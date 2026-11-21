import { Button } from "@workers-comp/ui";

const variants = ["filled", "tonal", "outlined", "text", "accent"] as const;
const sizes = ["xs", "sm", "md", "lg", "xl"] as const;

// The page the Figma comparison drives (tests/button.figma.spec.ts): one enabled and one
// disabled Button per variant and size, on white with the Figma label, so each can be put in
// a Figma state and measured against figma/button-<variant>.json.
export default function Figma() {
  return (
    <div className="flex w-fit flex-col gap-8 bg-white p-8">
      {variants.map((variant) => (
        <div key={variant} className="flex items-start gap-8">
          {sizes.flatMap((size) => [
            <div key={size}>
              <Button variant={variant} size={size}>
                Button
              </Button>
            </div>,
            <div key={`${size}-disabled`}>
              <Button variant={variant} size={size} disabled>
                Button
              </Button>
            </div>,
          ])}
        </div>
      ))}
    </div>
  );
}
