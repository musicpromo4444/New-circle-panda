import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Your designated master admin email */
export const MASTER_ADMIN_EMAIL = "reply.stagepro@gmail.com";

export const CP_AUTH_USER_KEY = "cp_auth_user";
export const AUTH_CHANGE_EVENT = "cp_auth_changed";

export interface AuthUser {
  id: string;
  email: string | null;
  name?: string;
  role?: "admin" | "user" | string;
}

/** Retrieve currently stored user from localStorage */
export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CP_AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/** Persist user to localStorage and dispatch event */
export function setStoredUser(user: AuthUser | null): void {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(CP_AUTH_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CP_AUTH_USER_KEY);
  }
  window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail: user }));
}

/** Check if a given user object has authorized master admin rights */
export function isMasterAdmin(user: { email?: string | null } | null | undefined): boolean {
  if (!user || !user.email) return false;
  return user.email.trim().toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
}

/**
 * Hook providing the reactive current user, loading state,
 * and quick login/logout controls for master admin and student accounts.
 */
export function useCurrentUser() {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState<boolean>(true);

  const syncUser = useCallback(() => {
    const local = getStoredUser();
    setUser(local);
    setLoading(false);
  }, []);

  useEffect(() => {
    syncUser();

    // Check Supabase session if available
    void supabase.auth
      .getUser()
      .then(({ data }) => {
        if (data?.user?.email) {
          const supaUser: AuthUser = {
            id: data.user.id,
            email: data.user.email,
            name: (data.user.user_metadata?.["name"] as string) || data.user.email.split("@")[0],
            role: data.user.email === MASTER_ADMIN_EMAIL ? "admin" : "user",
          };
          setStoredUser(supaUser);
          setUser(supaUser);
        }
      })
      .catch(() => {
        // Fallback to local session
      })
      .finally(() => {
        setLoading(false);
      });

    const handleAuthChange = (e: Event) => {
      const customEvent = e as CustomEvent<AuthUser | null>;
      setUser(customEvent.detail ?? getStoredUser());
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
      window.removeEventListener("storage", syncUser);
    };
  }, [syncUser]);

  const loginWithEmail = useCallback((email: string, name?: string) => {
    const cleanEmail = email.trim();
    const newUser: AuthUser = {
      id: `usr_${Date.now()}`,
      email: cleanEmail,
      name: name || cleanEmail.split("@")[0] || "User",
      role: cleanEmail.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase() ? "admin" : "user",
    };
    setStoredUser(newUser);
    setUser(newUser);
    return newUser;
  }, []);

  const loginAsMasterAdmin = useCallback(() => {
    const adminUser: AuthUser = {
      id: "master_admin_stagepro",
      email: MASTER_ADMIN_EMAIL,
      name: "StagePro Master Admin",
      role: "admin",
    };
    setStoredUser(adminUser);
    setUser(adminUser);
    return adminUser;
  }, []);

  const logout = useCallback(() => {
    setStoredUser(null);
    setUser(null);
    void supabase.auth.signOut().catch(() => {});
  }, []);

  return {
    user,
    loading,
    isMasterAdmin: isMasterAdmin(user),
    loginWithEmail,
    loginAsMasterAdmin,
    logout,
  };
}
