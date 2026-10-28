"""Reroute existing edges around rendered nodes; never change edge endpoints."""
from pathlib import Path
from collections import defaultdict
import xml.etree.ElementTree as E
import json,heapq,math,shutil,textwrap

BASE=Path(__file__).resolve().parents[1]
CACHE=BASE/'.render-cache'
STEP=10
def intersect(a,b,pad=0):
 return a[0]<b[2]+pad and a[2]>b[0]-pad and a[1]<b[3]+pad and a[3]>b[1]-pad
def rectangle(b):return (b['x'],b['y'],b['x']+b['w'],b['y']+b['h'])
def segment_box(a,b,pad=1):return (min(a[0],b[0])-pad,min(a[1],b[1])-pad,max(a[0],b[0])+pad,max(a[1],b[1])+pad)
def simplify(path):
 result=[]
 for point in path:
  if result and point==result[-1]:continue
  if len(result)>1 and ((result[-2][0]==result[-1][0]==point[0]) or (result[-2][1]==result[-1][1]==point[1])):result[-1]=point
  else:result.append(point)
 return result
def middle(points):
 lengths=[abs(b[0]-a[0])+abs(b[1]-a[1]) for a,b in zip(points,points[1:])]
 remain=sum(lengths)/2
 for (a,b),length in zip(zip(points,points[1:]),lengths):
  if remain<=length:
   frac=remain/max(length,1);return (a[0]+(b[0]-a[0])*frac,a[1]+(b[1]-a[1])*frac)
  remain-=length
 return points[-1]

