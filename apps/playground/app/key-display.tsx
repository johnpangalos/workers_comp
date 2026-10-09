import { useEffect, useState } from "react";

const labels: Record<string, string> = {
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  Enter: "↵",
  Escape: "Esc",
  Tab: "Tab",
  Shift: "⇧",
  Meta: "⌘",
  Alt: "⌥",
  Control: "Ctrl",
  Backspace: "⌫",
  " ": "Space",
};

/**
 * Shows the keys you press in the corner, like Headless UI's playground, so keyboard
 * behaviour (Tab, Enter, Space, arrows) is visible in screen recordings and demos.
 */
export function KeyDisplay() {
  const [keys, setKeys] = useState<{ id: number; label: string }[]>([]);

  useEffect(() => {
    let id = 0;
    function onKeyDown(event: KeyboardEvent) {
      const label = labels[event.key] ?? (event.key.length === 1 ? event.key.toUpperCase() : event.key);
      const entry = { id: id++, label };
      setKeys((current) => [...current.slice(-5), entry]);
      setTimeout(() => setKeys((current) => current.filter((k) => k.id !== entry.id)), 1500);
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);

  if (keys.length === 0) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed right-4 bottom-4 flex gap-1">
      {keys.map((key) => (
        <kbd
          key={key.id}
          className="rounded-md bg-gray-900 px-2 py-1 font-sans text-sm font-semibold text-white shadow-lg"
        >
          {key.label}
        </kbd>
      ))}
    </div>
  );
}
