import { readdirSync } from "node:fs";
import { index, route, type RouteConfig } from "@react-router/dev/routes";

// Every file in app/examples is a page at its own path:
// app/examples/button/in-a-form.tsx → /button/in-a-form. Add a file, get a page.
const examples = readdirSync(new URL("./examples", import.meta.url), { recursive: true })
  .map(String)
  .filter((file) => file.endsWith(".tsx"))
  .sort();

export default [
  index("routes/home.tsx"),
  ...examples.map((file) => route(file.replace(/\.tsx$/, ""), `examples/${file}`)),
] satisfies RouteConfig;
