#!/bin/bash

# DEFINITIVNÍ OPRAVA SSL PRO IPv6 na Hetzner serveru
# Spusť na serveru: bash ssl-oprava-ipv6.sh

set -e  # Zastav při chybě

DOMAIN="aplikace.eu"
CONFIG_FILE=$(grep -l "$DOMAIN" /etc/nginx/sites-enabled/* 2>/dev/null | head -1)
[ -z "$CONFIG_FILE" ] && CONFIG_FILE="/etc/nginx/sites-enabled/default"

echo "=========================================="
echo "  DEFINITIVNÍ OPRAVA SSL PRO IPv6"
echo "  Doména: $DOMAIN"
echo "  Konfigurace: $CONFIG_FILE"
echo "=========================================="
echo ""

# Záloha
echo "📦 Vytvářím zálohu..."
BACKUP_FILE="${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$CONFIG_FILE" "$BACKUP_FILE"
echo "✅ Záloha: $BACKUP_FILE"
echo ""

# Instalace Certbotu (pokud není)
if ! command -v certbot &> /dev/null; then
    echo "📥 Instaluji Certbot..."
    apt update
    apt install -y certbot python3-certbot-nginx
fi

# Vytvoření/obnovení certifikátu
echo "🔐 Vytvářím/obnovuji Let's Encrypt certifikát..."
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" \
    --non-interactive \
    --agree-tos \
    --email admin@$DOMAIN \
    --redirect \
    --force-renewal || {
    echo "⚠️ Certbot selhal, pokračuji s existujícím certifikátem..."
}

# Ověření existence certifikátu
CERT_PATH="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
KEY_PATH="/etc/letsencrypt/live/$DOMAIN/privkey.pem"

if [ ! -f "$CERT_PATH" ] || [ ! -f "$KEY_PATH" ]; then
    echo "❌ CHYBA: Certifikát neexistuje na $CERT_PATH"
    echo "Zkus spustit ručně: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    exit 1
fi

echo "✅ Certifikát nalezen: $CERT_PATH"
echo ""

# Kontrola a oprava Nginx konfigurace
echo "🔧 Kontroluji Nginx konfiguraci..."

# Zkontroluj, zda IPv6 má správný certifikát
if grep -q "listen \[::\]:443" "$CONFIG_FILE"; then
    echo "✅ IPv6 listen direktiva nalezena"
    
    # Zkontroluj, zda má správný certifikát
    if grep -A 5 "listen \[::\]:443" "$CONFIG_FILE" | grep -q "ssl_certificate.*$DOMAIN"; then
        echo "✅ IPv6 má správný certifikát"
    else
        echo "⚠️ IPv6 nemá správný certifikát, upravuji..."
        
        # Vytvoř dočasný soubor s opravou
        TEMP_FILE=$(mktemp)
        
        # Uprav konfiguraci - přidej SSL certifikát pro IPv6, pokud chybí
        awk -v domain="$DOMAIN" -v cert="$CERT_PATH" -v key="$KEY_PATH" '
        /listen \[::\]:443/ {
            print
            getline
            # Pokud další řádek není ssl_certificate, přidej ho
            if (!/ssl_certificate/) {
                print "    ssl_certificate " cert ";"
                print "    ssl_certificate_key " key ";"
            }
            print
            next
        }
        { print }
        ' "$CONFIG_FILE" > "$TEMP_FILE"
        
        mv "$TEMP_FILE" "$CONFIG_FILE"
        echo "✅ Konfigurace upravena"
    fi
else
    echo "⚠️ IPv6 listen direktiva chybí, přidávám..."
    
    # Přidej IPv6 listen za IPv4 listen
    sed -i '/listen 443 ssl http2;/a\    listen [::]:443 ssl http2;' "$CONFIG_FILE"
    echo "✅ IPv6 listen přidána"
fi

echo ""

# Test konfigurace
echo "🧪 Testuji Nginx konfiguraci..."
if nginx -t; then
    echo "✅ Konfigurace je platná"
    echo ""
    
    echo "🔄 Restartuji Nginx..."
    systemctl restart nginx
    echo "✅ Nginx restartován"
    echo ""
else
    echo "❌ CHYBA v konfiguraci!"
    echo "Obnovuji zálohu..."
    cp "$BACKUP_FILE" "$CONFIG_FILE"
    exit 1
fi

# Ověření
echo "=========================================="
echo "  OVĚŘENÍ"
echo "=========================================="
echo ""

echo "1. IPv4 certifikát:"
echo | openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" 2>/dev/null | \
    openssl x509 -noout -subject -issuer 2>/dev/null | head -2 || echo "Nelze ověřit"
echo ""

echo "2. IPv6 certifikát:"
IPV6="2a00:4b40:aaaa:2011:0:0:0:6"
echo | openssl s_client -connect "[$IPV6]:443" -servername "$DOMAIN" 2>/dev/null | \
    openssl x509 -noout -subject -issuer 2>/dev/null | head -2 || echo "Nelze ověřit (možná nemáš IPv6 připojení)"
echo ""

echo "3. Test HTTPS:"
curl -I "https://$DOMAIN" 2>&1 | head -3 || echo "Nelze připojit"
echo ""

echo "=========================================="
echo "  ✅ HOTOVO!"
echo "=========================================="
echo ""
echo "📋 Další kroky:"
echo "1. Počkej 5-10 minut (DNS cache)"
echo "2. Otestuj na SSL Labs: https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
echo "3. Otevři https://$DOMAIN v prohlížeči - měl by být zelený zámek"
echo ""
echo "🔙 Záloha je v: $BACKUP_FILE"



