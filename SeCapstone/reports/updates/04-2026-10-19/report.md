# Development Update — Progress Report 4

**Intelligent Property Management Workflow with OCR-Enabled Automated Billing Classification and Tenant Notification**

**Group 10**  
Casas, William Jake D.; Estayani, Khristian Maenard D.; Magtapat, Jullian Matthew B.

**Date prepared:** 19 October 2026

## 1. Development Progress

The main system features have been implemented, including bill processing, rent management, personal utility tracking, receipts, and tenant notifications. Property, unit, tenant, and billing records now work together. We are completing the remaining setup, final checks, and Chapter 3 before submission.

### Bill Processing and Payments

We added bill intake through supported emails and document uploads. The system reads available text directly and uses OCR for bill images. It checks required details, matches utility accounts, and identifies duplicates. Managers can correct unclear or missing details before reprocessing a bill.

Monthly rent generation and shared-bill calculations now follow the saved billing settings. Managers approve advance rent for an eligible final cycle and confirm rent payments. Tenants use a separate personal utility tracker. Confirmed rent receipts can be viewed or downloaded in a simple black-and-white layout.

### Tenant Pages and Design

We improved the tenant pages so bills, payment history, and receipts are easier to find. A calendar shows actual utility due dates and estimated future rent dates. Portal alerts, Web Push support, and rent email notification functions were added for billing updates.

We also adjusted desktop and mobile layouts, text sizes, spacing, and navigation. Animations were slowed down for smoother movement across roles.

<!-- PAGE BREAK -->

### Admin and Data Management

Separate workspaces allow each Manager to access only their own properties and tenants. Admin pages now show clearer system-status information and provide access to older audit records. Storage improvements include OCR text compression, reuse of identical uploaded files, and removal of expired login sessions.

## 2. Review and Improvements

We reviewed the diagrams and features against the approved workflow. The architectural diagram now illustrates bill extraction and the required billing fields. We clarified the difference between rent confirmation and personal utility tracking and simplified the steps for reviewing bills and using the tenant portal.

## 3. Chapter 3 Progress

Chapter 3 is still being prepared. Updated screenshots and descriptions of the implemented functions are available to support the chapter. We will continue organizing these materials and completing the remaining sections based on the required outline.

## 4. Remaining Work

With the main development completed, we are focusing on live email and notification setup, final checks, and Chapter 3. Any issues found during this stage will be addressed before submission.
