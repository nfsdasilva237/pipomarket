@echo off
echo 🧹 Nettoyage complet des caches...

rem Nettoyer cache Metro
if exist node_modules\.cache (
    echo Suppression node_modules\.cache...
    rmdir /s /q node_modules\.cache
)

rem Nettoyer cache Expo
if exist .expo (
    echo Suppression .expo...
    rmdir /s /q .expo
)

rem Nettoyer cache Babel
if exist node_modules\.cache\babel-loader (
    echo Suppression babel-loader cache...
    rmdir /s /q node_modules\.cache\babel-loader
)

echo.
echo ✅ Caches nettoyés!
echo.
echo 🚀 Redémarrez maintenant avec:
echo    npx expo start --clear
echo.
pause
