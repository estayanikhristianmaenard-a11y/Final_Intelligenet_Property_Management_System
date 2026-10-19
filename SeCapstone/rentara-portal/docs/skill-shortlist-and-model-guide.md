# PropertyPro skill shortlist and model guide

Recorded 13 October 2026 at the user's request. The user selected seven project-local skills: Trail of Bits property-based testing and differential review, Anthropic PDF, Taste redesign, Vercel web design guidelines, and Agentic Awesome Skills systematic debugging and API security. The folders are installed under `.agents/skills/`. UI UX Pro Max and Anthropic frontend-design remain deferred alternatives. Installation does not approve an immediate redesign or prove that any feature passes these skills' checks.

## Consolidated selection

This table is the current decision list; the sections below explain the fit and limits.

| Skill | Status | Specific help for this project |
| --- | --- | --- |
| Trail of Bits `property-based-testing` | User selected; installed locally | Check shared-charge totals, deterministic splitting, calendar edge cases, and lossless storage across many inputs. |
| Trail of Bits `differential-review` | User selected; installed locally | Review substantial groupmate/backend changes for security regressions and affected code paths. |
| Anthropic `pdf` | User selected; installed locally; manuscript review deferred | Extract and inspect Chapter 1–2 content and figures for later academic review. The skill assists document handling; adviser/editor judgment is still needed to identify gaps. |
| Taste `redesign-existing-projects` | User selected; installed locally | Polish our existing vanilla-CSS frontend while retaining working functions. The source directory is named `redesign-skill`. |
| UI UX Pro Max `ui-ux-pro-max` | Deferred design alternative | Establish consistent colors, typography, spacing, and mobile interaction guidance if the Taste trial does not fit. |
| Anthropic `frontend-design` | Deferred design alternative | Develop a visual direction if the Taste trial does not meet the user's preference. |
| Vercel `web-design-guidelines` | User selected; installed locally for subsequent audit | Review navigation, forms, keyboard access, responsive behavior, and feedback. |
| Agentic Awesome Skills `systematic-debugging` | User selected; installed locally | Reproduce errors, find their cause, and verify a focused fix. |
| Agentic Awesome Skills `api-security-best-practices` | User selected; installed locally | Review protected routes, permissions, inputs, upload handling, and safe errors using the current backend model. |
| AccessLint `accessibility-scan` | Optional tooling candidate | Add live-page evidence for mechanically detectable accessibility issues if an instruction-based audit is insufficient. |
| Agentic Awesome Skills `nodejs-best-practices` | Hold as reference only | Consult relevant Node principles when needed; verify dated advice and retain the locked stack. |

Existing JavaScript Playwright tests remain our browser verification tool, not an additional skill to install. Choose only one of the three design candidates for a given task. Selected skills are approved choices for later use, not evidence that they have been installed or that the project has passed their checks.

## Deferred Chapter 1–2 review

The user is not yet confident that Chapters 1 and 2 cover all required content and wants a later gap review. Do not reopen or rewrite them during skill selection. When requested, inspect the current manuscript, compare it with the locked workflow and actual implementation, distinguish missing content from unnecessary repetition, and identify exact section and paragraph numbers. Provide complete replacement paragraphs where needed, preserving facts, citations, scope, and proposal-stage tense. Inspect diagrams visually as well as extracted text; PDF extraction alone cannot establish correctness. Do not promise that PDF tooling finds every academic gap or guarantees approval.

## Project constraints

Keep Node.js 24+, SQLite, and the existing HTML/CSS/JavaScript frontend. Preserve the approved manuscript workflow: OCR extracts utility information; defined rules validate and process it; Managers confirm rent; utility payment marks are personal Tenant tracking, not provider verification. Keep accurate amounts, dates, history, and receipts. Do not introduce frameworks, animation libraries, backend functions, or manuscript changes merely because a skill recommends them. No Git pushes; the user pushes manually.

## Installation scope: this project

The user chose project-local installation, replacing the earlier personal-folder preference. Skills are in the repository-root `.agents/skills/` directory and are available while Codex works in this repository. They are shared project files the user can commit and push with other project changes; they are not automatically available in other repositories. Skill dependencies are separate from installation and must be checked before use.

Only the seven selected skill folders were installed. No AAS Core/MCP service was configured, no personal skill directory was changed, and no Git push was made.

## Previously recommended options

