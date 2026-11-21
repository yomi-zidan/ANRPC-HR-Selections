"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const tones = {
  success: { icon: CheckCircle2, cls: "bg-success-bg text-success-fg" },
  danger: { icon: AlertCircle, cls: "bg-danger-bg text-danger-fg" },
  info: { icon: Info, cls: "bg-info-bg text-info-fg" },
};

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const dismiss = useCallback(
    (id) => setItems((current) => current.filter((item) => item.id !== id)),
    []
  );

  const push = useCallback(
    (tone, message) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setItems((current) => [...current.slice(-3), { id, tone, message }]);
      setTimeout(() => dismiss(id), 4800);
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (message) => push("success", message),
      error: (message) => push("danger", message),
      info: (message) => push("info", message),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-24 z-[120] flex flex-col gap-2 sm:inset-x-auto sm:bottom-6 sm:start-6 sm:w-96 md:bottom-6"
      >
        {items.map((item) => {
          const { icon: Icon, cls } = tones[item.tone];
          return (
            <div
              key={item.id}
              role="status"
              className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-line bg-surface p-3 shadow-pop animate-pop"
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${cls}`}>
                <Icon size={17} />
              </span>
              <p className="min-w-0 flex-1 pt-1 text-sm leading-6">{item.message}</p>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="إغلاق"
                className="rounded-lg p-1.5 text-fg-subtle hover:bg-surface-2 hover:text-fg"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>");
  return context;
}
