# Ordrekontor 2.0 – pilotarbeidsflate

Interaktiv demonstrasjon av et ordrekontor, med 24 fiktive bestillinger, seks demokunder og åtte produkter. Ingen språkmodell, innboks eller ERP er tilkoblet. Tolkningen bruker regler og et fast tekstformat.

## Start

Åpne `Ordrekontor_demo.html` fra leveransepakken i en moderne nettleser. Den samlede filen trenger ingen installasjon eller nettforbindelse. Last ned filen først hvis forhåndsvisningen ikke kjører JavaScript.

Kildeutgaven ligger i `dist/`. Fra prosjektmappen kan du kjøre `python3 -m http.server --bind 127.0.0.1 --directory dist 8080` og åpne `http://127.0.0.1:8080`. Node.js brukes til tester og samling av HTML-filen; ingen npm-avhengigheter må installeres.

## Funksjoner

- Oversikt med beregnede nøkkeltall og graf for sju eller 14 demodager.
- Ordrekø med søk, statusfiltre, sortering, flervalg og CSV-eksport.
- Avvikskø og ordredetaljer med redigerbare varelinjer, kilde og kontrollspor.
- Godkjenning med egenoppgitt kontrollørnavn. Endringer opphever godkjenningen. Ugyldige eller ugodkjente ordre kan ikke eksporteres som ordre-JSON.
- TXT-/JSON-import med duplikatkontroll. Maksimalt 50 ordre per import og 500 lagrede demoordre.
- Kunderegister med egne demokunder og visning av kundens ordre.
- Rapporter og en justerbar økonomisimulator. Resultatene er regneeksempler, ikke prognoser. Kapasitetsverdi er ikke automatisk en kontant besparelse.
- Lys/mørk visning, kompakte tabeller, lokal lagring, sikkerhetskopi og bekreftet nullstilling.

Endringer lagres i nettleserens `localStorage` hvis det er tilgjengelig. Lagringen følger nettleseren og filens adresse; den synkroniseres ikke mellom enheter. Sikkerhetskopien lastes ned som JSON. Det finnes foreløpig ingen knapp for å gjenopprette en slik sikkerhetskopi. Nullstilling erstatter lokalt lagrede data.

## Importformat

```text
Kunde: DEMO-100
Referanse: TEST-2026-001
Levering: 2026-11-10
Linjer:
VENT-100; 4; stk; 125,00
FILT-200; 2; stk; 450,00
```

Bruk et kundenummer og varenummer fra demoregisteret. En JSON-import skal være en liste med objekter som har tekstfeltet `raw`, for eksempel `[{"raw":"Kunde: ..."}]`. PDF, bilder, regneark og frie e-postformater tolkes ikke. Kildemerker som «PDF · eksempel» beskriver bare de fiktive eksemplene.

## Tester og bygg

```sh
npm test
npm run check
npm run build
```

Byggeskriptet samler HTML, CSS og JavaScript i én fil og beregner en CSP-hash for skriptet. Standard utfil er `../ordrekontor-pilotpakke/Ordrekontor_demo.html`. Du kan oppgi en annen utfil: `node scripts/build-standalone.mjs /absolutt/sti/demo.html`. Skriptet skriver også en `.syntax.mjs`-fil til lokal syntakskontroll.

14 automatiserte tester dekker parseren, beløpsregning, godkjenningskrav, endringer, filtre, lokal datamodell, importduplikater og CSV-formler. Nettleserinteraksjon og visuell gjengivelse er ikke kontrollert i dette kjøremiljøet. Publisering er blokkert av utilgjengelig DNS for Git-verten; en offentlig nettadresse er ikke klar.

## Før produksjon

Dette er en lokal demo for fiktive data. Kontrollørnavnet er ingen innlogging, og kontrollsporet er ikke manipulasjonssikkert. Kundespesifikke priser, lagerstatus, roller, serverdatabase, innlogging, ekte AI-tolkning, betaling, innboks og IFS-integrasjon er ikke implementert.

Før kundedata brukes må tilgang, databehandling, lagring/sletting, modellleverandør og integrasjonsvei avklares. En produksjonsløsning trenger egne tester av tilgang, datakvalitet og modellfeil på et separat testutvalg.

