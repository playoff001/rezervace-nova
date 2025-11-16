# 🚀 Nasazení na GitHub Pages (Frontend) + Backend

GitHub Pages je zdarma, ale má omezení - servuje jen statické soubory. Backend musí být jinde (Railway, Render).

## ⚠️ Omezení GitHub Pages

- ✅ Zdarma
- ✅ Automatické nasazení z GitHubu
- ❌ Jen statické soubory (frontend)
- ❌ Žádný server-side kód
- ❌ Musíš mít backend jinde

---

## Krok 1: Připrav backend (Railway nebo Render)

Postupuj podle **NETLIFY_DEPLOYMENT.md** - Krok 1.

Získej URL backendu, např.: `https://rezervace-backend.railway.app`

---

## Krok 2: Uprav Vite konfiguraci pro GitHub Pages

GitHub Pages servuje aplikaci z podsložky (pokud není to hlavní repo), takže musíme upravit base path.

### Pokud je to hlavní repo (username.github.io):

```bash
# Vite automaticky použije správný base path
```

### Pokud je to projekt repo (username.github.io/repo-name):

Musíme nastavit `base` v `vite.config.ts`:

```typescript
export default defineConfig({
  base: '/repo-name/', // Nahraď 'repo-name' názvem tvého repo
  // ... zbytek konfigurace
});
```

---

## Krok 3: Nastav environment variable

V GitHub Actions nebo lokálně před buildem nastav:

```bash
VITE_API_URL=https://tvuj-backend-url.railway.app/api
```

---

## Krok 4: GitHub Actions pro automatické nasazení

Vytvoř soubor `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main  # nebo 'master'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
        run: npm run build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## Krok 5: Nastav GitHub Secrets

1. Jdi do repo → Settings → Secrets and variables → Actions
2. Klikni na "New repository secret"
3. Přidej:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://tvuj-backend-url.railway.app/api`

---

## Krok 6: Povol GitHub Pages

1. Jdi do repo → Settings → Pages
2. **Source:** Vyber "GitHub Actions"
3. Ulož

---

## Krok 7: Nastav CORS na backendu

V Railway/Render nastav environment variable:

```
ALLOWED_ORIGINS=https://username.github.io,https://username.github.io/repo-name
```

---

## ✅ Hotovo!

Po pushnutí do `main` branch se automaticky nasadí na GitHub Pages.

URL bude: `https://username.github.io/repo-name` (nebo `https://username.github.io` pokud je to hlavní repo)

---

## 🔧 Troubleshooting

### Build selže
- Zkontroluj GitHub Actions logy
- Zkontroluj, že `VITE_API_URL` secret je nastaven

### API nefunguje
- Zkontroluj, že `VITE_API_URL` je správně nastaveno
- Zkontroluj CORS na backendu
- Zkontroluj konzoli prohlížeče

---

## 💡 Tip

GitHub Pages je zdarma, ale má omezení. Pro produkční aplikaci doporučuji **Netlify** (také zdarma, ale lepší funkce).



