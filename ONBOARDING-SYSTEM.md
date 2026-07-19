# Onboarding System — Developer Documentation

## Overview

The Onboarding System is a comprehensive guided experience that helps new users get up to speed with AIMS Command Center. It consists of 4 integrated components accessible via the "Get Started" (🎯) sidebar option.

## Architecture

### Components

```
src/views/OnboardingHub.jsx          — Main hub, ties all sections together
  ├─ src/components/OnboardingChecklist.jsx    — Task progress checklist
  ├─ src/components/SetupWizard.jsx           — Step-by-step wizard
  ├─ src/components/InteractiveTour.jsx       — Feature walkthrough
  └─ src/components/QuickStartGuides.jsx      — Resources & guides
```

### Task Definition

```javascript
const TASKS = [
  { id: "api-keys", label: "Connect API Keys", icon: "🔑", category: "setup" },
  { id: "import-contacts", label: "Import First Contacts", icon: "👥", category: "setup" },
  { id: "brand-voice", label: "Configure Brand Voice", icon: "🎙", category: "setup" },
  { id: "first-campaign", label: "Create First Campaign", icon: "📢", category: "marketing" },
  { id: "schedule-post", label: "Schedule First Post", icon: "📅", category: "marketing" },
  { id: "agent-setup", label: "Activate AI Agents", icon: "🤖", category: "setup" },
  { id: "team-invite", label: "Invite Team Members", icon: "👫", category: "team" },
  { id: "notifications", label: "Set Up Notifications", icon: "🔔", category: "setup" },
  { id: "customize-theme", label: "Customize Theme & Branding", icon: "🎨", category: "setup" },
  { id: "explore-features", label: "Explore All Features", icon: "🚀", category: "learning" },
];
```

### Categories

- **setup** (🔧) — Core configuration tasks
- **marketing** (📢) — Marketing campaign tasks
- **team** (👥) — Team collaboration
- **learning** (🎓) — Feature discovery

## Component Details

### OnboardingHub (Main)

**File:** `src/views/OnboardingHub.jsx`

**Props:**
- `setActiveTab` — Function to navigate to different app sections

**State:**
- `completed` — Set of completed task IDs
- `currentStep` — Current wizard step index
- `showWizard` — Toggle wizard visibility
- `showTour` — Toggle tour visibility
- `activeTab` — Currently active section ("checklist", "wizard", "guides", "tour")

**Features:**
- Progress summary card showing overall completion %
- Tab navigation between 4 sections
- Real-time progress persistence to database
- Clean, accessible UI with proper color contrast

**Database Integration:**
```javascript
// Loads from onboarding_progress table
const { data } = await supabase
  .from("onboarding_progress")
  .select("completed_tasks")
  .eq("user_id", user.id)
  .single();

// Updates on task toggle
await supabase.from("onboarding_progress").upsert({
  user_id: user.id,
  completed_tasks: Array.from(newCompleted),
  updated_at: new Date(),
});
```

---

### OnboardingChecklist

**File:** `src/components/OnboardingChecklist.jsx`

**Props:**
- `tasks` — Array of task objects
- `completed` — Set of completed task IDs
- `onToggle` — Function to toggle task completion
- `setActiveTab` — Navigation function

**Features:**
- Groups tasks by category
- Shows category progress percentage
- Individual task cards with checkbox
- Click-to-complete functionality
- Visual feedback (strikethrough, color change)

**Task Card Structure:**
```javascript
{
  id: "task-id",
  label: "Task Label",
  icon: "emoji",
  category: "category-name"
}
```

---

### SetupWizard

**File:** `src/components/SetupWizard.jsx`

**Props:**
- `tasks` — Array of task objects
- `completed` — Set of completed task IDs
- `onToggle` — Function to mark step complete
- `currentStep` — Current step index
- `setCurrentStep` — Function to change step
- `setActiveTab` — Navigation function

**Wizard Steps:**
1. API Keys (password/text inputs)
2. Import Contacts (file upload)
3. Brand Voice (text, select, textarea)
4. Agent Setup (checkboxes)
5. First Campaign (text, select)

**Features:**
- Progress bar showing steps
- Back/Next navigation
- Field validation (empty/required)
- Completion status indicators
- Step-by-step guidance

**Step Definition:**
```javascript
const WIZARD_STEPS = [
  {
    id: "api-keys",
    title: "Connect API Keys",
    icon: "🔑",
    description: "...",
    fields: [
      { label: "...", key: "...", type: "password", placeholder: "...", help: "..." }
    ]
  }
];
```

**Field Types Supported:**
- `text` — Standard text input
- `password` — Masked password input
- `textarea` — Multi-line text area
- `select` — Dropdown selection
- `checkbox` — Boolean toggle
- `file` — File upload (CSV)

---

### InteractiveTour

**File:** `src/components/InteractiveTour.jsx`

**Props:**
- `setActiveTab` — Function to navigate to sections

