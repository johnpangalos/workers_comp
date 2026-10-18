import { Badge, type BadgeColor } from "@workers-comp/ui";

const colors: BadgeColor[] = ["gray", "fuchsia", "red", "amber", "green", "teal", "blue", "violet", "pink"];

// The page the Figma comparison drives (tests/badge.figma.spec.ts): for each color a badge and a
// link badge, on white with the Figma label, so each can be put in a Figma state and measured
// against figma/badge.json. Each badge sits in a block wrapper so it hugs its label, as in Figma.
export default function Figma() {
  return (
    <div className="grid w-fit grid-cols-2 gap-x-12 gap-y-4 bg-white p-8">
      {colors.flatMap((color) => [
        <div key={color}>
          <Badge color={color}>Badge</Badge>
        </div>,
        <div key={`${color}-link`}>
          <Badge href="#badge" color={color}>
            Badge
          </Badge>
        </div>,
      ])}
    </div>
  );
}
