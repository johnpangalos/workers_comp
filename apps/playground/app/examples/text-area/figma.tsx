import { TextArea } from "@workers-comp/ui";

const states = ["default", "hover", "focus", "disabled"] as const;
const invalids = [false, true] as const;

// The page the Figma comparison drives (tests/text-area.figma.spec.ts): one TextArea per Figma
// variant (state × invalid), on white with the Figma texts, each in a wrapper the spec can find.
// Each wrapper is the Figma component's width (spacing/80); the spec puts the hover and focus ones
// in their state the way a person would.
export default function Figma() {
  return (
    <div className="flex w-fit flex-col items-start gap-8 bg-white p-8">
      {invalids.flatMap((invalid) =>
        states.map((state) => (
          <div key={`${state}-${invalid}`} data-figma={`${state}-${invalid}`} className="w-80">
            <TextArea
              label="Injury description"
              placeholder="What happened, and how were you hurt?"
              description="Say when, where and how it happened."
              errorMessage="Describe the injury before you continue."
              invalid={invalid}
              disabled={state === "disabled"}
            />
          </div>
        )),
      )}
    </div>
  );
}
