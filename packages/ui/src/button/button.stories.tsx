import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { Button } from "./button";

const meta = {
  title: "Components/Button",
  component: Button,
  args: { children: "Button", onClick: fn() },
  argTypes: {
    variant: { control: "inline-radio", options: ["default", "outline", "ghost"] },
    size: { control: "inline-radio", options: ["default", "sm"] },
    disabled: { control: "boolean" },
  },
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/design/5OcRRw5a7qZGsgC43FjCp9?node-id=1-91",
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The playground: change variant, size and label in the Controls panel. */
export const Playground: Story = {};

export const Outline: Story = { args: { variant: "outline" } };
export const Ghost: Story = { args: { variant: "ghost" } };
export const Small: Story = { args: { size: "sm" } };
export const Disabled: Story = { args: { disabled: true } };

/**
 * The same grid as the Figma component set: variant × size, with the
 * static states side by side. Hover, press and Tab the live buttons to
 * compare against the Figma prototype.
 */
export const Matrix: Story = {
  render: () => (
    <div className="grid grid-cols-[auto_repeat(3,auto)] items-center gap-x-8 gap-y-4 font-sans text-sm text-gray-500">
      <span />
      <span>default</span>
      <span>focus (Tab to it)</span>
      <span>disabled</span>
      {(["default", "outline", "ghost"] as const).flatMap((variant) =>
        (["default", "sm"] as const).map((size) => (
          <div key={`${variant}-${size}`} className="contents">
            <span>
              {variant} / {size}
            </span>
            <div>
              <Button variant={variant} size={size}>
                Button
              </Button>
            </div>
            <div>
              <Button variant={variant} size={size}>
                Button
              </Button>
            </div>
            <div>
              <Button variant={variant} size={size} disabled>
                Button
              </Button>
            </div>
          </div>
        )),
      )}
    </div>
  ),
};
