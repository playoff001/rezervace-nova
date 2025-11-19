# 🚀 Nasazení změn na server po pushnutí na GitHub

## 📋 Krok za krokem - Rychlý návod

### Možnost 1: Nasazení přes SSH (pokud máš VPS server)

#### Krok 1: Připoj se na server přes SSH

```bash
ssh root@aplikace.eu
# Nebo ssh root@188.245.98.208
# Heslo: tnpKksN4TkkA
```

#### Krok 2: Přejdi do složky s aplikací

```bash
cd /var/www/rezervace-nova
# NEBO kamkoliv máš aplikaci
```

#### Krok 3: Stáhni změny z GitHubu

```bash
# Pokud používáš Git:
git pull origin main
# NEBO
git pull origin master

# Pokud to nejde, zkontroluj, jestli máš správnou branch:
git branch
git status
```

#### Krok 4: Nainstaluj závislosti (pokud jsou nové)

```bash
npm install
```

#### Krok 5: Sestav frontend (build)

```bash
npm run build
```

#### Krok 6: Restartuj aplikaci přes PM2

```bash
pm2 restart rezervace
# NEBO pokud se jmenuje jinak:
pm2 restart all

# Zkontroluj status:
pm2 status
pm2 logs rezervace --lines 50
```

#### Krok 7: Ověř, že to funguje

```bash
# Zkontroluj logy:
pm2 logs rezervace --lines 20

# Zkontroluj, že aplikace běží:
pm2 status
```

---

### Možnost 2: Nasazení přes SCP (pokud nemáš Git na serveru)

#### Krok 1: Na lokálním počítači (Windows)

Otevři PowerShell nebo CMD a přejdi do složky s projektem:

```powershell
cd "C:\Users\Dolez\OneDrive\Dokumenty\Novy-Github\rezervace-nova"
```

#### Krok 2: Sestav aplikaci lokálně

```powershell
npm install
npm run build
```

#### Krok 3: Nahraj soubory na server

```powershell
# Nahraj sestavenou aplikaci (dist + server + package.json)
scp -r dist root@aplikace.eu:/var/www/rezervace-nova/
scp -r server root@aplikace.eu:/var/www/rezervace-nova/
scp package.json root@aplikace.eu:/var/www/rezervace-nova/
scp ecosystem.config.js root@aplikace.eu:/var/www/rezervace-nova/

# NEBO nahraj všechny soubory (kromě node_modules):
scp -r * root@aplikace.eu:/var/www/rezervace-nova/ --exclude node_modules
```

#### Krok 4: Připoj se na server a restartuj

```bash
ssh root@aplikace.eu
cd /var/www/rezervace-nova
npm install --production
pm2 restart rezervace
```

---

### Možnost 3: Automatické nasazení (CI/CD)

Pokud máš nastavené automatické nasazení (GitHub Actions, GitLab CI, atd.):

1. Zkontroluj, jestli běží workflow v GitHubu:
   - Jdi na GitHub → tvůj projekt → "Actions" tab
   - Zkontroluj, jestli proběhl build po posledním pushi

2. Pokud workflow selhal:
   - Klikni na selhaný build
   - Zkontroluj logy, kde se to zlomilo
   - Oprav chybu a pushni znovu

---

## 🔧 Co dělat, když to nefunguje

### Problém 1: "git pull" nefunguje

```bash
# Zkontroluj, jestli jsi na správné větvi:
git branch

# Pokud nejsi na main/master:
git checkout main
# NEBO
git checkout master

# Zkontroluj remote:
git remote -v

# Pokud nemáš nastavený remote:
git remote add origin https://github.com/TVUJ_USERNAME/rezervace-nova.git
```

### Problém 2: Konflikty při git pull

```bash
# Pokud máš konflikty:
git stash  # Ulož lokální změny
git pull   # Stáhni změny
git stash pop  # Obnov lokální změny a vyřeš konflikty ručně
```

### Problém 3: Build selhal

```bash
# Zkontroluj logy build:
npm run build

# Pokud jsou chyby, oprav je a zkus znovu:
npm install
npm run build
```

### Problém 4: PM2 restart nefunguje

```bash
# Zkontroluj, jestli aplikace běží:
pm2 status

# Pokud neběží, spusť:
pm2 start ecosystem.config.js

# Pokud je problém, zkontroluj logy:
pm2 logs rezervace --lines 100

# Pokud potřebuješ úplný restart:
pm2 delete rezervace
pm2 start ecosystem.config.js
```

### Problém 5: Aplikace nefunguje po nasazení

```bash
# Zkontroluj logy:
pm2 logs rezervace --lines 100

# Zkontroluj, jestli běží správný port:
netstat -tulpn | grep 3002
# NEBO
ss -tulpn | grep 3002

# Zkontroluj Nginx:
systemctl status nginx
tail -50 /var/log/nginx/error.log
```

---

## ✅ Kontrolní checklist

- [ ] Připojil jsem se na server přes SSH
- [ ] Stáhl jsem změny z GitHubu (`git pull`)
- [ ] Nainstaloval jsem závislosti (`npm install`)
- [ ] Sestavil jsem aplikaci (`npm run build`)
- [ ] Restartoval jsem aplikaci (`pm2 restart rezervace`)
- [ ] Zkontroloval jsem, že aplikace běží (`pm2 status`)
- [ ] Zkontroloval jsem logy (`pm2 logs`)
- [ ] Otestoval jsem aplikaci v prohlížeči

---

## 📞 Potřebuješ pomoc?

Pokud nic z toho nefunguje, řekni mi:
1. Jakou chybu vidíš? (zkopíruj chybovou hlášku)
2. Jaký způsob nasazení používáš? (SSH+Git, SCP, automatické)
3. Kde máš aplikaci na serveru? (`/var/www/rezervace-nova` nebo jiná cesta?)
4. Jaký příkaz spouštíš na serveru? (`pm2 start` nebo jiný?)