**Tour Stops:**
1. Dashboard
2. Pipeline
3. Conversations
4. Campaigns
5. LYRIC Workstation
6. Calendar
7. AI Agents
8. Settings

**Features:**
- Sequential tour navigation
- Feature highlights for each stop
- Direct "Go to Section" buttons
- Quick-jump grid for all sections
- Progress indicator

**Tour Stop Structure:**
```javascript
{
  section: "Section Name",
  icon: "emoji",
  title: "Title",
  description: "Detailed description...",
  highlights: ["Feature 1", "Feature 2", "Feature 3"]
}
```

---

### QuickStartGuides

**File:** `src/components/QuickStartGuides.jsx`

**Props:** None

**Features:**
- 6 quick tips cards
- 8 expandable step-by-step guides
- External resource links
- Estimated completion time per guide

**Guide Structure:**
```javascript
{
  title: "Guide Title",
  icon: "emoji",
  duration: "15 min",
  steps: [
    "Step 1 instructions",
    "Step 2 instructions"
  ]
}
```

---

## Database Schema

### onboarding_progress Table

```sql
CREATE TABLE onboarding_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID,
  completed_tasks TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_onboarding_progress_user_id ON onboarding_progress(user_id);
CREATE INDEX idx_onboarding_progress_org_id ON onboarding_progress(org_id);
```

### RLS Policies

Users can only view/update their own onboarding progress:

```sql
-- SELECT: Own data or admin
CREATE POLICY onboarding_progress_select ON onboarding_progress
  FOR SELECT USING (auth.uid() = user_id OR 
                    (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin');

-- INSERT: Own data only
CREATE POLICY onboarding_progress_insert ON onboarding_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: Own data or admin
CREATE POLICY onboarding_progress_update ON onboarding_progress
  FOR UPDATE USING (auth.uid() = user_id OR 
                    (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin')
  WITH CHECK (auth.uid() = user_id OR 
              (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin');
```

---

## Integration with Main App

### Sidebar Navigation

**File:** `src/components/Sidebar.jsx`

Added to admin and client role navigation:

```javascript
admin: [
  { id: "dashboard",      icon: "⬡", label: "Command Center" },
  { divider: "SETUP" },
  { id: "onboarding-hub", icon: "🎯", label: "Get Started" },
  // ... rest of nav
]

client: [
  { id: "dashboard",      icon: "⬡", label: "Command Center" },
  { divider: "SETUP" },
  { id: "onboarding-hub", icon: "🎯", label: "Get Started" },
  // ... rest of nav
]
```

### App Router

**File:** `src/App.jsx`

```javascript
// Import
import OnboardingHub from "./views/OnboardingHub.jsx";

// Switch case
case "onboarding-hub":
  return <OnboardingHub setActiveTab={navTo} />;
```

---

## Styling

All components use the shared color system from `src/data.js`:

```javascript
const C = {
  bg: "#0a0e27",
  surface: "#10142f",
  border: "#1e2847",
  primary: "#6366f1",      // Indigo
  accent: "#06b6d4",       // Cyan
  success: "#22c55e",      // Green
  amber: "#f59e0b",        // Amber
  textPrimary: "#ffffff",
  textSecondary: "#cbd5e1",
  textMuted: "#64748b",
  hoverBg: "#1a1f3a",
};
```

Components support both dark and light modes via theme context.

---

## User Flow

1. **First Login:** User sees "Get Started" in sidebar
2. **Onboarding Hub:** Can choose to start with any of 4 sections
3. **Checklist:** Overview of all 10 tasks, progress tracking
4. **Wizard:** Step-by-step configuration (can skip)
5. **Tour:** Guided walkthrough of all features
6. **Guides:** Detailed resources and how-tos
7. **Back to App:** Continue with any app section

---

## Future Enhancements

- [ ] Progress notifications when tasks are completed
- [ ] Email notifications for incomplete onboarding
- [ ] Video tutorials linked in guides
- [ ] Contextual help tooltips in each section
- [ ] Admin dashboard to see team onboarding status
- [ ] Custom branding for onboarding flow
- [ ] Integration with CRM data validation (auto-mark tasks)
- [ ] Onboarding email sequence
- [ ] Mobile-optimized onboarding
- [ ] Localization/translation support

---

## Testing Checklist

- [ ] All 4 sections load without errors
- [ ] Tasks toggle completion correctly
- [ ] Progress persists across page reload
- [ ] Wizard steps navigate properly
- [ ] Tour navigation works smoothly
- [ ] Guides expand/collapse correctly
- [ ] Navigation buttons work
- [ ] Dark/light mode theming works
- [ ] Mobile responsive layout
- [ ] RLS policies enforce correctly

---

## Support

For issues or questions about the onboarding system:
1. Check component props and state management
2. Verify database table and RLS policies exist
3. Review console for errors
4. Test with different user roles
5. Contact development team

