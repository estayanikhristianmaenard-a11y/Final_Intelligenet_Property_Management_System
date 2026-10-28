"""Prepare manuscript blocks from the revised chapter sources without changing them."""
from pathlib import Path
import json
import re

root = Path(__file__).resolve().parent
title = 'Intelligent Property Management Workflow with OCR-Enabled Automated Billing Classification and Tenant Notification'
blocks = [{'type':'p','text':title,'style':'TITLE'}]
changes=[]
def clean(text):
    return text.replace('**','').replace('*','').strip()

for name in ['CHAPTER_I_REVISED.md','CHAPTER_II_REVISED.md','CHAPTER_III_WORKING.md','REFERENCES_REVISED.md']:
    content=(root/name).read_text(encoding='utf-8-sig')
    if name=='CHAPTER_II_REVISED.md':
        old='The Manager may also upload a clear photograph or scan of a printed provider bill.'
        new='Staff or the Manager may also upload a clear photograph or scan of a printed provider bill.'
        if old in content:
            content=content.replace(old,new)
            changes.append('Chapter II, Section 2.1: included Staff in the optional upload sentence, consistent with the implemented roles.')
        content=content.replace('optional Manager bill uploads','optional Staff or Manager bill uploads')
        content=content.replace('No completed iteration, testing result, or evaluation result is claimed in this chapter.','This chapter describes the planned methodology. Recorded development activities and testing results are presented separately in Chapter III; formal evaluation is reported only when completed.')
        changes.append('Chapter II, Section 2.4.3: aligned optional uploads with Staff access and distinguished the methodology plan from dated Chapter III development results.')
    lines=content.splitlines()
    i=0
    while i<len(lines):
        line=lines[i].strip()
        if not line:
            i+=1;continue
        image=re.fullmatch(r'!\[[^\]]*\]\(([^)]+)\)',line)
        if image:
            blocks.append({'type':'image','path':str((root/image.group(1)).resolve())})
            i+=1;continue
        if line.startswith('|'):
            rows=[]
            while i<len(lines) and lines[i].strip().startswith('|'):
                cells=[clean(c) for c in lines[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r':?-+:?',c.replace(' ','')) for c in cells):rows.append(cells)
                i+=1
            assert len({len(r) for r in rows})==1
            blocks.append({'type':'table','rows':rows})
            continue
        heading=re.match(r'^(#{1,6})\s+(.+)',line)
        if heading:
            level=len(heading.group(1))
            style='HEADING_'+str(min(level,6))
            text=clean(heading.group(2))
        else:
            text=clean(line)
            style='HEADING_2' if line.startswith('**') and line.endswith('**') and not text.startswith('Table ') else 'NORMAL_TEXT'
        blocks.append({'type':'p','text':text,'style':style,'newPage':text in ['CHAPTER I','CHAPTER II','CHAPTER III','REFERENCES']})
        i+=1

payload={'title':title,'blocks':blocks,'changes':changes}
(root/'MANUSCRIPT_I_III_PAYLOAD.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding='utf-8')
# The detailed alignment review is maintained separately; do not overwrite it.
print(json.dumps(payload,ensure_ascii=False))
