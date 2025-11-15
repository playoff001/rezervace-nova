# 🚀 Nasazení na Render (Backend) + Netlify/GitHub Pages (Frontend)

Render je platforma pro nasazení aplikací (podobná Railway). Můžeš použít Render pro backend a Netlify nebo GitHub Pages pro frontend.

## 📋 Co potřebuješ

1. ✅ **Render účet** (máš ho)
2. ✅ **Netlify účet** (máš ho) nebo **GitHub Pages** (zdarma)
3. ⚠️ **GitHub úložiště** (doporučeno pro automatické nasazení)

---

## Krok 1: Nasazení backendu na Render

### 1. Přihlas se na Render
- Jdi na https://dashboard.render.com/
- Přihlas se (máš účet)

### 2. Vytvoř nový Web Service

1. **Klikni na "New +" → "Web Service"**

2. **Připoj GitHub repozitář:**
   - Pokud ještě nemáš připojený GitHub, klikni na "Connect GitHub"
   - Autorizuj Render přístup k GitHubu
   - Vyber repozitář s aplikací

3. **Nastavení služby:**
   - **Name:** `rezervace-backend` (nebo jak chceš)
   - **Region:** Vyber nejbližší (např. Frankfurt pro ČR)
   - **Branch:** `main` (nebo `master`)
   - **Root Directory:** Nech prázdné (nebo `./` pokud máš problém)
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm run server`
   - **Plan:** 
     - **Free** - zdarma, ale služba se "uspi" po 15 minutách nečinnosti (pomalé probuzení)
     - **Starter** - $7/měsíc, vždy běží, rychlejší

4. **Environment Variables:**
   Klikni na "Advanced" a přidej:
   ```
   NODE_ENV=production
   PORT=10000
   ```
   (Render automaticky nastaví PORT, ale můžeme to explicitně nastavit)

5. **Klikni na "Create Web Service"**

6. **Počkej na nasazení:**
   - Render začne buildovat a nasazovat
   - Může to trvat 2-5 minut
   - Sleduj logy v "Logs" tabu

7. **Získej URL backendu:**
   - Po úspěšném nasazení uvidíš URL, např.: `https://rezervace-backend.onrender.com`
   - **Tuto URL si zkopíruj!** Budeš ji potřebovat pro frontend

---

## Krok 2: Nastav CORS na backendu

Po nasazení frontendu (v dalším kroku) se vrať sem a přidej environment variable:

1. V Render projektu klikni na "Environment"
2. Přidej novou proměnnou:
   ```
   ALLOWED_ORIGINS=https://tvuj-netlify-app.netlify.app,https://www.tvuj-netlify-app.netlify.app
   ```
   (Nahraď URL skutečnou URL z Netlify - doplníš později)

3. Klikni na "Save Changes"
4. Render automaticky restartuje službu

---

## Krok 3: Nasazení frontendu

### Varianta A: Netlify (doporučeno, máš účet)

Postupuj podle **NETLIFY_DEPLOYMENT.md**, ale místo Railway použij Render URL:

1. V Netlify nastav environment variable:
   ```
   VITE_API_URL=https://rezervace-backend.onrender.com/api
   ```
   (Nahraď `rezervace-backend.onrender.com` skutečnou URL z Render)

2. Po nasazení na Netlify získej URL frontendu (např. `https://rezervace-123.netlify.app`)

3. Vrať se do Render a aktualizuj `ALLOWED_ORIGINS`:
   ```
   ALLOWED_ORIGINS=https://rezervace-123.netlify.app,https://www.rezervace-123.netlify.app
   ```

### Varianta B: GitHub Pages

Postupuj podle **GITHUB_PAGES_DEPLOYMENT.md**, ale použij Render URL:

1. V GitHub Secrets nastav:
   ```
   VITE_API_URL=https://rezervace-backend.onrender.com/api
   ```

