import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "./lib/supabase.js";
import { C, THEMES } from "./data.js";

export const ThemeContext = createContext("dark");

export function useTheme() {
  return useContext(ThemeContext);
}
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
import WorkQueue from "./views/WorkQueue.jsx";
import ClientProfile from "./views/ClientProfile.jsx";
import Onboarding from "./views/Onboarding.jsx";

export default function App() {
  const [session, setSession]           = useState(undefined); // undefined = loading
  const [tab, setTab]                   = useState("dashboard");
  const [role, setRole]                 = useState("user");
  const [orgId, setOrgId]               = useState("");
  const [selectedLead, setSelectedLead] = useState(null);
  const [theme, setTheme]               = useState(() => localStorage.getItem("aims-theme") || "dark");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) {
        setRole(s.user.user_metadata?.role || "user");
        setOrgId(s.user.user_metadata?.org_id || "");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) {
        setRole(s.user.user_metadata?.role || "user");
        setOrgId(s.user.user_metadata?.org_id || "");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setTab("dashboard");
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("aims-theme", newTheme);
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
      case "dashboard":         return <Dashboard setActiveTab={navTo} setSelectedLead={setSelectedLead} />;
      case "crm":               return <CRM orgId={orgId} setActiveTab={navTo} setSelectedLead={setSelectedLead} />;
      case "pipeline":          return <Pipeline setSelectedLead={setSelectedLead} setActiveTab={navTo} />;
      case "conversations":     return <Conversations selectedLead={selectedLead} setSelectedLead={setSelectedLead} orgId={orgId} />;
      case "work-queue":        return <WorkQueue userEmail={session.user.email} />;
      case "campaigns":         return <Campaigns />;
      case "agent-aria":        return <AgentPage agentId="aria"     setActiveTab={navTo} orgId={orgId} role={role} />;
      case "agent-melody":      return <AgentPage agentId="melody"   setActiveTab={navTo} orgId={orgId} role={role} />;
      case "agent-lyric":       return <AgentPage agentId="lyric"    setActiveTab={navTo} orgId={orgId} role={role} />;
      case "agent-muse":        return <AgentPage agentId="muse"     setActiveTab={navTo} orgId={orgId} role={role} />;
      case "agent-allegra":     return <AgentPage agentId="allegra"  setActiveTab={navTo} orgId={orgId} role={role} />;
      case "lyric-workstation": return <LyricWorkstation orgId={orgId} />;
      case "client-profile":    return <ClientProfile role={role} orgId={orgId} />;
      case "onboarding":        return <Onboarding role={role} orgId={orgId} />;
      case "calendar":          return <CalendarView />;
      case "tasks":             return <Tasks />;
      case "notes":             return <Notes />;
      case "pricing":           return <Pricing />;
      case "settings":          return <Settings role={role} userEmail={session.user.email} orgId={orgId} theme={theme} onThemeToggle={toggleTheme} onSignOut={handleSignOut} />;
      default:                  return <Dashboard leads={leads} setActiveTab={navTo} setSelectedLead={setSelectedLead} />;
    }
  };

  const colors = THEMES[theme];

  return (
    <ThemeContext.Provider value={theme}>
      <div style={{ display:"flex", height:"100vh", overflow:"hidden", fontFamily:"'Inter', -apple-system, sans-serif", background: colors.bg }}>
        <Sidebar tab={tab} setTab={navTo} role={role} onSignOut={handleSignOut} />
        <main style={{ flex:1, overflow:"hidden", background: colors.bg }}>
          {renderView()}
        </main>
      </div>
    </ThemeContext.Provider>
  );
}
