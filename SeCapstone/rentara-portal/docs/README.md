# Rentara documentation

Start with the guide that matches your task. Use the current code and latest verification entry rather than an older checkpoint's test count.

| Task | Current guide |
| --- | --- |
| Understand the implemented Staff revision | [Permissions, proposals, demo and remaining acceptance work](staff-implementation-plan.md) |
| Coordinate turn-taking on main and shared laptop testing | [Taglish team workflow and handoff](team-branch-workflow.md) |
| Resume the next development session | [Prioritized pending tests and integrations](next-session-checklist.md) |
| Prepare the professor demonstration | [Final checks, accounts and demo order](professor-demo-checklist.md) |
| Understand Manager/Tenant needs and improvements | [User stories](user-stories.md) |
| Create and restore complete data/file backups | [Backup and recovery](backup-and-recovery.md) |
| Check what belongs in the capstone | [Scope and development boundaries](capstone-scope.md) |
| Understand automatic intake, billing, reminders and recovery | [Automatic workflow and status](automated-workflow.md) |
| Verify email intake through Tenant billing and alerts | [Email billing acceptance](email-billing-acceptance.md) |
| Run and use the application | [User manual](user-manual.md) |
| Check the UI and workflows yourself | [Manual test guide](manual-test-guide.md) |
| Find bill samples by source and case | [Utility-bill sample catalog](samples/utility-bills/README.md) |
| Open the portal on a phone | [Local-network demo](local-network-demo.md) |
| Run separate acceptance records and Android HTTPS | [Local acceptance setup](local-acceptance-setup.md) |
| Separate independent owners and configure their integrations | [Workspaces](workspaces.md) |
| Review workspace access-control changes and evidence | [Workspace security review](workspace-security-review.md) |
| Understand routes and stored records | [API and database contract](api-contract.md) |
| Explain each Admin status check | [System status criteria and limits](system-status.md) |
| Check verification evidence and remaining gaps | [Current QA status](qa-report.md) |
| Configure/preview rent email notices | [Rent email templates](rent-email-templates.md) |
| Configure the selected Gmail account locally | [Gmail setup and readiness check](gmail-local-setup.md) |
| Understand adopted UI patterns | [Tabler adaptations](tabler-design-adaptation.md) |
| Understand lightweight motion and form safeguards | [Performance and motion](performance-and-motion.md) |
| Review data/file retention | [Storage policy](storage-policy.md) |
| Use approved skills and references | [Skill/model guide](skill-shortlist-and-model-guide.md), [GitHub shortlist](github-reference-shortlist.md) |
| Find current code responsibilities and development setup | [Development guide](development-guide.md) |
| View the implemented interface | [Current screenshots](../../reports/mockups/README.md) |
| Review remaining visual improvements | [Current mockup review](mockup-review.md) |

## Historical material

[Archived checkpoints](archive/checkpoints) contain the earlier button, billing UI, responsive UI, parser/OCR and utility-journey reports. They retain evidence of what was checked at that time. They are not additional setup instructions or independent current specifications. Relevant links were updated when these files moved.

The [historical QA log](archive/checkpoints/qa-history-through-2026-10-20.md) preserves earlier complete-suite runs and issue histories. The [core-billing investigation](archive/checkpoints/core-billing-verification.md) is also historical; use the current QA status above for today's remaining work.

No manuscript, editable diagram, source bill fixture, private database or approved workflow has been removed. Original concepts and the superseded mockup PDF are in [the report archive](../../reports/archive/README.md). Historical reports are retained rather than discarded. Intentional duplicate bill/test assets are documented in the [cleanup record](project-cleanup.md).

The application directory is `rentara-portal`. Startup scripts and current documentation use this name. Demo account emails, the database filename and session identifiers remain compatible.

Current implementation: [Staff/Manager roles, correction workflow, demo setup and acceptance limits](staff-implementation-plan.md).

Older Staff/deployment proposals are grouped under [historical planning](archive/planning/README.md). See the [project cleanup record](project-cleanup.md) for removed code, retained fixtures and checks.

The current shared UI direction is documented in [interface-design.md](interface-design.md); the [PNG gallery](../../reports/mockups/README.md) contains the rendered implementation.
