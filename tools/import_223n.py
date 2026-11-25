#!/usr/bin/env python3
"""Extract visible DOCX paragraphs/tables and exact clause numbers; no paraphrasing."""
import argparse,hashlib,json,re
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]/'223n'
SOURCE=ROOT/'sources/Prikaz-Mintruda-Rossii-ot-20.04.2022-N-223n.docx'
IMAGES={}
NS='{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
def text(p):
 out=[]
 for n in p.iter():
  if n.tag==NS+'t':out.append(n.text or '')
  elif n.tag==NS+'tab':out.append('\t')
  elif n.tag in [NS+'br',NS+'cr']:out.append('\n')
 return ''.join(out)
def block(node):
 if node.tag==NS+'p':
  images=[]
  for child in node.iter():
   if child.tag.endswith('}blip') or child.tag.endswith('}imagedata'):
    for key,value in child.attrib.items():
     if value in IMAGES:images.append(IMAGES[value])
  return {'type':'p','text':text(node),**({'images':images} if images else {})}
 if node.tag!=NS+'tbl':return None
 rows=[]
 for row in node.findall(NS+'tr'):
  cells=[]
  for cell in row.findall(NS+'tc'):
   span=cell.find('./'+NS+'tcPr/'+NS+'gridSpan')
   cells.append({'span':int(span.get(NS+'val','1')) if span is not None else 1,'blocks':[b for n in cell if (b:=block(n)) is not None]})
  rows.append(cells)
 return {'type':'table','rows':rows}
def flatten(b):
 if b['type']=='p':return b['text']
 return '\n'.join('\t'.join('\n'.join(flatten(x) for x in c['blocks']) for c in row) for row in b['rows'])
def extract():
 with ZipFile(SOURCE) as z:
  body=ET.fromstring(z.read('word/document.xml')).find(NS+'body')
  relationships=ET.fromstring(z.read('word/_rels/document.xml.rels'))
  for rel in relationships:
   target=rel.get('Target','')
   if target.startswith('media/') and rel.get('Type','').endswith('/image'):
    filename=Path(target).name;assert re.fullmatch(r'[A-Za-z0-9_.-]+',filename)
    (ROOT/'assets').mkdir(exist_ok=True);(ROOT/'assets'/filename).write_bytes(z.read('word/'+target));IMAGES[rel.get('Id')]='assets/'+filename
 blocks=[b for n in body if (b:=block(n)) is not None]
 entries=[];scope='order';chapter='Приказ';current=None
 for index,b in enumerate(blocks):
  t=b.get('text','').strip()
  appendix=re.fullmatch(r'Приложение\s+N\s*([123])',t)
  if appendix:scope={'1':'regulation','2':'forms','3':'classifiers'}[appendix[1]];current=None;chapter='';continue
  if re.match(r'^[IVX]+\.\s',t):
   chapter=t;current=None
   if scope=='classifiers':
    current={'id':'classifiers-'+str(len(entries)),'scope':scope,'number':str({'I':1,'II':2,'III':3}[t.split('.')[0]]),'title':t,'chapter':chapter,'blocks':[]};entries.append(current)
  match=re.match(r'^(\d+(?:\.\d+)*)\.\s',t) if scope in ['order','regulation'] else re.fullmatch(r'Форма N (\d+)',t) if scope=='forms' else None
  if match:
   current={'id':scope+'-'+match[1],'scope':scope,'number':match[1],'title':('Форма № ' if scope=='forms' else 'Пункт ')+match[1],'chapter':chapter,'blocks':[]};entries.append(current)
  if scope=='order' and t=='Министр':current=None
  if current:current['blocks'].append(index)
 used={i for e in entries for i in e['blocks']};context=[]
 for i,b in enumerate(blocks):
  if i not in used:context.append(i)
  elif context:
   if any(flatten(blocks[j]).strip() for j in context):entries.append({'id':'context-'+str(context[0]),'scope':'context','number':'','title':'Текст документа','chapter':'','blocks':context})
   context=[]
 if context and any(flatten(blocks[j]).strip() for j in context):entries.append({'id':'context-'+str(context[0]),'scope':'context','number':'','title':'Текст документа','chapter':'','blocks':context})
 for e in entries:e['searchText']='\n'.join(flatten(blocks[i]) for i in e['blocks'])
 points=[e['number'] for e in entries if e['scope']=='regulation'];parents=[p for p in points if '.' not in p]
 assert parents==[str(i) for i in range(1,39)],parents
 assert len({e['id'] for e in entries})==len(entries)
 assert len([e for e in entries if e['scope']=='forms'])==11
 assert len([e for e in entries if e['scope']=='order'])==3
 assert len([e for e in entries if e['scope']=='classifiers'])==3
 # All visible source text stays in blocks, including tables, footnotes, and headings.
 assert re.sub(r'\s+','', ''.join(n.text or '' for n in body.iter(NS+'t')))==re.sub(r'\s+','', ''.join(flatten(b) for b in blocks)), 'Visible source text lost'
 return {'schemaVersion':1,'title':'Приказ Минтруда России от 20.04.2022 № 223н','source':SOURCE.name,'sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'blocks':blocks,'entries':entries}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');args=p.parse_args();data=extract();serialized=json.dumps(data,ensure_ascii=False,indent=2)+'\n'
 if args.check:assert (ROOT/'document.json').read_text()==serialized,'Stale document index'
 else:(ROOT/'document.json').write_text(serialized)
 print(json.dumps({'entries':len(data['entries']),'regulationClauses':len([e for e in data['entries'] if e['scope']=='regulation']),'paragraphAndTableBlocks':len(data['blocks']),'sha256':data['sha256']},ensure_ascii=False))
