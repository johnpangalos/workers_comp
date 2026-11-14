import { Select } from "@workers-comp/ui";

const states = ["default", "hover", "focus", "disabled", "open"] as const;

const bodyParts = [
  { value: "head", label: "Head" },
  { value: "back", label: "Back" },
  { value: "shoulder", label: "Shoulder" },
  { value: "hand", label: "Hand" },
  { value: "knee", label: "Knee", disabled: true },
];

// The page the Figma comparison drives (tests/select.figma.spec.ts), on white with the Figma text,
// each Select in a wrapper the spec can find: a trigger per SelectTrigger variant (state and invalid),
// a Select whose options are the four SelectOption states, the Listbox's Select, and the field in
// both Select variants. The spec puts each in its Figma state the way a person would.
export default function Figma() {
  return (
    <div className="flex w-fit flex-col items-start gap-6 bg-white p-8">
      {(["false", "true"] as const).flatMap((invalid) =>
        states.map((state) => (
          <div key={`${state}-${invalid}`} data-figma-trigger={`${state}-${invalid}`}>
            <Select
              aria-label="Injury"
              defaultValue="lower-back"
              invalid={invalid === "true"}
              disabled={state === "disabled"}
              items={[
                { value: "lower-back", label: "Lower back" },
                { value: "upper-back", label: "Upper back" },
              ]}
            />
          </div>
        )),
      )}
      <div data-figma="options">
        <Select
          aria-label="Option states"
          defaultValue="selected"
          items={[
            { value: "default", label: "Option" },
            { value: "highlighted", label: "Option" },
            { value: "selected", label: "Option" },
            { value: "disabled", label: "Option", disabled: true },
          ]}
        />
      </div>
      <div data-figma="listbox">
        <Select label="Body part" defaultValue="back" items={bodyParts} />
      </div>
      <div data-figma="field-false">
        <Select
          label="Body part"
          placeholder="Select a body part"
          description="Where the injury is."
          items={bodyParts}
        />
      </div>
      <div data-figma="field-true">
        <Select
          label="Body part"
          placeholder="Select a body part"
          description="Where the injury is."
          errorMessage="Choose the injured body part."
          invalid
          items={bodyParts}
        />
      </div>
    </div>
  );
}
