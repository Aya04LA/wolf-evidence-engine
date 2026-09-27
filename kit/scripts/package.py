#!/usr/bin/env python3
"""Package only the synthetic, shareable workshop material. No host secrets or dependencies."""
from pathlib import Path
import hashlib
import json
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[2]
FRONTEND = ROOT / 'frontend'
DOWNLOADS = FRONTEND / 'public/downloads'
DOWNLOADS.mkdir(parents=True, exist_ok=True)
(DOWNLOADS/'docs').mkdir(exist_ok=True)
docs = {'setup':'README.md','brief':'CHALLENGE.md','dataset':'DATASET.md','components':'COMPONENTS.md','validation':'VALIDATION.md','briefing':'BRIEFING.md'}
resources = {}
for slug, name in docs.items():
    p = ROOT/name
    if not p.exists():
        continue
    markdown = p.read_text()
    resources[slug] = {'file':name,'title':markdown.splitlines()[0].removeprefix('# '),'markdown':markdown}
    shutil.copy2(p, DOWNLOADS/'docs'/name)
content = FRONTEND/'src/app/resources/resource-content.ts'
content.parent.mkdir(parents=True,exist_ok=True)
content.write_text('// Generated from bundled workshop documents by kit/scripts/package.py.\nexport const resourceContent: Record<string, {file:string;title:string;markdown:string}> = '+json.dumps(resources,ensure_ascii=False,indent=2)+';\n')

excluded = {'node_modules','.next','.git','.vercel','__pycache__','.playwright-cli'}
def allowed(p):
    rel=p.relative_to(ROOT)
    return (not any(part in excluded for part in rel.parts)
            and rel.parts[0] != 'evidence'
            and not p.is_symlink()
            and not str(rel).startswith('frontend/public/downloads/')
            and not p.name.endswith(('.tsbuildinfo','.pyc','.log'))
            and not (p.name.startswith('.env') and p.name!='.env.example'))

archives = []
for name, files in [
    ('wolf-starter.zip',[p for p in ROOT.rglob('*') if p.is_file() and allowed(p)]),
    ('wolf-dataset.zip',[p for p in (ROOT/'kit/dataset').rglob('*') if p.is_file()]+[ROOT/'DATASET.md']),
]:
    dest=DOWNLOADS/name
    with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED) as z:
        for p in sorted(files):
            z.write(p,Path('wolf-materials-lab')/p.relative_to(ROOT))
    with zipfile.ZipFile(dest) as z:
        assert z.testzip() is None
        assert not any(any(x in Path(n).parts for x in excluded) for n in z.namelist())
    archives.append({'name':name,'bytes':dest.stat().st_size,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'files':len(files)})
(DOWNLOADS/'manifest.json').write_text(json.dumps({'synthetic':True,'archives':archives},indent=2)+'\n')
print(json.dumps(archives,indent=2))
