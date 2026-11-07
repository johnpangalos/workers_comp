import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type MouseEvent, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  Tab,
  TabList,
  tabClassName,
  TabPanel,
  tabListClassName,
  tabPanelClassName,
  Tabs,
  type TabsProps,
  tabsClassName,
} from "./tabs";

// These tests cover behaviour and the attributes and classes the styles select on.
// What those look like is checked in a real browser (the playground, tests/tabs.figma.spec.ts).

// The three-tab example the tests share: Settings is disabled.
function Example(props: Omit<TabsProps, "children">) {
  return (
    <Tabs {...props}>
      <TabList aria-label="Account">
        <Tab value="overview">Overview</Tab>
        <Tab value="activity">Activity</Tab>
        <Tab value="settings" disabled>
          Settings
        </Tab>
      </TabList>
      <TabPanel value="overview">Overview panel</TabPanel>
      <TabPanel value="activity">Activity panel</TabPanel>
      <TabPanel value="settings">Settings panel</TabPanel>
    </Tabs>
  );
}

const tab = (name: string) => screen.getByRole("tab", { name });

describe("Tabs", () => {
  it("renders a div with data-slot=tabs and its own classes by default", () => {
    const { container } = render(<Example defaultValue="overview" />);
    const root = container.firstElementChild!;
    expect(root.tagName).toBe("DIV");
    expect(root).toHaveAttribute("data-slot", "tabs");
    expect(root).toHaveAttribute("class", tabsClassName);
  });

  it("renders the element given as, not a div", () => {
    const { container } = render(
      <Tabs as="section" defaultValue="a">
        <TabList>
          <Tab value="a">A</Tab>
        </TabList>
      </Tabs>,
    );
    expect(container.firstElementChild!.tagName).toBe("SECTION");
    expect(container.firstElementChild).toHaveAttribute("class", tabsClassName);
  });

  it("appends className after its own classes and passes other props through", () => {
    const { container } = render(
      <Example defaultValue="overview" className="gap-6" id="account" data-testid="root" />,
    );
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute("class", `${tabsClassName} gap-6`);
    expect(root).toHaveAttribute("id", "account");
    expect(root).toHaveAttribute("data-testid", "root");
  });

  it("onValueChange receives the value of the tab the user selects", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn<(value: string) => void>();
    render(<Example defaultValue="overview" onValueChange={onValueChange} />);
    await user.click(tab("Activity"));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("activity");
    expect(tab("Activity")).toHaveAttribute("aria-selected", "true");
  });

  it("a controlled value without onValueChange stays on that value when another tab is clicked", async () => {
    const user = userEvent.setup();
    render(<Example value="overview" />);
    await user.click(tab("Activity"));
    expect(tab("Overview")).toHaveAttribute("aria-selected", "true");
    expect(tab("Activity")).toHaveAttribute("aria-selected", "false");
  });

  it("a controlled value follows onValueChange when the parent updates it", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState("overview");
      return (
        <>
          <p>Selected: {value}</p>
          <Example value={value} onValueChange={setValue} />
        </>
      );
    }
    render(<Controlled />);
    await user.click(tab("Activity"));
    expect(screen.getByText("Selected: activity")).toBeInTheDocument();
    expect(tab("Activity")).toHaveAttribute("aria-selected", "true");
  });
});

describe("TabList", () => {
  it("is role=tablist with its own classes, and appends className", () => {
    render(
      <Tabs defaultValue="a">
        <TabList className="w-full" aria-label="Account">
          <Tab value="a">A</Tab>
        </TabList>
      </Tabs>,
    );
    const list = screen.getByRole("tablist", { name: "Account" });
    expect(list).toHaveAttribute("class", `${tabListClassName} w-full`);
    expect(list).toHaveAttribute("aria-orientation", "horizontal");
  });
});

