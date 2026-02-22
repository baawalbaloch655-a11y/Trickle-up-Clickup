import { create } from 'zustand';

interface UIState {
    sidebarCollapsed: boolean;
    notificationPanelOpen: boolean;
    activeModal: string | null;
    sidebarPreferences: Record<string, boolean>;
    homePreferences: Record<string, boolean>;
    sectionPreferences: Record<string, boolean>;
    themeColor: string;
    themeAppearance: string;

    toggleSidebar: () => void;
    setSidebarCollapsed: (v: boolean) => void;
    toggleNotificationPanel: () => void;
    openModal: (name: string) => void;
    closeModal: () => void;
    toggleSidebarPreference: (key: string) => void;
    toggleHomePreference: (key: string) => void;
    toggleSectionPreference: (key: string) => void;
    setThemeColor: (color: string) => void;
    setThemeAppearance: (appearance: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
    sidebarCollapsed: false,
    notificationPanelOpen: false,
    activeModal: null,
    sidebarPreferences: {
        home: true,
        spaces: true,
        chat: true,
        planner: true,
        ai: true,
        teams: true,
        docs: false,
        dashboards: false,
        whiteboards: false,
        forms: false,
        clips: true,
        goals: false,
        timesheets: false,
    },
    homePreferences: {
        inbox: true,
        replies: true,
        assignedComments: true,
        myTasks: true,
        chatActivity: false,
        draftsAndSent: false,
        posts: false,
        allChannels: false,
        allSpaces: false,
        allTasks: false,
    },
    sectionPreferences: {
        favorites: true,
        spaces: true,
        channels: true,
        directMessages: true,
    },
    themeColor: 'purple',
    themeAppearance: 'dark',

    toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
    toggleNotificationPanel: () =>
        set((s) => ({ notificationPanelOpen: !s.notificationPanelOpen })),
    openModal: (name) => set({ activeModal: name }),
    closeModal: () => set({ activeModal: null }),
    toggleSidebarPreference: (key) => set((s) => ({
        sidebarPreferences: {
            ...s.sidebarPreferences,
            [key]: !s.sidebarPreferences[key]
        }
    })),
    toggleHomePreference: (key) => set((s) => ({
        homePreferences: {
            ...s.homePreferences,
            [key]: !s.homePreferences[key]
        }
    })),
    toggleSectionPreference: (key) => set((s) => ({
        sectionPreferences: {
            ...s.sectionPreferences,
            [key]: !s.sectionPreferences[key]
        }
    })),
    setThemeColor: (color) => {
        // Also update the DOM for global CSS variables
        document.documentElement.setAttribute('data-theme', color);
        set({ themeColor: color });
    },
    setThemeAppearance: (appearance) => set({ themeAppearance: appearance }),
}));
