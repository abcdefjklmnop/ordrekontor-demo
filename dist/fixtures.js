export const examples = [
 {id:'ready',name:'01 · Standardbestilling',note:'Alle opplysninger stemmer med demoregisteret.',raw:'Kunde: DEMO-100\nReferanse: PO-DEMO-101\nLevering: 2026-11-03\nLinjer:\nVENT-100; 4; stk; 125,00\nFILT-200; 2; stk; 450,00'},
 {id:'unit',name:'02 · Enhet må avklares',note:'Eske og stykk kan ikke behandles som samme enhet. Pris avviker også.',raw:'Kunde: DEMO-200\nReferanse: PO-DEMO-102\nLevering: 2026-11-04\nLinjer:\nFILT-200; 2; eske; 400,00'},
 {id:'unknown',name:'03 · Ukjent varenummer',note:'En ukjent vare skal stoppes, ikke erstattes automatisk.',raw:'Kunde: DEMO-100\nReferanse: PO-DEMO-103\nLevering: 2026-11-05\nLinjer:\nVENT-999; 3; stk; 125,00'},
 {id:'missing',name:'04 · Ufullstendig bestilling',note:'Ukjent kunde, manglende leveringsønske og ugyldig antall.',raw:'Kunde: DEMO-999\nReferanse: PO-DEMO-104\nLevering:\nLinjer:\nSLNG-300; -4; m; 85,00'}
];
