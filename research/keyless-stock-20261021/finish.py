"""Build notes from inspected, already-downloaded files. No network requests."""
import collections,hashlib,json
from pathlib import Path
R=Path(__file__).resolve().parent;LAB=R.parents[1]
notes={
'MK1781':('Hands type on a silver laptop; a soft dark foreground edge partly frames the keys.','A short human typing setup before showing the real product action.','The screen is not readable. Do not claim this shows LocIn or a particular application.'),
'MK4837':('A person with blue headphones looks down at a phone in a bright city square, then smiles.','A phone-away-from-desk setup, followed by the real message interface.','No message is visible; a smile does not prove a product result or endorsement.'),
'MK2293':('A seated reader turns a book page among moving boxes; another person joins and points at the book.','A quiet reading setup or shared-reading context, using one clear moment.','The book and people do not demonstrate speed, comprehension or a challenge. The second person enters later.'),
'MK43925':('Hands cut fruit and add pieces to a patterned yogurt bowl on a kitchen counter.','A concrete food or recipe story, with cuts anchored to visible hand actions.','Do not use food preparation as generic decoration in an unrelated software story.'),
'MK608':('A backlit runner moves through an outdoor paved area; the camera stays behind the runner.','An outdoor training story or a brief effort comparison when the product story supports it.','The person is mostly a silhouette. This is running, not proof of reading performance.'),
'MK17469':('A cropped white-coated figure writes on a clipboard; a stethoscope and bright room are visible.','A healthcare or paperwork story with a real product action shown separately.','Do not imply medical advice, a real patient record or endorsement. The visible text is not readable.'),
'MK32085':('Wet hands shape a clay vessel on a spinning pottery wheel, seen close from above.','An actual craft or material-making story; align movement to hand contact.','Do not turn it into a default metaphor for every product. Fast crops can hide the shaping action.'),
'MK31497':('The view moves through a dark field of glowing cubes and orange light.','Visual experiment only; no product-specific action.','Rejected: generic technology tunnel hides the product and repeats the style Hamit wants to avoid.'),
'RF01':('A group stands around a large paper plan in a workshop-like office.','Planning-story composition reference.','Only 500x280: unsuitable for a full-screen 1080p launch film.'),
'RF02':('Close hands point and draw on a large plan with rulers.','Paper-action composition reference.','Only 500x280; the drawing is not a software UI.'),
'RF03':('The shot changes from a paper plan to people looking down at it.','Plan-to-team framing reference.','Only 500x280; a long take with a framing change is not an extra story.'),
'RF04':('Hands draw and gesture above a paper plan; the focus shifts.','Hand-action composition reference.','Only 500x280 with soft frames.'),
'RF05':('A person in a jacket leans over a table while others follow the plan.','Team-reaction composition reference.','Only 500x280; same meeting as the other eight files.'),
'RF06':('Wide group view; a person lifts a large sheet from the work table.','Visible paper-lift motion reference.','Only 500x280; very short take.'),
'RF07':('Close side view of people following a discussion.','Conversation framing reference.','Only 500x280; no product is visible.'),
'RF08':('A woman turns and speaks in a shallow-focus close-up.','Reaction framing reference.','Only 500x280; no speech review or endorsement claim.'),
'RF09':('Close-up of a hand holding a pen at a transparent board.','Writing-contact framing reference.','Only 500x280; do not label the drawing as product output.')}
rows=json.loads((R/'download-results.json').read_text());assert len(rows)==17
assert len({x['source_sha256'] for x in rows})==len(rows)
for i,x in enumerate(rows):
 assert x['full_decode'] and x['status']=='downloaded'
 assert hashlib.sha256((LAB/x['source_file']).read_bytes()).hexdigest()==x['source_sha256']
 assert len(x['frames'])==4 and all((R/f).exists() for f in x['frames'])
 description,use,avoid=notes[x['id']];raw=x['source']['provider']=='RawFilm'
 selection='not_recommended' if raw or x['id']=='MK31497' else 'candidate'
 x.update(description=description,use=use,avoid=avoid,selection=selection,source_start=0,
  contact_sheet=f'review/sheet-{i//4+1}.jpg',suggested_ranges=[{'start':0,'end':min(3,x['duration']),'role':'Opening audition only; check motion before editing'}],
  method='Host agent inspected four chronological frames at the saved sampled seconds. Not continuous viewing or sound listening.',
  rights_status=('Local review only. Source permits commercial edited use, not raw redistribution. Download link says HD but actual file is 500x280.' if raw else 'Local film candidate only. Per-clip Free License recorded. Mixkit terms restrict mass downloading and stock/inventory redistribution. No hosted library permission.'),
  automation_download_allowed=False,shared_raw_pack_allowed=False)
 if not raw:x['source']['terms_url']='https://mixkit.co/terms/'
 (R/x['contact_sheet']).stat()
(R/'catalogue.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
checks={'downloaded':len(rows),'full_decode':all(x['full_decode'] for x in rows),'frames_inspected':sum(len(x['frames']) for x in rows),'selected':sum(x['selection']=='candidate' for x in rows),'rejected':sum(x['selection']=='not_recommended' for x in rows),'providers':dict(collections.Counter(x['source']['provider'] for x in rows)),'original_hashes_unchanged':True,'shared_raw_pack_allowed':False,'new_human_approvals':0,'source_sound_review':False,'bulk_download_disabled':True}
assert checks['selected']==7 and checks['rejected']==10
(R/'checks.json').write_text(json.dumps(checks,indent=2)+'\n');print(json.dumps(checks))
