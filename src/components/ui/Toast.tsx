import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

// A simple global event emitter for toasts to avoid complex context setup for a single feature
type ToastEvent = (message: string) => void;
let toastListener: ToastEvent | null = null;

export const showToast = (message: string) => {
  if (toastListener) {
    toastListener(message);
  }
};

export function Toast() {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const listener: ToastEvent = (msg) => {
      setMessage(msg);
      setVisible(true);
      setTimeout(() => setVisible(false), 3500);
    };
    toastListener = listener;
    return () => {
      toastListener = null;
    };
  }, []);

  return (
    <div
      className={cn(
        "fixed bottom-8 right-8 bg-brand-surface2 border border-brand-pink text-brand-text px-6 py-4 font-space text-[0.75rem] rounded-[4px] z-[1000] max-w-[300px] transition-transform duration-300",
        visible ? "translate-x-0" : "translate-x-[200%]"
      )}
    >
      {message}
    </div>
  );
}
