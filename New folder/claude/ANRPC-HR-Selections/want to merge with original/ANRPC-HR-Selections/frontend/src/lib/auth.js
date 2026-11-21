"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Session storage keys. They are identical to the ones used by the previous
 * version of the project, so existing logged-in sessions keep working.
 */
export const SESSION_KEYS = {
  employee: { token: "auth_token", user: "employee" },
  hr: { token: "hr_token", user: "hr_user" },
};

export function getToken(role) {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SESSION_KEYS[role].token);
}

export function readSession(role) {
  if (typeof window === "undefined") return null;
  const keys = SESSION_KEYS[role];
  const token = sessionStorage.getItem(keys.token);
  const raw = sessionStorage.getItem(keys.user);
  if (!token || !raw) return null;

  try {
    return { token, user: JSON.parse(raw) };
  } catch {
    clearAuthSession(role);
    return null;
  }
}

export function saveSession(role, token, user) {
  const keys = SESSION_KEYS[role];
  sessionStorage.setItem(keys.token, token);
  sessionStorage.setItem(keys.user, JSON.stringify(user));
}

export function clearAuthSession(role) {
  if (typeof window === "undefined") return;
  const keys = SESSION_KEYS[role];
  sessionStorage.removeItem(keys.token);
  sessionStorage.removeItem(keys.user);
}

/** Guards a workspace: redirects to /login when there is no valid session. */
export function useSession(role) {
  const router = useRouter();
  const [state, setState] = useState({ ready: false, user: null });

  useEffect(() => {
    const session = readSession(role);
    if (!session) {
      router.replace(`/login?role=${role}`);
      return;
    }
    setState({ ready: true, user: session.user });
  }, [role, router]);

  return state;
}
