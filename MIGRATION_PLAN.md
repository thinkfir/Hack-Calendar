# Hack-Calendar Migration Plan

## Overview
This document outlines a comprehensive migration plan to transform the existing Hack-Calendar application into a modern full-stack application with React frontend, Node.js/Express backend, and SQLite database.

## 1. Complete Analysis of Current Features and Functionality

### Core Features:
- **AI Project Assistant**: Generates task breakdowns from project ideas (supports local generation and multiple AI providers including Groq, OpenAI, Anthropic, Google, Cohere)
- **Team Management**: Add/remove members, assign skills, set sleep schedules, color-coded identification (8 distinct colors)
- **Task Management**: Create, edit, delete tasks with priorities, phases, multi-member assignments
- **Calendar View**: Google Calendar-style interface with hourly slots, multi-day task support, synchronized scrolling
- **Hackathon Settings**: Configure event name, start date, and duration
- **Data Persistence**: Local storage for all application data
- **Export/Import**: Export project data as JSON

### Business Logic:
- Smart task assignment based on team member skills
- Sleep schedule awareness (tasks not scheduled during sleep hours)
- Task phase progression (planning → design → development → integration → testing → presentation)
- Workload balancing across team members
- Time allocation percentages for different phases:
  - Planning: 10%
  - Design: 15%
  - Development: 50%
  - Integration: 10%
  - Testing: 10%
  - Presentation: 5%

## 2. Database Schema Design for SQLite

```sql
-- Teams/Hackathons table
CREATE TABLE hackathons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    start_date DATETIME NOT NULL,
    duration_hours INTEGER NOT NULL,
    project_idea TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Team members table
CREATE TABLE team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hackathon_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    color_index INTEGER NOT NULL CHECK (color_index BETWEEN 0 AND 7),
    sleep_start TIME DEFAULT '02:00',
    sleep_end TIME DEFAULT '08:00',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hackathon_id) REFERENCES hackathons(id) ON DELETE CASCADE
);

-- Skills table (normalized)
CREATE TABLE skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

-- Member skills junction table
CREATE TABLE member_skills (
    member_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    PRIMARY KEY (member_id, skill_id),
    FOREIGN KEY (member_id) REFERENCES team_members(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- Task phases enum table
CREATE TABLE task_phases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    display_order INTEGER NOT NULL
);

-- Insert default phases
INSERT INTO task_phases (name, display_order) VALUES 
    ('planning', 1),
    ('design', 2),
    ('development', 3),
    ('integration', 4),
    ('testing', 5),
    ('presentation', 6);

-- Tasks table
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hackathon_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    phase_id INTEGER NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    estimated_hours REAL NOT NULL,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('Not Started', 'In Progress', 'Completed', 'Blocked')) DEFAULT 'Not Started',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hackathon_id) REFERENCES hackathons(id) ON DELETE CASCADE,
    FOREIGN KEY (phase_id) REFERENCES task_phases(id)
);

-- Task assignments junction table (supports multiple assignees)
CREATE TABLE task_assignments (
    task_id INTEGER NOT NULL,
    member_id INTEGER NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (task_id, member_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES team_members(id) ON DELETE CASCADE
);

-- Task dependencies table
CREATE TABLE task_dependencies (
    task_id INTEGER NOT NULL,
    depends_on_task_id INTEGER NOT NULL,
    PRIMARY KEY (task_id, depends_on_task_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    CHECK (task_id != depends_on_task_id)
);

-- AI generation history
CREATE TABLE ai_generations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hackathon_id INTEGER NOT NULL,
    provider TEXT NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hackathon_id) REFERENCES hackathons(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_tasks_hackathon ON tasks(hackathon_id);
CREATE INDEX idx_tasks_dates ON tasks(start_date, end_date);
CREATE INDEX idx_members_hackathon ON team_members(hackathon_id);
CREATE INDEX idx_task_assignments_member ON task_assignments(member_id);
CREATE INDEX idx_task_assignments_task ON task_assignments(task_id);
```

## 3. RESTful API Endpoint Design

### Authentication Endpoints
```
POST   /api/auth/register    - Register new user
POST   /api/auth/login       - Login user
POST   /api/auth/logout      - Logout user
GET    /api/auth/me          - Get current user
```

### Hackathon Endpoints
```
GET    /api/hackathons              - List user's hackathons
POST   /api/hackathons              - Create new hackathon
GET    /api/hackathons/:id          - Get hackathon details
PUT    /api/hackathons/:id          - Update hackathon
DELETE /api/hackathons/:id          - Delete hackathon
POST   /api/hackathons/:id/export   - Export hackathon data
POST   /api/hackathons/import       - Import hackathon data
```

### Team Member Endpoints
```
GET    /api/hackathons/:hackathonId/members          - List team members
POST   /api/hackathons/:hackathonId/members          - Add team member
GET    /api/hackathons/:hackathonId/members/:id      - Get member details
PUT    /api/hackathons/:hackathonId/members/:id      - Update member
DELETE /api/hackathons/:hackathonId/members/:id      - Remove member
```

### Skills Endpoints
```
GET    /api/skills                                          - List all available skills
POST   /api/hackathons/:hackathonId/members/:id/skills     - Add skill to member
DELETE /api/hackathons/:hackathonId/members/:id/skills/:skillId - Remove skill
```

### Task Endpoints
```
GET    /api/hackathons/:hackathonId/tasks              - List tasks with filters
POST   /api/hackathons/:hackathonId/tasks              - Create task
GET    /api/hackathons/:hackathonId/tasks/:id          - Get task details
PUT    /api/hackathons/:hackathonId/tasks/:id          - Update task
DELETE /api/hackathons/:hackathonId/tasks/:id          - Delete task
POST   /api/hackathons/:hackathonId/tasks/:id/assign   - Assign members to task
DELETE /api/hackathons/:hackathonId/tasks/:id/assign/:memberId - Unassign member
```

