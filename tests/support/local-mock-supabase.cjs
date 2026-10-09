'use strict';

const { randomUUID } = require('node:crypto');

const clone = (value) => value == null ? value : structuredClone(value);
const UNIQUE_COLUMNS = {
  admin_settings: ['key'],
  articles: ['slug'],
  museum_halls: ['slug'],
  museum_exhibits: ['slug'],
  products: ['slug'],
  orders: ['order_number'],
  pixel_configs: ['provider'],
  media_assets: ['storage_path'],
};

// Snapshot of connected public table columns used by this suite; metadata only, no row data.
const SCHEMA_COLUMNS = {
  admin_settings: ['key', 'value', 'is_active', 'description', 'updated_at'],
  analytics_events: ['id', 'event_type', 'resource_id', 'session_id', 'payload', 'created_at'],
  articles: [
    'id', 'slug', 'title', 'excerpt', 'featured_image_url', 'content_blocks', 'reading_time_minutes',
    'tags', 'seo_title', 'seo_description', 'status', 'published_at', 'created_at',
  ],
  media_assets: [
    'id', 'file_name', 'storage_path', 'public_url', 'mime_type', 'created_at', 'file_size_bytes',
    'alt_text', 'caption', 'uploaded_by',
  ],
  museum_exhibits: [
    'id', 'hall_id', 'slug', 'title', 'summary', 'content_blocks', 'sort_order', 'status', 'created_at', 'model_3d_url',
  ],
  museum_halls: [
    'id', 'slug', 'title', 'subtitle', 'description', 'cover_image_url', 'ambient_audio_url', 'scene_config',
    'sort_order', 'status', 'created_at',
  ],
  orders: [
    'id', 'order_number', 'customer_name', 'customer_phone', 'customer_email', 'shipping_address', 'product_id',
    'product_name', 'variant_size', 'quantity', 'total_price', 'slip_url', 'status', 'admin_note', 'created_at',
    'updated_at', 'customer_line_id',
  ],
  pixel_configs: ['id', 'provider', 'pixel_id', 'is_active', 'updated_at', 'custom_script_head', 'custom_script_body'],
  products: [
    'id', 'slug', 'name', 'botanical_name', 'origin_region', 'description', 'hero_image_url',
    'gallery_urls', 'variants', 'line_oa_url', 'facebook_url', 'disclaimer', 'content_blocks',
    'sort_order', 'status', 'created_at', 'external_url', 'shopee_url', 'price',
  ],
  profiles: ['id', 'email', 'full_name', 'role', 'created_at'],
};

const JSON_TEXT_SETTING_KEYS = new Set(['site_content', 'contact_settings']);

function toDatabaseRow(table, input) {
  const row = clone(input);
  if (
    table === 'admin_settings' &&
    JSON_TEXT_SETTING_KEYS.has(row?.key) &&
    row.value !== null &&
    typeof row.value === 'object' &&
    !Array.isArray(row.value)
  ) {
    row.value = JSON.stringify(row.value);
  }
  return row;
}

function findUnknownColumn(table, payload) {
  const knownColumns = SCHEMA_COLUMNS[table];
  if (!knownColumns) return null;
  const inputs = Array.isArray(payload) ? payload : [payload];
  for (const input of inputs) {
    if (!input || typeof input !== 'object') continue;
    const unknown = Object.keys(input).find((column) => !knownColumns.includes(column));
    if (unknown) return unknown;
  }
  return null;
}

class LocalMockSupabase {
  constructor(seed = {}) {
    this.tables = Object.fromEntries(Object.entries(seed).map(([name, rows]) => [name, rows.map((row) => toDatabaseRow(name, row))]));
    this.operations = [];
    this.failures = [];
    this.storageObjects = new Map();
    this.storageFailures = [];
    this.storage = { from: (bucket) => this.storageBucket(bucket) };
  }

  from(table) {
    if (!this.tables[table]) this.tables[table] = [];
    return new Query(this, table);
  }

  failNext(table, action, error) {
    this.failures.push({ table, action, error: clone(error) });
  }

  failNextStorage(action, error) {
    this.storageFailures.push({ action, error: clone(error) });
  }

  consumeFailure(table, action) {
    const index = this.failures.findIndex((item) => item.table === table && item.action === action);
    return index < 0 ? null : this.failures.splice(index, 1)[0].error;
  }

  consumeStorageFailure(action) {
    const index = this.storageFailures.findIndex((item) => item.action === action);
    return index < 0 ? null : this.storageFailures.splice(index, 1)[0].error;
  }

  storageBucket(bucket) {
    return {
      upload: async (path, file, options = {}) => {
        const error = this.consumeStorageFailure('upload');
        if (error) return { data: null, error };
        const key = `${bucket}/${path}`;
        if (this.storageObjects.has(key) && !options.upsert) {
          return { data: null, error: { code: 'Duplicate', message: 'Object already exists' } };
        }
        this.storageObjects.set(key, { bucket, path, file: clone(file), options: clone(options) });
        return { data: { path }, error: null };
      },
      remove: async (paths) => {
        const error = this.consumeStorageFailure('remove');
        if (error) return { data: null, error };
        for (const path of paths) this.storageObjects.delete(`${bucket}/${path}`);
        return { data: paths.map((path) => ({ name: path })), error: null };
      },
      getPublicUrl: (path) => ({ data: { publicUrl: `https://mock-storage.invalid/${bucket}/${path}` } }),
    };
  }
}