for name in ['2.1_Architectural_Framework','2.2_Process_Flowchart_SIMPLE','2.3_FullBlown_DFD']:
 data=json.loads((CACHE/(name+'-geometry.json')).read_text())
 byid={e['id']:e for e in data}
 tree=E.parse(BASE/(name+'.drawio'));root=tree.find('.//mxGraphModel/root')
 original=CACHE/(name+'-before-routing.drawio')
 if not original.exists():shutil.copy2(BASE/(name+'.drawio'),original)
 items={e.get('id'):e for e in root}
 cells={id:e if e.tag=='mxCell' else e.find('mxCell') for id,e in items.items()}
 parents={e.get('parent') for e in cells.values() if e is not None}
 leaves=[e for e in data if e['vertex'] and e['id'] not in parents and e['box']['w']>0 and e['box']['h']>0]
 obstacles=[rectangle(e['box']) for e in leaves]
 edges=[e for e in data if e['edge'] and e.get('source') in byid and e.get('target') in byid]
 # Choose independent ports on each node side, retaining the original entry/exit side.
 ports=defaultdict(list)
 for e in edges:
  for which,nodeid,point in [('source',e['source'],e['points'][0]),('target',e['target'],e['points'][-1])]:
   b=byid[nodeid]['box'];x,y=point['x'],point['y']
   dist={'left':abs(x-b['x']),'right':abs(x-b['x']-b['w']),'top':abs(y-b['y']),'bottom':abs(y-b['y']-b['h'])}
   side=min(dist,key=dist.get);other=byid[e['target'] if which=='source' else e['source']]['box']
   ports[nodeid,side].append((e,which,other['y'] if side in ['left','right'] else other['x']))
 for (nodeid,side),links in ports.items():
  b=byid[nodeid]['box'];links.sort(key=lambda l:(l[2],l[0]['id']))
  for i,(e,which,_) in enumerate(links):
   frac=(i+1)/(len(links)+1);frac=.12+.76*frac
   if len(links)==1:frac=.5
   x=b['x']+(0 if side=='left' else b['w'] if side=='right' else b['w']*frac)
   y=b['y']+(0 if side=='top' else b['h'] if side=='bottom' else b['h']*frac)
   dx,dy={'left':(-1,0),'right':(1,0),'top':(0,-1),'bottom':(0,1)}[side]
   outside=(round((x+dx*30)/STEP),round((y+dy*30)/STEP))
   e[which+'Port']={'side':side,'frac':frac,'anchor':(x,y),'outside':outside,'dir':(dx,dy)}
 xmin=math.floor((min(r[0] for r in obstacles)-220)/STEP);xmax=math.ceil((max(r[2] for r in obstacles)+220)/STEP)
 ymin=math.floor((min(r[1] for r in obstacles)-200)/STEP);ymax=math.ceil((max(r[3] for r in obstacles)+220)/STEP)
 blocked=set()
 for x1,y1,x2,y2 in obstacles:
  for x in range(math.ceil((x1-10)/STEP),math.floor((x2+10)/STEP)+1):
   for y in range(math.ceil((y1-10)/STEP),math.floor((y2+10)/STEP)+1):blocked.add((x,y))
 used=defaultdict(int);directions=defaultdict(set);routes={}
 def route(start,end):
  queue=[(0,0,start[0],start[1],-1)];best={(start[0],start[1],-1):0};previous={};finish=None
  moves=[(1,0),(-1,0),(0,1),(0,-1)]
  while queue:
   _,g,x,y,d=heapq.heappop(queue);state=(x,y,d)
   if best.get(state)!=g:continue
   if (x,y)==end:finish=state;break
   for nd,(dx,dy) in enumerate(moves):
    nx,ny=x+dx,y+dy;point=(nx,ny)
    if not(xmin<=nx<=xmax and ymin<=ny<=ymax) or (point in blocked and point not in [start,end]):continue
    key=tuple(sorted([(x,y),point]));axis=nd//2
    cost=10+(32 if d!=-1 and d!=nd else 0)+used[key]*4000
    if directions[point] and axis not in directions[point]:cost+=120
    ng=g+cost;ns=(nx,ny,nd)
    if ng<best.get(ns,10**15):
     best[ns]=ng;previous[ns]=state;h=(abs(nx-end[0])+abs(ny-end[1]))*10
     heapq.heappush(queue,(ng+h,ng,nx,ny,nd))
  if finish is None:raise RuntimeError((name,'No obstacle-free route',start,end))
  path=[];state=finish
  while True:
   path.append((state[0],state[1]))
   if state not in previous:break
   state=previous[state]
  path.reverse()
  for a,b in zip(path,path[1:]):
   used[tuple(sorted([a,b]))]+=1;axis=0 if a[1]==b[1] else 1;directions[a].add(axis);directions[b].add(axis)
  return [(x*STEP,y*STEP) for x,y in path]
 # Short local connections first; long return paths use outer corridors when needed.
 edges.sort(key=lambda e:abs(e['sourcePort']['outside'][0]-e['targetPort']['outside'][0])+abs(e['sourcePort']['outside'][1]-e['targetPort']['outside'][1]))
 for e in edges:
  a,b=e['sourcePort'],e['targetPort']
  direct=abs(a['anchor'][0]-b['anchor'][0])<.01 or abs(a['anchor'][1]-b['anchor'][1])<.01
  otherboxes=[rectangle(n['box']) for n in leaves if n['id'] not in [e['source'],e['target']]]
  direct=direct and not any(intersect(segment_box(a['anchor'],b['anchor'],1),box,4) for box in otherboxes)
  path=[a['anchor'],b['anchor']] if direct else route(a['outside'],b['outside'])
  ax,ay=a['anchor'];bx,by=b['anchor'];first,last=path[0],path[-1]
  leadA=(ax,first[1]) if a['side'] in ['top','bottom'] else (first[0],ay)
  leadB=(bx,last[1]) if b['side'] in ['top','bottom'] else (last[0],by)
  points=[a['anchor'],b['anchor']] if direct else simplify([a['anchor'],leadA,*path,leadB,b['anchor']]);routes[e['id']]=points
  c=cells[e['id']];c.set('parent','1')
  style={}
  for token in c.get('style','').split(';'):
   if '=' in token:
    k,v=token.split('=',1);style[k]=v
  for prefix,p in [('exit',a),('entry',b)]:
   side,frac=p['side'],p['frac'];style[prefix+'X']=str(0 if side=='left' else 1 if side=='right' else frac);style[prefix+'Y']=str(0 if side=='top' else 1 if side=='bottom' else frac)
   style[prefix+'Dx']='0';style[prefix+'Dy']='0'
  style.update(edgeStyle='none',curved='0',rounded='0',jumpStyle='none',labelBackgroundColor='#ffffff',fontFamily='Arial',fontSize='17',whiteSpace='wrap',align='center',verticalAlign='middle',strokeWidth='1.5')
  e['style']=style
  g=c.find('mxGeometry')
  for child in list(g):g.remove(child)
  g.attrib.clear();g.attrib.update(relative='1',**{'as':'geometry'})
  ar=E.SubElement(g,'Array',{'as':'points'})
  for x,y in points[1:-1]:E.SubElement(ar,'mxPoint',{'x':str(round(x,2)),'y':str(round(y,2))})
 # Place labels in free space beside a segment, avoiding nodes, other labels and connectors.
 labels=[];failures=[]
 for e in sorted(edges,key=lambda e:-len(e['label'])):
  if not e['label'].strip():
   cells[e['id']].set('style',';'.join(k+'='+v for k,v in e['style'].items())+';');continue
  wrapped='\n'.join(textwrap.fill(line.strip(),width=28,break_long_words=False) for line in e['label'].splitlines())
  lines=wrapped.splitlines();w=max(len(line) for line in lines)*8.6+14;h=len(lines)*21+8
  candidates=[];pts=routes[e['id']]
  for a,b in zip(pts,pts[1:]):
   horizontal=abs(a[1]-b[1])<.1;length=abs(b[0]-a[0])+abs(b[1]-a[1])
   if length<35:continue
   for frac in [.5,.3,.7]:
    x=a[0]+(b[0]-a[0])*frac;y=a[1]+(b[1]-a[1])*frac
    for sign in [-1,1]:
     for gap in [10,25,45,70]:
      cx=x if horizontal else x+sign*(w/2+gap);cy=y+sign*(h/2+gap) if horizontal else y
      box=(cx-w/2,cy-h/2,cx+w/2,cy+h/2)
      hit=sum(intersect(box,r,4) for r in obstacles)+sum(intersect(box,r,8) for r in labels)
      linehits=0
      for other,routepoints in routes.items():
       for u,v in zip(routepoints,routepoints[1:]):
        if intersect(box,segment_box(u,v,1)):linehits+=1
      score=hit*100000+linehits*5000+gap*2+abs(frac-.5)*30+(0 if horizontal else 25)
      candidates.append((score,cx,cy,box))
  if not candidates:failures.append(e['id']);continue
  score,cx,cy,box=min(candidates);labels.append(box)
  if score>=5000:failures.append(e['id'])
  mid=middle(pts);g=cells[e['id']].find('mxGeometry');E.SubElement(g,'mxPoint',{'as':'offset','x':str(round(cx-mid[0],2)),'y':str(round(cy-mid[1],2))})
  obj=items[e['id']];obj.set('value' if obj.tag=='mxCell' else 'label',wrapped)
  e['style']['labelWidth']=str(math.ceil(w));cells[e['id']].set('style',';'.join(k+'='+v for k,v in e['style'].items())+';')
 E.indent(tree,space='  ');tree.write(BASE/(name+'.drawio'),encoding='utf-8',xml_declaration=True)
 print(name,'routed',len(edges),'edges; labels needing visual inspection:',failures,flush=True)
