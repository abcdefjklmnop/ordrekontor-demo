export const catalog = Object.freeze({
  'VENT-100': {name:'Standardventil, demo', unit:'stk', price:12500},
  'FILT-200': {name:'Filterelement, demo', unit:'stk', price:45000},
  'SLNG-300': {name:'Industrislange, demo', unit:'m', price:8500}
});
export const customers = Object.freeze({'DEMO-100':'Fjord Mekanikk (fiktiv)','DEMO-200':'Vest Verksted (fiktiv)'});

export function parseMoney(value) {
  const s = String(value).trim();
  if (!/^\d{1,8}(?:[,.]\d{1,2})?$/.test(s)) return null;
  const [whole, decimals = ''] = s.replace(',', '.').split('.');
  return Number(whole) * 100 + Number(decimals.padEnd(2, '0'));
}
export function validDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T12:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0,10) === s;
}
export function parseOrder(raw) {
  const order = {customer:'',reference:'',delivery:'',lines:[],parseIssues:[]};
  if (typeof raw !== 'string' || raw.length > 12000) {
    order.parseIssues.push('Bestillingen må være tekst på maksimalt 12 000 tegn.'); return order;
  }
  let inLines = false;
  const seen = new Set();
  for (const [index, original] of raw.split(/\r?\n/).entries()) {
    const line = original.trim();
    if (!line) continue;
    if (/^Linjer:$/i.test(line)) { if (inLines) order.parseIssues.push('Linjer er oppgitt flere ganger.'); inLines = true; continue; }
    if (!inLines) {
      const m = /^(Kunde|Referanse|Levering):\s*(.*)$/i.exec(line);
      if (!m) {order.parseIssues.push(`Linje ${index+1}: ukjent felt. Bruk eksempelformatet.`); continue;}
      const key = {kunde:'customer',referanse:'reference',levering:'delivery'}[m[1].toLowerCase()];
      if (seen.has(key)) order.parseIssues.push(`Feltet ${m[1]} er oppgitt flere ganger.`);
      seen.add(key); order[key] = m[2].trim(); continue;
    }
    const fields = line.split(';').map(s=>s.trim());
    if (fields.length !== 4) {order.parseIssues.push(`Linje ${index+1}: forventet varenummer; antall; enhet; enhetspris.`); continue;}
    order.lines.push({sku:fields[0].toUpperCase(),quantity:fields[1],unit:fields[2].toLowerCase(),price:fields[3],source:original});
  }
  return order;
}
export function validateOrder(order, registry = {customers, catalog}) {
  const issues = order.parseIssues.map(message=>({message,line:null}));
  if (!Object.hasOwn(registry.customers, order.customer)) issues.push({message:'Kundenummeret finnes ikke i demoregisteret.',line:null});
  if (!order.reference || order.reference.length > 100) issues.push({message:'Oppgi en referanse på 1–100 tegn.',line:null});
  if (!validDate(order.delivery)) issues.push({message:'Leveringsønsket må være en gyldig dato (ÅÅÅÅ-MM-DD).',line:null});
  if (!order.lines.length) issues.push({message:'Bestillingen inneholder ingen varelinjer.',line:null});
  if (order.lines.length > 100) issues.push({message:'Demonstrasjonen støtter maksimalt 100 varelinjer.',line:null});
  let total = 0;
  for (const [i,line] of order.lines.entries()) {
    const item = Object.hasOwn(registry.catalog, line.sku) ? registry.catalog[line.sku] : null;
    if (!item) issues.push({message:'Ukjent varenummer. Avklar med kunden.',line:i});
    const qty = /^\d{1,5}$/.test(String(line.quantity)) ? Number(line.quantity) : NaN;
    if (!Number.isInteger(qty) || qty < 1 || qty > 10000) issues.push({message:'Antall må være et heltall mellom 1 og 10 000.',line:i});
    if (item && line.unit !== item.unit) issues.push({message:`Enhet må avklares. Registeret bruker «${item.unit}». Ingen automatisk omregning.`,line:i});
    const price = parseMoney(line.price);
    if (price === null) issues.push({message:'Ugyldig pris. Bruk for eksempel 125,00 uten tusenskilletegn.',line:i});
    else if (item && price !== item.price) issues.push({message:`Pris avviker fra demoregisteret (${(item.price/100).toFixed(2)} kr). Avklar før godkjenning.`,line:i});
    if (Number.isInteger(qty) && qty > 0 && qty <= 10000 && price !== null) total += qty * price;
  }
  return {issues,total,valid:issues.length===0};
}
export function makeExport(order, reviewer, audit, approved, sourceDirty, registry = {customers, catalog}) {
  if (!approved || sourceDirty || !reviewer.trim() || !validateOrder(order, registry).valid) throw new Error('Ordren må være kontrollert og godkjent før eksport.');
  return {demo:true,not_for_production:true,extraction_method:'deterministic_demo_parser',customer:order.customer,reference:order.reference,requested_delivery:order.delivery,currency:'NOK',prices_exclude_vat:true,lines:order.lines.map(line=>({sku:line.sku,quantity:Number(line.quantity),unit:line.unit,unit_price_ore:parseMoney(line.price),original_source:line.source})),total_ore:validateOrder(order, registry).total,review:{self_reported_name:reviewer.trim(),identity_verified:false,approved_at:new Date().toISOString()},audit:structuredClone(audit)};
}
export function economics({volume,minutes,rate,fee,direct,fixed,clients}) {
  const values=[volume,minutes,rate,fee,direct,fixed,clients];
  if (values.some(v=>!Number.isFinite(v)||v<0)) throw new Error('Forutsetninger må være gyldige, ikke-negative tall.');
  const capacity = volume * minutes / 60 * rate;
  const contribution = fee - direct;
  return {capacity,afterFee:capacity-fee,revenue:clients*fee,profit:clients*contribution-fixed,needed:contribution>0?Math.ceil((500000+fixed)/contribution):null};
}
