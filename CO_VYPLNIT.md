# 📝 Co vyplnit - Konkrétní hodnoty

## 🔧 Backend na Render - Co vyplnit

### Při vytváření Web Service:

1. **Name:**
   ```
   rezervace-backend
   ```
   (nebo jakýkoliv název, který chceš)

2. **Region:**
   ```
   Frankfurt (EU)
   ```
   (nebo nejbližší k ČR)

3. **Branch:**
   ```
   main
   ```
   (nebo `master` pokud máš starší repo)

4. **Root Directory:**
   ```
   (nech prázdné)
   ```

5. **Runtime:**
   ```
   Node
   ```

6. **Build Command:**
   ```
   npm install
   ```

7. **Start Command:**
   ```
   npm run server
   ```

8. **Plan:**
   ```
   Free
   ```
   (pro testování zdarma)

### Environment Variables (v "Advanced"):

1. Klikni na **"Advanced"**
2. V sekci **"Environment Variables"** klikni **"Add Environment Variable"**
3. Přidej:
   - **Key:** `NODE_ENV`
   - **Value:** `production`
4. Klikni **"Add"**

---

## 🌐 URL backendu - Kde ho najdeš?

**URL backendu dostaneš až PO nasazení na Render!**

### Jak zjistit URL backendu:

1. **Po vytvoření Web Service** na Render:
   - Render začne buildovat (vidíš progress)
   - Počkej 2-5 minut na dokončení

2. **Po úspěšném nasazení:**
   - V Render dashboardu uvidíš svůj Web Service
   - **Nahoře uvidíš URL**, např.:
     ```
     https://rezervace-backend.onrender.com
     ```
   - **Tuto URL si zkopíruj!**

3. **Pokud nevidíš URL:**
   - Klikni na název Web Service
   - Vpravo nahoře uvidíš URL
   - Nebo v sekci "Settings" → "Custom Domain" (ale použij tu automatickou)

### Příklad URL backendu:
```
https://rezervace-backend.onrender.com
```

**Důležité:** URL backendu je vždy ve formátu:
```
https://NAZEV-SLUZBY.onrender.com
```

---

## 🔐 GitHub Secrets - Co vyplnit

### V GitHub repozitáři:

1. Jdi do **Settings** → **Secrets and variables** → **Actions**

2. Klikni **"New repository secret"**

3. **Name:**
   ```
   VITE_API_URL
   ```
   (musí být přesně takto, včetně velkých písmen)

4. **Value:**
   ```
   https://TVUJ-NAZEV-BACKENDU.onrender.com/api
   ```
   (nahraď `TVUJ-NAZEV-BACKENDU` skutečným názvem z Render)

### Příklad:

Pokud máš backend URL: `https://rezervace-backend.onrender.com`

Pak v GitHub Secrets vyplň:
- **Name:** `VITE_API_URL`
- **Value:** `https://rezervace-backend.onrender.com/api`

**Poznámka:** Na konci musí být `/api`!

---

## 🔄 CORS na Render - Co vyplnit

### Po nasazení frontendu na GitHub Pages:

1. V Render projektu klikni na **"Environment"** (vlevo)

2. Klikni **"Add Environment Variable"**

3. **Key:**
   ```
   ALLOWED_ORIGINS
   ```

4. **Value:**
   ```
   https://TVUJ-USERNAME.github.io,https://TVUJ-USERNAME.github.io/NAZEV-REPO
   ```
   (nahraď `TVUJ-USERNAME` a `NAZEV-REPO` skutečnými hodnotami)

### Příklad:

Pokud máš GitHub Pages URL: `https://jan-novak.github.io/rezervacni-system`

Pak vyplň:
- **Key:** `ALLOWED_ORIGINS`
- **Value:** `https://jan-novak.github.io,https://jan-novak.github.io/rezervacni-system`

**Poznámka:** Můžeš přidat více URL oddělených čárkou (bez mezer).

---

## 📋 Shrnutí - Pořadí kroků

### 1. Backend na Render
- ✅ Vyplň hodnoty výše
- ✅ Počkej na nasazení
- ✅ **Zkopíruj URL backendu** (např. `https://rezervace-backend.onrender.com`)

### 2. GitHub Secrets
- ✅ Přidej secret `VITE_API_URL`
- ✅ Value: `https://TVUJ-BACKEND-URL.onrender.com/api`

### 3. Frontend na GitHub Pages
- ✅ Pushni změny (workflow se spustí automaticky)
- ✅ Získej URL frontendu (např. `https://USERNAME.github.io/REPO-NAME`)

### 4. CORS na Render
- ✅ Přidej `ALLOWED_ORIGINS` s URL frontendu

---

## ❓ Časté otázky

### Q: Jaký je můj URL backendu?
**A:** Dostaneš ho až po nasazení na Render. Bude ve formátu `https://NAZEV.onrender.com`

### Q: Musím čekat na URL backendu před nasazením frontendu?
**A:** Ano, potřebuješ ho pro GitHub Secret `VITE_API_URL`

### Q: Co když se URL backendu změní?
**A:** URL se nemění, pokud nezměníš název služby na Render

### Q: Jak zjistím svůj GitHub username?
**A:** Vpravo nahoře na GitHubu uvidíš své jméno, nebo v URL: `https://github.com/TVOJ-USERNAME`

---

Potřebuješ pomoc s konkrétními hodnotami? Napiš mi! 🚀




