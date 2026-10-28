"""Check editable figure structure and essential approved workflow boundaries."""
from pathlib import Path
from collections import defaultdict, deque
import json
import xml.etree.ElementTree as E

base=Path(__file__).resolve().parents[1]
report=[]
def model(path):
 root=E.parse(path).find('.//mxGraphModel/root')
 assert root is not None,path
 nodes={}
 for obj in root:
  identifier=obj.get('id')
  if not identifier:continue
  assert identifier not in nodes,(path,identifier,'duplicate ID')
  cell=obj if obj.tag=='mxCell' else obj.find('mxCell')
  assert cell is not None,(path,identifier,'missing cell')
  label=obj.get('label',cell.get('value',''))
  assert '\ufffd' not in label,(path,identifier,'replacement character')
  nodes[identifier]={'cell':cell,'label':label}
 for id,n in nodes.items():
  c=n['cell']
  for key in ['source','target','parent']:
   if c.get(key):assert c.get(key) in nodes,(path,id,key,c.get(key))
  if c.get('edge')=='1':assert c.get('source') and c.get('target'),(path,id,'unconnected edge')
 return nodes

for filename in ['2.1_Architectural_Framework.drawio','2.2_Process_Flowchart_SIMPLE.drawio','2.3_FullBlown_DFD.drawio']:
 nodes=model(base/filename)
 edges={id:n for id,n in nodes.items() if n['cell'].get('edge')=='1'}
 if filename.startswith('2.1'):
  labels='\n'.join(n['label'] for n in nodes.values())
  for term in ['Admin','Staff','Manager','Tenant','Provider payment not verified','Email: rent only','Atomic revalidation']:
   assert term in labels,(filename,term)
  assert nodes['KLzBRVh5YApQ-wCuvRF--1412']['cell'].get('parent')=='KLzBRVh5YApQ-wCuvRF--1408'
  for id,target in [('access-property-setup','KLzBRVh5YApQ-wCuvRF--1425'),('access-utility-intake','gtn1k2S0OnRhmNFAWXwG-18')]:
   assert nodes[id]['cell'].get('source')=='role-access' and nodes[id]['cell'].get('target')==target
 elif filename.startswith('2.2'):
  graph=defaultdict(list)
  for n in edges.values():graph[n['cell'].get('source')].append(n['cell'].get('target'))
  seen=set();todo=deque(['start'])
  while todo:
   node=todo.popleft()
   if node in seen:continue
   seen.add(node);todo.extend(graph[node])
  vertices={id for id,n in nodes.items() if n['cell'].get('vertex')=='1'}
  assert vertices<=seen,('unreachable flow nodes',vertices-seen)
  for source,target in [('valid','final'),('exception','correction'),('exception','manager-correction'),('proposal-decision','proposal-atomic'),('proposal-valid','proposal-rejected'),('proposal-valid','proposal-applied'),('proposal-applied','final'),('review','paid'),('direct','paid')]:
   assert target in graph[source],(filename,source,target)
  assert 'Unfinalized utility only' in nodes['e8']['label']
  assert graph['personal']==['utility-end'],'Utility tracking must not issue a rent receipt'
  assert graph['final']==['notify'],'Finalized bills must continue through notification queuing'
  assert graph['notify']==['path'],'Notification queuing must not be a dangling process branch'
  assert 'Delivery failure does not block bills' in nodes['notify']['label']
  assert graph['utility-end']==[]
  assert 'No utility receipt' in nodes['personal']['label']
  assert 'No new cash payment' in nodes['creditpaid']['label']
 else:
  processes={'KLzBRVh5YApQ-wCuvRF--'+str(i) for i in range(1955,1961)}|{'admin-process'}
  entities={'KLzBRVh5YApQ-wCuvRF--'+str(i) for i in range(1952,1955)}|{'staff-entity','admin-entity','email-service'}
  stores={'KLzBRVh5YApQ-wCuvRF--1961','admin-store'}
  for id,n in edges.items():
   source,target=n['cell'].get('source'),n['cell'].get('target')
   assert source in processes or target in processes,(filename,id,'flow must touch a process')
   assert n['label'].strip(),(filename,id,'data flow needs a name')
  for process in processes:
   assert any(n['cell'].get('target')==process for n in edges.values()),(process,'no input')
   assert any(n['cell'].get('source')==process for n in edges.values()),(process,'no output')
  assert all(n['cell'].get('target')=='admin-process' for n in edges.values() if n['cell'].get('source')=='admin-entity')
  assert 'proposal records' in nodes['config-read']['label']
  assert 'history records' in nodes['portal-read']['label']
 report.append({'file':filename,'vertices':sum(n['cell'].get('vertex')=='1' for n in nodes.values()),'edges':len(edges),'structure':'passed','workflowAssertions':'passed'})
(base/'exports/verification.json').write_text(json.dumps({'scope':'Diagram assertions only; not application or formal evaluation tests','figures':report},indent=2)+'\n',encoding='utf-8')
for r in report:print(r['file'],'structure and workflow checks passed')
