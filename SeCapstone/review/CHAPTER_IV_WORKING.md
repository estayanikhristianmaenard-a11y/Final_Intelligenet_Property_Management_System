# CHAPTER IV

**CONCLUSIONS AND RECOMMENDATIONS**

This chapter presents our conclusions and recommendations based on the recorded development findings in Chapter III. The conclusions answer the four research questions in Chapter I in the same order, followed by recommendations for further testing and use of the system. Since formal participant evaluation has not yet been conducted, our conclusions are limited to the implemented functions and the development checks that we have completed.

## 4.1 Conclusions

We developed the system through repeated planning, design, development, testing and review using the Iterative Software Development Methodology. The seven development areas described in Chapter III connected account access, property setup, utility intake, validation, billing, payment records and notifications. This process allowed us to check added functions with the existing workflow and correct the issues found during development.

We integrated direct text extraction and OCR with rule-based validation, classification, equal allocation, exception handling and Tenant access in one property-management workflow. Valid utility sources proceed through the defined rules, while unresolved sources require Staff investigation and, when needed, Manager correction or authorization before billing can continue. Rent confirmation and receipts remain Manager-controlled, personal utility marks do not verify provider payment, and portal alerts, Web Push and supplementary rent email support access to the resulting records.

Our development checks provided evidence related to Functional Suitability, Performance Efficiency, Interaction Capability, Reliability and Security through function tests, local response measurements, browser tasks, recovery checks and access-control tests. The full run recorded on 1 November 2026 passed all 144 tests, while the earlier extraction comparisons and response measurements remained limited to their stated fixtures and local environment. These findings support a controlled demonstration, but they do not establish representative OCR accuracy, actual-phone notification delivery, participant acceptance or an overall ISO quality rating.

We prepared an implementation guide and user manual covering setup, account access, utility intake, correction handling, rent confirmation, personal utility tracking, receipts and permitted notifications. The materials also include demonstration files and a walkthrough for Staff, Manager and Tenant tasks, with Admin inspection checks recorded separately. These guides provide instructions for the included workflow, although their clarity and usefulness still need to be checked through actual user tasks.

## 4.2 Recommendations

Our recommendations are derived from the recorded development tests and technical limitations presented in Chapter III. They are not based on completed surveys, stakeholder interviews or participant ratings.

Our development team, together with the assigned Manager, Staff and Tenant testers, should first complete the prepared walkthrough on actual Android phones. Each task should record the device, tester, date, expected result and actual result, including navigation, forms, original-bill review, rent reporting and receipt viewing. The team should correct observed failures and repeat the affected tasks before using the demonstration results as evidence of actual-device operation.

Our development team and the property Manager should test supported provider emails and documents using consented samples with independently checked account references, amounts, dates and billing periods. The checks should cover automatic Gmail labelling, correct workspace and Tenant assignment, repeated retrieval and sources that must remain under review, including incomplete references and unsupported encrypted files. Direct text extraction and OCR results should be recorded separately, without counting copied or edited versions as independent real bills.

Our development team and the agreed Tenant test recipients should verify live rent-email and Web Push delivery using fresh, clearly identified test events. The checks should confirm actual receipt and access to the correct authenticated record, rather than treating a sending-service acceptance as proof of delivery or reading. The team should also check the existing reminder rules and preserve the restriction that supplementary email applies to rent only.

Our Admins and property Managers should follow the documented account, workspace and backup procedures when preparing the system for actual use. They should check role assignments and utility mappings, keep demonstration records separate from operational records, and verify a restore in a separate directory before relying on a backup. The operating guide should also make clear that scheduled processing requires a running backend and that Gmail and external notifications require internet access.

Our group, with our research adviser, should complete the evaluation plan for the five selected software-quality characteristics and collect the required participant results. The evaluation should use approved tasks, participants and scoring procedures, with actual observations kept separate from automated development tests. We should then update Chapters III and IV with those findings before making a study-wide conclusion about software quality and user acceptance.