### AI Generation Endpoints
```
POST   /api/hackathons/:hackathonId/generate-tasks     - Generate tasks from idea
GET    /api/hackathons/:hackathonId/ai-history         - Get AI generation history
```

### Calendar/Schedule Endpoints
```
GET    /api/hackathons/:hackathonId/calendar           - Get calendar data
GET    /api/hackathons/:hackathonId/members/:id/schedule - Get member's schedule
```

## 4. React Component Hierarchy and State Management Plan

### Component Hierarchy:
```
App
├── AuthProvider (Context)
├── Router
│   ├── PublicRoute
│   │   ├── LoginPage
│   │   └── RegisterPage
│   └── PrivateRoute
│       └── DashboardLayout
│           ├── Sidebar
│           │   └── Navigation
│           ├── MainContent
│           │   ├── HomePage (Hackathon List)
│           │   └── HackathonProvider (Context)
│           │       └── HackathonDashboard
│           │           ├── AIAssistantPage
│           │           │   ├── ProjectIdeaForm
│           │           │   ├── AIProviderSelector
│           │           │   └── GeneratedTasksList
│           │           ├── CalendarPage
│           │           │   ├── CalendarHeader
│           │           │   ├── TimeColumn
│           │           │   ├── CalendarGrid
│           │           │   │   └── TaskElement
│           │           │   └── TeamMembersSidebar
│           │           ├── TeamPage
│           │           │   ├── MembersList
│           │           │   ├── MemberDetails
│           │           │   └── TeamStatistics
│           │           └── SettingsPage
│           │               └── HackathonSettingsForm
│           └── Modals
│               ├── TaskModal
│               └── MemberModal
└── UIComponents
    ├── Button
    ├── Input
    ├── Select
    ├── Modal
    └── LoadingSpinner
```

### State Management Plan:
- **Global State (Context API)**:
  - Authentication state (user, token)
  - Current hackathon context
  - UI preferences (theme, layout)

- **Local State (Component)**:
  - Form data
  - UI states (modals, dropdowns)
  - Temporary selections

- **Server State (React Query)**:
  - Hackathon data
  - Team members
  - Tasks
  - Skills

## 5. Migration Strategy

### Phase 1: Backend Setup (Week 1)
1. Initialize Node.js project with Express
2. Set up SQLite database with migrations
3. Implement authentication middleware
4. Create RESTful API endpoints
5. Add validation and error handling
6. Write unit tests for API

### Phase 2: Data Migration (Week 1)
1. Create migration scripts for existing localStorage data
2. Build import/export functionality
3. Test data integrity

### Phase 3: Frontend Foundation (Week 2)
1. Create React app with TypeScript
2. Set up routing and authentication
3. Implement component library
4. Configure React Query for data fetching
5. Set up development environment

### Phase 4: Feature Migration (Weeks 3-4)
1. **Hackathon Management**: List, create, edit hackathons
2. **Team Management**: Member CRUD, skills assignment
3. **Task Management**: Task CRUD, assignments, dependencies
4. **Calendar View**: Recreate calendar with React components
5. **AI Integration**: Migrate task generation logic

### Phase 5: Testing & Deployment (Week 5)
1. End-to-end testing
2. Performance optimization
3. Security audit
4. Deployment setup

## 6. Folder Structure for New Application

```
hack-calendar/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── auth.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── hackathonController.js
│   │   │   ├── memberController.js
│   │   │   ├── taskController.js
│   │   │   └── aiController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── validation.js
│   │   │   └── errorHandler.js
│   │   ├── models/
│   │   │   ├── index.js
│   │   │   ├── Hackathon.js
│   │   │   ├── TeamMember.js
│   │   │   ├── Task.js
│   │   │   └── Skill.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── hackathons.js
│   │   │   ├── members.js
│   │   │   ├── tasks.js
│   │   │   └── ai.js
│   │   ├── services/
│   │   │   ├── aiService.js
│   │   │   ├── taskScheduler.js
│   │   │   └── exportService.js
│   │   ├── utils/
│   │   │   ├── validators.js
│   │   │   └── helpers.js
│   │   └── app.js
│   ├── migrations/
│   ├── tests/
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   ├── ai-assistant/
│   │   │   ├── calendar/
│   │   │   ├── team/
│   │   │   └── settings/
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx
│   │   │   └── HackathonContext.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useHackathon.ts
│   │   │   └── useApi.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   └── aiProviders.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── dateHelpers.ts
│   │   │   └── taskScheduler.ts
│   │   ├── pages/
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   └── tsconfig.json
│
├── shared/
│   └── types/
│       └── index.ts
│
├── scripts/
│   ├── migrate-data.js
│   └── setup-db.js
│
├── .gitignore
├── README.md
└── docker-compose.yml
```

## Key Migration Benefits

This migration plan preserves all existing functionality while providing:

1. **Scalability**: Multi-user support with proper authentication
2. **Data Persistence**: Reliable database storage instead of localStorage
3. **API-First Design**: RESTful endpoints for future integrations
4. **Modern Architecture**: Separation of concerns, maintainable codebase
5. **Type Safety**: TypeScript for fewer runtime errors
6. **Better State Management**: React Query for efficient data fetching
7. **Enhanced Security**: Server-side validation and authentication
8. **Improved Testing**: Easier to write unit and integration tests
9. **Professional UI**: Reusable component library
10. **Performance**: Optimized queries and caching strategies

## Next Steps

1. Review this migration plan
2. Decide on priority features
3. Set up development environment
4. Begin implementation following the phases outlined above