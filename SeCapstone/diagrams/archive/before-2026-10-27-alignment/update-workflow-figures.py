"""Historical 27 October alignment script; do not rerun over later manual edits."""
from pathlib import Path
import shutil
import xml.etree.ElementTree as E

BASE=Path(__file__).resolve().parents[2]
ARCHIVE=BASE/'archive'/'before-2026-10-27-alignment'
ARCHIVE.mkdir(parents=True,exist_ok=True)
NODE='rounded=0;html=0;whiteSpace=wrap;fillColor=#ffffff;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=18;strokeWidth=2;spacing=8;'
EDGE='edgeStyle=orthogonalEdgeStyle;rounded=0;html=0;endArrow=block;endFill=0;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=17;strokeWidth=1.5;labelBackgroundColor=#ffffff;'

class Figure:
 def __init__(self,name):
  self.path=BASE/(name+'.drawio')
  if not (ARCHIVE/self.path.name).exists():shutil.copy2(self.path,ARCHIVE/self.path.name)
  self.tree=E.parse(self.path);self.root=self.tree.find('.//mxGraphModel/root')
 def item(self,id):return next(e for e in self.root if e.get('id')==id)
 def cell(self,id):
  e=self.item(id);return e if e.tag=='mxCell' else e.find('mxCell')
 def label(self,id,text):
  e=self.item(id);e.set('value' if e.tag=='mxCell' else 'label',text)
 def pos(self,id,x=None,y=None,w=None,h=None):
  g=self.cell(id).find('mxGeometry')
  for k,v in [('x',x),('y',y),('width',w),('height',h)]:
   if v is not None:g.set(k,str(v))
 def node(self,id,text,x,y,w,h,style=NODE,parent='1'):
  try:c=self.cell(id)
  except StopIteration:c=E.SubElement(self.root,'mxCell',{'id':id,'vertex':'1','parent':parent})
  c.set('value',text);c.set('style',style)
  g=c.find('mxGeometry')
  if g is None:g=E.SubElement(c,'mxGeometry',{'as':'geometry'})
  g.attrib.update(x=str(x),y=str(y),width=str(w),height=str(h))
 def edge(self,id,source,target,label='',points=None,style=EDGE):
  try:c=self.cell(id)
  except StopIteration:c=E.SubElement(self.root,'mxCell',{'id':id,'edge':'1','parent':'1'})
  c.attrib.update(source=source,target=target,value=label,style=style)
  for old in list(c):c.remove(old)
  g=E.SubElement(c,'mxGeometry',{'relative':'1','as':'geometry'})
  if points:
   a=E.SubElement(g,'Array',{'as':'points'})
   for x,y in points:E.SubElement(a,'mxPoint',{'x':str(x),'y':str(y)})
 def save(self):
  # Imported nonbreaking spaces/replacement glyphs must not print as stray symbols.
  for e in self.root.iter():
   for k in ['label','value']:
    if e.get(k):e.set(k,e.get(k).replace('\ufffd',' ').replace('\xa0',' '))
  self.tree.getroot().set('agent','Rentara manuscript alignment 2026-10-27')
  self.tree.find('.//mxGraphModel').set('background','#ffffff')
  E.indent(self.tree,space='  ');self.tree.write(self.path,encoding='utf-8',xml_declaration=True)

# Figure 2.1: preserve modules, correct the overlapping actor row and authority labels.
a=Figure('2.1_Architectural_Framework')
a.pos('KLzBRVh5YApQ-wCuvRF--1408',x=1000,w=880,h=170)
a.cell('KLzBRVh5YApQ-wCuvRF--1412').set('parent','KLzBRVh5YApQ-wCuvRF--1408')
for id,x,w in [('KLzBRVh5YApQ-wCuvRF--1410',20,130),('KLzBRVh5YApQ-wCuvRF--1411',180,130),('KLzBRVh5YApQ-wCuvRF--1409',340,155),('KLzBRVh5YApQ-wCuvRF--1412',525,130),('staff-actor',700,130)]:a.pos(id,x=x,y=70,w=w,h=67)
a.label('D7l46L1weNutjggXawa2-1','Accounts / Workspaces\nSystem Maintenance')
a.label('KLzBRVh5YApQ-wCuvRF--1433','Bills for Review\nStaff investigates / proposes\nManager authorizes / corrects\nAtomic revalidation; keep history')
a.label('KLzBRVh5YApQ-wCuvRF--1431','Validate and Classify Bill\nRequired fields / full mapping\nPeriod / duplicate checks')
a.pos('KLzBRVh5YApQ-wCuvRF--1431',h=184)
a.label('KLzBRVh5YApQ-wCuvRF--1436','Authorized / direct correction')
a.label('KLzBRVh5YApQ-wCuvRF--1439','Manager Rent Confirmation\nTenant report / Manager record\nEligible final-cycle advance')
a.label('KLzBRVh5YApQ-wCuvRF--1446','System Database\nWorkspace-scoped records')
# Added Staff routes use the outside right lane, away from the actor labels.
a.edge('staff-review','staff-actor','KLzBRVh5YApQ-wCuvRF--1433','Investigation / proposal',[(2830,300),(2830,710),(1370,710),(1370,850)],EDGE+'exitX=1;exitY=0.5;entryX=1;entryY=0.4;')
# Summarize access instead of routing every UI action across the architecture.
actors={'KLzBRVh5YApQ-wCuvRF--1410','KLzBRVh5YApQ-wCuvRF--1411','KLzBRVh5YApQ-wCuvRF--1412','KLzBRVh5YApQ-wCuvRF--1409','staff-actor'}
for item in list(a.root):
 cell=item if item.tag=='mxCell' else item.find('mxCell')
 if cell is not None and cell.get('edge') and (cell.get('source') in actors or cell.get('target') in actors):a.root.remove(item)
