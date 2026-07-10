<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Feature, Bug & Improvement workflow

Before implementing any new feature, bug fix, or improvement:

1. **Feature** → create `doc/features/[feature-name]/TASKS.md` with:
   - Title and summary
   - One or more user stories, each with:
     - Tasks (checklist)
     - Validation steps (checklist)

2. **Bug** → create `doc/bugs/[bug-name]/TASKS.md` with:
   - Title, summary, and root cause
   - A user story with:
     - Tasks to fix
     - Validation steps (checklist)

3. **Improvement** → create `doc/improvements/[improvement-name]/TASKS.md` with:
   - Title and summary
   - Motivation (why this change matters)
   - One or more user stories, each with:
     - Tasks (checklist)
     - Validation steps (checklist)

4. Present the plan to the user for approval before writing code.
5. After implementation, commit using the commit convention below.

# Commit convention

Use conventional commits: `type(scope): description`.  
Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `test`.  
Scope is optional but encouraged (e.g., `phase 2`, `crawler`, `db`).
