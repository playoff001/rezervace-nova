# 🚀 Návod na nasazení aplikace

## 📚 Rychlý přehled možností

- **[NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md)** - Frontend na Netlify + Backend na Railway/Render (doporučeno, máš Netlify účet)
- **[GITHUB_PAGES_DEPLOYMENT.md](./GITHUB_PAGES_DEPLOYMENT.md)** - Frontend na GitHub Pages + Backend na Railway/Render (zdarma)
- **Níže** - Vše na jednom serveru (VPS nebo Railway)

---

## Rychlý start - Railway (vše na jednom serveru)

### 1. Příprava
1. Vytvoř účet na https://railway.app/
2. Připoj GitHub úložiště
3. Railway automaticky detekuje Node.js projekt

### 2. Nastavení
1. V Railway projektu:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Port:** Railway automaticky nastaví `PORT` environment variable

2. Environment Variables (volitelné):
   - `NODE_ENV=production`
   - `ALLOWED_ORIGINS=https://vas-domena.cz`

### 3. Nasazení
- Railway automaticky nasadí při pushnutí do GitHubu
- Získáš HTTPS URL automaticky

---

## VPS (Hetzner, DigitalOcean, atd.)

### 1. Příprava serveru
```bash
# Připoj se na server přes SSH
ssh root@tvoje-ip

# Aktualizuj systém
apt update && apt upgrade -y

# Nainstaluj Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Nainstaluj PM2 pro správu procesů
npm install -g pm2

# Nainstaluj Nginx (pro reverse proxy)
apt install -y nginx

# Nainstaluj Certbot (pro SSL)
apt install -y certbot python3-certbot-nginx
```

### 2. Nahrání aplikace
```bash
# Vytvoř složku pro aplikaci
mkdir -p /var/www/rezervace
cd /var/www/rezervace

# Nahraj soubory (přes Git nebo SCP)
git clone https://github.com/tvuj-username/rezervace.git .
# NEBO
# scp -r ./* root@tvoje-ip:/var/www/rezervace/
```

### 3. Instalace a build
```bash
cd /var/www/rezervace

# Nainstaluj závislosti
npm install

# Build frontendu
npm run build

# Vytvoř data složku
mkdir -p server/data
```

### 4. Nastavení PM2
```bash
# Spusť aplikaci přes PM2
pm2 start ecosystem.config.js

# Ulož PM2 konfiguraci pro automatický start
pm2 save
pm2 startup
```

### 5. Nastavení Nginx (reverse proxy)
```bash
# Vytvoř Nginx konfiguraci
nano /etc/nginx/sites-available/rezervace
```

Vlož:
```nginx
server {
    listen 80;
    server_name vas-domena.cz www.vas-domena.cz;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Aktivuj konfiguraci
ln -s /etc/nginx/sites-available/rezervace /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 6. SSL certifikát (Let's Encrypt)
```bash
# Získej SSL certifikát
certbot --nginx -d vas-domena.cz -d www.vas-domena.cz

# Certbot automaticky upraví Nginx konfiguraci
```

### 7. Firewall
```bash
# Povol HTTP a HTTPS
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp  # SSH
ufw enable
```

---

## Render.com

### 1. Vytvoř účet na https://render.com/

### 2. Vytvoř nový Web Service
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Environment:** Node

### 3. Environment Variables
- `NODE_ENV=production`
- `PORT` (Render automaticky nastaví)

### 4. Nasazení
- Render automaticky nasadí při pushnutí do GitHubu
- Získáš HTTPS URL automaticky

---

## Vercel (Frontend) + Railway (Backend)

### Frontend na Vercel:
1. Vytvoř účet na https://vercel.com/
2. Importuj projekt z GitHubu
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. **Install Command:** `npm install`

### Backend na Railway:
1. Vytvoř účet na https://railway.app/
2. Vytvoř nový projekt
3. **Build Command:** `npm install`
4. **Start Command:** `npm run server`
5. Získej URL backendu

### Propojení:
1. V Vercel nastav Environment Variable:
   - `VITE_API_URL=https://tvuj-backend.railway.app`
2. Uprav `vite.config.ts` - v produkci použij environment variable

---

## ⚠️ Důležité po nasazení

1. **Změň admin heslo!**
   - Výchozí: `admin` / `admin123`
   - Přihlas se do administrace a změň heslo

2. **Nastav e-mail a SMS** (pokud chceš)
   - V administraci → Nastavení

3. **Nastav údaje penzionu**
   - V administraci → Nastavení
   - IČO, DIČ, adresa, bankovní účet

4. **Zálohy**
   - Pravidelně zálohuj `server/data/*.json`
   - Nebo nastav automatické zálohy

5. **Monitoring**
   - Sleduj logy: `pm2 logs` (na VPS)
   - Nebo použij monitoring poskytovatele

---

## 🔧 Troubleshooting

### Aplikace se nespustí
- Zkontroluj logy: `pm2 logs` nebo logy poskytovatele
- Zkontroluj, že port není obsazený
- Zkontroluj environment variables

### Frontend se nenačítá
- Zkontroluj, že `npm run build` proběhl úspěšně
- Zkontroluj, že backend servuje statické soubory
- Zkontroluj CORS nastavení

### API nefunguje
- Zkontroluj, že backend běží
- Zkontroluj CORS nastavení
- Zkontroluj URL v frontendu

---

## 📞 Potřebuješ pomoc?

Pokud narazíš na problém, zkontroluj:
1. Logy serveru
2. Konzoli prohlížeče (F12)
3. Network tab v prohlížeči
4. Dokumentaci poskytovatele hostingu