class Query {
  constructor(client, table) {
    this.client = client;
    this.table = table;
    this.action = 'select';
    this.payload = null;
    this.filters = [];
    this.orders = [];
    this.limitCount = null;
    this.returning = false;
    this.conflictColumn = null;
  }

  select() { this.returning = true; return this; }
  eq(column, value) { this.filters.push((row) => row[column] === value); return this; }
  in(column, values) { const allowed = new Set(values); this.filters.push((row) => allowed.has(row[column])); return this; }
  order(column, options = {}) { this.orders.push({ column, ascending: options.ascending !== false }); return this; }
  limit(count) { this.limitCount = count; return this; }
  insert(payload) { this.action = 'insert'; this.payload = payload; return this; }
  upsert(payload, options = {}) { this.action = 'upsert'; this.payload = payload; this.conflictColumn = options.onConflict || null; return this; }
  update(payload) { this.action = 'update'; this.payload = payload; return this; }
  delete() { this.action = 'delete'; return this; }

  async single() {
    const result = await this.execute();
    if (result.error) return result;
    const rows = Array.isArray(result.data) ? result.data : result.data == null ? [] : [result.data];
    if (rows.length !== 1) return { data: null, error: { code: 'PGRST116', message: `Expected one row, received ${rows.length}` } };
    return { data: rows[0], error: null };
  }

  async maybeSingle() {
    const result = await this.execute();
    if (result.error) return result;
    const rows = Array.isArray(result.data) ? result.data : result.data == null ? [] : [result.data];
    if (rows.length > 1) return { data: null, error: { code: 'PGRST116', message: `Expected at most one row, received ${rows.length}` } };
    return { data: rows[0] || null, error: null };
  }

  then(resolve, reject) { return this.execute().then(resolve, reject); }

  async execute() {
    this.client.operations.push({ table: this.table, action: this.action, payload: clone(this.payload), returning: this.returning });
    const failure = this.client.consumeFailure(this.table, this.action);
    if (failure) return { data: null, error: failure };

    const unknownColumn = findUnknownColumn(this.table, this.payload);
    if (unknownColumn) {
      return {
        data: null,
        error: { code: 'PGRST204', message: `Could not find the '${unknownColumn}' column of '${this.table}' in the schema cache` },
      };
    }

    const rows = this.client.tables[this.table] || (this.client.tables[this.table] = []);
    if (this.action === 'select') {
      let selected = rows.filter((row) => this.filters.every((filter) => filter(row)));
      for (const { column, ascending } of this.orders) {
        selected = selected.slice().sort((a, b) => {
          const left = a[column];
          const right = b[column];
          const cmp = left == null && right == null ? 0 : left == null ? -1 : right == null ? 1 : left < right ? -1 : left > right ? 1 : 0;
          return ascending ? cmp : -cmp;
        });
      }
      if (this.limitCount != null) selected = selected.slice(0, this.limitCount);
      return { data: clone(selected), error: null };
    }

    if (this.action === 'insert' || this.action === 'upsert') {
      const inputs = Array.isArray(this.payload) ? this.payload : [this.payload];
      const written = [];
      for (const input of inputs) {
        if (!input || typeof input !== 'object') return { data: null, error: { code: '22023', message: 'Invalid row payload' } };
        let existing = null;
        if (this.action === 'upsert' && this.conflictColumn) {
          existing = rows.find((row) => row[this.conflictColumn] === input[this.conflictColumn]);
        }
        if (existing) {
          Object.assign(existing, toDatabaseRow(this.table, input));
          written.push(existing);
          continue;
        }
        const uniqueColumns = UNIQUE_COLUMNS[this.table] || [];
        const duplicateColumn = uniqueColumns.find((column) => input[column] != null && rows.some((row) => row[column] === input[column]));
        if (duplicateColumn) return { data: null, error: { code: '23505', message: `duplicate key value violates unique constraint on ${duplicateColumn}` } };
        if (this.table === 'museum_exhibits' && input.hall_id != null && !this.client.tables.museum_halls?.some((hall) => hall.id === input.hall_id)) {
          return { data: null, error: { code: '23503', message: 'museum_exhibits hall_id violates foreign key constraint' } };
        }
        const now = new Date().toISOString();
        const row = toDatabaseRow(this.table, input);
        const defaultColumns = SCHEMA_COLUMNS[this.table] || ['id', 'created_at', 'updated_at'];
        for (const column of ['id', 'created_at', 'updated_at']) {
          if (defaultColumns.includes(column) && !Object.hasOwn(row, column)) {
            row[column] = column === 'id' ? randomUUID() : now;
          }
        }
        rows.push(row);
        written.push(row);
      }
      return { data: this.returning ? clone(written) : null, error: null };
    }

    const matched = rows.filter((row) => this.filters.every((filter) => filter(row)));
    if (this.action === 'update') {
      for (const row of matched) {
        Object.assign(row, clone(this.payload));
      }
      return { data: this.returning ? clone(matched) : null, error: null };
    }
    if (this.action === 'delete') {
      const matchedSet = new Set(matched);
      this.client.tables[this.table] = rows.filter((row) => !matchedSet.has(row));
      return { data: this.returning ? clone(matched) : null, error: null };
    }
    return { data: null, error: { code: 'MOCK_UNSUPPORTED', message: `Unsupported action: ${this.action}` } };
  }
}

module.exports = { LocalMockSupabase };
