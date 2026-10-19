# Proposed rent email notification amendment

Prepared on 13 October 2026 against the stored 45-page FINAL_MANUSCRIPT.pdf. This is a revision checklist, not an amendment to the approved PDF or a claim that sending is implemented. Page numbers refer to that export and will change after editing. Paragraph-opening anchors identify passages when they span pages; paragraph numbers are not guessed from PDF line breaks.

## Proposed boundary

Keep Web Push for the existing rent and utility notifications. Add email only for rent billing updates, eligible rent reminders, and Manager-confirmed rent payment notices. Email messages link to the authenticated portal; they do not attach or create another receipt, establish payment by themselves, or prove readership. No tenant SMS, utility email notifications, marketing messages or provider-payment verification are added.

Use existing rent event and reminder rules. Rent generated on its due date receives a billing update that day, not a reminder three days before a bill exists. Do not change anniversary generation or introduce advance billing solely to support email. The 9 AM Philippine-time cutoff, pending-report suppression, late-bill handling and no retrospective reminder policy remain applicable. Payment-status changes continue to require the existing rent workflow.

Implementation will need a valid tenant destination, protected SMTP credentials, a configured portal URL, queued attempts, limited retries, duplicate controls and sending/failure records. Email-server acceptance must be distinguished from inbox delivery/readership. These controls are proposed requirements, not existing verified features.

## Complete manuscript change map

| Section / current PDF pages | Locate this passage or item | Revision needed |
| --- | --- | --- |
| 1.1 Introduction, page 4 | Final paragraph beginning “Based on these ideas” | Mention permitted Web Push alerts and supplementary rent email alerts in the concept sentence. Keep technical setup out of the introduction. |
| 1.2 Related Literature, pages 8–9 | Topic “Web Push Notifications and Secure Notification Delivery” | Retitle to include rent email notifications. Retain the W3C and Carboneri citations and discussion; add the concise email literature paragraph below. No synthesis section is required. |
| 1.3 Significance, page 11 | First paragraph beginning “The study develops and evaluates” | Include supplementary rent email notifications among the technologies. Other significance paragraphs already discuss electronic/automated notifications generally and need no new claims. |
| 1.4 Statement of the Problem, page 13 | Question 2 beginning “How does the proposed system integrate OCR” | Include rent email notifications in its function list, if the adviser permits amending this approved question. Preserve the remaining questions and ISO characteristics. |
| 1.5 Scope and Limitations, page 16 | Paragraph beginning “Rent payment statuses will remain” | Preserve all payment/tracking rules. Describe the additional rent-only email channel and eligible events, retain Web Push and timing rules, and replace the blanket tenant-email exclusion with exclusion of tenant SMS and utility email alerts. |
| 1.5 Scope and Limitations, page 17 | Final paragraph beginning “The study excludes mobile applications” | Retain the existing delivery/readership limitation and clarify that it covers both channels. Keep all other exclusions. |
| 2.0 Project Overview / Project Information, pages 18–19 | First project-description paragraph ending with permitted Web Push updates | Include supplementary rent email alerts. Keep utility intake distinct from outgoing tenant messages. |
| 2.0 Requirements Definition / A. Business Requirements, page 21 | Paragraph beginning “The centralized database shall retain” | Preserve rent/utility separation. Replace “Tenant email notifications shall not be used; the mailbox shall serve utility intake only” with rent-only outgoing email requirements. Retain SMS/GSM exclusion. Add valid-destination, event, queue, retry, duplicate, failure and portal-access requirements. |
| 2.0 Requirements Definition / B. User Requirements, pages 21–22 | Paragraph beginning “The Admin shall perform” and ending with Tenant alerts | Include the Tenant’s registered destination for rent emails and receipt of permitted rent alerts. No manual Manager send for every bill is required. |
| 2.0 Requirements Definition / C. Security Requirements, pages 22–23 | Paragraph beginning “The system shall require valid credentials” | Add protected sending credentials, authorized recipient selection and minimum email content with authenticated portal access. Preserve the existing privacy-audit disclaimer. |
| 2.1 Concept of the Study / Architectural Framework, page 23 | Paragraph beginning “The framework connects” | Include rent email delivery beside Web Push in the notification component. |
| 2.1 Architectural Framework explanation, pages 26–27 | Paragraph beginning “The designated property-management mailbox” | Retain utility intake; remove the prohibition on sending Tenant notifications. Explain intake and outgoing rent SMTP as separate functions, even if a single authorized email account is used. |
| 2.1 Architectural Framework explanation, page 32 | Paragraph beginning “The Centralized Database will relate” | Include email channel, event/recipient association, schedule, attempts and available outcomes in the notification records. Preserve financial and correction relationships. |
| 2.1 Architectural Framework explanation, pages 32–33 | Paragraphs beginning “Web Push will be the only external” and “Notification records will distinguish” | Replace the exclusive-channel statement. Describe rent-only email, shared event rules, separate channel outcomes, limited retries, duplicate controls and no delivery/readership guarantee. Retain Web Push permissions and all reminder exclusions. |
| 2.1 Architectural Framework explanation, pages 33–34 | Paragraphs beginning “The Admin performs” and “The components form” | Update the Tenant alert description and closing notification summary; no other role/payment change is needed. |
| 2.2 Conceptual Operation, pages 34–35 | Workflow description containing “Permitted billing updates and eligible reminders” | Distinguish Web Push for rent/utilities from email for rent. Retain authentication, timing and payment rules. |
| 2.2 Overall Process Flowchart explanation, pages 36–37 | Paragraph beginning “The flowchart shows” | Update its last notification sentence to describe the two channel scopes. |
| 2.2 Full-Blown DFD explanation, page 38 | Paragraph beginning “The DFD illustrates” | Identify outgoing rent alert information and email sending outcomes if represented in the revised DFD. |
| 2.3 Mockup Design, page 38 | Paragraph beginning “The mockups present” | Only update channel-specific wording/screens if the chosen design shows them. The current general “permitted notifications” phrase remains suitable. |
| 2.4 Methodology, pages 38–39 | Paragraph listing interconnected functions and ending in Web Push Notifications | Include rent email notifications. Preserve the iterative approach. |
| 2.4.2 Development Iterations, page 41 | Table 2.2, Iteration 6 | Add rent email alerts to Development Focus and Main Functions; do not add another iteration. |
| 2.4.3 Application of the Methodology, page 41 | First paragraph beginning “The planned iterations will be applied” | Include rent email notifications among integrated functions. |
| 2.4.4 System Testing and Evaluation Procedures, pages 42–44 | Paragraph beginning “Validation, mapping, classification” | Add expected-recipient/event checks, real controlled sending, failure/retry and duplicate tests. Verify pending/paid rent suppression, due-date cutoff and late-bill rules. A simulated mail transport test is not proof of real delivery. |
| 2.4.4 System Testing and Evaluation Procedures, pages 43–44 | Paragraph beginning “Functional Suitability will use” | Include bounded email evidence under functionality, reliability and security. Keep all five quality characteristics. |
| 2.4.4 System Testing and Evaluation Procedures, page 44 | Paragraph beginning “Managers will review bills” | Include checking rent email and following its portal link among Tenant tasks. Retain prospective tense and no completed participant results. |
| References, when restored | Existing notification references | Retain existing entries; add only sources actually cited in the new paragraph. Reference formatting remains subject to the adviser’s required style. |

