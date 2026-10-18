import { Badge, type BadgeColor } from "@workers-comp/ui";

const colors: BadgeColor[] = ["gray", "fuchsia", "red", "amber", "green", "teal", "blue", "violet", "pink"];

// The Figma component set, as a page: every color as a badge and as a link, with and without the
// dot. Tab through the links to see the keyboard focus ring; compare with figma/badge.json.
export default function Variants() {
  return (
    <div className="flex min-h-screen items-start justify-center bg-gray-50 p-12">
      <table className="text-sm">
        <thead>
          <tr className="text-left text-xs font-semibold text-gray-500">
            <th className="pr-10 pb-4">color</th>
            <th className="pr-10 pb-4">badge</th>
            <th className="pr-10 pb-4">link</th>
            <th className="pb-4">no dot</th>
          </tr>
        </thead>
        <tbody>
          {colors.map((color) => (
            <tr key={color}>
              <th className="py-2 pr-10 text-left font-normal text-gray-500">{color}</th>
              <td className="py-2 pr-10">
                <Badge color={color}>Badge</Badge>
              </td>
              <td className="py-2 pr-10">
                <Badge href="#badge" color={color}>
                  Badge
                </Badge>
              </td>
              <td className="py-2">
                <Badge color={color} dot={false}>
                  Badge
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
