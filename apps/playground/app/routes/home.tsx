import { Link } from "react-router";

// The same files routes.ts turns into pages, grouped by folder for the index.
const files = Object.keys(import.meta.glob("../examples/**/*.tsx"));
const groups = Map.groupBy(
  files.map((file) => file.replace("../examples/", "").replace(/\.tsx$/, "")),
  (path) => path.split("/")[0]!,
);

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="text-2xl font-semibold">Workers Comp playground</h1>
      <p className="mt-2 text-sm text-gray-500">
        Each page is a plain example built from{" "}
        <code className="font-mono text-gray-700">@workers-comp/ui</code>. Open one, then click,
        tab and press keys; the keys you press show up in the corner.
      </p>
      {[...groups].map(([component, paths]) => (
        <section key={component} className="mt-10">
          <h2 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">{component}</h2>
          <ul className="mt-3 space-y-2">
            {paths.map((path) => (
              <li key={path}>
                <Link to={`/${path}`} className="text-fuchsia-700 hover:underline">
                  {path.split("/").slice(1).join(" / ").replaceAll("-", " ")}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
