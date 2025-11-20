#!/bin/bash
echo "🧹 Nettoyage complet des caches..."

# Nettoyer cache Metro
rm -rf node_modules/.cache

# Nettoyer cache Expo
rm -rf .expo

# Nettoyer cache Babel
rm -rf node_modules/.cache/babel-loader

# Nettoyer watchman (si installé)
watchman watch-del-all 2>/dev/null || true

# Nettoyer cache npm
npm cache clean --force 2>/dev/null || true

echo "✅ Caches nettoyés!"
echo ""
echo "🚀 Redémarrez maintenant avec:"
echo "   npx expo start --clear"
