import { Button } from "@workers-comp/ui";

// The Button's styles sit in @layer components, so anything in className wins
// without !important: Tailwind utilities here, or a plain CSS class in another app.
export default function Overrides() {
  return (
    <div className="flex min-h-screen items-start justify-center bg-gray-50 p-12">
      <div className="flex flex-col items-start gap-4">
        <Button>Default</Button>
        <Button className="rounded-none px-8">Square</Button>
        <Button variant="outlined" className="w-64 border-gray-400 text-gray-900">
          Full-width outlined, recoloured
        </Button>
        <Button disabled className="rounded-none">
          Disabled square
        </Button>
      </div>
    </div>
  );
}
