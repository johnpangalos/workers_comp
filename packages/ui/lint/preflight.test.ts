// @vitest-environment node
// Runs oxlint with only the `workers-comp/preflight` rule on small components written to a temp
// folder, laid out as the package's are (`<name>/<name>.tsx`).
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const plugin = fileURLToPath(new URL("./preflight.js", import.meta.url));
const oxlint = fileURLToPath(new URL("../../../node_modules/.bin/oxlint", import.meta.url));

// The messages oxlint reports for one file, by rule message.
function lint(folder: string, file: string, source: string): string[] {
  const dir = mkdtempSync(join(tmpdir(), "preflight-"));
  try {
    mkdirSync(join(dir, folder));
    writeFileSync(join(dir, folder, file), source);
    const config = {
      jsPlugins: [plugin],
      plugins: [],
      categories: {},
      rules: { "workers-comp/preflight": "error" },
    };
    writeFileSync(join(dir, ".oxlintrc.json"), JSON.stringify(config));
    let out = "";
    try {
      out = execFileSync(oxlint, ["-c", ".oxlintrc.json", "--format", "json", "."], {
        cwd: dir,
        encoding: "utf8",
      });
    } catch (error) {
      out = (error as { stdout: string }).stdout;
    }
    const { diagnostics } = JSON.parse(out) as { diagnostics: { message: string }[] };
    return diagnostics.map((diagnostic) => diagnostic.message);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const tabs = (rootClasses: string, listClasses: string) => `
  export function Tabs() {
    return <div className={[cx(\`${rootClasses}\`), "x"].join(" ")}>children</div>;
  }
  export function TabList() {
    return <div className={cx(\`${listClasses}\`)} />;
  }
`;

describe("workers-comp/preflight", () => {
  it("passes preflight first on the outermost element of the component the file is named for", () => {
    expect(lint("tabs", "tabs.tsx", tabs("preflight flex gap-3", "inline-flex"))).toEqual([]);
  });

  it("reports a top-level component without preflight", () => {
    const messages = lint("tabs", "tabs.tsx", tabs("flex gap-3", "inline-flex"));
    expect(messages).toEqual([expect.stringContaining("Tabs's outermost element needs `preflight`")]);
  });

  it("reports preflight that isn't first", () => {
    const messages = lint("tabs", "tabs.tsx", tabs("flex preflight gap-3", "inline-flex"));
    expect(messages).toEqual([expect.stringContaining("Put `preflight` first")]);
  });

  it("reports preflight on a part, which the top level already resets", () => {
    const messages = lint("tabs", "tabs.tsx", tabs("preflight flex", "preflight inline-flex"));
    expect(messages).toEqual([expect.stringContaining("only on the outermost element of Tabs")]);
  });

  it("reports preflight on an element inside the top-level component", () => {
    const source = `
      export function TextField() {
        return (
          <div className={cx(\`preflight flex\`)}>
            <input className={cx(\`preflight rounded-md\`)} />
          </div>
        );
      }
    `;
    expect(lint("text-field", "text-field.tsx", source)).toEqual([
      expect.stringContaining("only on the outermost element of TextField"),
    ]);
  });

  it("reports a file named for a component it doesn't define", () => {
    const source = `export function Other() { return <div className={cx(\`preflight\`)} />; }`;
    expect(lint("badge", "badge.tsx", source)).toEqual([expect.stringContaining("doesn't define one")]);
  });

  it("leaves other files alone: tests, and files not named for their folder", () => {
    expect(lint("tabs", "tabs.test.tsx", tabs("flex", "preflight"))).toEqual([]);
    expect(lint("tabs", "examples.tsx", tabs("flex", "preflight"))).toEqual([]);
  });
});
