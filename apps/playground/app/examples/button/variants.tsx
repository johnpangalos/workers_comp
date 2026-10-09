import { Button } from "@workers-comp/ui";

const variants = ["default", "outline", "ghost"] as const;
const sizes = ["default", "sm"] as const;

// The Figma component set, as a page: every variant and size, enabled and disabled.
// Hover, press and Tab through them to compare with the Figma prototype.
export default function Variants() {
  return (
    <div className="flex min-h-screen items-start justify-center bg-gray-50 p-12">
      <table className="text-sm">
        <thead>
          <tr className="text-left text-xs font-semibold text-gray-500">
            <th className="pr-10 pb-4">variant / size</th>
            <th className="pr-10 pb-4">enabled</th>
            <th className="pb-4">disabled</th>
          </tr>
        </thead>
        <tbody>
          {variants.flatMap((variant) =>
            sizes.map((size) => (
              <tr key={`${variant}-${size}`}>
                <th className="py-2 pr-10 text-left font-normal text-gray-500">
                  {variant} / {size}
                </th>
                <td className="py-2 pr-10">
                  <Button variant={variant} size={size}>
                    Button
                  </Button>
                </td>
                <td className="py-2">
                  <Button variant={variant} size={size} disabled>
                    Button
                  </Button>
                </td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
}
