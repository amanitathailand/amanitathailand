/**
 * Normalize structured admin_settings values across deployments.
 * Some Supabase schemas expose `value` as JSONB (object); the live project
 * currently exposes it as TEXT containing serialized JSON.
 */
export function parseAdminSettingsValue(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined || value === '') return {};

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  if (typeof value === 'string') {
    const parsed: unknown = JSON.parse(value);
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  }

  throw new Error('admin_settings.value ต้องเป็น JSON object หรือข้อความ JSON object');
}
