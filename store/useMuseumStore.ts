import { create } from 'zustand';

interface MuseumState {
  isPortalOpen: boolean;
  cameraZoom: number;
  activeHallSlug: string | null;
  isAudioMuted: boolean;
  openPortal: () => void;
  closePortal: () => void;
  toggleAudio: () => void;
  setActiveHall: (slug: string | null) => void;
}

export const useMuseumStore = create<MuseumState>((set) => ({
  isPortalOpen: false,
  cameraZoom: 1.0,
  activeHallSlug: null,
  isAudioMuted: true,
  openPortal: () => set({ isPortalOpen: true, cameraZoom: 1.7 }),
  closePortal: () => set({ isPortalOpen: false, cameraZoom: 1.0 }),
  toggleAudio: () => set((state) => ({ isAudioMuted: !state.isAudioMuted })),
  setActiveHall: (slug) => set({ activeHallSlug: slug }),
}));
