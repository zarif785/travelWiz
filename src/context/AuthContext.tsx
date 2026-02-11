import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@/types';

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    login: (email: string, password: string) => { ok: boolean; error?: string };
    signup: (name: string, email: string, password: string) => { ok: boolean; error?: string };
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const USERS_STORAGE_KEY = 'travelai_users';
const SESSION_STORAGE_KEY = 'travelai_session_user';

interface StoredUser extends User {
    password: string;
}

function loadUsers(): StoredUser[] {
    try {
        const raw = localStorage.getItem(USERS_STORAGE_KEY);
        return raw ? (JSON.parse(raw) as StoredUser[]) : [];
    } catch (error) {
        console.error('Failed to load users from storage', error);
        return [];
    }
}

function saveUsers(users: StoredUser[]): void {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function toPublicUser(user: StoredUser): User {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
    };
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        try {
            const sessionUserId = localStorage.getItem(SESSION_STORAGE_KEY);
            if (!sessionUserId) return;
            const users = loadUsers();
            const matched = users.find((entry) => entry.id === sessionUserId);
            if (matched) {
                setUser(toPublicUser(matched));
            }
        } catch (error) {
            console.error('Failed to hydrate auth session', error);
        }
    }, []);

    const login: AuthContextType['login'] = (email, password) => {
        const normalizedEmail = email.trim().toLowerCase();
        const users = loadUsers();
        const matched = users.find((entry) => entry.email.toLowerCase() === normalizedEmail);

        if (!matched || matched.password !== password) {
            return { ok: false, error: 'Invalid email or password.' };
        }

        const publicUser = toPublicUser(matched);
        setUser(publicUser);
        localStorage.setItem(SESSION_STORAGE_KEY, matched.id);
        return { ok: true };
    };

    const signup: AuthContextType['signup'] = (name, email, password) => {
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedName = name.trim();

        if (!normalizedName) return { ok: false, error: 'Name is required.' };
        if (!normalizedEmail) return { ok: false, error: 'Email is required.' };
        if (!password || password.length < 6) {
            return { ok: false, error: 'Password must be at least 6 characters.' };
        }

        const users = loadUsers();
        const exists = users.some((entry) => entry.email.toLowerCase() === normalizedEmail);
        if (exists) return { ok: false, error: 'An account with this email already exists.' };

        const newUser: StoredUser = {
            id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now()),
            name: normalizedName,
            email: normalizedEmail,
            password,
        };

        const updated = [...users, newUser];
        saveUsers(updated);
        localStorage.setItem(SESSION_STORAGE_KEY, newUser.id);
        setUser(toPublicUser(newUser));
        return { ok: true };
    };

    const logout = () => {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        setUser(null);
    };

    const value: AuthContextType = useMemo(
        () => ({
            isAuthenticated: !!user,
            user,
            login,
            signup,
            logout,
        }),
        [user]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
