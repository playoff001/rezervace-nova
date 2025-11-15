# 🚀 Rychlý start - Nasazení na živý web (zdarma pro testování)

Tento návod ti ukáže, jak nasadit aplikaci **zdarma** pro testování:
- **Frontend:** GitHub Pages (zdarma, automatická doména)
- **Backend:** Render Free (zdarma, s uspáváním)

---

## Krok 1: Nahrání projektu na GitHub

### 1.1 Vytvoř nový repozitář na GitHubu

1. Jdi na https://github.com/
2. Klikni na **"+"** (vpravo nahoře) → **"New repository"**
3. Vyplň:
   - **Repository name:** `rezervacni-system` (nebo jak chceš)
   - **Description:** (volitelné)
   - **Public** nebo **Private** (pro testování můžeš Public)
   - **NECH zaškrtnuté:** "Add a README file" (máš ho už)
   - **NECH nezaškrtnuté:** .gitignore, license (máš je už)
4. Klikni **"Create repository"**

### 1.2 Nahraj projekt do GitHubu

Otevři PowerShell/Terminal ve složce projektu a spusť:

```bash
# Přejdi do složky projektu
cd "C:\Users\Dolez\OneDrive\Dokumenty\GitHub\rezervace"

# Inicializuj Git (pokud ještě není)
git init

# Přidej všechny soubory
git add .

# Vytvoř první commit
git commit -m "Initial commit - rezervacni system"

# Přidej GitHub repozitář (nahraď USERNAME a REPO_NAME)
git remote add origin https://github.com/USERNAME/REPO_NAME.git

# Nahraj na GitHub
git branch -M main
git push -u origin main
```

**Nebo použij GitHub Desktop:**
1. Stáhni GitHub Desktop: https://desktop.github.com/
2. File → Add Local Repository → vyber složku projektu
3. Commit & Push

---

## Krok 2: Nasazení backendu na Render (zdarma)

### 2.1 Vytvoř Web Service na Render

1. Jdi na https://dashboard.render.com/
2. Přihlas se (máš účet)
3. Klikni **"New +"** → **"Web Service"**
4. **Připoj GitHub:**
   - Pokud ještě nemáš připojený GitHub, klikni "Connect GitHub"
   - Autorizuj Render přístup
   - Vyber repozitář `rezervacni-system`
5. **Nastavení:**
   - **Name:** `rezervace-backend`
   - **Region:** Frankfurt (nebo nejbližší)
   - **Branch:** `main`
   - **Root Directory:** (nech prázdné)
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm run server`
   - **Plan:** **Free** (zdarma pro testování)
6. **Environment Variables:**
   - Klikni "Advanced"
   - Přidej:
     ```
     NODE_ENV=production
     ```
7. Klikni **"Create Web Service"**
8. **Počkej na nasazení** (2-5 minut)
9. **Zkopíruj URL backendu:**
   - Uvidíš URL, např.: `https://rezervace-backend.onrender.com`
   - **Tuto URL si zkopíruj!** Budeš ji potřebovat

⚠️ **Poznámka:** Free plan se uspí po 15 minutách nečinnosti. První požadavek po probuzení může trvat 30-60 sekund.

---

## Krok 3: Nasazení frontendu na GitHub Pages (zdarma)

### 3.1 Vytvoř GitHub Actions workflow

1. V GitHub repozitáři klikni na **"Settings"** (nahoře)
2. Vlevo klikni na **"Secrets and variables"** → **"Actions"**
3. Klikni **"New repository secret"**
4. Přidej:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://tvuj-render-url.onrender.com/api`
   - (Nahraď `tvuj-render-url.onrender.com` skutečnou URL z Render)
5. Klikni **"Add secret"**

### 3.2 Vytvoř GitHub Actions workflow soubor

V projektu vytvoř složku a soubor:
- Složka: `.github/workflows/`
- Soubor: `deploy.yml`

**Obsah souboru `.github/workflows/deploy.yml`:**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
        run: npm run build
      
      - name: Setup Pages
        uses: actions/configure-pages@v3
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: './dist'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

### 3.3 Nahraj soubor na GitHub

```bash
# Přidej soubor
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Pages deployment"
git push
```

### 3.4 Povol GitHub Pages

1. V GitHub repozitáři: **Settings** → **Pages** (vlevo)
2. **Source:** Vyber **"GitHub Actions"**
3. Ulož

### 3.5 Získej URL frontendu

1. Po pushnutí se automaticky spustí GitHub Actions
2. Sleduj progress: **Actions** tab (nahoře v repozitáři)
3. Po úspěšném nasazení získej URL:
   - **Settings** → **Pages**
   - Uvidíš URL, např.: `https://USERNAME.github.io/rezervacni-system`
   - **Tuto URL si zkopíruj!**

---

## Krok 4: Nastav CORS na backendu

1. V Render projektu klikni na **"Environment"**
2. Přidej novou proměnnou:
   ```
   ALLOWED_ORIGINS=https://USERNAME.github.io,https://USERNAME.github.io/rezervacni-system
   ```
   (Nahraď `USERNAME` a `rezervacni-system` skutečnými hodnotami)
3. Klikni **"Save Changes"**
4. Render automaticky restartuje službu

---

## ✅ Hotovo!

Aplikace je nasazena zdarma:
- **Frontend:** `https://USERNAME.github.io/rezervacni-system`
- **Backend:** `https://rezervace-backend.onrender.com`

---

## 🔧 Testování

1. Otevři URL frontendu v prohlížeči
2. Zkus vytvořit rezervaci
3. Pokud backend spí (Free plan), první požadavek může trvat 30-60 sekund

---

## ⚠️ Důležité poznámky

### Backend (Render Free):
- ✅ Zdarma
- ⚠️ Uspává se po 15 minutách nečinnosti
- ⚠️ První požadavek po probuzení je pomalý (30-60 sekund)
- 💡 Pro produkci zvaž Starter plan ($7/měsíc)

### Frontend (GitHub Pages):
- ✅ Zdarma
- ✅ Automatické nasazení při pushnutí
- ✅ Automatická HTTPS doména

---

## 🐛 Troubleshooting

### Frontend se nenačítá
- Zkontroluj GitHub Actions logy (Actions tab)
- Zkontroluj, že `VITE_API_URL` secret je nastaven

### API nefunguje
- Zkontroluj, že backend běží (Render dashboard)
- Zkontroluj CORS nastavení v Render
- Zkontroluj konzoli prohlížeče (F12) pro chyby

### Backend se nespustí
- Zkontroluj logy v Render (Logs tab)
- Zkontroluj, že `npm run server` funguje lokálně

---

## 📝 Co dál?

Po testování můžeš:
1. **Upgradovat Render na Starter** ($7/měsíc) - rychlejší, vždy běží
2. **Přesunout frontend na Netlify** - lepší funkce, stále zdarma
3. **Přidat vlastní doménu** - profesionálnější vzhled

Potřebuješ pomoc? Napiš mi! 🚀

