import { type FormEvent, useState } from "react";
import { Button, Select, SelectOption } from "@workers-comp/ui";

const bodyParts = [
  { value: "head", label: "Head" },
  { value: "neck", label: "Neck" },
  { value: "lower-back", label: "Lower back" },
  { value: "shoulder", label: "Shoulder" },
  { value: "hand", label: "Hand or wrist" },
  { value: "knee", label: "Knee" },
  { value: "foot", label: "Foot or ankle" },
];

// A realistic use: the first step of a workers' comp claim. The body part comes from data (`items`),
// the kind of injury from `SelectOption` children, and the shift is fixed by the employer, so it is
// disabled. Submitting without a body part marks it invalid with an error message; picking one
// clears it. The form data shows what the hidden native select submits.
export default function ClaimForm() {
  const [bodyPart, setBodyPart] = useState("");
  const [missing, setMissing] = useState(false);
  const [submitted, setSubmitted] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!bodyPart) {
      setMissing(true);
      return;
    }
    const data = Array.from(new FormData(event.currentTarget), ([name, value]) => `${name}=${String(value)}`);
    setSubmitted(data.join(", "));
  }

  return (
    <div className="min-h-screen bg-gray-50 p-12">
      <form
        noValidate
        onSubmit={submit}
        className="mx-auto flex max-w-md flex-col gap-6 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200"
      >
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Report an injury</h1>
          <p className="mt-1 text-sm text-gray-600">Step 1 of 3: what happened.</p>
        </div>
        <Select
          name="bodyPart"
          label="Body part"
          placeholder="Select a body part"
          description="Where the injury is. Pick the main one if there are several."
          errorMessage="Choose the injured body part."
          invalid={missing && !bodyPart}
          value={bodyPart}
          onValueChange={(value) => {
            setBodyPart(value);
            setMissing(false);
          }}
          items={bodyParts}
        />
        <Select name="injury" label="Kind of injury" defaultValue="strain">
          <SelectOption value="strain">Strain or sprain</SelectOption>
          <SelectOption value="cut">Cut or puncture</SelectOption>
          <SelectOption value="fracture">Fracture</SelectOption>
          <SelectOption value="burn">Burn</SelectOption>
          <SelectOption value="illness" disabled>
            Occupational illness (use form 5020)
          </SelectOption>
        </Select>
        <Select
          name="shift"
          label="Shift"
          description="Set by your employer."
          defaultValue="day"
          disabled
          items={[
            { value: "day", label: "Day (7am to 3pm)" },
            { value: "swing", label: "Swing (3pm to 11pm)" },
          ]}
        />
        <div className="flex items-center gap-3">
          <Button type="submit">Continue</Button>
          {submitted && <p className="text-sm text-gray-600">Submitted: {submitted}</p>}
        </div>
      </form>
    </div>
  );
}
