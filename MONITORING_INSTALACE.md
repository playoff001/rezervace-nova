# Instalace monitoring skriptu

## 1. Nahrání skriptu na server

Skript `monitoring.sh` nahraj na server do složky `/usr/local/bin/`:

```bash
# Na lokálním počítači (z složky projektu)
scp monitoring.sh root@aplikace.eu:/usr/local/bin/rezervace-monitoring.sh

# Nebo na serveru vytvoř soubor ručně:
sudo nano /usr/local/bin/rezervace-monitoring.sh
# (zkopíruj obsah monitoring.sh)
```

## 2. Nastavení oprávnění

```bash
sudo chmod +x /usr/local/bin/rezervace-monitoring.sh
```

## 3. Instalace mailu (pokud není nainstalovaný)

```bash
sudo apt-get update
sudo apt-get install -y mailutils

# Při instalaci se tě zeptá na konfiguraci - vyber "Internet Site"
# A jako mail name zadej: aplikace.eu
```

## 4. Testování skriptu

```bash
# Spusť skript ručně
sudo /usr/local/bin/rezervace-monitoring.sh

# Zkontroluj log
sudo tail -20 /var/log/rezervace-monitoring.log

# Zkontroluj, jestli přišel e-mail (pokud je nějaký problém)
```

## 5. Nastavení automatického spouštění (cron)

```bash
# Otevři crontab
sudo crontab -e

# Přidej tento řádek (kontrola každých 5 minut):
*/5 * * * * /usr/local/bin/rezervace-monitoring.sh

# Nebo každých 10 minut:
*/10 * * * * /usr/local/bin/rezervace-monitoring.sh

# Nebo každou hodinu:
0 * * * * /usr/local/bin/rezervace-monitoring.sh
```

## 6. Kontrola logů

```bash
# Zobraz poslední logy
sudo tail -50 /var/log/rezervace-monitoring.log

# Sleduj logy v reálném čase
sudo tail -f /var/log/rezervace-monitoring.log
```

## Co skript kontroluje:

1. **Nginx služba** - jestli běží
2. **Nginx konfigurace** - jestli neobsahuje chyby
3. **PM2 proces** - jestli backend aplikace běží
4. **Backend API** - jestli API odpovídá
5. **Webová stránka** - jestli aplikace.eu odpovídá

## Co se stane při problému:

- Skript pošle e-mail na: dolezal.jiri@seznam.cz
- E-mail se pošle pouze jednou (aby nebyl spam)
- Po opravě problému se alert resetuje a při dalším problému se pošle znovu

## Ruční testování:

```bash
# Simuluj problém - zastav Nginx
sudo systemctl stop nginx

# Počkej 5-10 minut (nebo spusť skript ručně)
sudo /usr/local/bin/rezervace-monitoring.sh

# Měl by přijít e-mail

# Oprav problém
sudo systemctl start nginx

# Počkej další kontrolu - alert by se měl resetovat
```


