#!/usr/bin/env python3
"""Validate synthetic fixtures, reconciliations, joins, and ingestion-version semantics."""
import json, math, hashlib, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]; D=ROOT/'kit/dataset'
def read(name):return json.loads((D/(name+'.json')).read_text())
def check(ok,message):
 if not ok:raise AssertionError(message)
def close(a,b,message):check(abs(a-b)<.011,message+f': {a} != {b}')
def summed(rows,key):return round(sum(r[key] for r in rows),2)
lines=read('transactions');products=read('products');suppliers=read('suppliers');countries=read('countries');offers=read('offer-versions');invoices=read('synthetic-invoices');exports=read('ui-exports');manifest=read('manifest');fx=read('fx-rates')
pids={p['code'] for p in products};sids={s['id'] for s in suppliers};isos={c['iso'] for c in countries};oids={o['id'] for o in offers}
check(len({l['id'] for l in lines})==len(lines),'Unique transaction IDs')
for l in lines:
 check(l['productCode'] in pids and l['supplierId'] in sids and l['iso'] in isos,'Transaction foreign keys')
 close(l['qty']*l['unitPriceEUR'],l['valueEUR'],'Line quantity × unit price')
 close(round(l['valueEUR']*fx[l['currency']],2),l['valueLocal'],'Currency conversion')
close(summed(lines,'valueEUR'),manifest['aggregateEUR'],'Manifest spend')
for key,records in [('transactions',lines),('products',products),('suppliers',suppliers),('countries',countries),('offerVersions',offers),('invoices',invoices)]:check(manifest['counts'][key]==len(records),'Manifest count '+key)
platform=exports['platform.ts'];null=exports['nullmessung.ts'];specs=exports['produkte.ts']['produktSpecs'];analysis=exports['tiefenanalyse.ts'];pub=json.loads((ROOT/'frontend/public/data/nullmessung-lines.json').read_text())
close(summed(lines,'valueEUR'),platform['totals']['spendEUR'],'Platform headline')
close(summed(lines,'valueEUR'),summed(platform['clusters'],'spendEUR'),'Cluster totals')
close(summed(lines,'valueEUR'),null['nullmessungMeta']['totalEUR'],'Intake headline')
close(summed(lines,'valueEUR'),summed(null['monthlyVolumes'],'valueEUR'),'Monthly total')
close(summed(lines,'valueEUR'),summed(specs,'totalEUR'),'Product total')
for c in null['nullmessungCountries']:
 ls=[l for l in lines if l['iso']==c['iso']];close(c['totalEUR'],summed(ls,'valueEUR'),'Country total '+c['iso']);check(c['rows']==len(ls),'Country row count');close(c['totalEUR'],summed(c['brandsBought'],'valueEUR'),'Brand subtotal')
 close(c['totalEUR'],sum(b['totalEUR'] for b in pub[c['iso']].values()),'Public drilldown totals')
 for b in pub[c['iso']].values():close(b['totalEUR'],summed(b['lines'],'eur'),'Public brand line totals');check(b['count']==len(b['lines']),'Public brand row counts')
for p in specs:
 ls=[l for l in lines if l['productCode']==p['code']];close(p['totalEUR'],summed(ls,'valueEUR'),'Product value');check(p['totalQty']==sum(l['qty'] for l in ls),'Product quantity');close(p['totalEUR'],summed(p['demand'],'valueEUR'),'Demand subtotals');check(p['nCountries']==len(p['demand']),'Demand country count');check(p['nEquivalents']==sum(e['filled'] for e in p['equivalents']),'Equivalent count')
