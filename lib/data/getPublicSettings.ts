import { createClientServer } from '@/lib/supabase/server';
import { INITIAL_CONTACT_SETTINGS, INITIAL_SITE_CONTENT } from '@/lib/data/initialData';
import { parseAdminSettingsValue } from '@/lib/data/parseAdminSettingsValue';
import type { ContactSettings, PortalMenuItem, SiteContentSettings } from '@/types';

type PublicSettings = {
  site: SiteContentSettings;
  contact: ContactSettings;
  portalMenuItems: PortalMenuItem[];
};

export async function getPublicSettings(): Promise<PublicSettings> {
  const supabase = await createClientServer();
  const { data, error } = await supabase
    .from('admin_settings')
    .select('key, value')
    .in('key', ['site_content', 'contact_settings']);

  if (error) throw error;

  const siteRow = data?.find((row: { key: string }) => row.key === 'site_content');
  const contactRow = data?.find((row: { key: string }) => row.key === 'contact_settings');
  const site = { ...INITIAL_SITE_CONTENT, ...parseAdminSettingsValue(siteRow?.value) } as SiteContentSettings;
  const contact = { ...INITIAL_CONTACT_SETTINGS, ...parseAdminSettingsValue(contactRow?.value) } as ContactSettings;
  const portalMenuItems = Array.isArray(site.portal_menu_items) ? site.portal_menu_items : [];

  return { site, contact, portalMenuItems };
}
