# Průvodce nasazením rezervačního systému na živý web

## 📋 Co aplikace potřebuje

### Technické požadavky:
- **Node.js** (verze 18 nebo novější)
- **npm** (součást Node.js)
- **Port** pro backend (např. 3002, nebo port zadaný prostředím)
- **Možnost spustit Node.js proces** (běžící na pozadí)

---

## 🎯 Možnosti hostingu

### 1. **VPS (Virtual Private Server)** - Doporučeno pro plnou kontrolu
**Výhody:**
- Plná kontrola nad serverem
- Vlastní doména
- Levnější dlouhodobě
- Možnost rozšíření

**Nevýhody:**
- Vyžaduje správu serveru
- Nutné nastavit firewall, SSL certifikát

**Doporučení:**
- **DigitalOcean** (od $6/měsíc) - https://www.digitalocean.com/
- **Hetzner** (od €4/měsíc) - https://www.hetzner.com/ - blízko ČR
- **VPS.cz** (český poskytovatel) - https://www.vps.cz/
- **Wedos** (český poskytovatel) - https://www.wedos.cz/

**Co potřebuješ:**
- VPS s Ubuntu/Debian Linux
- SSH přístup
- Node.js nainstalovaný
- PM2 pro správu procesů (nebo systemd)
- Nginx jako reverse proxy (volitelné, ale doporučeno)
- SSL certifikát (Let's Encrypt - zdarma)

---

### 2. **Platformy jako služba (PaaS)** - Nejjednodušší
**Výhody:**
- Jednoduché nasazení
- Automatické SSL certifikáty
- Automatické restartování
- Monitoring

**Nevýhody:**
- Obvykle dražší
- Méně kontroly

**Doporučení:**

#### **Railway** (https://railway.app/)
- **Cena:** $5/měsíc + použití
- **Výhody:** Velmi jednoduché, automatické nasazení z GitHubu
- **Vhodné pro:** Začátečníky

#### **Render** (https://render.com/)
- **Cena:** $7/měsíc pro web service
- **Výhody:** Jednoduché, dobrá dokumentace
- **Vhodné pro:** Začátečníky

#### **Fly.io** (https://fly.io/)
- **Cena:** Pay-as-you-go
- **Výhody:** Globální distribuce
- **Vhodné pro:** Pokročilejší

#### **Heroku** (https://www.heroku.com/)
- **Cena:** Od $7/měsíc
- **Výhody:** Velmi známá platforma
- **Nevýhody:** Dražší

---

### 3. **Kombinace Frontend + Backend**
**Možnost A:** Frontend na Vercel/Netlify + Backend na Railway/Render
- Frontend: **Vercel** (zdarma) nebo **Netlify** (zdarma)
- Backend: **Railway** nebo **Render** ($5-7/měsíc)

**Možnost B:** Vše na jednom VPS
- Frontend i backend na stejném serveru
- Levnější, ale vyžaduje správu

---

## 🚀 Postup nasazení (obecný)

### Krok 1: Příprava aplikace
1. Build frontendu: `npm run build`
2. Vytvoří se složka `dist/` se statickými soubory
3. Backend servuje tyto soubory + API

### Krok 2: Nastavení prostředí
- Nastavit proměnné prostředí (port, URL)
- Nastavit produkční konfiguraci

### Krok 3: Nasazení
- Nahrát soubory na server
- Nainstalovat závislosti: `npm install --production`
- Spustit server

### Krok 4: SSL certifikát
- Nastavit HTTPS (Let's Encrypt zdarma)
- Přesměrovat HTTP → HTTPS

### Krok 5: Monitoring
- Nastavit automatické restartování (PM2, systemd)
- Nastavit monitoring a logy

---

## 📝 Co je potřeba upravit v kódu

1. **API URL** - frontend musí vědět, kde je backend
2. **Port** - backend musí naslouchat na správném portu
3. **CORS** - povolit správné domény
4. **Statické soubory** - backend musí servovat frontend
5. **Environment variables** - port, URL, atd.

---

## 💡 Doporučení

**Pro začátečníky:**
→ **Railway** nebo **Render** - nejjednodušší nasazení

**Pro pokročilejší:**
→ **VPS (Hetzner nebo VPS.cz)** - více kontroly, levnější dlouhodobě

**Pro malý provoz:**
→ **Vercel (frontend) + Railway (backend)** - frontend zdarma, backend $5/měsíc

---

## ⚠️ Důležité poznámky

1. **Data (JSON soubory)** - v produkci zvaž přechod na databázi (PostgreSQL, MySQL)
2. **Zálohy** - pravidelně zálohuj data
3. **Hesla** - změň výchozí admin heslo!
4. **SSL** - vždy používej HTTPS v produkci
5. **Environment variables** - citlivé údaje (hesla, API klíče) ukládej do proměnných prostředí

---

## 🔧 Co můžu připravit

Můžu ti připravit:
1. ✅ Production build konfiguraci
2. ✅ Upravit server, aby servoval frontend
3. ✅ Přidat environment variables
4. ✅ Vytvořit start scripty
5. ✅ Přidat PM2 konfiguraci
6. ✅ Vytvořit deployment scripty

Řekni, kterou možnost hostingu preferuješ, a připravím ti konkrétní návod a potřebné soubory!



