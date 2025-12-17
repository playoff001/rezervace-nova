# 🔒 DEFINITIVNÍ OPRAVA SSL PRO IPv6 - Kompletní řešení

## 📋 Problém

- ❌ **IPv4:** Funguje správně (Let's Encrypt certifikát)
- ❌ **IPv6:** Self-signed certifikát → varování o nebezpečí
- ❌ **Důsledek:** Polovina uživatelů (s IPv6) dostává varování o nebezpečném webu

**Příčina:** Nginx používá pro IPv6 jiný (self-signed) certifikát než pro IPv4.

---

## ✅ DEFINITIVNÍ ŘEŠENÍ (Krok za krokem)

### Krok 1: Připoj se na server

```bash
ssh root@aplikace.eu
# Nebo ssh root@188.245.98.208
```

### Krok 2: Zkontroluj aktuální stav

```bash
# Najdi Nginx konfigurační soubor pro aplikace.eu
DOMAIN="aplikace.eu"
CONFIG_FILE=$(grep -l "$DOMAIN" /etc/nginx/sites-enabled/* 2>/dev/null | head -1)

# Pokud nenajde, použij default
[ -z "$CONFIG_FILE" ] && CONFIG_FILE="/etc/nginx/sites-enabled/default"

echo "=== DIAGNOSTIKA ==="
echo "Konfigurační soubor: $CONFIG_FILE"
echo ""
echo "1. Aktuální IPv6 listen direktivy:"
grep -n "listen \[::\]" "$CONFIG_FILE" || echo "IPv6 nenalezen"
echo ""
echo "2. SSL certifikáty v konfiguraci:"
grep -n "ssl_certificate" "$CONFIG_FILE" | grep -v "^#" || echo "SSL nenalezen"
echo ""
echo "3. Dostupné Let's Encrypt certifikáty:"
certbot certificates 2>/dev/null | grep -A 10 "$DOMAIN" || echo "Let's Encrypt certifikát nenalezen"
echo ""
echo "4. Test aktuálního certifikátu (IPv4):"
echo | openssl s_client -connect aplikace.eu:443 -servername aplikace.eu 2>/dev/null | openssl x509 -noout -subject -issuer 2>/dev/null || echo "Nelze připojit"
echo ""
echo "5. Test aktuálního certifikátu (IPv6):"
echo | openssl s_client -connect [2a00:4b40:aaaa:2011:0:0:0:6]:443 -servername aplikace.eu 2>/dev/null | openssl x509 -noout -subject -issuer 2>/dev/null || echo "Nelze připojit (IPv6)"
```

### Krok 3: ZÁLOHA konfigurace (DŮLEŽITÉ!)

```bash
# Vytvoř zálohu
cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Záloha vytvořena: ${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
```

### Krok 4: Vytvoř/obnov Let's Encrypt certifikát

```bash
# Instalace Certbotu (pokud není nainstalovaný)
if ! command -v certbot &> /dev/null; then
    echo "Instaluji Certbot..."
    apt update
    apt install -y certbot python3-certbot-nginx
fi

# Vytvoř nebo obnov certifikát pro aplikace.eu
echo "Vytvářím/obnovuji Let's Encrypt certifikát..."
certbot --nginx -d aplikace.eu -d www.aplikace.eu \
    --non-interactive \
    --agree-tos \
    --email admin@aplikace.eu \
    --redirect \
    --force-renewal

# Ověř, že certifikát existuje
CERT_PATH="/etc/letsencrypt/live/aplikace.eu/fullchain.pem"
KEY_PATH="/etc/letsencrypt/live/aplikace.eu/privkey.pem"

if [ ! -f "$CERT_PATH" ] || [ ! -f "$KEY_PATH" ]; then
    echo "❌ CHYBA: Certifikát nebyl vytvořen!"
    exit 1
fi

echo "✅ Certifikát vytvořen: $CERT_PATH"
```

### Krok 5: OPRAVA Nginx konfigurace pro IPv6

Otevři konfigurační soubor:
```bash
nano "$CONFIG_FILE"
```

**Najdi server blok pro `aplikace.eu` a ujisti se, že vypadá TAKTO:**

```nginx
# Redirect HTTP → HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name aplikace.eu www.aplikace.eu;
    return 301 https://$server_name$request_uri;
}

# HTTPS server blok
server {
    # IPv4
    listen 443 ssl http2;
    
    # IPv6 - DŮLEŽITÉ: Musí mít STEJNÝ certifikát jako IPv4!
    listen [::]:443 ssl http2;
    
    server_name aplikace.eu www.aplikace.eu;
    
    # SSL certifikáty - STEJNÉ pro IPv4 i IPv6!
    ssl_certificate /etc/letsencrypt/live/aplikace.eu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aplikace.eu/privkey.pem;
    
    # Moderní SSL nastavení
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS (doporučeno)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Root a index
    root /var/www/aplikace.eu;  # NEBO tvůj root
    index index.html index.htm;
    
    # API proxy (pokud máš backend)
    location /api {
        proxy_pass http://localhost:3002;  # NEBO tvůj backend port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Statické soubory (frontend)
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache pro statické soubory
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Gzip komprese
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
}
```

**KLÍČOVÉ BODY:**
- ✅ `listen [::]:443 ssl http2;` - IPv6 MUSÍ mít SSL
- ✅ `ssl_certificate` musí být `/etc/letsencrypt/live/aplikace.eu/fullchain.pem`
- ✅ STEJNÝ certifikát pro IPv4 i IPv6 (stejné řádky!)
- ✅ Žádný jiný `server` blok nesmí přepisovat IPv6 konfiguraci

### Krok 6: OVĚŘ konfiguraci a restartuj

```bash
# Test konfigurace
nginx -t

# Pokud je OK (syntax is ok, test is successful), restartuj
if [ $? -eq 0 ]; then
    systemctl restart nginx
    echo "✅ Nginx restartován"
else
    echo "❌ Chyba v konfiguraci - oprav to!"
    exit 1
fi
```

### Krok 7: OVĚŘ opravu

```bash
echo "=== OVĚŘENÍ OPRAVY ==="
echo ""
echo "1. IPv4 certifikát:"
echo | openssl s_client -connect aplikace.eu:443 -servername aplikace.eu 2>/dev/null | openssl x509 -noout -subject -issuer -dates
echo ""
echo "2. IPv6 certifikát:"
echo | openssl s_client -connect [2a00:4b40:aaaa:2011:0:0:0:6]:443 -servername aplikace.eu 2>/dev/null | openssl x509 -noout -subject -issuer -dates
echo ""
echo "3. Test HTTP → HTTPS redirect:"
curl -I http://aplikace.eu 2>&1 | grep -i "location\|301"
echo ""
echo "4. Test HTTPS (IPv4):"
curl -I https://aplikace.eu 2>&1 | head -3
echo ""
echo "✅ Pokud oba certifikáty ukazují 'Let's Encrypt' a stejný subject, je to OK!"
```

### Krok 8: Otestuj na SSL Labs

Počkej **5-10 minut** (DNS cache) a otestuj:

1. **SSL Labs:** https://www.ssllabs.com/ssltest/analyze.html?d=aplikace.eu
   - Očekávaný výsledek: **Grade A** pro IPv4 i IPv6

2. **V prohlížeči:**
   - Otevři https://aplikace.eu
   - Měl by být zelený zámek 🔒
   - Klikni na zámek → "Certifikát" → mělo by být "Let's Encrypt"

---

## 🚨 CO DĚLAT, KDYŽ TO STÁLE NEFUNGUJE

### Problém 1: Certbot neupravil IPv6

**Řešení:** Certbot někdy neupraví IPv6 konfiguraci. Musíš to udělat ručně (viz Krok 5).

### Problém 2: Je tu jiný server blok, který přepisuje IPv6

```bash
# Najdi všechny server bloky s IPv6
grep -rn "listen \[::\]" /etc/nginx/sites-enabled/

# Zkontroluj, jestli není default blok, který přepisuje
cat /etc/nginx/sites-enabled/default | grep -A 5 "listen \[::\]"
```

**Řešení:** Odstraň nebo zakomentuj konfliktní `server` bloky, nebo přesuň tvou konfiguraci nahoru v `sites-enabled/`.

### Problém 3: Hetzner používá defaultní certifikát pro IPv6

**Řešení:** Ujisti se, že tvůj `server` blok je první v pořadí:

```bash
# Zkontroluj pořadí
ls -la /etc/nginx/sites-enabled/

# Tvůj soubor by měl být první (např. 01-aplikace.eu nebo aplikace.eu)
# Default by měl být zakomentovaný nebo na konci
```

### Problém 4: DNS ještě nepřesměrovalo IPv6

**Řešení:** Počkej 10-30 minut a znovu otestuj. DNS změny se propagují.

---

## ❓ ODPOVĚDI NA TVOJE OTÁZKY

### 1. "Pomůže nahrát SSL certifikát přes Hetzner Cloud UI?"

**NE** - Tato možnost je pro **placené certifikáty** (Wildcard, EV certifikáty). Pro normální web je **Let's Encrypt zdarma** a **lepší řešení**. Hetzner UI ti nepomůže opravit problém s IPv6 - ten je v Nginx konfiguraci na serveru.

### 2. "Změnit nameservery na Hetzner?"

**Není nutné** - Pokud máš doménu jinde (např. u registrátora), můžeš:
- **Možnost A:** Nechat nameservery u registrátora a jen nastavit DNS záznamy (A, AAAA)
- **Možnost B:** Změnit nameservery na Hetzner a spravovat DNS tam (pohodlnější)

**Ale to NEPOMŮŽE** s problémem IPv6 SSL certifikátu - ten je v Nginx konfiguraci na serveru, ne v DNS.

### 3. "Něco nastavit v doméně?"

DNS záznamy musí být správné:
- **A záznam:** `aplikace.eu` → `188.245.98.208`
- **AAAA záznam:** `aplikace.eu` → `2a00:4b40:aaaa:2011:0:0:0:6`

Ale i když jsou DNS záznamy správně, problém je, že **server používá špatný certifikát pro IPv6**.

---

## ✅ FINÁLNÍ CHECKLIST

- [ ] Připojil jsem se k serveru přes SSH
- [ ] Vytvořil jsem zálohu Nginx konfigurace
- [ ] Vytvořil/obnovil jsem Let's Encrypt certifikát
- [ ] Upravil jsem Nginx konfiguraci - IPv6 má STEJNÝ certifikát jako IPv4
- [ ] Otestoval jsem konfiguraci: `nginx -t`
- [ ] Restartoval jsem Nginx
- [ ] Ověřil jsem, že oba (IPv4 i IPv6) používají Let's Encrypt certifikát
- [ ] Počkal jsem 10 minut a otestoval na SSL Labs
- [ ] Otestoval jsem v prohlížeči (Chrome, Firefox, mobil)
- [ ] Web se zobrazuje bez varování pro všechny uživatele

---

## 🎯 VÝSLEDEK

Po této opravě:
- ✅ **IPv4:** Grade A na SSL Labs
- ✅ **IPv6:** Grade A na SSL Labs
- ✅ **Všichni uživatelé:** Zelený zámek, žádná varování
- ✅ **Profesionální vzhled:** Důvěryhodný certifikát od Let's Encrypt

---

## 📞 Pokud to stále nefunguje

1. Zkontroluj logy: `tail -50 /var/log/nginx/error.log`
2. Zkontroluj certbot logy: `tail -50 /var/log/letsencrypt/letsencrypt.log`
3. Otestuj z různých míst (různé sítě, mobilní data)
4. Kontaktuj Hetzner podporu, pokud problém přetrvává











