"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ToastPosition =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left";

export type ToastType = "success" | "error" | "info";

type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  position: ToastPosition;
  setPosition: (position: ToastPosition) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const STORAGE_KEY = "launchafrica-toast-position";

const validPositions: ToastPosition[] = [
  "top-right",
  "top-left",
  "bottom-right",
  "bottom-left",
];

export function ToastProvider({ children }: { children: ReactNode }) {
  const [position, setPositionState] = useState<ToastPosition>("bottom-right");

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved && validPositions.includes(saved as ToastPosition)) {
        setPositionState(saved as ToastPosition);
      }
    } catch {
      // Keep the default position.
    }
  }, []);

  const setPosition = useCallback((next: ToastPosition) => {
    setPositionState(next);

    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Keep the setting for this session.
    }
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success", duration = 3000) => {
      const id = Date.now() + Math.random();

      setToasts((current) => [...current, { id, message, type, duration }]);
    },
    [],
  );

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, position, setPosition }}>
      {children}

      <div
        className={`pointer-events-none fixed z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 ${
          position === "top-right"
            ? "right-4 top-4 sm:right-6 sm:top-6"
            : position === "top-left"
              ? "left-4 top-4 sm:left-6 sm:top-6"
              : position === "bottom-left"
                ? "bottom-4 left-4 sm:bottom-6 sm:left-6"
                : "bottom-4 right-4 sm:bottom-6 sm:right-6"
        }`}
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    if (toast.duration <= 0) return;

    const timer = window.setTimeout(() => onDismiss(toast.id), toast.duration);

    return () => window.clearTimeout(timer);
  }, [toast, onDismiss]);

  const styles: Record<ToastType, string> = {
    success: "border-emerald-500/40",
    error: "border-red-500/40",
    info: "border-blue-500/40",
  };

  const icons: Record<ToastType, string> = {
    success: "✓",
    error: "!",
    info: "i",
  };

  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      aria-live={toast.type === "error" ? "assertive" : "polite"}
      className={`bg-card border-line pointer-events-auto flex items-start gap-3 rounded-card border p-4 shadow-xl ${styles[toast.type]}`}
    >
      <span
        aria-hidden="true"
        className="text-logo2 bg-input flex size-9 shrink-0 items-center justify-center rounded-full font-bold"
      >
        {icons[toast.type]}
      </span>

      <div className="min-w-0 flex-1 pt-1">
        <p className="text-main text-sm font-semibold">LaunchAfrica</p>
        <p className="text-soft mt-1 break-words text-sm">{toast.message}</p>
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="text-soft hover:text-main rounded-md p-1"
      >
        ×
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }

  return context;
}
