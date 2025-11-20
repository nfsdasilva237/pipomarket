@echo off
echo ========================================
echo 🌐 Construction version WEB - PipoMarket
echo ========================================
echo.

echo 📦 Etape 1: Nettoyage du cache...
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist .expo rmdir /s /q .expo
if exist web-build rmdir /s /q web-build
echo ✅ Cache nettoye!
echo.

echo 📦 Etape 2: Installation des dependances...
call npm install
if errorlevel 1 (
    echo ❌ Erreur lors de l'installation
    pause
    exit /b 1
)
echo ✅ Dependances installees!
echo.

echo 🔨 Etape 3: Construction de la version web...
echo (Cela peut prendre 2-5 minutes...)
call npx expo export:web
if errorlevel 1 (
    echo ❌ Erreur lors de la construction
    pause
    exit /b 1
)
echo.

echo ========================================
echo ✅ CONSTRUCTION TERMINEE!
echo ========================================
echo.
echo 📁 Les fichiers web sont dans: web-build\
echo.
echo 📋 PROCHAINES ETAPES:
echo.
echo 1. Testez localement (optionnel):
echo    npx serve web-build
echo.
echo 2. Uploadez le CONTENU de web-build\ vers Hostinger:
echo    - Via FTP (FileZilla)
echo    - Via Gestionnaire de fichiers Hostinger
echo    - Destination: /public_html/ ou /domains/app.pipomarket.com/public_html
echo.
echo 3. Activez HTTPS/SSL dans Hostinger (obligatoire!)
echo.
echo 📖 Guide complet: GUIDE_DEPLOIEMENT_WEB.md
echo ========================================
echo.
pause
