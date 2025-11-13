# ============================================
# PIPOMARKET - SETUP AUTOMATIQUE (PowerShell)
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  PIPOMARKET - CREATION AUTOMATIQUE" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier qu'on est dans le bon dossier
if (-Not (Test-Path "package.json")) {
    Write-Host "ERREUR: Vous n'etes pas dans le dossier pipomarket !" -ForegroundColor Red
    Write-Host "Veuillez executer : cd pipomarket" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "[1/4] Creation des dossiers..." -ForegroundColor Green
New-Item -ItemType Directory -Force -Path "data" | Out-Null
New-Item -ItemType Directory -Force -Path "screens" | Out-Null
Write-Host "    - Dossiers crees !" -ForegroundColor White
Write-Host ""

Write-Host "[2/4] Installation des dependances de navigation..." -ForegroundColor Green
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context
Write-Host "    - Dependances installees !" -ForegroundColor White
Write-Host ""

Write-Host "[3/4] Creation des fichiers vides..." -ForegroundColor Green
New-Item -ItemType File -Force -Path "data\appData.js" | Out-Null
New-Item -ItemType File -Force -Path "screens\HomeScreen.js" | Out-Null
New-Item -ItemType File -Force -Path "screens\StartupsScreen.js" | Out-Null
New-Item -ItemType File -Force -Path "screens\StartupDetailScreen.js" | Out-Null
New-Item -ItemType File -Force -Path "screens\CartScreen.js" | Out-Null
New-Item -ItemType File -Force -Path "screens\CheckoutScreen.js" | Out-Null
Write-Host "    - Fichiers crees !" -ForegroundColor White
Write-Host ""

Write-Host "[4/4] Affichage de la structure..." -ForegroundColor Green
Write-Host ""
Write-Host "Structure creee avec succes :" -ForegroundColor Cyan
Write-Host ""
Write-Host "pipomarket/" -ForegroundColor Yellow
Write-Host "  |-- App.js (a remplacer)" -ForegroundColor White
Write-Host "  |-- package.json" -ForegroundColor White
Write-Host "  |-- data/" -ForegroundColor Yellow
Write-Host "  |     |-- appData.js (a remplir)" -ForegroundColor White
Write-Host "  |-- screens/" -ForegroundColor Yellow
Write-Host "  |     |-- HomeScreen.js (a remplir)" -ForegroundColor White
Write-Host "  |     |-- StartupsScreen.js (a remplir)" -ForegroundColor White
Write-Host "  |     |-- StartupDetailScreen.js (a remplir)" -ForegroundColor White
Write-Host "  |     |-- CartScreen.js (a remplir)" -ForegroundColor White
Write-Host "  |     |-- CheckoutScreen.js (a remplir)" -ForegroundColor White
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  STRUCTURE CREEE AVEC SUCCES !" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "PROCHAINES ETAPES :" -ForegroundColor Yellow
Write-Host "1. Copiez le contenu des fichiers depuis Claude" -ForegroundColor White
Write-Host "2. Lancez : npm start" -ForegroundColor White
Write-Host ""
pause
