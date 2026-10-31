import test from 'node:test';
import assert from 'node:assert/strict';
import {parseMoney,parseOrder,validateOrder,makeExport,economics,validDate} from '../dist/core.js';
import {examples} from '../dist/fixtures.js';
test('Standardordren får riktig beløp i øre og kan eksporteres etter godkjenning',()=>{
 const order=parseOrder(examples[0].raw);const check=validateOrder(order);
 assert.equal(check.valid,true);assert.equal(check.total,140000);
 const output=makeExport(order,'Testbruker',[],true,false);
 assert.equal(output.total_ore,140000);assert.equal(output.demo,true);assert.equal(output.review.identity_verified,false);
});
test('Uavklarte enheter og priser blokkerer godkjenning',()=>{
 const order=parseOrder(examples[1].raw);assert.equal(validateOrder(order).issues.length,2);
 assert.throws(()=>makeExport(order,'Test',[],true,false));
});
test('Ukjent vare og ugyldige metadata stoppes',()=>{
 assert.equal(validateOrder(parseOrder(examples[2].raw)).valid,false);
 const bad=validateOrder(parseOrder(examples[3].raw));assert.equal(bad.valid,false);assert.ok(bad.issues.length>=3);
});
test('Manglende godkjenning, endret kilde og tom kontrollør blokkerer eksport',()=>{
 const order=parseOrder(examples[0].raw);
 assert.throws(()=>makeExport(order,'Test',[],false,false));
 assert.throws(()=>makeExport(order,'Test',[],true,true));
 assert.throws(()=>makeExport(order,' ',[],true,false));
 order.lines[0].quantity='0';assert.throws(()=>makeExport(order,'Test',[],true,false));
});
test('Ingen skjult trunkering, dupliserte metadata eller ugyldige datoer',()=>{
 assert.equal(validDate('2026-02-30'),false);assert.equal(validDate('2028-02-29'),true);
 for(const raw of [examples[0].raw+'\nEKSTRA; ufullstendig',examples[0].raw.replace('Referanse:','Kunde: DEMO-200\nReferanse:'),'x'.repeat(12001)])assert.equal(validateOrder(parseOrder(raw)).valid,false);
});
test('Pengeparser avviser uavklart formatering og bevarer øre',()=>{
 assert.equal(parseMoney('0,01'),1);assert.equal(parseMoney('125.50'),12550);
 for(const s of ['1.234,56','1e4','Infinity','-100','NaN','10,999'])assert.equal(parseMoney(s),null);
});
test('Økonomi inkluderer direkte og faste kostnader og håndterer negativt dekningsbidrag',()=>{
 const result=economics({volume:2000,minutes:6,rate:500,fee:35000,direct:18000,fixed:300000,clients:48});
 assert.equal(result.capacity,100000);assert.equal(result.revenue,1680000);assert.equal(result.profit,516000);assert.equal(result.needed,48);
 assert.equal(economics({volume:0,minutes:0,rate:0,fee:100,direct:101,fixed:10,clients:1}).needed,null);
 assert.throws(()=>economics({volume:-1,minutes:0,rate:0,fee:0,direct:0,fixed:0,clients:0}));
});
test('Prototypenøkler blir ikke behandlet som gyldige registerposter',()=>{
 const order=parseOrder(examples[0].raw.replace('VENT-100','CONSTRUCTOR').replace('DEMO-100','__proto__'));
 assert.equal(validateOrder(order).valid,false);
});
