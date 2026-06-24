import { useState } from "react";
import { SAMPLE_LEADS } from "./data.js";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./views/Dashboard.jsx";
import CRM from "./views/CRM.jsx";
import Pipeline from "./views/Pipeline.jsx";
import Conversations from "./views/Conversations.jsx";
import Campaigns from "./views/Campaigns.jsx";
import AgentPage from "./views/AgentPage.jsx";
import LyricWorkstation from "./views/LyricWorkstation.jsx";
import CalendarView from "./views/Calendar.jsx";
import Tasks from "./views/Tasks.jsx";
import Notes from "./views/Notes.jsx";
import Pricing from "./views/Pricing.jsx";
import Settings from "./views/Settings.jsx";

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [role, setRole] = useState("admin");
  const [apiKey, setApiKey] = useState("");
  const [leads] = useState(SAMPLE_LEADS);
  const [selectedLead, setSelectedLead] = useState(null);

  const navTo = (newTab) => setTab(newTab);

  const renderView = () => {
    switch (tab) {
      case "dashboard":         return <Dashboard leads={leads} setActiveTab={navTo} setSelectedLead={setSelectedLead} />;
      case "crm":               return <CRM setActiveTab={navTo} setSelectedLead={setSelectedLead} />;
      case "pipeline":          return <Pipeline leads={leads} setSelectedLead={setSelectedLead} setActiveTab={navTo} />;
      case "conversations":     return <Conversations leads={leads} selectedLead={selectedLead} setSelectedLead={setSelectedLead} apiKey={apiKey} />;
      case "campaigns":         return <Campaigns />;
      case "agent-aria":        return <AgentPage agentId="aria"   apiKey={apiKey} setActiveTab={navTo} />;
      case "agent-melody":      return <AgentPage agentId="melody" apiKey={apiKey} setActiveTab={navTo} />;
      case "agent-lyric":       return <AgentPage agentId="lyric"  apiKey={apiKey} setActiveTab={navTo} />;
      case "agent-muse":        return <AgentPage agentId="muse"   apiKey={apiKey} setActiveTab={navTo} />;
      case "lyric-workstation": return <LyricWorkstation apiKey={apiKey} />;
      case "calendar":          return <CalendarView />;
      case "tasks":             return <Tasks />;
      case "notes":             return <Notes />;
      case "pricing":           return <Pricing />;
      case "settings":          return <Settings apiKey={apiKey} setApiKey={setApiKey} role={role} setRole={setRole} />;
      default:                  return <Dashboard leads={leads} setActiveTab={navTo} setSelectedLead={setSelectedLead} />;
    }
  };

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", fontFamily:"'Inter', -apple-system, sans-serif" }}>
      <Sidebar tab={tab} setTab={navTo} role={role} />
      <main style={{ flex:1, overflow:"hidden", background:"#06091A" }}>
        {renderView()}
      </main>
    </div>
  );
}
