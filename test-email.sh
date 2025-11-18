#!/bin/bash

# Testovací skript pro odeslání e-mailu z monitoring systému

EMAIL="dolezal.jiri@seznam.cz"

echo "Odesílám testovací e-mail na $EMAIL..."

echo "Toto je testovací e-mail z monitoring systému rezervačního formuláře.

Monitoring systém je správně nakonfigurovaný a e-maily fungují.

Čas odeslání: $(date '+%Y-%m-%d %H:%M:%S')
Server: $(hostname)
IP adresa: $(curl -4 -s ifconfig.me 2>/dev/null || echo 'Neznámá')

Pokud jsi obdržel tento e-mail, monitoring systém funguje správně!" | mail -s "TEST: Monitoring systém rezervačního formuláře" "$EMAIL"

if [ $? -eq 0 ]; then
    echo "✓ Testovací e-mail byl úspěšně odeslán na $EMAIL"
    echo "Zkontroluj svou e-mailovou schránku."
else
    echo "✗ Chyba při odesílání e-mailu"
    echo "Zkontroluj konfiguraci mailutils:"
    echo "  sudo dpkg-reconfigure postfix"
fi

