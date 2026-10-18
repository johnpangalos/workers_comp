import { Chip } from "@workers-comp/ui";

// A realistic use: a day strip that jumps to each section of a week of dinners. Days you're out
// are muted; the section you're in is marked current.
const days: [id: string, label: string, out: boolean][] = [
  ["reuse", "Reuse", false],
  ["prep", "Prep", false],
  ["sun", "Sun", false],
  ["mon", "Mon", false],
  ["tue", "Tue", true],
  ["wed", "Wed", false],
  ["thu", "Thu", true],
  ["fri", "Fri", false],
  ["sat", "Sat", false],
];
const current = "mon";

export default function DayStrip() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav aria-label="Jump to a day" className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <ul className="flex gap-6 overflow-x-auto px-4 py-3">
          {days.map(([id, label, out]) => (
            <li key={id} className="shrink-0">
              <Chip href={`#${id}`} muted={out} current={id === current}>
                {label}
              </Chip>
            </li>
          ))}
        </ul>
      </nav>
      <main className="mx-auto max-w-md space-y-10 px-4 py-8">
        {days.map(([id, label, out]) => (
          <section key={id} id={id} className="scroll-mt-20">
            <h2 className="text-lg font-semibold text-gray-900">{label}</h2>
            <p className="mt-2 text-sm text-gray-700">
              {out && "You're out this day."}
              {!out && "Dinner for the table."}
            </p>
          </section>
        ))}
      </main>
    </div>
  );
}
