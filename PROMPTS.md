# Prompt log — React Lab 2

Part of what you submit. It shows _how_ you used AI: did you hand it the contract and the
rules, or type "make it work"? Fill it in **as you go**, not from memory at the end.

- Name and roll number: Aman Rajput, MT2026006
- AI tool and plan (e.g. ChatGPT free, Gemini, Claude free, Copilot): Claude Code (Claude Opus 5.5), in VS Code

**Log every prompt you send, in order — including the ones that didn't help.** Paste each
prompt in full. One exception: if you pasted CONTRACT.md's prompt 1 unchanged, write
"CONTRACT.md prompt 1, unchanged". Summarise each reply; don't paste whole files.

> Note: the original chat session was lost. Prompt 1 is verbatim; prompts 2–4 were
> rewritten from memory afterwards, as close to what I sent as I can recall.

---

## Prompt 1 — generate

**Sent:**

```text
read the markdown files in the root of the project and generate a plan to start with this project
```

**What came back:** (which files; which hooks it used; anything from the "not yet" list;
anything it did that the contract didn't ask for)
No code — a step-by-step plan: run `npm install` / `npm test`, paste CONTRACT.md prompt 1
into a fresh chat, drop the reply into `src/courses/`, fill AUDIT.md sections 0–4 before
asking for any fix, then send a fix prompt with the audit decisions + §4.

**Did it run?** (`npm run dev`: list loads? add works? 409 shown? fieldErrors shown?
`npm test`: __ passed / __ failed)
Nothing to run — it was only a plan.

**What I did with it:**
Read it and followed it as the order of work. Strictly this prompt wasn't needed — the
README already says the same — but it helped me see the audit-before-fix order.

---

## Prompt 2 — generate the feature

**Why I sent it:** The lab's prompt 1: build the Courses page against the contract, with
the rules attached.

**Sent:**

```text
CONTRACT.md prompt 1, unchanged
```

**What came back:**
One file, `src/courses/CoursesPage.jsx` (~200 lines), one component doing everything — the
same shape as `ai-sample/CoursesPage.jsx`. 13 × `useState`, 1 × `useEffect`, and despite
the rules it used `useMemo` (re-sort), 2 × `useCallback`, and `useRef` (refocus Code input).
Also: `key={index}`, separate `loading`/`error` booleans, a stored `courseCount`, a full
list reload after every add, no effect cleanup, `import React`.

**Did it run?** List loads, add works, 409 shows "Course code already exists", fieldErrors
show under inputs. `npm test`: 31 passed / 31 failed — the hook, View and form tests fail
because those pieces don't exist as separate files.

**What I kept, and what I rejected:**
Kept: the `Number(...)` conversion of credits/capacity and `description: null` when empty.
Rejected (decided in AUDIT.md §1–4, before any fix): the single-component shape, all four
"not yet" hooks, `courseCount`, the reload after add, `key={index}`.

---

## Prompt 3 — fix, using my audit

**Why I sent it:** Carries out AUDIT.md §4 — every cut, move and add listed there.

**Sent:**

```text
Here is my audit of the CoursesPage you gave me. Change the code to match these decisions
exactly — don't add anything else.

Cut: useMemo, both useCallbacks, useRef and the refocus, the courseCount state, the
separate loading and fieldErrors states, import React.

Move:
- load + add logic -> src/courses/useCourses.js
- the list rendering -> src/courses/CoursesView.jsx (renders from props only, no hooks)
- the form and its state -> src/courses/AddCourseForm.jsx
- CoursesPage.jsx only calls useCourses() and renders <h1>Courses</h1>, CoursesView and
  AddCourseForm. Nothing else.

Add:
- one status field: "loading" | "ready" | "error", with error as the message string
- the load effect with [] deps and an ignore flag in the cleanup
- addCourse POSTs with apiFetch, inserts the 201 body sorted by code as a NEW array
  (no reload of the list), returns the created course, and does not catch errors
- key={course.id}
- the form keeps the whole error object; shows error.message above the button with
  role="alert", and each fieldErrors entry under its own input (not inside the label)

This is the exact shape the tests check:
<pasted CONTRACT.md §4 in full>

Still only useState and useEffect. Reply with each file in full, path on the first line.
```

**What came back:**
Four files — `useCourses.js`, `CoursesView.jsx`, `AddCourseForm.jsx`, a slimmed
`CoursesPage.jsx`. 6 × `useState` (3 in the hook, 3 in the form), 1 × `useEffect` with
`[]` + `ignore` cleanup. No "not yet" hooks. Form values as one `values` object, fields
driven by a small `FIELDS` array.

**What I kept, and what I rejected:**
Kept almost all of it. Checked by hand: no `apiFetch` in the View or form, `addCourse`
doesn't swallow errors, no reload after add (1 request per add in the Network tab).
`npm test`: 60 passed / 2 failed — the two in `fieldErrors.test.jsx` (accessibility).

---

## Prompt 4 — fix the accessibility gaps

**Why I sent it:** The last item of AUDIT.md §4's "add" list it had missed: `aria-invalid` +
`aria-describedby`, and a field error under Description too.

**Sent:**

```text
Two fieldErrors tests fail. In AddCourseForm, an input that has a fieldErrors entry must
have aria-invalid="true" and aria-describedby set to the id of its error message. Give
each message an id. Description (the textarea) must show its field error too, the same
way. Only change AddCourseForm.jsx.
```

**What came back:**
`AddCourseForm.jsx` only: each field error gets `id="<name>-error"`, inputs and the
textarea get `aria-invalid` / `aria-describedby` only when there's a reason, otherwise
`undefined`.

**What I kept, and what I rejected:**
Kept it. `npm test`: 62 passed / 0 failed. In the app: loads, adds in code order, 409 shown,
fieldErrors shown under the right input.

---

## Afterwards

- How many prompts did the whole feature take? 4 (1 plan, 1 generate, 2 fixes) — 3 if you
  don't count the plan.
- Which of your prompts would you write differently now, and how? Prompt 3 — I'd have gone
  through §4 line by line against my audit and put the aria requirements in it explicitly;
  then prompt 4 wouldn't have been needed. Prompt 1 I'd skip; the README already gave the
  plan.
- One thing the rules in prompt 1 prevented (or failed to prevent): They kept it to
  `apiFetch` (no axios, no raw `fetch`) and no TypeScript — but they failed to prevent
  `useMemo`, `useCallback` and `useRef`, even though the prompt banned them by name. The
  rules narrow what the AI does; they don't guarantee it, so the audit is still needed.
