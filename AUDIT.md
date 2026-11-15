# Audit — React Lab 2

Part of what you submit. Fill in sections 0–4 **before** you ask the AI to change anything:
deciding what's wrong is your job, not the AI's. The sheet you audit against is "The Shape
of a Good React Slice" — section 08 of the lab doc.

Point at code as `file:line`, e.g. `CoursesPage.jsx:14`.

Line numbers in sections 0–4 refer to the AI's first version of `src/courses/CoursesPage.jsx`
(the draft from `ai-sample/CoursesPage.jsx`, before any fix).

---

## 0. What came back

| File the AI gave you | What's in it (components, hooks) | Lines |
| --- | --- | --- |
| `src/courses/CoursesPage.jsx` | One component, `CoursesPage`, doing everything: fetch, add, list and form. 13 × `useState`, 1 × `useEffect`, 2 × `useCallback`, 1 × `useMemo`, 1 × `useRef` | 204 |

- Does it run? Yes — the list loads, a valid add appears in code order, a duplicate code
  shows "Course code already exists", bad input shows fieldErrors under the inputs
  (`CoursesPage.test.jsx`: 4/4 passed).
- Requests in the Network tab — on page load: 1 (`GET /api/courses`); per add: 2
  (`POST /api/courses`, then `GET /api/courses` again to reload the whole list —
  `CoursesPage.jsx:86`).
- `npm test` before any fix: 31 passed / 31 failed. Failing files: `useCourses.test.jsx`,
  `CoursesView.test.jsx`, `AddCourseForm.test.jsx`, `fieldErrors.test.jsx` — the hook,
  View and form don't exist as separate pieces.

## 1. Part A — walk the allowed list

Is each element present, and in the right place?

| Element (the sheet, Part A) | Where it is in the AI's code (`file:line`, or "missing") | Right place? If not, where should it be? |
| --- | --- | --- |
| One View component that only renders | Missing — the list JSX is inline in `CoursesPage.jsx:103-127` | No → `CoursesView.jsx`, rendering from `{ courses, status, error }` props only |
| Fetch + logic in a separate hook or module | Missing — `fetchCourses` (`:37`) and `handleSubmit`'s POST (`:67`) are inside the component | No → `useCourses.js`, returning `{ courses, status, error, addCourse }` |
| `useState` for the course list, at the right level | `CoursesPage.jsx:21` | Level is right (the page owns it), but it belongs inside `useCourses` |
| `useState` for the form's inputs, at the right level | `CoursesPage.jsx:25-33` (9 states) | No → in `AddCourseForm`; nothing else needs the half-typed values |
| `useEffect` — for the initial fetch only (with a cleanup) | `CoursesPage.jsx:51-53` | Present but no cleanup / `ignore` flag, and deps are `[fetchCourses]` instead of `[]` → move to `useCourses`, `[]` + cleanup |
| Props down, callbacks up (the form raises "add this course") | Missing — the form calls `apiFetch` itself (`:67`) | No → `AddCourseForm({ onAdd })` calls `onAdd(courseRequest)`; the hook does the POST |
| `.map` to render the list, with a stable `key` | `CoursesPage.jsx:111-112` — `key={index}` | `.map` yes, key wrong → `key={course.id}` |
| Loading / error / empty states, from one `status` | `CoursesPage.jsx:22-23` — `loading` + `error` as two separate states | No → one `status`: `"loading"` / `"ready"` / `"error"`, plus `error` as the message |

## 2. Part B — scan for "not yet"

Search the files (VS Code: Ctrl/Cmd+Shift+F) for each one.

| Not yet | Found? (`file:line`) | What it does in *this* slice | Cut, or keep — and why |
| --- | --- | --- | --- |
| `useMemo` | `CoursesPage.jsx:56` | Re-sorts `courses` by code | Cut — the server already returns the list sorted; after an add, the hook inserts in order |
| `useCallback` | `CoursesPage.jsx:37`, `:60` | Wraps `fetchCourses` and `handleSubmit` so their identity stays the same | Cut — nothing compares them; `fetchCourses` only needed it because it was in the effect's deps |
| `useReducer` | Not found | — | — |
| `useRef` | `CoursesPage.jsx:34`, `:87`, `:135` | Refocuses the Code input after an add | Cut — not in the contract |
| Context (`createContext`, `useContext`) | Not found | — | — |
| A data-fetching library, or `axios`, or raw `fetch` instead of `apiFetch` | Not found — uses `apiFetch` (`:40`, `:67`) | — | — |
| TypeScript (types, interfaces, `.ts`/`.tsx`) | Not found | — | — |
| Anything else nobody taught you (name it) | `import React` (`:11`) — not needed with the new JSX transform | Cut |

## 3. The rule — every hook and every component split

One row for **each** `useState`, `useEffect` and custom hook call, and for **each**
component. Say what it does *in this slice*. "The AI added it" and "just in case" are not
answers — if you can't name its job, the decision is "cut".