| Skill / tool | Current decision | Purpose |
| --- | --- | --- |
| Taste `redesign-existing-projects` | User selected; installed locally | Targeted improvements to existing screens with vanilla CSS and existing functionality. |
| Vercel `web-design-guidelines` | User selected; installed locally | Focused accessibility, forms, navigation, and usability review after design changes. |
| Anthropic `frontend-design` | Alternative, not an additional default | Creating a distinct visual direction when needed. Choose one design guide per task. |
| Existing project Playwright tests | Keep using | Verify desktop/mobile interactions and role-specific workflows without a second testing setup. |
| Taste default `design-taste-frontend` | Exclude from current portal plan | Its declared scope excludes dashboards and multi-step product UI, and its framework defaults do not fit this project. |
| Vercel React/Next.js and deployment skills | Exclude from current development plan | Their intended stack or deployment task does not match current work. The `vercel-labs/skills` repository is an installer, not a design skill. |

Taste's redesign guide is useful but opinionated. Apply relevant readability, spacing, feedback, and accessible-control guidance; do not copy decorative layouts, cinematic scrolling, random dates, or sample-number changes into real billing records. See [the actual redesign instructions](https://github.com/Leonxlnx/taste-skill/blob/main/skills/redesign-skill/SKILL.md).

## Newly inspected repositories

| Candidate | Decision | Fit and limits |
| --- | --- | --- |
| UI UX Pro Max `ui-ux-pro-max` | Keep as a design-direction candidate | Useful searchable guidance for palettes, typography, responsive layouts, touch controls, and form feedback. Search only the relevant domain for a small task. Its stack list includes HTML+Tailwind but no dedicated vanilla-CSS entry; keep our CSS and translate applicable guidance rather than adopting Tailwind. |
| Agentic Awesome Skills `systematic-debugging` | User selected; installed locally | Reproduce a failure, locate its cause, and make a focused repair. Use for real bugs; its formal process can add overhead on routine edits. |
| Agentic Awesome Skills `api-security-best-practices` | User selected; installed locally | Review protected API routes, authorization, validation, uploads, and error responses. Adapt examples to our existing Node sessions and SQLite instead of adding their sample frameworks. |
| Agentic Awesome Skills `nodejs-best-practices` | Hold as an optional reference | Async, error-handling, and security principles may help. The document includes 2025 runtime guidance and framework comparisons; verify version-sensitive advice against official Node documentation. Do not reopen our locked stack decision. |
| Agentic Awesome Skills `playwright-skill` | Skip for now | It brings its own executor/browser setup, overlapping our existing tests and installed Edge. |
| Entire Agentic Awesome Skills catalog, plugin bundles, and AAS Core MCP | Skip for now | We need a few inspected instructions, not another catalog service or broad installation. Reconsider only for a specific unmet need. |