describe("Tab", () => {
  it("is a native button with role=tab that selects its own value, and reports data-selected", () => {
    render(<Example defaultValue="overview" />);
    const overview = tab("Overview");
    expect(overview.tagName).toBe("BUTTON");
    expect(overview).toHaveAttribute("type", "button");
    expect(overview).toHaveAttribute("aria-selected", "true");
    expect(overview).toHaveAttribute("data-selected", "");
    expect(tab("Activity")).toHaveAttribute("aria-selected", "false");
    expect(tab("Activity")).not.toHaveAttribute("data-selected");
  });

  it("carries only its own classes by default", () => {
    render(<Example defaultValue="overview" />);
    expect(tab("Activity")).toHaveAttribute("class", tabClassName);
  });

  it("appends className after its own classes", () => {
    render(
      <Tabs defaultValue="a">
        <TabList>
          <Tab value="a" className="w-full">
            A
          </Tab>
        </TabList>
      </Tabs>,
    );
    expect(tab("A")).toHaveAttribute("class", `${tabClassName} w-full`);
  });

  it("passes data-* and aria-* attributes through (its id pairs it with the panel, so it is comp0's)", () => {
    render(
      <Tabs defaultValue="a">
        <TabList>
          <Tab value="a" data-track="first-tab" aria-describedby="hint">
            A
          </Tab>
        </TabList>
      </Tabs>,
    );
    const first = tab("A");
    expect(first).toHaveAttribute("data-track", "first-tab");
    expect(first).toHaveAttribute("aria-describedby", "hint");
  });

  it("reports hover as data-hovered, the attribute the hover styles select on", async () => {
    const user = userEvent.setup();
    render(<Example defaultValue="overview" />);
    const activity = tab("Activity");
    expect(activity).not.toHaveAttribute("data-hovered");
    await user.hover(activity);
    expect(activity).toHaveAttribute("data-hovered", "");
    await user.unhover(activity);
    expect(activity).not.toHaveAttribute("data-hovered");
  });

  it("reports data-disabled on a disabled tab", () => {
    render(<Example defaultValue="overview" />);
    expect(tab("Settings")).toBeDisabled();
    expect(tab("Settings")).toHaveAttribute("data-disabled", "");
  });

  it("is reached by Tab and shows a focus ring for keyboard focus only", async () => {
    const user = userEvent.setup();
    render(<Example defaultValue="overview" />);
    await user.tab();
    expect(tab("Overview")).toHaveFocus();
    expect(tab("Overview")).toHaveAttribute("data-focus-visible", "");
    await user.click(tab("Overview"));
    expect(tab("Overview")).not.toHaveAttribute("data-focus-visible");
  });

  it("a click selects the tab and fires the consumer's onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn<() => void>();
    render(
      <Tabs defaultValue="overview">
        <TabList>
          <Tab value="overview">Overview</Tab>
          <Tab value="activity" onClick={onClick}>
            Activity
          </Tab>
        </TabList>
      </Tabs>,
    );
    await user.click(tab("Activity"));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(tab("Activity")).toHaveAttribute("aria-selected", "true");
  });

  it("clicking a disabled tab doesn't select it or call onValueChange", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn<(value: string) => void>();
    render(<Example defaultValue="overview" onValueChange={onValueChange} />);
    await user.click(tab("Settings"));
    expect(tab("Settings")).toHaveAttribute("aria-selected", "false");
    expect(tab("Overview")).toHaveAttribute("aria-selected", "true");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("Enter and Space on a focused tab select it", async () => {
    const user = userEvent.setup();
    render(<Example defaultValue="overview" />);
    tab("Activity").focus();
    await user.keyboard("{Enter}");
    expect(tab("Activity")).toHaveAttribute("aria-selected", "true");
    tab("Overview").focus();
    await user.keyboard(" ");
    expect(tab("Overview")).toHaveAttribute("aria-selected", "true");
  });

  it("a consumer's onClick that calls preventDefault stops the tab being selected, and still runs", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn<(event: MouseEvent) => void>((event) => event.preventDefault());
    const onValueChange = vi.fn<(value: string) => void>();
    render(
      <Tabs defaultValue="overview" onValueChange={onValueChange}>
        <TabList>
          <Tab value="overview">Overview</Tab>
          <Tab value="activity" onClick={onClick}>
            Activity
          </Tab>
        </TabList>
      </Tabs>,
    );
    await user.click(tab("Activity"));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(tab("Activity")).toHaveAttribute("aria-selected", "false");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it.each([
    ["the reset of native appearance", "appearance-none"],
    ["no native border", "border-0"],
    ["the medium label", "font-medium"],
    ["the grey label", "text-gray-600"],
    ["the rounded corners", "rounded-md"],
    ["the horizontal padding", "px-3"],
    ["the vertical padding", "py-1.5"],
    ["the 14px label", "text-sm"],
    ["the hover label", "data-hovered:text-gray-900"],
    ["the selected background", "data-selected:bg-white"],
    ["the selected label", "data-selected:text-gray-900"],
    ["the disabled label", "data-disabled:text-gray-400"],
    ["the selected disabled label", "data-selected:data-disabled:text-gray-400"],
    ["the focus ring", "data-focus-visible:ring-2"],
    ["the focus ring colour", "data-focus-visible:ring-fuchsia-600"],
    ["the focus ring offset", "data-focus-visible:ring-offset-2"],
  ])("tabClassName has %s", (_, expected) => {
    expect(tabClassName.split(/\s+/)).toContain(expected);
  });

  // Hostile inputs

  it("a tab hovered and then disabled drops data-hovered", async () => {
    const user = userEvent.setup();
    const tabs = (disabled: boolean) => (
      <Tabs defaultValue="a">
        <TabList>
          <Tab value="a">A</Tab>
          <Tab value="b" disabled={disabled}>
            B
          </Tab>
        </TabList>
      </Tabs>
    );
    const { rerender } = render(tabs(false));
    await user.hover(tab("B"));
    expect(tab("B")).toHaveAttribute("data-hovered", "");
    rerender(tabs(true));
    expect(tab("B")).not.toHaveAttribute("data-hovered");
  });

  it("a hover over a disabled tab never reports data-hovered, even after the pointer moves over it", async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="a">
        <TabList>
          <Tab value="a">A</Tab>
          <Tab value="b" disabled>
            B
          </Tab>
        </TabList>
      </Tabs>,
    );
    await user.hover(tab("B"));
    await user.hover(tab("A"));
    await user.hover(tab("B"));
    expect(tab("B")).not.toHaveAttribute("data-hovered");
  });
});

