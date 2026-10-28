"""Apply bounded manuscript wording updates and prepare guarded Docs replacements."""
from pathlib import Path
import json

root=Path(__file__).resolve().parent
edits=[]
def change(filename,old,new,section,remote=True):
    path=root/filename
    content=path.read_text(encoding='utf-8-sig')
    if old not in content:
        assert new in content, (filename,section,'Expected source paragraph not found')
        return
    count=content.count(old)
    path.write_text(content.replace(old,new),encoding='utf-8')
    edits.append({'file':filename,'section':section,'old':old,'new':new,'localCount':count,'remote':remote})

change('CHAPTER_I_REVISED.md',
 'Records that do not meet the required validation conditions are sent to the Exception Queue for Manager review.',
 'Records that do not meet the required validation conditions are sent to the Exception Queue for Staff investigation and, when required, Manager decisions.',
 '1.2, OCR and Billing Document Extraction, paragraph 1')
change('CHAPTER_I_REVISED.md',
 'Records that do not meet the defined conditions are sent to the Exception Queue for Manager review.',
 'Records that do not meet the defined conditions are sent to the Exception Queue for Staff investigation and, when required, Manager decisions.',
 '1.2, Rule-Based Processing and Exception Handling, paragraph 1')
change('CHAPTER_I_REVISED.md',
 'Incomplete, uncertain, duplicated, unmappable, or otherwise invalid records will enter the Exception Queue for Manager correction, revalidation, and reprocessing.',
 'Incomplete, uncertain, duplicated, unmappable, or otherwise invalid records will enter the Exception Queue for Staff investigation or Manager correction. Staff correction proposals will require Manager authorization, and accepted corrections will undergo system revalidation and reprocessing.',
 '1.5, paragraph 4')
change('CHAPTER_I_REVISED.md',
 'The study excludes mobile applications;',
 'Independent business workspaces will separate each management group\'s operational records. Managers and Staff will access only their authorized workspace, while Tenants will access their own records. Admin access will support authorized account and workspace maintenance without operational rent-confirmation authority. The Tenant calendar will display actual validated bill dates and clearly labelled estimates of upcoming configured rent dates. Estimates will not create charges, establish payment obligations, or predict utility dates. Workspace separation and calendar presentation support the included billing workflow rather than introduce new research objectives.\n\nThe study excludes mobile applications;',
 '1.5, new supporting-infrastructure paragraph before exclusions')
change('CHAPTER_II_REVISED.md',
 'The Manager may also upload a clear photograph or scan of a printed provider bill.',
 'Staff or the Manager may also upload a clear photograph or scan of a printed provider bill.',
 '2.1, intake description',False)
change('CHAPTER_II_REVISED.md','optional Manager bill uploads','optional Staff or Manager bill uploads','2.4.3, paragraph 1',False)
change('CHAPTER_II_REVISED.md',
 'No completed iteration, testing result, or evaluation result is claimed in this chapter.',
 'This chapter describes the planned methodology. Recorded development activities and testing results are presented separately in Chapter III; formal evaluation is reported only when completed.',
 '2.4.3, paragraph 3',False)
change('CHAPTER_II_REVISED.md',
 'No completed testing or evaluation result is claimed at the proposal stage.',
 'This section specifies the evaluation procedure rather than its results. Chapter III distinguishes the completed development checks from the formal evaluation activities that remain pending.',
 '2.4.4, participant-task and scoring paragraph')
change('CHAPTER_III_WORKING.md',
 'A locked PDF is not automatically replaced by a summary fallback.',
 'A password-protected attachment requires review and an available readable supported source; the system does not recover its password or infer hidden account characters.',
 '3.1.1, email intake, upload, and extraction paragraph')
old='The selected ISO/IEC 25010:2023 characteristics remain Functional Suitability, Performance Efficiency, Interaction Capability, Reliability, and Security, as defined in Chapters I and II. Automated functional and access checks provide limited technical evidence; they do not by themselves establish scores for all five characteristics. A controlled performance study, representative extraction dataset, and participant-based interaction evaluation have not been established by the available records. No questionnaire ratings, respondent counts, OCR accuracy percentage, load capacity, or security certification are reported as completed results.'
new='''The selected ISO/IEC 25010:2023 characteristics remain Functional Suitability, Performance Efficiency, Interaction Capability, Reliability, and Security, as defined in Chapters I and II. Each characteristic requires evidence appropriate to its purpose; a passed automated suite does not establish a score for every characteristic.

Functional Suitability is supported by recorded checks of intake, validation, allocation, correction handling, rent confirmation, receipt access, and personal utility tracking. These results apply to the exercised cases. Representative extraction accuracy still requires a declared sample set and manually checked reference values.

Performance Efficiency has not yet been established through a controlled response-time, resource-use, or concurrent-user study. The full-suite duration reported in Section 3.2.3 measures the time taken by the test suite and must not be presented as bill-processing latency or evidence of production capacity.

Interaction Capability has preliminary evidence from automated browser journeys and phone-sized layout checks. These checks do not replace actual-device tasks, participant feedback, or an adviser-approved usability questionnaire. The proposed interface redesign remains separate from the implemented screens and must be checked after application.

Reliability is supported by the recorded duplicate, replay, restart-persistence, invalid-correction rollback, and independent-job failure scenarios. These bounded checks do not establish long-term availability or operation while the server is shut down.

Security has evidence from selected authentication, role, record-access, and workspace-isolation checks. It has not been established through a complete penetration test or legal compliance audit. No questionnaire ratings, respondent counts, OCR accuracy percentage, load capacity, or security certification are reported as completed results.'''
change('CHAPTER_III_WORKING.md',old,new,'3.1.3, five quality-characteristic evidence paragraphs')
(root/'MANUSCRIPT_ALIGNMENT_EDITS.json').write_text(json.dumps(edits,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(edits,ensure_ascii=True))
