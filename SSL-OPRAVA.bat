@echo off
chcp 65001 >nul
echo ==========================================
echo   DEFINITIVNÍ OPRAVA SSL PRO IPv6
echo   Doména: aplikace.eu
echo ==========================================
echo.

echo Tento skript ti pomůže opravit SSL certifikát pro IPv6.
echo.
echo Co se stane:
echo 1. Připojíš se na server přes SSH
echo 2. Nahráš opravný skript
echo 3. Spustíš opravu
echo.

pause

echo.
echo ==========================================
echo   KROK 1: Připojení na server
echo ==========================================
echo.
echo Zadej IP adresu serveru (nebo stiskni Enter pro aplikace.eu):
set /p SERVER_IP="Server IP nebo domain: "
if "%SERVER_IP%"=="" set SERVER_IP=aplikace.eu

echo.
echo Připojuji se na %SERVER_IP%...
echo Pokud tě to požádá o heslo, zadej: tnpKksN4TkkA
echo.

ssh root@%SERVER_IP%

echo.
echo ==========================================
echo   Hotovo!
echo ==========================================
echo.
echo Pokud se připojení nezdařilo, spusť ručně:
echo   ssh root@%SERVER_IP%
echo.
echo Pak pokračuj podle návodu v: SSL_DEFINITIVNI_OPRAVA.md
echo.

pause











