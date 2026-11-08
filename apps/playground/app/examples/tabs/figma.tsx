import { Tab, TabList, TabPanel, Tabs } from "@workers-comp/ui";

// The page the Figma comparison drives (tests/tabs.figma.spec.ts): every Tab variant, a TabList, a
// TabPanel and a whole Tabs, on white with the Figma labels, each in a wrapper the spec can find.
// Each wrapper hugs its content, as in Figma.
export default function Figma() {
  return (
    <div className="flex w-fit flex-col items-start gap-6 bg-white p-8">
      <div data-figma-tab="false-default">
        <Tabs defaultValue="none">
          <TabList>
            <Tab value="tab">Tab</Tab>
          </TabList>
        </Tabs>
      </div>
      <div data-figma-tab="false-hover">
        <Tabs defaultValue="none">
          <TabList>
            <Tab value="tab">Tab</Tab>
          </TabList>
        </Tabs>
      </div>
      <div data-figma-tab="false-disabled">
        <Tabs defaultValue="none">
          <TabList>
            <Tab value="tab" disabled>
              Tab
            </Tab>
          </TabList>
        </Tabs>
      </div>
      <div data-figma-tab="true-default">
        <Tabs defaultValue="tab">
          <TabList>
            <Tab value="tab">Tab</Tab>
          </TabList>
        </Tabs>
      </div>
      <div data-figma-tab="true-focus">
        <Tabs defaultValue="tab">
          <TabList>
            <Tab value="tab">Tab</Tab>
          </TabList>
        </Tabs>
      </div>
      <div data-figma="tablist">
        <Tabs defaultValue="overview">
          <TabList>
            <Tab value="overview">Overview</Tab>
            <Tab value="activity">Activity</Tab>
            <Tab value="settings" disabled>
              Settings
            </Tab>
          </TabList>
        </Tabs>
      </div>
      <div data-figma="tabpanel">
        <Tabs defaultValue="overview">
          <TabPanel value="overview">Overview panel</TabPanel>
        </Tabs>
      </div>
      <div data-figma="tabs">
        <Tabs defaultValue="overview">
          <TabList>
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
      </div>
    </div>
  );
}
