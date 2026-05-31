import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type InternalToastType = "error" | "success" | "info";

interface InternalToast {
  id: number;
  type: InternalToastType;
  message: string;
}

interface InternalToastContextValue {
  showToast: (type: InternalToastType, message: string) => void;
}

const InternalToastContext = createContext<InternalToastContextValue | null>(null);

let toastCounter = 0;

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: InternalToast;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const delay = toast.type === "error" ? 7000 : 4500;
    const timer = window.setTimeout(onDismiss, delay);
    return () => window.clearTimeout(timer);
  }, [onDismiss, toast.type]);

  return (
    <div
      className={`internal-toast internal-toast--${toast.type}`}
      role={toast.type === "error" ? "alert" : "status"}
    >
      <p className="internal-toast__message">{toast.message}</p>
      <button
        type="button"
        className="internal-toast__close"
        onClick={onDismiss}
        aria-label="Cerrar notificación"
      >
        ×
      </button>
    </div>
  );
}

export function InternalToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<InternalToast[]>([]);

  const showToast = useCallback((type: InternalToastType, message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;
    const id = ++toastCounter;
    setToasts((current) => [...current, { id, type, message: trimmed }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  return (
    <InternalToastContext.Provider value={{ showToast }}>
      {children}
      <div className="internal-toast-host" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </InternalToastContext.Provider>
  );
}

export function useInternalToast(): InternalToastContextValue {
  const context = useContext(InternalToastContext);
  if (!context) {
    throw new Error("useInternalToast debe usarse dentro de InternalToastProvider.");
  }
  return context;
}
