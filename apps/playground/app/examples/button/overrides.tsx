import { Button } from "@workers-comp/ui";

// The Button's styles sit in @layer components, so anything in className wins
// without !important: Tailwind utilities here, or a plain CSS class in another app.
export default function Overrides() {
  return (
    <div className="flex min-h-screen items-start justify-center bg-gray-50 p-12">
      <div className="flex flex-col items-start gap-4">
        <Button>Default</Button>
        <Button className="rounded-full px-6">Pill</Button>
        <Button variant="outline" className="w-64 border-fuchsia-700 text-fuchsia-700">
          Full-width outline, recoloured
        </Button>
        <Button disabled className="rounded-full">
          Disabled pill
        </Button>
      </div>
    </div>
  );
}