a.pos('D7l46L1weNutjggXawa2-1',x=500,y=75,w=430,h=100)
a.node('role-access','AUTHENTICATED PORTAL / WORKSPACE ACCESS\nAdmin: accounts and maintenance. Staff: descriptive records, intake, investigation and proposals.\nManager: operations, setup, correction decisions and rent confirmation. Tenant: own bills, rent reports, receipts and personal utility marks.',383,225,2276,105,NODE+'fontStyle=0;')
for role in ['KLzBRVh5YApQ-wCuvRF--1410','KLzBRVh5YApQ-wCuvRF--1411','KLzBRVh5YApQ-wCuvRF--1412','staff-actor']:
 a.edge('access-'+role,role,'role-access','',None,EDGE+'exitX=0.5;exitY=1;entryY=0;entryX=0.7;')
a.edge('admin-maintenance','KLzBRVh5YApQ-wCuvRF--1410','D7l46L1weNutjggXawa2-1','',None,EDGE+'exitX=0;exitY=0.5;entryX=1;entryY=0.5;')
a.edge('provider-email','KLzBRVh5YApQ-wCuvRF--1409','gtn1k2S0OnRhmNFAWXwG-18','Utility bill email',[(2710,160),(2710,350)],EDGE+'exitX=1;exitY=0.5;entryX=1;entryY=0.1;')
a.label('KLzBRVh5YApQ-wCuvRF--1431','Validate / Classify Bill\nFields / mapping / period\nDuplicate checks')
a.pos('KLzBRVh5YApQ-wCuvRF--1431',x=101,w=260,h=145)
a.save()

# Figure 2.2: a failed Staff proposal must not be applied before a successful atomic recheck.
f=Figure('2.2_Process_Flowchart_SIMPLE')
f.label('utility','Receive Utility Bill\nMailbox / Staff or Manager upload\nDirect text extraction or OCR')
f.label('rules','Validate and Calculate Shares\nFull mapping / period / duplicates\nRevalidate corrected records')
f.label('credit','Eligible final cycle only:\nManager confirms advance use.\nOtherwise retain rent unchanged.\nCalculate remaining rent.')
f.label('correction','Staff investigates / proposes\nProposed values + source reason\nLive billing remains unchanged')
f.pos('correction',x=850,y=950,w=310,h=95)
f.pos('exception',x=870,y=805,w=270,h=70)
f.label('proposal-decision','Manager authorizes\ncurrent proposal?')
f.pos('proposal-decision',x=880,y=1100,w=250,h=120)
f.label('proposal-rejected','Keep reason; leave source unchanged\nReject / stale / invalid proposal\nReturn for investigation')
f.pos('proposal-rejected',x=1510,y=1100,w=300,h=110)
f.node('proposal-atomic','Check current context; apply and\nrevalidate in one transaction',1190,1260,300,85)
f.node('proposal-valid','Revalidation\nsuccessful?',1215,1400,250,115,NODE+'rhombus;')
f.node('proposal-applied','Commit corrected source / shares\nRetain preparer and authorizer',1190,1570,300,85)
f.node('manager-correction','Manager direct correction\nKeep history; revalidate',1190,620,300,85)
f.edge('manager-direct-correction','exception','manager-correction','Manager handles directly',[(1170,840),(1170,660)],EDGE+'exitX=1;exitY=0.5;entryX=0;entryY=0.5;')
f.edge('manager-correction-check','manager-correction','rules','Recheck',[(1520,660),(1520,590),(515,590)],EDGE+'exitX=1;exitY=0.5;entryX=0.5;entryY=0;')
f.edge('e9','proposal-decision','proposal-atomic','Authorize',[(1005,1302)],EDGE+'exitX=0.5;exitY=1;entryX=0;entryY=0.5;')
f.edge('proposal-submit','correction','proposal-decision','Submit',None,EDGE+'exitX=0.5;exitY=1;entryX=0.5;entryY=0;')
f.edge('proposal-reject','proposal-decision','proposal-rejected','Reject / stale',None,EDGE+'exitX=1;exitY=0.5;entryX=0;entryY=0.5;')
f.edge('proposal-return','proposal-rejected','correction','Investigate / revise',[(1860,1155),(1860,910),(1005,910)],EDGE+'exitX=1;exitY=0.5;entryX=0.5;entryY=0;')
f.edge('proposal-atomic-valid','proposal-atomic','proposal-valid','',None,EDGE+'exitX=0.5;exitY=1;entryX=0.5;entryY=0;')
f.edge('proposal-rollback','proposal-valid','proposal-rejected','No: roll back',[(1655,1457)],EDGE+'exitX=1;exitY=0.5;entryX=0.5;entryY=1;')
f.edge('proposal-commit','proposal-valid','proposal-applied','Yes',None,EDGE+'exitX=0.5;exitY=1;entryX=0.5;entryY=0;')
f.edge('proposal-finalize','proposal-applied','final','Validated result',[(1140,1612),(1140,1750),(735,1750),(735,910),(515,910)],EDGE+'exitX=0;exitY=0.5;entryX=0.5;entryY=0;')
f.label('personal','Tenant Personal Utility Tracker\nNot Marked Paid / Self-Reported Paid\nProvider payment not verified\nNo utility receipt')
f.label('notify','Portal Alerts + Web Push\nSupplementary email: rent only')
f.save()

