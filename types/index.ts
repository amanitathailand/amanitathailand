export type UserRole = 
  | 'super_admin' 
  | 'content_admin' 
  | 'museum_curator' 
  | 'editor' 
  | 'analyst' 
  | 'visitor';

export type ContentStatus = 'draft' | 'published' | 'archived';

export type BlockType = 
  | 'text' | 'heading' | 'image' | 'gallery' | 'video' 
  | 'youtube' | 'quote' | 'timeline' | 'accordion' 
  | 'audio' | '3d_model' | 'divider' | 'button' | 'callout';

export interface ContentBlock<T = any> {
  id: string;
  type: BlockType;
  data: T;
}

export interface MuseumHall {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  cover_image_url?: string | null;
  ambient_audio_url?: string | null;
  scene_config?: {
    fogDensity: number;
    bloomStrength: number;
    fogColor?: string;
  };
  timeline_meta?: Array<{
    yearOrEra: string;
    title: string;
    summary: string;
  }>;
  sort_order: number;
  status: ContentStatus;
  created_at?: string;
}

export interface MuseumExhibit {
  id: string;
  hall_id: string;
  slug: string;
  title: string;
  summary?: string | null;
  model_3d_url?: string | null;
  content_blocks: ContentBlock[];
  audio_narrative_url?: string | null;
  sort_order: number;
  status: ContentStatus;
  created_at?: string;
}

export interface ProductVariant {
  size: '3g' | '5g' | '10g' | '15g' | string;
  price: number;
  in_stock: boolean;
  note?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  botanical_name: string;
  origin_region: string;
  description: string;
  price: number;
  hero_image_url: string;
  gallery_urls?: string[];
  variants: ProductVariant[];
  line_oa_url: string;
  facebook_url: string;
  shopee_url?: string | null;
  external_url?: string | null;
  disclaimer: string;
  content_blocks: ContentBlock[];
  sort_order: number;
  status: ContentStatus;
  created_at?: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  category_id?: string | null;
  featured_image_url?: string | null;
  content_blocks: ContentBlock[];
  reading_time_minutes: number;
  tags: string[];
  seo_title?: string | null;
  seo_description?: string | null;
  status: ContentStatus;
  published_at?: string | null;
  created_at?: string;
}

export interface PixelConfig {
  id: string;
  provider: 'meta' | 'tiktok' | 'ga4' | 'gtm' | 'clarity';
  pixel_id: string;
  is_active: boolean;
  custom_script_head?: string | null;
  custom_script_body?: string | null;
}

export type PortalMenuIcon = 'sparkles' | 'compass' | 'book' | 'layers' | 'phone' | 'feather' | 'package' | 'none';

export interface PortalMenuItem {
  id: string;
  label: string;
  sub: string;
  href: string;
  icon_key: PortalMenuIcon;
  image_url?: string;
  sort_order: number;
  status: 'published' | 'draft';
}

export interface SiteContentSettings {
  site_title: string;
  site_subtitle: string;
  portal_button_text: string;
  portal_menu_items?: PortalMenuItem[];
  home_display_mode?: '3d' | 'real_photo';
  home_photo_image_url?: string;
  home_photo_alt?: string;
  home_photo_caption?: string;
  home_photo_subtitle?: string;
  home_3d_model_url?: string;
  museum_title: string;
  museum_subtitle: string;
  museum_description: string;
  products_title: string;
  products_subtitle: string;
  products_description: string;
  articles_title: string;
  articles_subtitle: string;
  articles_description: string;
  footer_disclaimer: string;
  promptpay_number?: string;
  promptpay_name?: string;
  promptpay_bank?: string;
}

export interface ContactSettings {
  contact_title: string;
  contact_subtitle: string;
  contact_description: string;
  line_oa_url: string;
  line_oa_id: string;
  facebook_url: string;
  facebook_name: string;
  phone_number: string;
  email: string;
  address: string;
  business_hours: string;
  shopee_url: string;
  google_maps_url?: string;
  // PromptPay QR Settings
  promptpay_number: string;
  promptpay_name: string;
  promptpay_bank: string;
  payment_instructions?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_line_id?: string;
  shipping_address: string;
  product_id?: string;
  product_name: string;
  variant_size?: string;
  quantity: number;
  total_price: number;
  slip_url?: string;
  status: 'pending' | 'paid' | 'shipped' | 'cancelled';
  admin_note?: string;
  created_at: string;
  updated_at?: string;
}
