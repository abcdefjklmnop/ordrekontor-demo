import {catalog as baseCatalog, parseOrder, validateOrder, makeExport} from './core.js';
export const products={...baseCatalog,'KOBL-400':{name:'Koblingssett',unit:'stk',price:29500},'PAKN-500':{name:'Pakningssett',unit:'stk',price:18000},'MANO-600':{name:'Manometer',unit:'stk',price:69000},'FEST-700':{name:'Festebrakett',unit:'stk',price:22000},'ADAP-800':{name:'Adapter',unit:'stk',price:37500}};
export const initialCustomers=[
 {id:'DEMO-100',name:'Fjord Mekanikk',contact:'Innkjøpsavdelingen',email:'innkjop@fjord.example',city:'Bergen',color:'#5557d9'},
 {id:'DEMO-200',name:'Vest Verksted',contact:'Ordrekontoret',email:'ordre@vest.example',city:'Ålesund',color:'#007e87'},
 {id:'DEMO-300',name:'Nordhavn Teknikk',contact:'Reservedelsavdelingen',email:'deler@nordhavn.example',city:'Stavanger',color:'#b06627'},
 {id:'DEMO-400',name:'Kyst Industri',contact:'Innkjøpsavdelingen',email:'innkjop@kyst.example',city:'Trondheim',color:'#a34287'},
 {id:'DEMO-500',name:'Havlinje Service',contact:'Servicekontoret',email:'service@havlinje.example',city:'Tromsø',color:'#367dab'},
 {id:'DEMO-600',name:'Sund Elektro',contact:'Prosjektkontoret',email:'prosjekt@sund.example',city:'Oslo',color:'#64813d'}
];
export function registry(state){return {catalog:products,customers:Object.fromEntries(state.customers.map(c=>[c.id,c.name]))};}
export function check(order,state){return validateOrder(order,registry(state));}
export function snapshot(o){return JSON.stringify([o.customer,o.reference,o.delivery,o.lines.map(l=>[l.sku,l.quantity,l.unit,l.price]),o.raw]);}
export function status(o,state){if(!check(o,state).valid)return 'review';if(o.approval&&o.approval.snapshot===snapshot(o))return o.exported?'exported':'approved';return 'new';}
export function approve(o,state,name){if(!name.trim()||name.length>80||!check(o,state).valid)throw Error('Avklar alle avvik og oppgi kontrollør før godkjenning.');o.approval={name:name.trim(),at:new Date().toISOString(),snapshot:snapshot(o)};o.exported=false;addEvent(o,'Godkjent i demo av '+name.trim()+'.');}
export function addEvent(o,message){o.audit.push({at:new Date().toISOString(),message});}
export function changed(o,message){o.approval=null;o.exported=false;addEvent(o,message+' Tidligere godkjenning er opphevet.');}
export function exportOrder(o,state){if(!['approved','exported'].includes(status(o,state)))throw Error('Bare gyldige, godkjente ordre kan eksporteres.');return {...makeExport(o,o.approval.name,o.audit,true,false,registry(state)),id:o.id,review:{self_reported_name:o.approval.name,identity_verified:false,approved_at:o.approval.at}};}
export function csvCell(value){let s=String(value??'');if(/^[\s]*[=+\-@]/.test(s)||/^[\t\r\n]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
export function newRecord(raw,id,source='Tekstimport'){
 const parsed=parseOrder(raw);return {...parsed,id,raw,source,created:new Date().toISOString(),approval:null,exported:false,audit:[{at:new Date().toISOString(),message:'Opprettet som demoordre. Regelbasert tolkning, ingen AI-modell.'}]};
}
export function importRecords(raw,state,idFactory){
 if(typeof raw!=='string'||raw.length>200000)throw Error('Importen er for stor. Maksimalt 200 000 tegn.');
 let sources;
 if(raw.trim().startsWith('[')){try{sources=JSON.parse(raw);}catch{throw Error('Ugyldig JSON. Forventet en liste med objekter som har feltet raw.');}
 if(!Array.isArray(sources)||!sources.length||sources.length>50||sources.some(x=>!x||typeof x.raw!=='string'))throw Error('JSON må inneholde 1–50 objekter med et tekstfelt kalt raw.');sources=sources.map(x=>x.raw);
 }else sources=[raw];
 const result=[],keys=new Set(state.orders.map(o=>o.customer+'|'+o.reference));
 for(const text of sources){if(text.length>12000||!text.trim())throw Error('Hver bestilling må inneholde 1–12 000 tegn.');const o=newRecord(text,idFactory());
 if(!o.reference)throw Error('Ordreferanse mangler. Ingen ordre ble importert.');const key=o.customer+'|'+o.reference;if(keys.has(key))throw Error('Duplikat kunde/referanse: '+o.reference+'. Ingen ordre ble importert.');keys.add(key);result.push(o);}
 return result;
}
export function seed(){
 const state={schema:2,customers:structuredClone(initialCustomers),orders:[],settings:{reviewer:'Demooperatør',theme:'light',compact:false},economy:{volume:2000,minutes:6,rate:500,fee:35000,direct:18000,fixed:300000,clients:48}};
 const skus=Object.keys(products);
 for(let i=0;i<24;i++){
 const customer=state.customers[i%6],sku=skus[i%skus.length],item=products[sku],sku2=skus[(i+3)%skus.length],item2=products[sku2];
 const date='2026-10-'+String(13+Math.floor(i/2)).padStart(2,'0');
 const raw=`Kunde: ${customer.id}\nReferanse: PO-DEMO-${1041+i}\nLevering: 2026-11-${String(2+i%10).padStart(2,'0')}\nLinjer:\n${sku}; ${2+i%9}; ${item.unit}; ${(item.price/100).toFixed(2)}\n${sku2}; ${1+i%4}; ${item2.unit}; ${(item2.price/100).toFixed(2)}`;
 const o=newRecord(raw,'ORD-'+String(1041+i),['E-post · eksempel','PDF · eksempel','Excel · eksempel'][i%3]);o.created=date+'T'+String(8+i%8).padStart(2,'0')+':'+String(i%2?35:10)+':00Z';o.audit[0].at=o.created;
 if(i%6===1)o.lines[0].unit='eske';
 if(i%6===4)o.lines[0].sku='UKJENT-900';
 if(i%6===5)o.lines[1].price='1,00';
 if(i%6===2||i%6===3){o.approval={name:'Demokontrollør',at:o.created,snapshot:snapshot(o)};o.audit.push({at:o.created,message:'Forhåndsgodkjent eksempeldata, ingen reell kontroll utført.'});if(i%6===3)o.exported=true;}
 state.orders.push(o);
 }
 return state;
}
export function selectOrders(state,{query='',filter='all',sort='newest'}={}){
 const q=query.toLocaleLowerCase('nb-NO').trim();
 return state.orders.filter(o=>{const c=state.customers.find(c=>c.id===o.customer);return (filter==='all'||status(o,state)===filter)&&(!q||[o.id,o.reference,o.customer,c?.name??'',o.source].join(' ').toLocaleLowerCase('nb-NO').includes(q));}).sort((a,b)=>sort==='amount'?check(b,state).total-check(a,state).total:sort==='oldest'?a.created.localeCompare(b.created):b.created.localeCompare(a.created));
}
export function metrics(state){return {total:state.orders.length,review:state.orders.filter(o=>status(o,state)==='review').length,open:state.orders.filter(o=>['new','review'].includes(status(o,state))).length,approved:state.orders.filter(o=>['approved','exported'].includes(status(o,state))).length,value:state.orders.filter(o=>check(o,state).valid).reduce((sum,o)=>sum+check(o,state).total,0)};}
export function restoreState(raw) {
  const s = JSON.parse(raw);
  if (s?.schema !== 2 || !Array.isArray(s.orders) || s.orders.length > 500 ||
      !Array.isArray(s.customers) || s.customers.length > 100 || !s.settings || !s.economy)
    throw Error('Ugyldig lagret demotilstand.');
  const text = value => typeof value === 'string';
  const timestamp = value => text(value) && Number.isFinite(new Date(value).getTime());
  const ids = new Set();
  for (const o of s.orders) {
    if (!o || !text(o.id) || ids.has(o.id) ||
        ['customer','reference','delivery','raw','source'].some(k => !text(o[k])) ||
        o.raw.length > 12000 || !Array.isArray(o.lines) || o.lines.length > 100 ||
        !Array.isArray(o.parseIssues) || o.parseIssues.some(x => !text(x)) ||
        !Array.isArray(o.audit) || !timestamp(o.created) ||
        o.audit.some(x => !x || !timestamp(x.at) || !text(x.message)))
      throw Error('Ugyldig ordre i lokal lagring.');
    ids.add(o.id);
    for (const l of o.lines)
      if (!l || ['sku','quantity','unit','price','source'].some(k => !text(l[k])))
        throw Error('Ugyldig varelinje.');
    if (o.approval && (!text(o.approval.name) || !text(o.approval.snapshot) || !timestamp(o.approval.at)))
      throw Error('Ugyldig godkjenning.');
  }
  const customerIds = new Set();
  for (const c of s.customers) {
    if (!c || ['id','name','email','city','contact'].some(k => !text(c[k])) || customerIds.has(c.id))
      throw Error('Ugyldig kunderegister.');
    customerIds.add(c.id);
  }
  if (!['light','dark'].includes(s.settings.theme) || !text(s.settings.reviewer) ||
      s.settings.reviewer.length > 80 || typeof s.settings.compact !== 'boolean')
    throw Error('Ugyldige innstillinger.');
  if (['volume','minutes','rate','fee','direct','fixed','clients'].some(k => !Number.isFinite(s.economy[k]) || s.economy[k] < 0))
    throw Error('Ugyldige økonomiforutsetninger.');
  return s;
}
