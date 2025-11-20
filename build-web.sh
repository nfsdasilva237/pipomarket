#!/bin/bash

echo "========================================"
echo "🌐 Construction version WEB - PipoMarket"
echo "========================================"
echo ""

echo "📦 Étape 1: Nettoyage du cache..."
rm -rf node_modules/.cache
rm -rf .expo
rm -rf web-build
echo "✅ Cache nettoyé!"
echo ""

echo "📦 Étape 2: Installation des dépendances..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de l'installation"
    exit 1
fi
echo "✅ Dépendances installées!"
echo ""

echo "🔨 Étape 3: Construction de la version web..."
echo "(Cela peut prendre 2-5 minutes...)"
npx expo export:web
if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la construction"
    exit 1
fi
echo ""

echo "========================================"
echo "✅ CONSTRUCTION TERMINÉE!"
echo "========================================"
echo ""
echo "📁 Les fichiers web sont dans: web-build/"
echo ""
echo "📋 PROCHAINES ÉTAPES:"
echo ""
echo "1. Testez localement (optionnel):"
echo "   npx serve web-build"
echo ""
echo "2. Uploadez le CONTENU de web-build/ vers Hostinger:"
echo "   - Via FTP (FileZilla)"
echo "   - Via Gestionnaire de fichiers Hostinger"
echo "   - Destination: /public_html/ ou /domains/app.pipomarket.com/public_html"
echo ""
echo "3. Activez HTTPS/SSL dans Hostinger (obligatoire!)"
echo ""
echo "📖 Guide complet: GUIDE_DEPLOIEMENT_WEB.md"
echo "========================================"
echo ""
