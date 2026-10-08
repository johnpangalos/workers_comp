import type { Preview } from "@storybook/react-vite";
import "./preview.css";

const preview: Preview = {
  parameters: {
    layout: "centered",
    controls: { expanded: true },
    // Fail the a11y panel (and `storybook test`) on violations instead of just listing them.
    a11y: { test: "error" },
  },
};

export default preview;
