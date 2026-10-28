"""Audit native renderer geometry. Run render-diagrams.mjs first."""
from pathlib import Path
import json,hashlib
BASE=Path(__file__).resolve().parents[1]
def rect(b):return b['x'],b['y'],b['x']+b['w'],b['y']+b['h']
def hit(a,b):return a[0]<b[2] and a[2]>b[0] and a[1]<b[3] and a[3]>b[1]
def line_hit(box,u,v):
 if abs(u['x']-v['x'])<.01:return box[0]<u['x']<box[2] and min(u['y'],v['y'])<box[3] and max(u['y'],v['y'])>box[1]
 if abs(u['y']-v['y'])<.01:return box[1]<u['y']<box[3] and min(u['x'],v['x'])<box[2] and max(u['x'],v['x'])>box[0]
 return False
results=[]
for name,before in [('2.1_Architectural_Framework',7),('2.2_Process_Flowchart_SIMPLE',6),('2.3_FullBlown_DFD',5)]:
 data=json.loads((BASE/'.render-cache'/(name+'-geometry.json')).read_text())
 edges=[n for n in data if n['edge']];parents={n['parent'] for n in data if n.get('parent')}
 for edge in edges:
  for a,b in zip(edge['points'],edge['points'][1:]):
   if a and b:assert abs(a['x']-b['x'])<.01 or abs(a['y']-b['y'])<.01,(name,edge['id'],'diagonal connector segment')
 nodes=[n for n in data if n['vertex'] and n['id'] not in parents and n['box']['w'] and n['box']['h']]
 labels=[n for n in edges if n.get('text') and n['label'].strip()]
 issues=[];shared=0;crossings=0
 for i,a in enumerate(edges):
  for b in edges[i+1:]:
   overlap=False
   for x,y in zip(a['points'],a['points'][1:]):
    for u,v in zip(b['points'],b['points'][1:]):
     if not all([x,y,u,v]):continue
     if abs(x['x']-y['x'])<.01 and abs(u['x']-v['x'])<.01 and abs(x['x']-u['x'])<.01:
      overlap |= min(max(x['y'],y['y']),max(u['y'],v['y']))-max(min(x['y'],y['y']),min(u['y'],v['y']))>8
     if abs(x['y']-y['y'])<.01 and abs(u['y']-v['y'])<.01 and abs(x['y']-u['y'])<.01:
      overlap |= min(max(x['x'],y['x']),max(u['x'],v['x']))-max(min(x['x'],y['x']),min(u['x'],v['x']))>8
   if overlap:shared+=1
 for i,a in enumerate(labels):
  box=rect(a['text'])
  for b in labels[i+1:]:
   if hit(box,rect(b['text'])):issues.append([a['id'],b['id'],'label/label'])
  for b in nodes:
   if hit(box,rect(b['box'])):issues.append([a['id'],b['id'],'label/node'])
  for b in data:
   if b['vertex'] and b['id'] in parents and b.get('text') and hit(box,rect(b['text'])):issues.append([a['id'],b['id'],'label/section-heading'])
  for edge in edges:
   if any(line_hit(box,u,v) for u,v in zip(edge['points'],edge['points'][1:]) if u and v):issues.append([a['id'],edge['id'],'label/connector'])
 for edge in edges:
  for node in nodes:
   if node['id'] in [edge.get('source'),edge.get('target')]:continue
   x1,y1,x2,y2=rect(node['box']);inside=(x1+2,y1+2,x2-2,y2-2)
   if any(line_hit(inside,u,v) for u,v in zip(edge['points'],edge['points'][1:]) if u and v):issues.append([edge['id'],node['id'],'connector/unrelated-node'])
 # Plain crossings and shared runs are allowed by the user's visual preference.
 # Do not force tiny detours merely to separate otherwise clear straight routes.
 assert not issues,(name,issues)
 results.append({'file':name+'.drawio','sourceSha256':hashlib.sha256((BASE/(name+'.drawio')).read_bytes()).hexdigest(),'sharedSegmentPairsBefore':before,'sharedSegmentPairsAfter':shared,'labelCollisions':len(issues),'lineCrossings':'Plain crossings are permitted without jumps. Connectors must avoid unrelated shapes and labels.'})
 print(name,shared,'shared connector runs;',len(issues),'measured layout collisions')
(BASE/'exports/layout-verification.json').write_text(json.dumps({'method':'Native mxGraph geometry at scale 1; excludes container rectangles and checks their leaf nodes. Review print layout separately.','figures':results},indent=2)+'\n',encoding='utf-8')
