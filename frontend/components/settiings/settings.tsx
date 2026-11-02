"use client";

import { useToast, type ToastPosition } from "@/components/toast/ToastProvider";

const positions: {
  value: ToastPosition;
  label: string;
}[] = [
  { value: "top-right", label: "Top right" },
  { value: "top-left", label: "Top left" },
  { value: "bottom-right", label: "Bottom right (default)" },
  { value: "bottom-left", label: "Bottom left" },
];

export default function NotificationSettings() {
  const { position, setPosition, showToast } = useToast();

  return (
    <section className="bg-card border-line rounded-card border p-5 sm:p-6">
      <h2 className="text-main text-lg font-bold">Notification preferences</h2>

      <p className="text-soft mt-2 text-sm">
        Choose where LaunchAfrica notifications appear.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {positions.map((item) => (
          <label
            key={item.value}
            className={`border-line flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${
              position === item.value
                ? "border-[var(--text-logo)] bg-input"
                : "hover:bg-input"
            }`}
          >
            <input
              type="radio"
              name="notification-position"
              value={item.value}
              checked={position === item.value}
              onChange={() => setPosition(item.value)}
              className="accent-current"
            />

            <span className="text-main text-sm">{item.label}</span>
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={() =>
          showToast(
            `Notifications will appear at ${position.replace("-", " ")}.`,
            "info",
          )
        }
        className="btn-main rounded-pill mt-5 px-5 py-3 text-sm"
      >
        Test notification
      </button>
    </section>
  );
}
