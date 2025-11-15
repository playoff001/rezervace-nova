# 🚀 Nasazení na Netlify (Frontend) + Backend

Tento návod ti ukáže, jak nasadit aplikaci s frontendem na Netlify a backendem na Railway nebo Render.

## 📋 Co potřebuješ

1. ✅ **Netlify účet** (máš ho)
2. ⚠️ **Backend hosting** - Railway, Render, nebo jiný Node.js hosting
3. ⚠️ **GitHub úložiště** (doporučeno pro automatické nasazení)

---

## Krok 1: Připrav backend (Railway nebo Render)

> 💡 **Máš účet na Render?** Podívej se na **[RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)** pro detailní návod!

### Varianta A: Railway (doporučeno)

1. **Vytvoř účet na Railway:**
   - Jdi na https://railway.app/
   - Přihlas se přes GitHub

2. **Vytvoř nový projekt:**
   - Klikni na "New Project"
   - Vyber "Deploy from GitHub repo"
   - Vyber repozitář s aplikací

3. **Nastavení projektu:**
   - Railway automaticky detekuje Node.js projekt
   - **Root Directory:** Nech prázdné (nebo `./` pokud máš problém)
   - **Build Command:** `npm install`
   - **Start Command:** `npm run server`
   - **Port:** Railway automaticky nastaví `PORT` environment variable

4. **Environment Variables (volitelné):**
   - `NODE_ENV=production`
   - `ALLOWED_ORIGINS=https://tvuj-netlify-app.netlify.app` (doplníš později)

5. **Získej URL backendu:**
   - Railway ti dá URL, např.: `https://rezervace-production.up.railway.app`
   - **Tuto URL si zkopíruj!** Budeš ji potřebovat pro frontend

### Varianta B: Render

1. **Vytvoř účet na Render:**
   - Jdi na https://render.com/
   - Přihlas se přes GitHub

2. **Vytvoř nový Web Service:**
   - Klikni na "New +" → "Web Service"
   - Vyber repozitář s aplikací

3. **Nastavení:**
   - **Name:** `rezervace-backend` (nebo jak chceš)
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm run server`
   - **Plan:** Free nebo Starter ($7/měsíc)

4. **Environment Variables:**
   - `NODE_ENV=production`
   - `PORT` - Render automaticky nastaví

5. **Získej URL backendu:**
   - Render ti dá URL, např.: `https://rezervace-backend.onrender.com`
   - **Tuto URL si zkopíruj!**

---

## Krok 2: Nastav CORS na backendu

V Railway/Render nastav environment variable:

```
ALLOWED_ORIGINS=https://tvuj-netlify-app.netlify.app,https://www.tvuj-netlify-app.netlify.app
```

(Po nasazení frontendu na Netlify doplníš správnou URL)

---

## Krok 3: Nasazení frontendu na Netlify

### Metoda 1: Přes Netlify Dashboard (nejjednodušší)

1. **Přihlas se na Netlify:**
   - Jdi na https://app.netlify.com/

2. **Vytvoř nový site:**
   - Klikni na "Add new site" → "Import an existing project"
   - Vyber "Deploy with GitHub"
   - Autorizuj Netlify přístup k GitHubu
   - Vyber repozitář s aplikací

3. **Nastavení buildu:**
   - **Base directory:** Nech prázdné
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`

4. **Environment Variables:**
   - Klikni na "Show advanced" → "New variable"
   - Přidej:
     ```
     VITE_API_URL=https://tvuj-backend-url.railway.app/api
     ```
     (Nahraď `tvuj-backend-url.railway.app` skutečnou URL z Railway/Render)

5. **Deploy:**
   - Klikni na "Deploy site"
   - Netlify automaticky buildne a nasadí aplikaci

6. **Získej URL frontendu:**
   - Netlify ti dá URL, např.: `https://rezervace-123.netlify.app`
   - Můžeš si změnit název v "Site settings" → "Change site name"

### Metoda 2: Přes Netlify CLI

1. **Nainstaluj Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Přihlas se:**
   ```bash
   netlify login
   ```

3. **Nastav environment variable:**
   ```bash
   netlify env:set VITE_API_URL "https://tvuj-backend-url.railway.app/api"
   ```

4. **Deploy:**
   ```bash
   npm run build
   netlify deploy --prod
   ```

---

## Krok 4: Aktualizuj CORS na backendu

Teď, když máš URL frontendu, aktualizuj `ALLOWED_ORIGINS` na backendu:

```
ALLOWED_ORIGINS=https://tvuj-netlify-app.netlify.app,https://www.tvuj-netlify-app.netlify.app
```

---

## Krok 5: Vlastní doména (volitelné)

### Na Netlify:

1. Jdi do "Site settings" → "Domain management"
2. Klikni na "Add custom domain"
3. Zadej svou doménu (např. `rezervace.penzion.cz`)
4. Postupuj podle instrukcí (DNS záznamy)

### Aktualizuj CORS:

Přidej vlastní doménu do `ALLOWED_ORIGINS` na backendu:

```
ALLOWED_ORIGINS=https://rezervace.penzion.cz,https://www.rezervace.penzion.cz,https://tvuj-netlify-app.netlify.app
```

---

## ✅ Hotovo!

Aplikace by teď měla fungovat:
- **Frontend:** Na Netlify (např. `https://rezervace-123.netlify.app`)
- **Backend:** Na Railway/Render (např. `https://rezervace-backend.railway.app`)

---

## 🔧 Troubleshooting

### Frontend se nenačítá
- Zkontroluj, že build proběhl úspěšně v Netlify
- Zkontroluj konzoli prohlížeče (F12) pro chyby

### API nefunguje (CORS chyby)
- Zkontroluj, že `VITE_API_URL` je správně nastaveno v Netlify
- Zkontroluj, že `ALLOWED_ORIGINS` obsahuje URL frontendu
- Zkontroluj Network tab v prohlížeči - vidíš požadavky na backend?

### Backend neběží
- Zkontroluj logy v Railway/Render
- Zkontroluj, že `PORT` environment variable je nastaveno
- Zkontroluj, že `npm run server` funguje lokálně

---

## 📝 Důležité poznámky

1. **Environment Variables:**
   - `VITE_API_URL` musí začínat na `VITE_` aby Vite viděl tuto proměnnou
   - Po změně environment variable v Netlify musíš znovu deploynout

2. **Automatické nasazení:**
   - Při pushnutí do GitHubu se automaticky nasadí nová verze
   - Netlify i Railway/Render podporují automatické nasazení

3. **Zálohy:**
   - Pravidelně zálohuj `server/data/*.json` z backendu
   - Nebo nastav automatické zálohy

4. **Monitoring:**
   - Sleduj logy v Netlify (Deploys → Deploy log)
   - Sleduj logy v Railway/Render

---

## 💰 Ceny

- **Netlify:** Zdarma (pro malé projekty) nebo $19/měsíc (pro větší)
- **Railway:** $5/měsíc + použití
- **Render:** $7/měsíc (Starter plan)

**Celkem:** Cca $5-12/měsíc

---

Potřebuješ pomoc? Napiš mi! 🚀

