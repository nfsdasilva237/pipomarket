#!/bin/bash
# Script de nettoyage du cache Metro et redémarrage propre

echo "🧹 Nettoyage du cache Metro..."
echo ""

# 1. Arrêter tous les processus Metro
echo "1️⃣ Arrêt des processus Metro..."
pkill -f "react-native" || true
pkill -f "metro" || true
sleep 2

# 2. Nettoyer le cache Watchman
echo "2️⃣ Nettoyage du cache Watchman..."
watchman watch-del-all 2>/dev/null || echo "   ⚠️ Watchman non disponible (normal sur Windows)"

# 3. Nettoyer le cache Metro
echo "3️⃣ Suppression du cache Metro..."
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/haste-map-* 2>/dev/null || true
rm -rf $TMPDIR/react-native-* 2>/dev/null || true

# 4. Nettoyer le cache npm
echo "4️⃣ Nettoyage du cache npm..."
npm cache clean --force

# 5. Nettoyer les caches Android (si applicable)
echo "5️⃣ Nettoyage des caches Android..."
cd android 2>/dev/null && ./gradlew clean && cd .. || echo "   ⚠️ Android non disponible"

echo ""
echo "✅ Nettoyage terminé!"
echo ""
echo "📱 Pour redémarrer l'application, exécutez:"
echo "   npx react-native start --reset-cache"
echo ""
echo "   Puis dans un autre terminal:"
echo "   npm run android"
