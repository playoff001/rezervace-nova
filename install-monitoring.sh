#!/bin/bash

# Instalační skript pro monitoring
# Spusť na serveru: sudo bash install-monitoring.sh

set -e

echo "=== Instalace monitoring skriptu ==="

# Zkontroluj, jestli běží jako root
if [ "$EUID" -ne 0 ]; then 
    echo "Chyba: Spusť skript jako root (sudo)"
    exit 1
fi

# Zjisti, kde je skript (mělo by být v kořenové složce projektu)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITORING_SCRIPT="$SCRIPT_DIR/monitoring.sh"

if [ ! -f "$MONITORING_SCRIPT" ]; then
    echo "Chyba: monitoring.sh nenalezen v $SCRIPT_DIR"
    exit 1
fi

# Zkopíruj skript do /usr/local/bin
echo "Kopíruji monitoring.sh do /usr/local/bin/..."
cp "$MONITORING_SCRIPT" /usr/local/bin/rezervace-monitoring.sh
chmod +x /usr/local/bin/rezervace-monitoring.sh

# Vytvoř log soubor
touch /var/log/rezervace-monitoring.log
chmod 644 /var/log/rezervace-monitoring.log

# Zkontroluj, jestli je nainstalovaný mailutils
if ! command -v mail &> /dev/null; then
    echo "Instaluji mailutils..."
    apt-get update
    DEBIAN_FRONTEND=noninteractive apt-get install -y mailutils
    echo "Mailutils nainstalován. Možná bude potřeba nakonfigurovat (vyber 'Internet Site' a mail name: aplikace.eu)"
fi

# Zkontroluj, jestli už není v crontab
if crontab -l 2>/dev/null | grep -q "rezervace-monitoring.sh"; then
    echo "Monitoring už je v crontab, přeskočeno"
else
    echo "Přidávám monitoring do crontab (každých 5 minut)..."
    (crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/rezervace-monitoring.sh") | crontab -
fi

# Test spuštění
echo "Testuji monitoring skript..."
/usr/local/bin/rezervace-monitoring.sh

echo ""
echo "=== Instalace dokončena ==="
echo "Monitoring běží každých 5 minut"
echo "Logy: sudo tail -f /var/log/rezervace-monitoring.log"
echo "Test: sudo /usr/local/bin/rezervace-monitoring.sh"
echo "Crontab: sudo crontab -l"


