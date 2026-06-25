import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase.js";
import { SAMPLE_LEADS, C } from "./data.js";
import Login from "./views/Login.jsx";
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
  const [session, setSession]           = useState(undefined); // undefined = loading
  const [tab, setTab]                   = useState("dashboard");
  const [role, setRole]                 = useState("user");
  const [apiKey, setApiKey]             = useState("");
  const [leads]                         = useState(SAMPLE_LEADS);
  const [selectedLead, setSelectedLead] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) setRole(s.user.user_metadata?.role || "user");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) setRole(s.user.user_metadata?.role || "user");
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setTab("dashboard");
  };

  if (session === undefined) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:C.bg, color:C.textMuted, fontFamily:"'Inter', sans-serif", fontSize:13 }}>
        Loading…
      </div>
    );
  }

  if (!session) return <Login />;

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
      case "settings":          return <Settings apiKey={apiKey} setApiKey={setApiKey} role={role} userEmail={session.user.email} onSignOut={handleSignOut} />;
      default:                  return <Dashboard leads={leads} setActiveTab={navTo} setSelectedLead={setSelectedLead} />;
    }
  };

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", fontFamily:"'Inter', -apple-system, sans-serif" }}>
      <Sidebar tab={tab} setTab={navTo} role={role} onSignOut={handleSignOut} />
      <main style={{ flex:1, overflow:"hidden", background:"#06091A" }}>
        {renderView()}
      </main>
    </div>
  );
}
