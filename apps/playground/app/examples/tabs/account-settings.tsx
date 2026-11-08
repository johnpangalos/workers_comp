import { useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "@workers-comp/ui";

// A realistic use: an account card whose sections are tabs. The selected section is kept in state,
// so the page can show which one is open and the tabs follow the state. Billing is disabled until
// the account has a plan.
export default function AccountSettings() {
  const [section, setSection] = useState("profile");

  return (
    <div className="min-h-screen bg-gray-50 p-12">
      <div className="mx-auto max-w-lg rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h1 className="text-base font-semibold text-gray-900">Account</h1>
        <p className="mt-1 text-sm text-gray-500">Showing: {section}</p>
        <Tabs value={section} onValueChange={setSection} className="mt-4 w-full">
          <TabList aria-label="Account sections">
            <Tab value="profile">Profile</Tab>
            <Tab value="team">Team</Tab>
            <Tab value="billing" disabled>
              Billing
            </Tab>
          </TabList>
          <TabPanel value="profile">Your name, email address and photo.</TabPanel>
          <TabPanel value="team">The people who can sign in to this account.</TabPanel>
          <TabPanel value="billing">Your plan and invoices.</TabPanel>
        </Tabs>
      </div>
    </div>
  );
}
