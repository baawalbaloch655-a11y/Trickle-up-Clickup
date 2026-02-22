import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    status: string;
    isEmailVerified: boolean;
}

interface ActiveOrg {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
    plan: string;
    role?: { id: string; name: string; permissions: string[] };
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    expiresIn: number | null;
    activeOrg: ActiveOrg | null;
    isAuthenticated: boolean;

    setUser: (user: User) => void;
    setTokens: (accessToken: string, refreshToken: string, expiresIn: number) => void;
    setActiveOrg: (org: ActiveOrg) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            expiresIn: null,
            activeOrg: null,
            isAuthenticated: false,

            setUser: (user) => set({ user, isAuthenticated: true }),

            setTokens: (accessToken, refreshToken, expiresIn) =>
                set({ accessToken, refreshToken, expiresIn }),

            setActiveOrg: (org) => set({ activeOrg: org }),

            logout: () =>
                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    expiresIn: null,
                    activeOrg: null,
                    isAuthenticated: false,
                }),
        }),
        {
            name: 'trickleup-auth',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                expiresIn: state.expiresIn,
                activeOrg: state.activeOrg,
                isAuthenticated: state.isAuthenticated,
            }),
        },
    ),
);