for o in offers:check(o['supplierId'] in sids and o['productCode'] in pids,'Offer foreign keys')
for i in invoices:
 check((D/i['sourceFile']).is_file(),'Invoice evidence file resolves');check(i['supplierId'] in sids and i['iso'] in isos,'Invoice foreign keys');check(i['agreementId'] is None or i['agreementId'] in oids,'Agreement foreign key');close(i['netEUR'],summed(i['lines'],'netEUR'),'Invoice subtotal');close(i['grossEUR'],i['netEUR']+i['vatEUR'],'Invoice gross')
 for l in i['lines']:close(l['qty']*l['unitPriceEUR'],l['netEUR'],'Invoice line multiplication')
 if i['agreementId']:
  o=next(o for o in offers if o['id']==i['agreementId']);check(o['validFrom']<=i['date'] and o['version']==3,'Effective agreed offer version');close(o['priceEUR'],i['agreedUnitPriceEUR'],'Invoice agreement price')
 if i['expectedVarianceEUR'] is not None:close(i['expectedVarianceEUR'],round(i['lines'][0]['qty']*(i['lines'][0]['unitPriceEUR']-i['agreedUnitPriceEUR']),2),'Invoice expected variance')
check(len({i['expectedOutcome'] for i in invoices})==6,'Six invoice cases')
check({e['invoiceId'] for e in read('workflow-events')}=={i['id'] for i in invoices},'Event invoice coverage')
close(null['bonusTotalEUR'],summed(null['bonusRows'],'bonusEUR'),'Bonus total')
for b in null['bonusRows']:close(b['bonusEUR'],round(b['spendEUR']*b['ratePct']/100,2),'Bonus multiplication')
for line in lines: check((D/line['source']).is_file(),'Transaction evidence file resolves')
for offer in offers: check((D/offer['source']).is_file(),'Offer evidence file resolves')
versions=read('ingestion-versions')
for u in read('update-lineage'):
 v=versions[u['market']];expected=v['v1']+v['v2'] if u['mode']=='add_supplier' else ([r for r in v['v1'] if r['supplierId']!=u['scopeSupplierId']]+v['v2'] if u['mode']=='replace_supplier_subset' else v['v2']);check(v['current']==expected,'Update semantics '+u['market']);check(len(expected)==u['currentRows'],'Version counts')
fru=next(u for u in read('update-lineage') if u['market']=='FR');frv=versions['FR'];
check(all(r['supplierId']==fru['scopeSupplierId'] for r in frv['v2']),'FR replacement scope');
unaffected=[r for r in frv['v1'] if r['supplierId']!=fru['scopeSupplierId']];
check(len(unaffected)>0 and all(r in frv['current'] for r in unaffected),'FR unaffected rows preserved');
check(not ({r['id'] for r in frv['v1'] if r['supplierId']==fru['scopeSupplierId']} & {r['id'] for r in frv['current']}),'FR superseded target rows removed');
sheets=read('input-sheets')
for file,book in sheets.items():
 width=read('input-schema')['files'][file]['columns']
 for sheet,rows in book.items():check(all(len(row)==width for row in rows),'Raw column width '+file+'/'+sheet)
for market in versions.values():
 for row in market['current']: close(row['qty']*row['unitPriceEUR'],row['valueEUR'],'Version row arithmetic')
fr=sheets['FR-v2']['Sheet1'][1:];
close(sum(row[10] for row in fr),summed(versions['FR']['v2'],'valueEUR'),'FR sheet matches current version subset');check(any(row[10]<0 for row in fr),'Cancellation fixture present')
for invoice in {row[5] for row in fr}:
 rows=[r for r in fr if r[5]==invoice];close(rows[0][3],sum(r[10] for r in rows),'French repeated invoice totals');check(len({r[3] for r in rows})==1,'French repeated total consistency')
# Generator is deterministic and contains no private runtime dependency.
if '--reproducible' in sys.argv:
 paths=list(D.rglob('*'))+list((ROOT/'frontend/src/data').glob('*'))+list((ROOT/'frontend/public/data').glob('*'))
 before={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in paths if p.is_file()}
 subprocess.run([sys.executable,str(Path(__file__).with_name('generate.py'))],check=True)
 after={p:hashlib.sha256(Path(p).read_bytes()).hexdigest() for p in before};check(before==after,'Deterministic regeneration')
print(f'PASS: {len(lines)} transactions reconciled across countries, products, months, clusters and public drilldown; {len(invoices)} invoices, effective offers, raw layouts and update semantics validated.')
