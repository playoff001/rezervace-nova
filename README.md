# Rezervační systém pro penzion

Kompletní rezervační systém pro ubytování v penzionu s uživatelskou a administrátorskou částí.

## 🚀 Funkce

### Uživatelská část (Host)
- ✅ Výběr pokoje z dostupných pokojů
- ✅ Interaktivní kalendář s půldny (AM/PM)
- ✅ Automatický výpočet ceny
- ✅ Rezervační formulář s validací
- ✅ Potvrzovací e-mail a SMS
- ✅ Děkovná stránka s rekapitulací

### Administrátorská část (Majitel)
- ✅ Přihlášení s heslem
- ✅ Přehled všech rezervací s filtry
- ✅ Detail rezervace s možností úprav
- ✅ Správa pokojů (přidání, úprava, mazání)
- ✅ Správa blokací kalendáře (AM/PM)
- ✅ Označení rezervace jako zaplacené
- ✅ Odesílání SMS hostům
- ✅ Dashboard se statistikami

## 📋 Technologie

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **Ukládání dat:** JSON soubory (lze snadno nahradit databází)
- **E-mail:** Nodemailer
- **SMS:** REST API (konfigurovatelné)

## 🛠️ Instalace

1. **Nainstalujte závislosti:**
   ```bash
   npm install
   ```

2. **Spusťte backend server:**
   ```bash
   npm run server
   ```
   Server poběží na `http://localhost:3002`

3. **V jiném terminálu spusťte frontend:**
   ```bash
   npm run dev
   ```
   Aplikace poběží na `http://localhost:5173`

## 🔐 Výchozí přihlašovací údaje

- **Uživatelské jméno:** `admin`
- **Heslo:** `admin123`

⚠️ **Důležité:** Po prvním přihlášení změňte heslo v administraci!

## 📁 Struktura projektu

```
rezervace/
├── src/
│   ├── api/              # API klient
│   ├── components/       # React komponenty
│   │   ├── admin/        # Admin komponenty
│   │   └── ...
│   ├── pages/            # Stránky aplikace
│   │   ├── admin/        # Admin stránky
│   │   └── ...
│   ├── types.ts          # TypeScript typy
│   ├── utils/            # Pomocné funkce
│   └── App.tsx           # Hlavní komponenta
├── server/
│   ├── data/             # JSON soubory s daty
│   └── index.js          # Express server
└── ...
```

## 📧 Konfigurace e-mailu a SMS

E-mail a SMS se konfigurují v administraci po přihlášení. Data se ukládají do `server/data/config.json`.

### E-mail (Nodemailer)
- Host SMTP serveru
- Port
- Uživatelské jméno a heslo
- Odesílatel

### SMS
- API klíč
- API URL
- Odesílatel

## 🗓️ Jak funguje kalendář s půldny

- **Příjezd:** Kliknutí na datum obsadí **PM** (odpoledne)
- **Odjezd:** Kliknutí na datum obsadí **AM** (dopoledne)
- **Dny mezi:** Automaticky se obsadí **AM + PM**
- **Blokace:** Administrátor může blokovat jednotlivé půlky dne pro údržbu

## 📝 Datové modely

### Room (Pokoj)
- id, name, capacity, pricePerNight, description, available

### Reservation (Rezervace)
- id, roomId, checkIn, checkOut, nights, totalPrice
- guestName, guestPhone, guestEmail, numberOfGuests, note
- status (pending/confirmed/paid/cancelled)
- paymentMethod, paymentNote

### Block (Blokace)
- id, roomId, date, halfDay (AM/PM), reason

## 🔄 API Endpoints

### Pokoje
- `GET /api/rooms` - Seznam pokojů
- `GET /api/rooms/:id` - Detail pokoje
- `POST /api/rooms` - Vytvořit pokoj
- `PUT /api/rooms/:id` - Upravit pokoj
- `DELETE /api/rooms/:id` - Smazat pokoj

### Rezervace
- `GET /api/reservations` - Seznam rezervací
- `GET /api/reservations/:id` - Detail rezervace
- `POST /api/reservations` - Vytvořit rezervaci
- `PUT /api/reservations/:id` - Upravit rezervaci
- `POST /api/reservations/:id/cancel` - Zrušit rezervaci
- `POST /api/reservations/:id/paid` - Označit jako zaplacené

### Blokace
- `GET /api/blocks?roomId=...` - Seznam blokací
- `POST /api/blocks` - Vytvořit blokaci
- `DELETE /api/blocks/:id` - Smazat blokaci

### Kalendář
- `GET /api/calendar/:roomId` - Kalendář pro pokoj

### Admin
- `POST /api/admin/login` - Přihlášení
- `GET /api/admin/config` - Konfigurace
- `PUT /api/admin/config` - Aktualizovat konfiguraci
- `POST /api/admin/sms/:reservationId` - Odeslat SMS

## 🚢 Build pro produkci

```bash
npm run build
```

Vytvoří se složka `dist` s připravenou aplikací.

## 📦 Produkční nasazení

Aplikace je připravena pro nasazení na živý web. Podrobné návody najdeš v:

- **[NASAZENI.md](./NASAZENI.md)** - Přehled možností hostingu a požadavků
- **[RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)** - Backend na Render + Frontend na Netlify/GitHub Pages ⭐ (máš Render i Netlify účet!)
- **[NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md)** - Frontend na Netlify + Backend na Railway
- **[GITHUB_PAGES_DEPLOYMENT.md](./GITHUB_PAGES_DEPLOYMENT.md)** - Frontend na GitHub Pages + Backend (zdarma)
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Vše na jednom serveru (VPS nebo Railway)

### Rychlý přehled možností:

**Pro začátečníky (nejjednodušší):**
- **Railway** (https://railway.app/) - $5/měsíc, automatické nasazení
- **Render** (https://render.com/) - $7/měsíc, jednoduché nastavení

**Pro pokročilejší (více kontroly):**
- **VPS** (Hetzner, DigitalOcean, VPS.cz) - od €4/měsíc, plná kontrola

**Kombinace:**
- Frontend na **Vercel** (zdarma) + Backend na **Railway** ($5/měsíc)

### Co je potřeba po nasazení:

1. ✅ **Změň admin heslo** - výchozí je `admin` / `admin123`
2. ✅ **Nastav údaje penzionu** - IČO, DIČ, adresa, bankovní účet (v administraci)
3. ✅ **Nastav e-mail a SMS** (volitelné) - v administraci → Nastavení
4. ✅ **Nastav SSL/HTTPS** - většina poskytovatelů to dělá automaticky
5. ✅ **Zálohy** - pravidelně zálohuj `server/data/*.json`

### Spuštění v produkci:

**Windows:**
```bash
npm run build
start-production.bat
```

**Linux/Mac:**
```bash
npm run build
npm start
```

**Nebo s PM2 (doporučeno pro VPS):**
```bash
npm install -g pm2
npm run build
pm2 start ecosystem.config.js
```

## 📄 Licence

MIT

## 🤝 Podpora

Pro dotazy a problémy vytvořte issue v repozitáři.


