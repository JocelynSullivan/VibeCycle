---

````markdown
# Project Design Doc — **Vibe Cycle**

**Description:**  
An AI-assisted daily routine generator that adapts to user energy levels and personal tasks.

**Tech Stack:**  
- **Frontend:** TypeScript, React, TailwindCSS  
- **Backend:** FastAPI 
- **AI:** Ollama (local LLM)  
- **Database:** PostgreSQL  
- **Infrastructure:** Docker, optional Redis caching  

---

## 1. Overview & Goals

**Problem:**  
Users want quick, personalized morning/evening routines from a list of tasks that adapt to their daily energy levels. The routines should be easy to follow, editable, and saved per user.

**High-level Goals:**

- Save user-specific tasks and routines.
- Adjust routines dynamically based on input energy level (1–5).
- Estimate how long each task takes and auto-structure them into time slots.
- Provide a clean, intuitive interface for following, editing, and completing routines.

---

## 2. Current Features

- Add and delete tasks.
- Generate morning and evening routines.

---

## 3. Features to Add

- Save task info for each user.
- Input energy level → AI adjusts routine.
- Style output for readability and flow.
- AI estimates duration and positions tasks accordingly.
- Click and drag to reorder tasks while maintaining time slots.
- Hover over a task to see details (duration, energy, importance).
- Edit task details inline or via modal.
- Mark tasks as done with one click.
- Save multiple routines per user.
- Display weekly and daily routines side by side.

---

## 4. Prototype

**Goal:** Validate UX and flow before full backend/AI integration.

**Scope:**

- Store data locally (no backend).
- Add/delete tasks and generate simple routines based on heuristic logic.
- Include energy slider (1–5) to influence number of tasks shown.
- Enable drag-and-drop task reordering.
- Hover tooltips for task details.
- Save generated routines in localStorage.

**Deliverables:**

- React + Tailwind front-end with mock data.
- Flow: Add → Generate → Drag → Save → Reload.
- Conduct basic user feedback session.

---

## 5. Minimum Viable Product (MVP)

**Includes:**

- Auth (email/password or OAuth).
- PostgreSQL persistence for users, tasks, and saved routines.
- CRUD APIs for tasks/routines.
- Ollama integration for AI-based generation and duration estimates.
- Styled UI for following routines.
- Hover details, drag-and-drop, edit, mark-done.
- Save/load routines.
- Dual daily + weekly view.

**Excludes (Future Phases):**

- Social features (sharing, collaboration).
- Calendar integrations.
- Offline mode.
- Complex analytics.

---

## 6. System Architecture

### Overview

**Frontend (React + TS + Tailwind)**  
↕  
**Backend (FastAPI or Node/Express)**

- Auth (JWT)
- Task & Routine API
- Ollama integration (prompt building, parsing)
- Duration fallback heuristics  
  ↕  
  **Database (PostgreSQL)**
- users, tasks, routines, completions

**Optional:** Redis caching for recent generations or rate-limiting.

### Routine Generation Flow

1. User inputs tasks + energy level.
2. Backend sends request to Ollama.
3. Ollama returns structured JSON (task order, durations, energy cost, importance).
4. Backend stores routine snapshot and returns to client.
5. Frontend renders routine timeline.
6. User can reorder tasks, edit, or save the routine.

---

## 7. Database Schema (PostgreSQL)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  default_duration_minutes INT,
  default_energy INT,
  priority INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  routine_type TEXT CHECK (routine_type IN ('morning','evening','custom')),
  date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE routine_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID REFERENCES routines(id) ON DELETE CASCADE,
  task_id UUID NULL REFERENCES tasks(id),
  title TEXT NOT NULL,
  start_time TIME NOT NULL,
  duration_minutes INT NOT NULL,
  energy_cost INT,
  priority INT,
  position INT NOT NULL
);

CREATE TABLE completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  task_id UUID,
  routine_item_id UUID,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

---

## 8. API Endpoints

**Auth**

- `POST /api/auth/register`
- `POST /api/auth/login`

**Tasks**

- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`

**Routines**

- `POST /api/routines/generate` → triggers AI routine generation.
- `POST /api/routines` → save routine.
- `GET /api/routines` → list saved.
- `GET /api/routines/:id` → view routine.
- `PUT /api/routines/:id` → update.
- `DELETE /api/routines/:id` → delete.

**Routine Interactions**

- `POST /api/routine_items/:id/mark_done`
- `PUT /api/routine_items/:id/move`
- `PATCH /api/routine_items/:id`

**Analytics**

- `GET /api/metrics/daily` → completion and timing data.

---

## 9. Frontend Design

### Component Hierarchy

```
App
 ├── AuthPage
 ├── Dashboard
 │    ├── Sidebar (Tasks, Saved routines)
 │    ├── RoutinePanel
 │    │    ├── EnergyInput
 │    │    ├── RoutineHeader
 │    │    ├── RoutineTimeline
 │    │    │    ├── TimeSlot
 │    │    │    │    └── RoutineTaskCard
 │    ├── WeeklyView
 │    ├── DailyView
 │    ├── CompareView
 ├── TaskModal
 ├── HoverTooltip
 └── CompletionBadge
