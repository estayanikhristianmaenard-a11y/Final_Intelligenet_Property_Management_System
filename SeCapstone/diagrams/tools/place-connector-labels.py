"""Position labels from measured native text bounds, preserving routes and meanings."""
from pathlib import Path
import json,math
import xml.etree.ElementTree as E

BASE=Path(__file__).resolve().parents[1]
def rect(b):return (b['x'],b['y'],b['x']+b['w'],b['y']+b['h'])
def hit(a,b,p=0):return a[0]<b[2]+p and a[2]>b[0]-p and a[1]<b[3]+p and a[3]>b[1]-p
def sb(a,b):return (min(a['x'],b['x'])-1,min(a['y'],b['y'])-1,max(a['x'],b['x'])+1,max(a['y'],b['y'])+1)
for name in ['2.1_Architectural_Framework','2.2_Process_Flowchart_SIMPLE','2.3_FullBlown_DFD']:
 data=json.loads((BASE/'.render-cache'/(name+'-geometry.json')).read_text())
 parents={n['parent'] for n in data if n.get('parent')}
 obstacles=[rect(n['box']) for n in data if n['vertex'] and n['id'] not in parents and n['box']['w']>0 and n['box']['h']>0]
 # Container headings count as obstacles even though routes may cross container borders.
 obstacles += [rect(n['text']) for n in data if n['vertex'] and n['id'] in parents and n.get('text')]
 edges=[n for n in data if n['edge']]
 lineboxes=[sb(a,b) for n in edges for a,b in zip(n['points'],n['points'][1:]) if a and b]
 tree=E.parse(BASE/(name+'.drawio'));root=tree.find('.//mxGraphModel/root');cells={o.get('id'):o if o.tag=='mxCell' else o.find('mxCell') for o in root}
 placed=[];failures=[]
 for n in sorted([e for e in edges if e['label'].strip() and e.get('text')],key=lambda e:-e['text']['w']*e['text']['h']):
  measured=n['text'];w=measured['w']+6;h=measured['h']+6;candidates=[]
  for a,b in zip(n['points'],n['points'][1:]):
   if not a or not b:continue
   horizontal=abs(a['y']-b['y'])<.1;length=abs(a['x']-b['x'])+abs(a['y']-b['y'])
   if length<12:continue
   for f in [.5,.25,.75,.1,.9]:
    x=a['x']+(b['x']-a['x'])*f;y=a['y']+(b['y']-a['y'])*f
    for sign in [-1,1]:
     for gap in [8,18,30,45,65,90,120,160]:
      cx=x if horizontal else x+sign*(w/2+gap);cy=y+sign*(h/2+gap) if horizontal else y
      box=(cx-w/2,cy-h/2,cx+w/2,cy+h/2)
      collisions=sum(hit(box,o,5) for o in obstacles)+sum(hit(box,o,8) for o in placed)
      lines=sum(hit(box,o,2) for o in lineboxes)
      score=collisions*1000000+lines*100000+gap*3+abs(f-.5)*10+(0 if horizontal else 20)
      candidates.append((score,cx,cy,box))
  if not candidates:failures.append(n['id']);continue
  score,cx,cy,box=min(candidates);placed.append(box)
  if score>=100000:failures.append(n['id'])
  g=cells[n['id']].find('mxGeometry');offset=g.find("mxPoint[@as='offset']")
  if offset is None:offset=E.SubElement(g,'mxPoint',{'as':'offset'})
  oldx=float(offset.get('x',0));oldy=float(offset.get('y',0))
  offset.set('x',str(round(oldx+cx-(measured['x']+measured['w']/2),2)))
  offset.set('y',str(round(oldy+cy-(measured['y']+measured['h']/2),2)))
 E.indent(tree,space='  ');tree.write(BASE/(name+'.drawio'),encoding='utf-8',xml_declaration=True)
 print(name,'labels needing further inspection:',failures,flush=True)
