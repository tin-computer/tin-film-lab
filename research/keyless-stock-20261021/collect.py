"""Validate saved Mixkit page metadata. Bulk collection is intentionally disabled."""
import json,re
def objects(value):
 if isinstance(value,dict):
  yield value
  for v in value.values():yield from objects(v)
 elif isinstance(value,list):
  for v in value:yield from objects(v)
def mixkit_video(document):
 candidates=[]
 for block in re.findall(r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',document,re.S):
  for item in objects(json.loads(block)):
   if item.get('@type')=='VideoObject':candidates.append(item)
 if len(candidates)!=1:raise ValueError('Expected one primary video object')
 item=candidates[0]
 if item.get('license','').rstrip('/')!='https://mixkit.co/license/#videoFree':raise ValueError('Not the commercial free video licence')
 url=item.get('contentUrl','')
 if not re.fullmatch(r'https://assets\.mixkit\.co/videos/\d+/[^/?]+\.mp4',url):raise ValueError('Missing direct licensed media URL')
 return item

if __name__=='__main__':
 raise SystemExit('Bulk collection disabled after source terms review. Use existing licensed files or manually selected provider downloads. See README.md.')
