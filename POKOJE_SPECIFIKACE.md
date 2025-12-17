# Rezervační formulář pro pokoje – specifikace

Tento dokument popisuje požadované chování nové varianty rezervačního formuláře pro **jednotlivé pokoje** (např. „Modrý pokoj“ a „Zelený pokoj“).

---

## 1. Přehled

- Stávající formulář pro **celý penzion** zůstává jako samostatná varianta na URL `/penzion`.
- Nová varianta pro **pokoje** bude samostatná:
  - uživatel (host) si vybere konkrétní pokoj (modrý / zelený),
  - každý pokoj má vlastní kapacitu a ceny,
  - všechny rezervace (penzion + pokoje) budou v jedné tabulce v administraci, odliší se podle názvu pokoje (`roomName`).
- U pokojové varianty **neexistuje záloha** – host vždy platí **celou částku**.

---

## 2. Cesty (URL) a rozcestník

- `/` – úvodní stránka (landing page) s rozcestníkem:
  - „Formulář pro celý penzion“ → `/penzion`
  - „Formulář pro jednotlivé pokoje“ → `/pokoje` (info / vstup do pokojové varianty)

- `/penzion` – stávající formulář pro Penzion u Zlatého kníratého Sumce (beze změny logiky).

- Pro pokoje se použije samostatná route, např.:
  - `/pokoje-rezervace` (konkrétní název doplníme při implementaci)
    - nahoře dvě tlačítka/přepínače: **Modrý pokoj** / **Zelený pokoj**
    - podle zvoleného pokoje se načte kalendář a formulář jen pro tento pokoj.

Staré adresy (`/reservace/:roomId`, `/potvrzeni/:id`) zůstávají kvůli zpětné kompatibilitě funkční.

---

## 3. Model pokoje (Room) – pokojová varianta

### 3.1 Základní vlastnosti

Pro každý pokoj budou v datech a v adminu minimálně tyto vlastnosti:

- `name` – název pokoje (např. „Modrý pokoj“, „Zelený pokoj“)
- `capacity` – **maximální počet osob** v pokoji
- `pricePerNight` – **základní cena za osobu / den** (Kč)
- `available` – zda je pokoj dostupný pro rezervace
- `description` – volitelný popis

Sezóny a speciální tabulky (SeasonalPricing) se u pokojové varianty **nepoužijí** – ceník je jednoduchý.

### 3.2 Ceny za služby (za osobu / den)

Pro každý pokoj budou v adminu volitelná pole:

- `cena_snídaně` (Kč / osoba / den)
- `cena_polopenze` (Kč / osoba / den)
- `cena_plné_penze` (Kč / osoba / den)
- `název_vlastní_služby` (text, např. „soukromé parkování“)
- `cena_vlastní_služby` (Kč / osoba / den)

**Pravidla zobrazování:**

- Pokud je cena **prázdná nebo 0** → daná volba se **vůbec NEzobrazí** v rezervačním formuláři.
- Pokud je cena **> 0** → volba se v rezervačním formuláři zobrazí jako checkbox / přepínač.

---

## 4. Výpočet ceny

### 4.1 Základní cena (bez služeb)

Vstupy:

- `cena_za_osobu_den` – základní cena pokoje (Kč / osoba / den)
- `počet_osob`
- `počet_nocí`

Vzorec:

```text
základní_cena = cena_za_osobu_den × počet_osob × počet_nocí
```

### 4.2 Příplatky za služby

Pro každou službu (snídaně, polopenze, plná penze, vlastní služba) platí:

- v adminu je nastavená `cena_služby` (Kč / osoba / den),
- ve formuláři si host službu **zaškrtne** (pokud je cena > 0 a tedy je volba zobrazená).

Příplatek za jednu službu:

```text
příplatek_služby = cena_služby × počet_osob × počet_nocí
```

Součet všech služeb:

```text
součet_služeb = Σ příplatek_každé_vybrané_služby
```

### 4.3 Celková cena

Finální částka, kterou host vidí a platí:

```text
celková_cena = základní_cena + součet_služeb
```

U pokojové varianty **není záloha** – v UI, v e‑mailech ani ve faktuře se nerozděluje na zálohu a doplatek, vždy se pracuje s celkovou částkou.

---

## 5. Chování formuláře pro pokoje

### 5.1 Výběr pokoje

- Uživatel vidí dvě volby (např. tlačítka / segmenty):
  - „Modrý pokoj“
  - „Zelený pokoj“
- Po kliknutí se:
  - načte kalendář obsazenosti jen pro daný pokoj (`roomId`),
  - formulář pro hosta (jméno, telefon, e‑mail, počet osob, poznámka),
  - zobrazí volitelné služby podle vyplněných cen v adminu.

### 5.2 Kontrola počtu osob

- `počet_osob` nesmí překročit `capacity` pokoje.
  - Pokud host zadá více osob než kapacita:
    - formulář zobrazí chybu (např. „Maximální kapacita pokoje je X osob“),
    - rezervace se neuloží.

### 5.3 Výstup pro uživatele

V potvrzení na webu (po úspěšné rezervaci) se zobrazí:

- název pokoje,
- termín (check‑in / check‑out),
- počet osob, počet nocí,
- základní cena,
- zvolené služby – každá jako samostatný řádek, např.:
  - „Snídaně – +1 500 Kč“,
  - „Soukromé parkování – +800 Kč“,
- **celková cena k úhradě**.

Stejné informace se budou odrážet i v:

- potvrzovacím e‑mailu pro hosta,
- kopii e‑mailu pro penzion,
- PDF faktuře (pokud je generována).

---

## 6. Administrace rezervací

- Tabulka rezervací zůstává **jedna společná**:
  - rezervace celého penzionu,
  - rezervace modrého pokoje,
  - rezervace zeleného pokoje.
- Každý záznam má:
  - `roomName` (např. `Penzion`, `Modrý pokoj`, `Zelený pokoj`),
  - ostatní údaje jako dosud (termíny, host, kontakty, stav platby).
- Volitelně lze přidat filtr podle `roomName`, ale není povinný – klíčové je, že všechny rezervace jsou v jednom přehledu.

---

## 7. Shrnutí rozdílů oproti stávajícímu penzionu

- **Penzion (celý objekt):**
  - Sezónní cenotvorba (hlavní / vedlejší sezóna, svátky).
  - Logika záloha + doplatek.
  - Stávající URL `/penzion`.

- **Pokoje (modrý / zelený):**
  - Jednoduchý ceník: cena za osobu / den.
  - Volitelné služby (snídaně, polopenze, plná penze, vlastní služba) – vše za osobu / den.
  - Celková částka = základní cena + příplatky služeb.
  - Žádná záloha; pracuje se jen s celkovou cenou.
  - Všechny rezervace (penzion + pokoje) v jedné admin tabulce.



