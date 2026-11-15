import { Tab, TabList, TabPanel, Tabs } from "@workers-comp/ui";

// Native controls an app puts inside a TabPanel, with no classes of their own. The components'
// reset must leave them with the browser's look and size (tests/tabs.native-controls.spec.ts).
export default function NativeControls() {
  return (
    <div className="flex w-fit flex-col items-start bg-white p-8">
      <Tabs defaultValue="notify">
        <TabList>
          <Tab value="notify">Notify</Tab>
          <Tab value="plan">Plan</Tab>
        </TabList>
        <TabPanel value="notify">
          <label>
            <input type="checkbox" name="email" /> Email me
          </label>
          <label>
            <input type="radio" name="frequency" value="daily" /> Daily
          </label>
          <label>
            <input type="radio" name="frequency" value="weekly" /> Weekly
          </label>
          <select name="channel" defaultValue="email">
            <option value="email">Email</option>
            <option value="sms">Text message</option>
          </select>
        </TabPanel>
        <TabPanel value="plan">Your plan and invoices.</TabPanel>
      </Tabs>
    </div>
  );
}
