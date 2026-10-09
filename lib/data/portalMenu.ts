import type { PortalMenuItem } from '@/types';

export const INITIAL_PORTAL_MENU_ITEMS: PortalMenuItem[] = [
  { id: 'portal-legend', label: 'ห้องตำนานและพิธีกรรม', sub: 'Legends & Rituals', href: '/museum/legend-hall', icon_key: 'sparkles', sort_order: 1, status: 'published' },
  { id: 'portal-chronicles', label: 'ห้องบันทึกประวัติศาสตร์', sub: 'Chronicles', href: '/museum/history-hall', icon_key: 'book', sort_order: 2, status: 'published' },
  { id: 'portal-biochemistry', label: 'ห้องชีวเคมีและวิทยาศาสตร์', sub: 'Biochemistry', href: '/museum/science-hall', icon_key: 'layers', sort_order: 3, status: 'published' },
  { id: 'portal-dream', label: 'มิติโลกแห่งความฝัน', sub: 'Dream World', href: '/museum/dream-hall', icon_key: 'compass', sort_order: 4, status: 'published' },
  { id: 'portal-articles', label: 'คลังบทความวิจัย', sub: 'Articles & Studies', href: '/articles', icon_key: 'feather', sort_order: 5, status: 'published' },
  { id: 'portal-specimens', label: 'นิทรรศการตัวอย่างพฤกษศาสตร์', sub: 'Specimens', href: '/products', icon_key: 'layers', sort_order: 6, status: 'published' },
  { id: 'portal-contact', label: 'ติดต่อผู้ดูแลพิพิธภัณฑ์', sub: 'Contact Curator', href: '/contact', icon_key: 'phone', sort_order: 7, status: 'published' },
];
