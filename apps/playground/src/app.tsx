import type { Result as AxeResult } from "axe-core";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  combinations,
  defaultProps,
  toJsx,
  type Control,
  type PlaygroundEntry,
  type Props,
} from "./playground";

// Every file in ./entries is a component page. Add a file, get a page.
const entries = Object.values(
  import.meta.glob<{ default: PlaygroundEntry }>("./entries/*.tsx", { eager: true }),
)
  .map((module) => module.default)
  .sort((a, b) => a.name.localeCompare(b.name));

const slug = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

function useHash() {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("hashchange", onChange);
      return () => window.removeEventListener("hashchange", onChange);
    },
    () => window.location.hash.replace(/^#\/?/, ""),
  );
}

export function App() {
  const hash = useHash();
  const entry = entries.find((e) => slug(e.name) === hash) ?? entries[0];

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-gray-900">
      <nav className="w-56 shrink-0 border-r border-gray-200 bg-white p-4">
        <p className="mb-4 text-xs font-semibold tracking-wide text-gray-500 uppercase">
          Workers Comp
        </p>
        <ul className="space-y-1">
          {entries.map((e) => (
            <li key={e.name}>
              <a
                href={`#/${slug(e.name)}`}
                aria-current={e === entry ? "page" : undefined}
                className="block rounded-md px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 aria-[current=page]:bg-fuchsia-50 aria-[current=page]:font-semibold aria-[current=page]:text-fuchsia-700"
              >
                {e.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <main className="min-w-0 flex-1 p-8">
        {entry ? <EntryPage key={entry.name} entry={entry} /> : <p>No components yet.</p>}
      </main>
    </div>
  );
}

function EntryPage({ entry }: { entry: PlaygroundEntry }) {
  const [props, setProps] = useState<Props>(() => defaultProps(entry.controls));
  const Component = entry.component;
  const jsx = toJsx(entry, props);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{entry.name}</h1>
          {entry.description && <p className="mt-1 text-sm text-gray-500">{entry.description}</p>}
        </div>
        {entry.figma && (
          <a
            href={entry.figma}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50"
          >
            Open in Figma ↗
          </a>
        )}
      </header>

      <Section title="Playground">
        <div className="grid gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 md:grid-cols-[1fr_16rem]">
          <div data-axe-target className="flex min-h-48 items-center justify-center bg-white p-8">
            <Component {...props} />
          </div>
          <form className="space-y-4 bg-white p-4" onSubmit={(e) => e.preventDefault()}>
            {Object.entries(entry.controls).map(([key, control]) => (
              <ControlField
                key={key}
                name={key}
                control={control}
                value={props[key]}
                onChange={(value) => setProps((p) => ({ ...p, [key]: value }))}
              />
            ))}
          </form>
        </div>
        <CodeBlock code={jsx} />
      </Section>

      {entry.matrix && (
        <Section title="All variants">
          <Matrix entry={entry} />
        </Section>
      )}

      <Section title="Accessibility">
        <AxeReport deps={jsx} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-500">{title}</h2>
      {children}
    </section>
  );
}

function ControlField({
  name,
  control,
  value,
  onChange,
}: {
  name: string;
  control: Control;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const id = `control-${name}`;
  const label = name === "children" ? "label (children)" : name;

  if (control.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="size-4 accent-fuchsia-700"
        />
        {label}
      </label>
    );
  }

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs font-semibold text-gray-500">
        {label}
      </label>
      {control.type === "select" ? (
        <select
          id={id}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
        >
          {control.options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
        />
      )}
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-gray-900 px-4 py-3 font-mono text-sm text-gray-100">
      <code className="overflow-x-auto whitespace-pre">{code}</code>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
        className="shrink-0 rounded-md px-2 py-1 font-sans text-xs text-gray-300 hover:bg-gray-800"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function Matrix({ entry }: { entry: PlaygroundEntry }) {
  const { rows, columns } = entry.matrix!;
  const Component = entry.component;
  const base = defaultProps(entry.controls);

  return (
    <div data-axe-target className="overflow-x-auto rounded-lg border border-gray-200 bg-white p-6">
      <table className="text-sm">
        <thead>
          <tr>
            <th className="pr-8 pb-4 text-left text-xs font-semibold text-gray-500">{rows.join(" / ")}</th>
            {columns.map((c) => (
              <th key={c.label} className="pr-8 pb-4 text-left text-xs font-semibold text-gray-500">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {combinations(entry.controls, rows).map((row) => {
            const rowLabel = rows.map((key) => String(row[key])).join(" / ");
            return (
              <tr key={rowLabel}>
                <th className="py-2 pr-8 text-left font-normal text-gray-500">{rowLabel}</th>
                {columns.map((c) => (
                  <td key={c.label} className="py-2 pr-8">
                    <Component {...base} {...row} {...c.props} />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Runs axe against the preview and the matrix whenever the props change. */
function AxeReport({ deps }: { deps: string }) {
  const [violations, setViolations] = useState<AxeResult[] | null>(null);
  const running = useRef(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (running.current) return;
      running.current = true;
      try {
        const targets = Array.from(document.querySelectorAll("[data-axe-target]"));
        // axe is large, so it loads on first use instead of with the page.
        const { default: axe } = await import("axe-core");
        const result = await axe.run(targets, { resultTypes: ["violations"] });
        setViolations(result.violations);
      } finally {
        running.current = false;
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [deps]);

  if (!violations) return <p className="text-sm text-gray-500">Checking…</p>;
  if (violations.length === 0) {
    return (
      <p className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm">
        ✓ No axe violations in the playground or the variant grid.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {violations.map((v) => (
        <li key={v.id} className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm">
          <p className="font-semibold text-red-800">
            {v.impact}: {v.help}
          </p>
          <p className="text-red-700">
            {v.nodes.length} element{v.nodes.length === 1 ? "" : "s"} ·{" "}
            <a href={v.helpUrl} target="_blank" rel="noreferrer" className="underline">
              how to fix
            </a>
          </p>
        </li>
      ))}
    </ul>
  );
}
