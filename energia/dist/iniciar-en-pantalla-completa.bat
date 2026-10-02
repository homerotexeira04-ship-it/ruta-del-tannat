@echo off
setlocal
rem Abre la Ruta de la Energia en pantalla completa (modo kiosco), con Google Chrome o, si no hay, con Microsoft Edge.
rem Dejar este archivo en la misma carpeta que ruta-de-la-energia.html (la carpeta no debe tener espacios en el nombre).
rem Para que arranque con Windows: Win+R, escribir shell:startup y poner ahi un acceso directo a este archivo.
rem Con un teclado, Alt+F4 cierra el modo kiosco.

set "JUEGO=%~dp0ruta-de-la-energia.html"
if not exist "%JUEGO%" goto sinjuego
set "URL=file:///%JUEGO:\=/%"

set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if exist "%CHROME%" goto conchrome
set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if exist "%CHROME%" goto conchrome
set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if exist "%CHROME%" goto conchrome
goto sinchrome

:conchrome
start "" "%CHROME%" --kiosk --disable-pinch --overscroll-history-navigation=0 --noerrdialogs --disable-infobars --disable-session-crashed-bubble --no-first-run --no-default-browser-check --autoplay-policy=no-user-gesture-required --user-data-dir="%LocalAppData%\RutaEnergia" "%URL%"
exit /b 0

:sinchrome
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if exist "%EDGE%" goto conedge
set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if exist "%EDGE%" goto conedge
echo No se encontro Google Chrome ni Microsoft Edge. Instalar Chrome y volver a abrir este archivo.
pause
exit /b 1

:conedge
start "" "%EDGE%" --kiosk --edge-kiosk-type=fullscreen --disable-pinch --overscroll-history-navigation=0 --no-first-run --autoplay-policy=no-user-gesture-required --user-data-dir="%LocalAppData%\RutaEnergiaEdge" "%URL%"
exit /b 0

:sinjuego
echo No se encuentra ruta-de-la-energia.html junto a este archivo.
pause
exit /b 1