```

### UX Details

- **Routine layout:** Fixed timeline; clear times + large, readable cards.
- **Drag-and-drop:** Tasks swap or reflow; times remain anchored.
- **Hover:** Show duration, energy, importance, notes, and quick edit.
- **Edit:** Inline (click-to-edit) or modal.
- **Mark done:** Single click checkmark.
- **Save routine:** Choose “template” (regenerate) or “snapshot” (fixed).
- **Dual views:** Daily (detailed) + Weekly (compact).

---

## 10. Ollama Integration

### Expected Output

```json
{
  "routine_type": "morning",
  "generated_for_energy": 2,
  "start_time": "07:00",
  "items": [
    {
      "task_title": "Make coffee",
      "task_id": null,
      "duration_minutes": 8,
      "energy_cost": 1,
      "priority": 2,
      "notes": "Brew medium strength"
    }
  ]
}
```

### Prompt Template

```
You are an assistant that creates structured morning or evening routines from a list of tasks.
Consider the user's energy level and prioritize efficiency.
Return valid JSON with ordered tasks, estimated durations, energy cost, and priority.
```

### Error Handling

- Schema validation (pydantic or zod).
- Fallback to heuristic-based generation.

### Learning from Data

- Store completion times to improve duration estimates.

---

## 11. Drag-and-Drop Time Logic

- **Fixed slots:** Predefined times (e.g., 6–9am, 15-min increments).
- **Swap mode (default):** Swap two tasks’ positions.
- **Reflow mode (optional):** Adjust start times automatically.
- **Edge cases:** Prevent overlaps or overflows.

---

## 12. Metrics

### Product

- DAU/MAU
- Tasks added per week
- Routines generated per week
- Saved routines per user

### Engagement

- Completion rate
- Routine-following duration
- Retention rate (DAU/MAU ratio)

### AI

- Duration accuracy (MAE)
- Generation validity (% of valid JSON responses)
- User satisfaction (edits per generation)

### UX

- Drag/drop usage
- Hover frequency
- Edit interactions

### System

- LLM latency
- API error rate
- Server uptime

---

## 13. Privacy & Security

- Bcrypt/Argon2 password hashing.
- JWT tokens.
- HTTPS everywhere.
- GDPR compliance (export/delete data).
- Ollama runs locally, never stores user data.
- Rate-limit AI endpoint.

---

## 14. Testing

- **Unit:** API routes, DB models, schema validation.
- **Integration:** Task creation → routine generation → completion.
- **E2E:** Cypress/Playwright tests.
- **Usability:** Test clarity of energy slider and DnD interactions.

---

## 15. Deployment

- Docker containers for backend and Ollama.
- Postgres hosted (RDS or similar).
- CI/CD pipeline (lint, test, deploy).
- Environment variables in secure vault.
- Staging and production environments.

---

## 16. Roadmap

| Phase         | Duration   | Goals                                         |
| ------------- | ---------- | --------------------------------------------- |
| **Prototype** | 2 weeks    | Frontend mock data, basic flow                |
| **MVP**       | 6–8 weeks  | Backend, DB, Ollama, drag/drop, save routines |
| **Phase 2**   | 8–12 weeks | Analytics, learning duration, weekly planner  |
| **Phase 3**   | Continuous | Collaboration, personalization, mobile app    |

---

## 17. Example TypeScript Types

```ts
export type Task = {
  id: string;
  title: string;
  description?: string;
  default_duration_minutes?: number;
  default_energy?: number;
  priority?: number;
};

export type RoutineItem = {
  id: string;
  task_id?: string | null;
  title: string;
  start_time: string;
  duration_minutes: number;
  energy_cost?: number;
  priority?: number;
  notes?: string;
  position: number;
  completed?: boolean;
};

export type Routine = {
  id?: string;
  user_id?: string;
  name?: string;
  routine_type: "morning" | "evening" | "custom";
  start_time?: string;
  items: RoutineItem[];
};
```

---

## 18. UI Copy Examples

- “How much energy do you have right now? (1 = low, 5 = full energy)”
- “AI will suggest and order tasks based on your energy level.”
- “Save as template (AI-regenerates) or snapshot (fixed).”

---

## 19. Risks & Mitigations

| Risk                     | Mitigation                      |
| ------------------------ | ------------------------------- |
| LLM returns invalid data | Strict schema validation        |
| Slow AI response         | Async loading, progress spinner |
| Duration errors          | Learn from completion data      |
| Confusing time changes   | Clear DnD modes: swap vs reflow |

---

## 20. Success Criteria

- Users can log in, add tasks, and save routines.
- AI adjusts routine based on energy level.
- Drag-and-drop maintains times.
- Tasks editable and markable as done.
- Duration error < 25% MAE after 2 weeks.

---

## 21. Example User Flow

1. Sign in.
2. Add tasks (e.g., “Make breakfast,” “Workout,” “Email”).
3. Select energy = 2 and click **Generate Morning Routine**.
4. Ollama returns structured routine.
5. Drag tasks to reorder.
6. Hover for details; edit duration.
7. Mark completed tasks.
8. Save routine as “Tuesday Morning (Low Energy)”.
9. Later, compare daily and weekly views.

---

**End of Document**
