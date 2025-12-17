# 🔧 Oprava line endings (CRLF → LF)

## 📋 Problém

Windows používá CRLF (`\r\n`) pro konec řádků, ale Linux/Unix/GitHub používá LF (`\n`). 
To může způsobit problémy při nasazení na server.

Varování: "This diff contains a change in line endings from 'LF' to 'CRLF'."

## ✅ Řešení

### Krok 1: Nastav Git pro automatickou konverzi

```bash
# Globálně (pro všechny repozitáře):
git config --global core.autocrlf true

# NEBO lokálně (jen pro tento projekt):
cd "C:\Users\Dolez\OneDrive\Dokumenty\Novy-Github\rezervace-nova"
git config core.autocrlf true
```

### Krok 2: Převeď stávající soubory na LF

```bash
# Zkontroluj aktuální stav:
git ls-files -e | head

# Pokud máš soubory s CRLF, převeď je:
git add --renormalize .
```

### Krok 3: Commit změny

```bash
# Pokud vidíš změny po renormalize:
git add .gitattributes
git commit -m "Oprava line endings - nastavení LF pro všechny soubory"
```

### Krok 4: Push na GitHub

```bash
git push origin main
# NEBO
git push origin master
```

---

## 🔍 Kontrola

### Zkontroluj aktuální nastavení:

```bash
# Zkontroluj Git config:
git config core.autocrlf

# Mělo by být: true (pro Windows)
```

### Pokud to pořád nefunguje:

```bash
# Manuálně převeď všechny textové soubory:
git rm --cached -r .
git reset --hard
git add .
git commit -m "Oprava line endings"
```

---

## ⚠️ Poznámka

Po této úpravě:
- **Na Windows:** Git automaticky převede LF → CRLF při checkout
- **Na Linux/Mac:** Git použije LF
- **V repository:** Všechny soubory budou mít LF

To zajistí, že všechny platformy budou mít konzistentní line endings!










