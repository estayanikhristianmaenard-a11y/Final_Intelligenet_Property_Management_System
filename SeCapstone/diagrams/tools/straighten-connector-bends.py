"""Remove grid-snap stair steps while preserving endpoints and shape clearance."""
from pathlib import Path
import xml.etree.ElementTree as E
import json,math
BASE=Path(__file__).resolve().parents[1]
def axis(a,b):return 'v' if abs(a[0]-b[0])<.01 else 'h' if abs(a[1]-b[1])<.01 else 'd'
def length(a,b):return abs(a[0]-b[0])+abs(a[1]-b[1])
def clean(pts):
 out=[]
 for p in pts:
  if out and length(out[-1],p)<.01:continue
  if len(out)>1 and axis(out[-2],out[-1])==axis(out[-1],p) and axis(out[-1],p)!='d':out[-1]=p
  else:out.append(p)
 return out
def crosses(a,b,box):
 x1,y1,x2,y2=box
 if axis(a,b)=='v':return x1<a[0]<x2 and min(a[1],b[1])<y2 and max(a[1],b[1])>y1
 if axis(a,b)=='h':return y1<a[1]<y2 and min(a[0],b[0])<x2 and max(a[0],b[0])>x1
 return True
for name in ['2.1_Architectural_Framework','2.2_Process_Flowchart_SIMPLE','2.3_FullBlown_DFD']:
 data=json.loads((BASE/'.render-cache'/(name+'-geometry.json')).read_text());byid={n['id']:n for n in data};parents={n.get('parent') for n in data}
 nodes=[n for n in data if n['vertex'] and n['id'] not in parents and n['box']['w'] and n['box']['h']]
 tree=E.parse(BASE/(name+'.drawio'));root=tree.find('.//mxGraphModel/root');cells={o.get('id'):o if o.tag=='mxCell' else o.find('mxCell') for o in root}
 removed=0;ports=0
 for edge in [e for e in data if e['edge']]:
  c=cells[edge['id']];pts=clean([(p['x'],p['y']) for p in edge['points'] if p]);before=len(pts)
  def valid(path):
   for nodeid,point,neighbor in [(edge['source'],path[0],path[1]),(edge['target'],path[-1],path[-2])]:
    b=byid[nodeid]['box'];cx=b['x']+b['w']/2;cy=b['y']+b['h']/2
    if (point[0]-cx)*(neighbor[0]-point[0])+(point[1]-cy)*(neighbor[1]-point[1])<-.1:return False
   for i,(a,b) in enumerate(zip(path,path[1:])):
    if axis(a,b)=='d':return False
    for node in nodes:
     if node['id']==edge['source'] and i==0:continue
     if node['id']==edge['target'] and i==len(path)-2:continue
     r=node['box'];box=(r['x']+2,r['y']+2,r['x']+r['w']-2,r['y']+r['h']-2)
     if crosses(a,b,box):return False
   return True
  # Remove two unnecessary turns in a four-leg staircase whenever clearance allows.
  changed=True
  while changed:
   changed=False
   for i in range(len(pts)-4):
    window=pts[i:i+5];axes=[axis(a,b) for a,b in zip(window,window[1:])]
    if axes not in [['h','v','h','v'],['v','h','v','h']]:continue
    if min(length(window[1],window[2]),length(window[2],window[3]))>35:continue
    q=(window[-1][0],window[0][1]) if axes[0]=='h' else (window[0][0],window[-1][1])
    candidate=clean(pts[:i]+[window[0],q,window[-1]]+pts[i+5:])
    if len(candidate)<len(pts) and valid(candidate):pts=candidate;changed=True;break
  # Align near-terminal columns/rows directly onto the shape boundary.
  for reverse,nodeid,prefix in [(False,edge['source'],'exit'),(True,edge['target'],'entry')]:
   p=list(reversed(pts)) if reverse else list(pts)
   if len(p)<4:continue
   a1,a2,a3=axis(p[0],p[1]),axis(p[1],p[2]),axis(p[2],p[3])
   if a1!=a3 or a1 not in ['h','v'] or a2==a1 or length(p[1],p[2])>35:continue
   shape=cells[nodeid].get('style','');r=byid[nodeid]['box'];cx=r['x']+r['w']/2;cy=r['y']+r['h']/2
   if 'cylinder' in shape:continue
   if a1=='v':
    x=p[2][0]
    if not r['x']+7<x<r['x']+r['w']-7:continue
    sign=1 if p[1][1]>p[0][1] else -1
    ratio=(x-cx)/(r['w']/2)
    factor=math.sqrt(max(0,1-ratio*ratio)) if 'ellipse' in shape else max(0,1-abs(ratio)) if 'rhombus' in shape else 1
    anchor=(x,cy+sign*r['h']/2*factor)
   else:
    y=p[2][1]
    if not r['y']+7<y<r['y']+r['h']-7:continue
    sign=1 if p[1][0]>p[0][0] else -1
    ratio=(y-cy)/(r['h']/2)
    factor=math.sqrt(max(0,1-ratio*ratio)) if 'ellipse' in shape else max(0,1-abs(ratio)) if 'rhombus' in shape else 1
    anchor=(cx+sign*r['w']/2*factor,y)
   candidate=clean([anchor]+p[3:]);candidate=list(reversed(candidate)) if reverse else candidate
   if len(candidate)<len(pts) and valid(candidate):
    pts=candidate;ports+=1
    c.set('style',c.get('style')+f'{prefix}X={(anchor[0]-r["x"])/r["w"]};{prefix}Y={(anchor[1]-r["y"])/r["h"]};{prefix}Perimeter=0;')
  removed+=max(0,before-len(pts))
  g=c.find('mxGeometry');ar=g.find("Array[@as='points']")
  if ar is not None:g.remove(ar)
  if len(pts)>2:
   ar=E.SubElement(g,'Array',{'as':'points'})
   for x,y in pts[1:-1]:E.SubElement(ar,'mxPoint',{'x':str(x),'y':str(y)})
 E.indent(tree,space='  ');tree.write(BASE/(name+'.drawio'),encoding='utf-8',xml_declaration=True)
 print(name,'removed',removed,'unnecessary bends; aligned',ports,'ports',flush=True)