## RRL addition to place after the existing Web Push discussion

Email provides another channel for sending rent-related alerts. Klensin (2008) describes Simple Mail Transfer Protocol (SMTP) as a protocol for transporting electronic mail. Moore and Newman (2018) explain the use of Transport Layer Security (TLS) to protect email submission and access connections. These standards provide a technical basis for supplementary rent email notifications in the proposed system. Messages will direct tenants to the authenticated portal, while notification records will distinguish sending attempts and available acceptance or failure results. An accepted email will not establish that the Tenant received or read it, and sending a message will not change rent payment status.

These are primary technical standards, not empirical studies proving that email reduces late payments. If the adviser requires empirical related studies for this topic, source them before making an outcome claim. Do not replace existing Web Push studies or invent citations.

Verified source candidates for later reference restoration:

- Klensin, J. (2008). *Simple Mail Transfer Protocol* (RFC 5321). https://www.rfc-editor.org/info/rfc5321/
- Moore, K., & Newman, C. (2018). *Cleartext Considered Obsolete: Use of Transport Layer Security (TLS) for Email Submission and Access* (RFC 8314). https://www.rfc-editor.org/info/rfc8314/

## Diagram edits after the manuscript wording is settled

- Architecture (Figure 2.1): extend the notification component with rent-only email delivery and the external SMTP/email service. Keep utility intake separate.
- Flowchart (Figure 2.2): label applicable notification steps “Web Push alerts; rent email alerts.” If channel scopes are unclear at the common finalization step, annotate that email applies to rent only. A payment-confirmation email is an alert from the existing confirmation path, not another payment action.
- DFD (Figure 2.3): add the mail service as an external entity if drawn explicitly; label outgoing rent notification data and returned sending results. Recipient/destination and queued results pass through system processes and notification storage, not directly between a Tenant and the database. Balance external flows if multiple DFD levels are maintained.

## Demo cost and practical limits

A small local demo can use a standard Gmail account plus the open-source Nodemailer library without a paid email delivery subscription. Internet and a running backend are needed. Account eligibility, App Password/2-Step Verification requirements and sending limits still apply. Gmail describes limit errors above 500 messages/day or more than 500 recipients in one message; do not treat that threshold as a guaranteed daily delivery allowance. A local-network portal link works only where that network is reachable; email receipt outside it does not make the portal publicly accessible.

Official references checked on 13 October 2026:

- Nodemailer license: https://nodemailer.com/license
- Gmail sending limits: https://support.google.com/mail/answer/22839
- Google App Password requirements: https://support.google.com/accounts/answer/185833

## Separate proposed change

Email-body utility parsing and masked CAN/SIN matching are separate from outgoing rent notifications. They need their own source evidence, intake requirements and tests. This amendment does not claim those changes are approved or implemented, does not promise unmasked provider emails and does not require automatic access to provider apps.
