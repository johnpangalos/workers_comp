import { Button } from "@workers-comp/ui";
import { definePlayground } from "../playground";

export default definePlayground({
  name: "Button",
  description:
    "Hover, press and Tab to the live buttons to see each state. Variants and sizes match the Figma component set.",
  figma: "https://www.figma.com/design/5OcRRw5a7qZGsgC43FjCp9?node-id=1-91",
  component: Button,
  controls: {
    variant: { type: "select", options: ["default", "outline", "ghost"], default: "default" },
    size: { type: "select", options: ["default", "sm"], default: "default" },
    disabled: { type: "boolean", default: false },
    children: { type: "text", default: "Button" },
  },
  matrix: {
    rows: ["variant", "size"],
    columns: [
      { label: "default", props: {} },
      { label: "disabled", props: { disabled: true } },
    ],
  },
});