# Figure 2.3: preserve processes 1.0–6.0; add the existing Admin support function.
d=Figure('2.3_FullBlown_DFD')
d.label('KLzBRVh5YApQ-wCuvRF--1957','3.0\nValidate / Classify Bills\nReview Correction Proposals')
d.label('KLzBRVh5YApQ-wCuvRF--1972','Validated / revalidated details')
d.label('KLzBRVh5YApQ-wCuvRF--1963','Authorized decision /\ndirect correction')
d.label('KLzBRVh5YApQ-wCuvRF--1965','Rent / credit decisions')
d.label('rent-email-out','Rent email')
d.label('KLzBRVh5YApQ-wCuvRF--1960','6.0\nTenant Portal / Alerts\nPersonal Utility Tracker')
d.edge('staff-setup-data','staff-entity','KLzBRVh5YApQ-wCuvRF--1955','Existing descriptive\nrecord changes',[(1025,300),(485,300),(485,440),(378,440)],EDGE+'exitX=1;exitY=0.5;entryX=0.5;entryY=0;')
d.edge('staff-source-data','staff-entity','KLzBRVh5YApQ-wCuvRF--1956','Uploaded bill',[(955,165),(340,165),(340,282)],EDGE+'exitX=0.5;exitY=0;entryX=1;entryY=0.5;')
d.edge('staff-proposal-data','staff-entity','KLzBRVh5YApQ-wCuvRF--1957','Findings / proposal',[(930,365),(795,365)],EDGE+'exitX=0.3;exitY=1;entryX=0.85;entryY=0;')
d.edge('staff-review-data','KLzBRVh5YApQ-wCuvRF--1957','staff-entity','Review / decision\nresults',[(1060,585),(1060,350),(990,350)],EDGE+'exitX=1;exitY=0.5;entryX=0.8;entryY=1;')
d.node('admin-entity','Admin',650,20,140,60)
d.node('admin-process','7.0\nManage Accounts\nand Workspaces',900,-30,190,160,NODE+'ellipse;aspect=fixed;')
d.node('admin-store','D1. System Database\nAccounts / memberships',1250,0,220,110,NODE+'shape=cylinder3;size=15;')
d.edge('admin-in','admin-entity','admin-process','Account / role\nassignments',None,EDGE+'exitX=1;exitY=0.3;entryX=0;entryY=0.3;')
d.edge('admin-out','admin-process','admin-entity','Account details',None,EDGE+'exitX=0;exitY=0.75;entryX=1;entryY=0.8;')
d.edge('admin-write','admin-process','admin-store','Account records',None,EDGE+'exitX=1;exitY=0.3;entryX=0;entryY=0.3;')
d.edge('admin-read','admin-store','admin-process','Stored accounts',None,EDGE+'exitX=0;exitY=0.8;entryX=1;entryY=0.75;')
d.node('dfd-boundary-note','D1 is repeated for legibility; both symbols denote the same workspace-scoped database.\nAdmin maintains accounts only. Staff proposes; Manager authorizes and confirms rent.\nPortal / Web Push: rent and utilities. Outgoing email: rent only. Utility marks are unverified.',420,1520,1080,110,'text;html=0;whiteSpace=wrap;strokeColor=none;fillColor=none;fontColor=#000000;fontFamily=Arial;fontSize=17;align=left;verticalAlign=middle;')
d.save()

# Validate model references, parent links, nonempty vertices, and retained role elements.
for p in BASE.glob('*.drawio'):
 tree=E.parse(p);root=tree.find('.//mxGraphModel/root')
 ids=[e.get('id') for e in root if e.get('id')]
 assert len(ids)==len(set(ids)),p
 for e in root:
  c=e if e.tag=='mxCell' else e.find('mxCell')
  if c is None:continue
  for k in ['source','target','parent']:
   if c.get(k):assert c.get(k) in ids,(p,e.get('id'),k,c.get(k))
 print(p.name,'valid XML, unique IDs and valid endpoints')