2. Po nasazení na GitHub Pages získej URL (např. `https://username.github.io/repo-name`)

3. V Render aktualizuj `ALLOWED_ORIGINS`:
   ```
   ALLOWED_ORIGINS=https://username.github.io,https://username.github.io/repo-name
   ```

---

## Krok 4: Vlastní doména (volitelné)

### Pro frontend (Netlify):
1. V Netlify: Site settings → Domain management → Add custom domain
2. Postupuj podle instrukcí

### Pro backend (Render):
1. V Render: Settings → Custom Domain
2. Přidej doménu (např. `api.rezervace.penzion.cz`)
3. Postupuj podle instrukcí (DNS záznamy)

### Aktualizuj CORS:
Přidej vlastní domény do `ALLOWED_ORIGINS` v Render:
```
ALLOWED_ORIGINS=https://rezervace.penzion.cz,https://www.rezervace.penzion.cz,https://api.rezervace.penzion.cz
```

---

## ✅ Hotovo!

Aplikace by teď měla fungovat:
- **Frontend:** Na Netlify nebo GitHub Pages
- **Backend:** Na Render (např. `https://rezervace-backend.onrender.com`)

---

## 🔧 Troubleshooting

### Backend se nespustí
- Zkontroluj logy v Render (Logs tab)
- Zkontroluj, že `npm run server` funguje lokálně
- Zkontroluj, že `PORT` environment variable je nastaveno

### Backend se "usíná" (Free plan)
- Na Free planu se služba uspí po 15 minutách nečinnosti
- První požadavek po probuzení může trvat 30-60 sekund
- **Řešení:** Upgraduj na Starter plan ($7/měsíc) nebo použij Railway

### API nefunguje (CORS chyby)
- Zkontroluj, že `VITE_API_URL` je správně nastaveno v Netlify/GitHub
- Zkontroluj, že `ALLOWED_ORIGINS` obsahuje URL frontendu
- Zkontroluj Network tab v prohlížeči - vidíš požadavky na backend?

### Pomalé načítání (Free plan)
- Free plan má omezené zdroje
- První požadavek po probuzení je pomalý
- **Řešení:** Upgraduj na Starter plan nebo použij Railway

---

## 💰 Ceny Render

### Free Plan
- ✅ Zdarma
- ❌ Služba se uspí po 15 minutách nečinnosti
- ❌ Pomalé probuzení (30-60 sekund)
- ❌ Omezené zdroje

### Starter Plan
- 💰 $7/měsíc
- ✅ Služba vždy běží
- ✅ Rychlejší
- ✅ Více zdrojů

**Doporučení:** Pro produkční aplikaci použij **Starter plan** ($7/měsíc) nebo **Railway** ($5/měsíc).

---

## 📊 Srovnání Render vs Railway

| Funkce | Render | Railway |
|--------|--------|---------|
| **Free plan** | ✅ Ano (s uspáváním) | ❌ Ne |
| **Starter plan** | $7/měsíc | $5/měsíc |
| **Rychlost** | Dobrá | Dobrá |
| **Uspávání** | Ano (Free) | Ne |
| **Automatické nasazení** | ✅ Ano | ✅ Ano |
| **SSL** | ✅ Automaticky | ✅ Automaticky |

**Závěr:** Oba jsou dobré. Railway je levnější ($5 vs $7), ale Render má free plan (s omezeními).

---

## 🎯 Rychlý postup (Netlify + Render)

1. **Render:** Vytvoř Web Service → Build: `npm install` → Start: `npm run server` → Zkopíruj URL
2. **Netlify:** Import z GitHubu → Build: `npm run build` → Publish: `dist` → Env: `VITE_API_URL=https://tvuj-render-url.onrender.com/api`
3. **Render:** Přidej `ALLOWED_ORIGINS=https://tvuj-netlify-url.netlify.app`
4. ✅ Hotovo!

---

Potřebuješ pomoc? Napiš mi! 🚀