describe("TabPanel", () => {
  it("is role=tabpanel, labelled by its tab, with its own classes", () => {
    render(<Example defaultValue="overview" />);
    const panel = screen.getByRole("tabpanel", { name: "Overview" });
    expect(panel).toHaveTextContent("Overview panel");
    expect(panel).toHaveAttribute("aria-labelledby", tab("Overview").id);
    expect(panel).toHaveAttribute("class", tabPanelClassName);
    expect(panel).toHaveAttribute("data-selected", "");
    expect(panel).not.toHaveAttribute("hidden");
  });

  it("is hidden while its tab is not selected, and stays mounted", () => {
    render(<Example defaultValue="overview" />);
    const panel = screen.getByText("Activity panel");
    expect(panel).toHaveAttribute("hidden");
    expect(panel).not.toHaveAttribute("data-selected");
  });

  it("appends className after its own classes", () => {
    render(
      <Tabs defaultValue="a">
        <TabList>
          <Tab value="a">A</Tab>
        </TabList>
        <TabPanel value="a" className="gap-2">
          Body
        </TabPanel>
      </Tabs>,
    );
    expect(screen.getByText("Body")).toHaveAttribute("class", `${tabPanelClassName} gap-2`);
  });

  it.each([
    ["the column layout", "flex-col"],
    ["the start alignment", "items-start"],
    ["the 16px padding", "p-4"],
    ["the 14px text", "text-sm"],
    ["the regular weight", "font-normal"],
    ["the grey text", "text-gray-700"],
    ["the hidden rule that beats the flex class", "not-data-selected:hidden"],
  ])("tabPanelClassName has %s", (_, expected) => {
    expect(tabPanelClassName.split(/\s+/)).toContain(expected);
  });

  // Hostile inputs

  it("defaultValue matching no tab: nothing is selected, the Tab key still reaches the first enabled tab, and no panel shows", async () => {
    const user = userEvent.setup();
    render(<Example defaultValue="missing" />);
    for (const name of ["Overview", "Activity", "Settings"]) {
      expect(tab(name)).toHaveAttribute("aria-selected", "false");
    }
    await user.tab();
    expect(tab("Overview")).toHaveFocus();
    for (const name of ["Overview", "Activity", "Settings"]) {
      expect(screen.getByText(`${name} panel`)).toHaveAttribute("hidden");
    }
  });

  it("defaultValue naming a disabled tab: the Tab key reaches an enabled tab, and arrows never land on the disabled one", async () => {
    const user = userEvent.setup();
    render(<Example defaultValue="settings" />);
    expect(tab("Settings")).toHaveAttribute("aria-selected", "true");
    await user.tab();
    expect(tab("Overview")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(tab("Activity")).toHaveFocus();
    expect(tab("Activity")).toHaveAttribute("aria-selected", "true");
    expect(tab("Settings")).not.toHaveFocus();
  });
});

describe("Tabs classes", () => {
  it.each([
    ["tabsClassName", tabsClassName],
    ["tabListClassName", tabListClassName],
    ["tabClassName", tabClassName],
    ["tabPanelClassName", tabPanelClassName],
  ])("%s uses theme utilities only, never arbitrary values", (_, classes) => {
    // An arbitrary value is `w-[137px]` or `text-[#…]`; a data attribute selector is `data-[…]`.
    expect(classes).not.toMatch(/(?<!data)-\[/);
  });
});

describe("Tabs keyboard navigation", () => {
  it("the Tab key reaches the selected tab", async () => {
    const user = userEvent.setup();
    render(<Example defaultValue="activity" />);
    await user.tab();
    expect(tab("Activity")).toHaveFocus();
  });

  it("ArrowRight and ArrowLeft move to and select the next and previous enabled tab, wrapping and skipping disabled ones", async () => {
    const user = userEvent.setup();
    render(<Example defaultValue="overview" />);
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(tab("Activity")).toHaveFocus();
    expect(tab("Activity")).toHaveAttribute("aria-selected", "true");
    // Settings is disabled, so the next tab after Activity is Overview again.
    await user.keyboard("{ArrowRight}");
    expect(tab("Overview")).toHaveFocus();
    expect(tab("Overview")).toHaveAttribute("aria-selected", "true");
    // Going back from the first tab wraps to the last enabled one.
    await user.keyboard("{ArrowLeft}");
    expect(tab("Activity")).toHaveFocus();
    expect(tab("Activity")).toHaveAttribute("aria-selected", "true");
  });

  it("Home and End move to and select the first and last enabled tab", async () => {
    const user = userEvent.setup();
    render(<Example defaultValue="overview" />);
    await user.tab();
    await user.keyboard("{End}");
    expect(tab("Activity")).toHaveFocus();
    expect(tab("Activity")).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{Home}");
    expect(tab("Overview")).toHaveFocus();
    expect(tab("Overview")).toHaveAttribute("aria-selected", "true");
  });
});