| Hook call or component (`file:line`) | What earns it here? (one sentence) | Keep / cut / move (to where) |
| --- | --- | --- |
| `CoursesPage` component (`:20`) | The page; should only put the hook, View and form together | Keep, slimmed to just that |
| `useState` courses (`:21`) | The list the page shows, updated after an add | Move → `useCourses` |
| `useState` loading (`:22`) | Whether the first fetch is pending | Cut → replaced by one `status` in `useCourses` |
| `useState` error (`:23`) | The load error message | Move → `useCourses` (set together with `status: "error"`) |
| `useState` courseCount (`:24`) | Nothing — it's `courses.length`, stored twice | Cut (computable; not in the contract) |
| `useState` code, title, department, credits, capacity, description (`:25-30`) | The six controlled input values | Move → `AddCourseForm` (as one `values` object) |
| `useState` submitting (`:31`) | Disables the button while the POST is on its way | Move → `AddCourseForm` |
| `useState` formError (`:32`) | The add error's message, shown above the button | Move → `AddCourseForm` (keep the whole error) |
| `useState` fieldErrors (`:33`) | Per-field reasons from a 400 | Cut — read `error.fieldErrors` from the stored error |
| `useEffect` (`:51`) | Loads the list once when the page appears | Move → `useCourses`, deps `[]`, with an `ignore` cleanup |
| (missing) `useCourses` custom hook | Fetch + add logic, out of the components | Add |
| (missing) `CoursesView` component | Renders loading / error / empty / list from props | Add |
| (missing) `AddCourseForm` component | The form; raises the course through `onAdd` | Add |

## 4. Decisions — before any fix prompt

- I will **cut**: `useMemo` (`:56`), both `useCallback`s (`:37`, `:60`), `useRef` + the
  refocus (`:34`, `:87`, `:135`), `courseCount` (`:24`, `:42`, `:101`), the separate
  `loading` and `fieldErrors` states, `import React`.
- I will **move** (from → to): load + add logic `CoursesPage.jsx` → `useCourses.js`; list
  rendering `CoursesPage.jsx:103-127` → `CoursesView.jsx`; form + its state
  `CoursesPage.jsx:25-33, 129-201` → `AddCourseForm.jsx`.
- I will **add** (missing from the AI's version): one `status` field; an `ignore` cleanup in
  the effect; `addCourse` that inserts the 201 body in code order as a new array (no
  reload) and rethrows errors; `key={course.id}`; `aria-invalid` + `aria-describedby` on
  inputs with a field error and `role="alert"` on the form message; a field error under
  Description too.
- Other smells I found (state stored that could be computed, a reload after add, browser
  validation, `key={index}`, swallowed errors…): `courseCount` stored instead of computed;
  a full list reload after every add (`:86`); `key={index}` (`:112`); `parseInt` instead
  of `Number` (`:73-74`); the load effect has no cleanup, so a stale answer could land;
  the "N courses in the catalogue" line (`:101`) isn't in the contract.

---

## 5. Strip check (section 14 of the doc)

For each "not yet" item you removed — one at a time:

| Removed | `npm test` after | The app after (loads / adds / shows errors) |
| --- | --- | --- |
| `useMemo` (used `courses` directly) | `CoursesPage.test.jsx`: 4/4 passed | Loads, adds in code order, shows 409 and fieldErrors |
| `useCallback` ×2 (plain functions; effect deps `[fetchCourses]` → `[]`) | `CoursesPage.test.jsx`: 4/4 passed | Same |
| `useRef` (dropped the refocus) | `CoursesPage.test.jsx`: 4/4 passed | Same |

Nothing broke: none of the three earned its place. One catch: removing `useCallback`
means `fetchCourses` is a new function every render, so the effect's deps had to change
to `[]` as well — otherwise it would fetch on every render, forever.

## 6. Before / after

|  | Before (the AI's first version) | After (yours) |
| --- | --- | --- |
| Files and components | 1 file, 1 component (`CoursesPage`) | 4 files: `useCourses`, `CoursesView`, `AddCourseForm`, `CoursesPage` |
| `useState` calls (and where) | 13, all in `CoursesPage` | 6: `useCourses` (courses, status, error), `AddCourseForm` (values, submitting, error) |
| `useEffect` calls | 1 (no cleanup, deps `[fetchCourses]`) | 1 in `useCourses` (deps `[]`, `ignore` cleanup) |
| "Not yet" items | `useMemo`, `useCallback` ×2, `useRef` | None |
| Requests: on load / per add | 1 / 2 (POST + reload) | 1 / 1 (POST only) |
| `npm test` | 31 passed / 31 failed | 62 passed / 0 failed |

## 7. Two sentences

- One thing the AI got right that you might not have thought of: sending `description` as
  `null` when it's empty, and turning the number inputs' strings into numbers before the
  POST — the server's contract needs both.
- One thing you will never accept from an AI without checking again: a list that reloads
  itself after every add — it works, but it doubles the requests and hides that the 201
  body already has the new course.
