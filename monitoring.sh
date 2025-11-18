#!/bin/bash

# Monitoring skript pro rezervační systém
# Kontroluje Nginx, aplikaci a backend API

# Konfigurace
EMAIL="dolezal.jiri@seznam.cz"
LOG_FILE="/var/log/rezervace-monitoring.log"
ALERT_FILE="/tmp/rezervace-alert-sent"

# Funkce pro logování
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Funkce pro odeslání e-mailu
send_alert() {
    local subject="$1"
    local message="$2"
    
    # Odešli e-mail pouze pokud jsme ho ještě neposlali (aby nebyly spam)
    if [ ! -f "$ALERT_FILE" ]; then
        echo "$message" | mail -s "$subject" "$EMAIL" 2>/dev/null
        if [ $? -eq 0 ]; then
            log "ALERT: E-mail odeslán - $subject"
            touch "$ALERT_FILE"
        else
            log "CHYBA: Nepodařilo se odeslat e-mail"
        fi
    fi
}

# Funkce pro reset alertu (když vše funguje)
reset_alert() {
    if [ -f "$ALERT_FILE" ]; then
        rm "$ALERT_FILE"
        log "OK: Vše funguje, alert resetován"
    fi
}

# Kontrola Nginx
check_nginx() {
    if systemctl is-active --quiet nginx; then
        log "OK: Nginx běží"
        return 0
    else
        log "CHYBA: Nginx neběží!"
        send_alert "ALERT: Nginx neběží na aplikace.eu" "Nginx služba neběží na serveru. Zkontroluj: sudo systemctl status nginx"
        return 1
    fi
}

# Kontrola Nginx konfigurace
check_nginx_config() {
    if nginx -t > /dev/null 2>&1; then
        log "OK: Nginx konfigurace je v pořádku"
        return 0
    else
        log "CHYBA: Nginx konfigurace obsahuje chyby!"
        local error=$(nginx -t 2>&1)
        send_alert "ALERT: Chyba v Nginx konfiguraci" "Nginx konfigurace obsahuje chyby:\n\n$error\n\nZkontroluj: sudo nginx -t"
        return 1
    fi
}

# Kontrola dostupnosti aplikace.eu
check_website() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://aplikace.eu 2>/dev/null)
    
    if [ "$response" = "200" ] || [ "$response" = "301" ] || [ "$response" = "302" ]; then
        log "OK: aplikace.eu odpovídá (HTTP $response)"
        return 0
    else
        log "CHYBA: aplikace.eu neodpovídá (HTTP $response)"
        send_alert "ALERT: aplikace.eu neodpovídá" "Webová stránka https://aplikace.eu neodpovídá správně.\n\nHTTP kód: $response\n\nZkontroluj:\n- sudo systemctl status nginx\n- sudo tail -50 /var/log/nginx/error.log"
        return 1
    fi
}

# Kontrola backend API
check_api() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://localhost:3002/api/rooms 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        log "OK: Backend API funguje (HTTP $response)"
        return 0
    else
        log "CHYBA: Backend API nefunguje (HTTP $response)"
        send_alert "ALERT: Backend API nefunguje" "Backend API na localhost:3002 neodpovídá správně.\n\nHTTP kód: $response\n\nZkontroluj:\n- pm2 status\n- pm2 logs rezervace --lines 50"
        return 1
    fi
}

# Kontrola PM2 procesu
check_pm2() {
    if pm2 list | grep -q "rezervace.*online"; then
        log "OK: PM2 proces rezervace běží"
        return 0
    else
        log "CHYBA: PM2 proces rezervace neběží!"
        send_alert "ALERT: Backend aplikace neběží" "PM2 proces 'rezervace' neběží.\n\nZkontroluj:\n- pm2 status\n- pm2 logs rezervace --lines 50\n\nRestart: pm2 restart rezervace"
        return 1
    fi
}

# Hlavní kontrola
main() {
    log "=== Spouštím monitoring kontrolu ==="
    
    local errors=0
    
    # Proved všechny kontroly
    check_nginx || ((errors++))
    check_nginx_config || ((errors++))
    check_pm2 || ((errors++))
    check_api || ((errors++))
    check_website || ((errors++))
    
    # Pokud vše funguje, resetuj alert
    if [ $errors -eq 0 ]; then
        reset_alert
        log "OK: Všechny kontroly prošly úspěšně"
    else
        log "CHYBA: Nalezeno $errors problémů"
    fi
    
    log "=== Monitoring kontrola dokončena ===\n"
}

# Spusť monitoring
main