Sources inspected: [UI UX Pro Max instructions](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/SKILL.md), [Agentic Awesome Skills overview](https://github.com/sickn33/agentic-awesome-skills), [systematic-debugging](https://github.com/sickn33/agentic-awesome-skills/blob/main/skills/systematic-debugging/SKILL.md), [nodejs-best-practices](https://github.com/sickn33/agentic-awesome-skills/blob/main/skills/nodejs-best-practices/SKILL.md), and [playwright-skill](https://github.com/sickn33/agentic-awesome-skills/blob/main/skills/playwright-skill/SKILL.md). Repository names, popularity, and advertised quality are not evidence of better results for PropertyPro. This was a focused candidate review, not an audit of every catalog entry or installer script.

## Additional GitHub search: practical gaps

Focused discovery on 13 October 2026. Skill installation records the selected tools; it does not mean a project audit has been completed.

| Candidate | Decision | Concrete PropertyPro use and limits |
| --- | --- | --- |
| Trail of Bits `property-based-testing` | User selected; installed locally | Test rules across generated inputs: allocated centavos sum to the source charge, splitting is deterministic, calendar rules handle short months, and stored OCR text round-trips exactly. This complements our Node example tests; it is not browser testing. The guide includes JavaScript fast-check, but introducing a library is a separate dependency decision. |
| Trail of Bits `differential-review` | User selected; installed locally for significant backend integrations | Review changed authorization, validation, payment, receipt, and intake paths against their Git baseline when integrating a groupmate's work. It is a security review, not a Git merge utility or complete manuscript-compliance check. Its history tracing and reports add overhead; reserve it for important changes, not CSS or documentation. |
| AccessLint `accessibility-scan` | Optional later candidate | Scan one rendered page for mechanically detectable accessibility issues, such as contrast or missing accessible names. This can add evidence beyond Vercel's instruction-based review. It brings an AccessLint CLI and debuggable Chrome/CDP workflow; verify Windows/browser compatibility, package versions, and authenticated-page setup before adoption. Its shell examples require adaptation to PowerShell. It does not prove complete accessibility compliance or replace human checks. |
| Anthropic `pdf` | User selected; installed locally; Chapter 1–2 review deferred | Extract manuscript text/tables or inspect bill documents during offline troubleshooting. It uses Python/CLI tools and can support comparisons. It is not a drop-in Node billing extractor and does not replace PDF.js/Tesseract.js, validate extracted billing values, or guarantee provider-layout accuracy. Inspect license and tool prerequisites before use. |
| Anthropic `webapp-testing` | Skip installing for now | Its screenshot/DOM/log inspection workflow is useful, but its Python Playwright setup duplicates our existing JavaScript tests. Continue using the project's current browser harness. |
| Trail of Bits `insecure-defaults` plugin | Hold; do not adopt its full workflow now | Default credentials, permissive access, debug leakage, and fallback-secret checks are relevant before deployment. The inspected current plugin uses a multi-agent Claude-specific pipeline and is not the simple standalone SKILL.md path initially expected. Prefer a bounded configuration review now; revisit packaging and execution requirements if a fuller audit becomes necessary. |

Inspected sources: [property-based-testing](https://github.com/trailofbits/skills/blob/main/plugins/property-based-testing/skills/property-based-testing/SKILL.md), [differential-review](https://github.com/trailofbits/skills/blob/main/plugins/differential-review/skills/differential-review/SKILL.md), [AccessLint scan instructions](https://github.com/AccessLint/skills/blob/main/plugins/accesslint/skills/accessibility-scan/SKILL.md), [AccessLint requirements](https://github.com/AccessLint/skills), [Anthropic PDF](https://github.com/anthropics/skills/blob/main/skills/pdf/SKILL.md), [Anthropic webapp testing](https://github.com/anthropics/skills/blob/main/skills/webapp-testing/SKILL.md), and [insecure-defaults plugin](https://github.com/trailofbits/skills/tree/main/plugins/insecure-defaults).

No new general-purpose OCR skill is recommended from this search. The offline PDF guide is adjacent document tooling, not an evaluated provider-bill extraction workflow. For OCR, prioritize representative bill fixtures with known correct values for the five required fields, email/upload duplicate cases, and uncertain extraction routed to Manager review. An agent instruction skill itself does not improve the runtime OCR engine.

Suggested order: finish real mailbox/OCR acceptance using our existing tools; select and trial one design guide; use property-based testing for financial/calendar rules when needed; use differential review for substantial backend changes. Accessibility tooling remains optional; PDF-assisted manuscript review is selected but deferred. Stop expanding the shortlist once a candidate covers a real task; more installed skills are not an accomplishment by themselves.

## Agentic Awesome Skills as a personal library

The repository is suitable for discovery across coding, design, documents, security, data, and automation. It aggregates instructions from many source families; evaluate individual files and prerequisites rather than treating the catalog as one uniformly compatible skill. Prefer a maintained upstream source for skills already selected from Trail of Bits, Anthropic, Taste, or Vercel, unless inspection establishes a reason to use the catalog's variant. Do not install duplicate copies of the same skill.

The inspected README describes supported read-only AAS Core discovery and planning, while apply/recovery remain experimental. Its Codex setup guide includes additional runtime and host-configuration changes. None of that is needed merely to install a few known skill paths. At inspection, main's README named 19.4.0 while its Codex guide used 19.5.0 commands: verify a coherent release/commit before installation rather than copying floating commands. See [catalog overview](https://github.com/sickn33/agentic-awesome-skills) and [Codex setup guide](https://github.com/sickn33/agentic-awesome-skills/blob/main/docs/users/codex-cli-skills.md).

Additional inspected candidates:

| Skill | Personal usefulness | PropertyPro decision |
| --- | --- | --- |
| `api-security-best-practices` | User selected; installed locally | Check authentication, resource authorization, input limits, private uploads, and safe errors. Its examples use Express/JWT/Zod/Prisma; retain our existing sessions, Node routing, and SQLite rather than copying those dependencies. |
| `sql-optimization-patterns` | Diagnose measured query bottlenecks with query plans | Optional, not yet user selected. Applicable to SQLite when real queries are slow; verify results before/after and use representative data. It is not a disk-storage minimization guide; extra indexes consume storage. Do not optimize blindly. |
| `verification-before-completion` | Evidence before completion claims | Hold, not a default install. Its broad triggers and requirement for fresh full commands can encourage repeated work. Our existing verification instructions already require appropriate evidence; passing tests is not a guarantee of all requirements. |
| `writing-plans` | Detailed multi-step implementation plans | Hold, not a default install. The inspected version prescribes worktrees, frequent commits, other Superpowers skills, and agent/session handoffs. This is unnecessary for routine tasks and should not override our manual Git workflow or bounded-task preference. |

Sources: [API security](https://github.com/sickn33/agentic-awesome-skills/blob/main/skills/api-security-best-practices/SKILL.md), [SQL optimization](https://github.com/sickn33/agentic-awesome-skills/blob/main/skills/sql-optimization-patterns/SKILL.md), [verification](https://github.com/sickn33/agentic-awesome-skills/blob/main/skills/verification-before-completion/SKILL.md), [planning](https://github.com/sickn33/agentic-awesome-skills/blob/main/skills/writing-plans/SKILL.md). This is a focused inspection, not a review of every catalog skill or a guarantee of installer safety.

The seven selected skills are installed in this project. SQL optimization can wait until we observe a real performance problem. Framework-specific, cloud, offensive-security, social/marketing, and agent-platform skills can be discovered later when a concrete task needs them. Skills in this project's `.agents/skills/` folder are not automatically available in other repositories.

## How we will finalize the selection

The user chose Taste redesign as the main design guide and Vercel for the subsequent audit. Trial Taste on the Tenant Bills screen with desktop/mobile screenshots and the existing tests. Compare readability, accurate status labels, ease of reporting rent/marking utilities, and phone usability. Keep UI UX Pro Max and Anthropic frontend-design deferred unless the trial does not fit. Use Vercel's audit only where it adds distinct checks. Retain the smallest useful set after the trial.

Before installation, inspect the selected skill's complete instructions, supporting scripts, prerequisites, and exact revision. Install only selected paths. After final selection, remove only confirmed redundant project-installed skills; do not remove system skills, unrelated user skills, documents, or working dependencies. The saved visual concept remains deferred until the user chooses a direction.

## Model suggestions before substantial work

The user wants an early model recommendation to manage usage. These are task-based starting points, not guarantees of savings or correctness.

| Task | Suggested starting point |
| --- | --- |
| Specific labels, spacing, a small responsive fix, or a clearly specified component | Luna High |
| Implementing an already agreed screen with several related changes | Luna High; increase effort only if the task warrants it |
| Comparing approaches, unclear bugs, OCR/mailbox integration, or substantial code review | Sol Medium; High for difficult investigation |
| Rent calculations, payment/receipt correctness, authentication, database changes, or merge conflicts | Sol Medium/High with targeted verification |
| Exceptionally difficult unresolved work | Consider higher effort after defining what simpler attempts could not resolve; Max is not the default |

Official OpenAI guidance recommends Luna for focused, repeatable work and Sol for complex coding. Higher reasoning effort uses more time and tokens; model availability depends on the account/client. See [OpenAI model guidance](https://learn.chatgpt.com/docs/models). Exact usage savings and remaining subscription allowance cannot be inferred from task size alone.

Before substantial work, give a short recommendation such as: "Suggested model: Luna High. This is a small CSS change with clear requirements." If a switch would materially help, state it before expensive investigation and give the user an opportunity to switch. Do not silently switch models or claim that recommending a model already changed it. Continue straightforward work without repeated model questions unless the user asks to pause.

Keep tasks bounded: identify the screen/problem, preserve the workflow, define the expected result, load only relevant skill guidance, and run checks appropriate to the changes. Do not use multiple design skills, unnecessary subagents, or full-project audits for a small edit.

Example prompt: "Polish the Tenant Bills screen for phones. Keep all existing actions and billing rules. Improve spacing, readability, and loading feedback using our current CSS. Check the affected interactions. Suggest the appropriate model before starting."
