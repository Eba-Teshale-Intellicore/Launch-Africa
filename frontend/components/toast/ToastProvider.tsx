"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
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

const TOAST_POSITION_EVENT = "launchafrica-toast-position-change";

const validPositions: ToastPosition[] = [
  "top-right",
  "top-left",
  "bottom-right",
  "bottom-left",
];

// Read toast position from localStorage.
function getToastPositionSnapshot(): ToastPosition {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved && validPositions.includes(saved as ToastPosition)) {
      return saved as ToastPosition;
    }
  } catch {
    // Use default position.
  }

  return "bottom-right";
}

// Server-side snapshot.
function getServerToastPositionSnapshot(): ToastPosition {
  return "bottom-right";
}

// Subscribe to toast position changes.
function subscribeToToastPosition(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(TOAST_POSITION_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(TOAST_POSITION_EVENT, callback);
  };
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const position = useSyncExternalStore(
    subscribeToToastPosition,
    getToastPositionSnapshot,
    getServerToastPositionSnapshot,
  );

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Change toast position.
  const setPosition = useCallback((next: ToastPosition) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Keep the current session functional.
    }

    window.dispatchEvent(new Event(TOAST_POSITION_EVENT));
  }, []);

  // Show toast notification.
  const showToast = useCallback(
    (message: string, type: ToastType = "success", duration = 3000) => {
      const id = Date.now() + Math.random();

      setToasts((current) => [
        ...current,
        {
          id,
          message,
          type,
          duration,
        },
      ]);
    },
    [],
  );

  // Dismiss toast notification.
  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        position,
        setPosition,
      }}
    >
      {children}

      {/* TOAST CONTAINER */}
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

// INDIVIDUAL TOAST CARD.
function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  // Automatic dismissal.
  useEffect(() => {
    if (toast.duration <= 0) return;

    const timer = window.setTimeout(() => onDismiss(toast.id), toast.duration);

    return () => window.clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

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
      className={`pointer-events-auto flex items-start gap-3 rounded-card border border-line bg-card p-4 shadow-xl ${styles[toast.type]}`}
    >
      {/* ICON */}
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-input text-logo2 font-bold"
      >
        {icons[toast.type]}
      </span>

      {/* MESSAGE */}
      <div className="min-w-0 flex-1 pt-1">
        <p className="text-main text-sm font-semibold">LaunchAfrica</p>

        <p className="mt-1 break-words text-sm text-soft">{toast.message}</p>
      </div>

      {/* DISMISS */}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="rounded-md p-1 text-soft hover:text-main"
      >
        ×
      </button>
    </div>
  );
}

// CUSTOM HOOK.
export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }

  return context;
}
