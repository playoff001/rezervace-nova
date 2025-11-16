# 📤 Nahrání projektu na GitHub - Rychlý návod

## Metoda 1: Přes GitHub Desktop (nejjednodušší)

### 1. Stáhni GitHub Desktop
- Jdi na https://desktop.github.com/
- Stáhni a nainstaluj

### 2. Přihlas se
- Otevři GitHub Desktop
- Přihlas se svým GitHub účtem

### 3. Vytvoř repozitář na GitHubu
1. Jdi na https://github.com/
2. Klikni **"+"** (vpravo nahoře) → **"New repository"**
3. Vyplň:
   - **Name:** `rezervacni-system` (nebo jak chceš)
   - **Public** (pro testování můžeš Public)
   - **NECH nezaškrtnuté:** README, .gitignore, license (máš je už)
4. Klikni **"Create repository"**

### 4. Přidej projekt do GitHub Desktop
1. V GitHub Desktop: **File** → **Add Local Repository**
2. Klikni **"Choose..."** a vyber složku: `C:\Users\Dolez\OneDrive\Dokumenty\GitHub\rezervace`
3. Klikni **"Add repository"**

### 5. Commit a Push
1. V GitHub Desktop uvidíš všechny soubory
2. Dole napiš commit message: `Initial commit - rezervacni system`
3. Klikni **"Commit to main"**
4. Klikni **"Publish repository"**
5. Vyber repozitář, který jsi vytvořil
6. Klikni **"Publish repository"**

✅ **Hotovo!** Projekt je na GitHubu.

---

## Metoda 2: Přes příkazovou řádku (PowerShell)

### 1. Vytvoř repozitář na GitHubu
- Stejně jako v Metodě 1, krok 3

### 2. Otevři PowerShell ve složce projektu

```powershell
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

**Nahraď:**
- `USERNAME` - tvé GitHub uživatelské jméno
- `REPO_NAME` - název repozitáře (např. `rezervacni-system`)

---

## ✅ Co dál?

Po nahrání na GitHub pokračuj podle **QUICK_START.md**:
1. Nasazení backendu na Render
2. Nasazení frontendu na GitHub Pages

---

## 🔍 Jak zjistit URL repozitáře?

Po vytvoření repozitáře na GitHubu uvidíš URL, např.:
```
https://github.com/USERNAME/rezervacni-system
```

Tuto URL použiješ při připojování v Render a GitHub Desktop.




