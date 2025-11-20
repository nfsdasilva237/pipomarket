# 🚀 LANCEMENT RAPIDE - PIPOMARKET

## ⚡ PUBLICATION EN 5 ÉTAPES

### 1️⃣ INSTALLATION EAS (5 min)
```bash
npm install -g eas-cli
eas login
cd /home/user/pipomarket
eas init
```

### 2️⃣ BUILD ANDROID (30 min)
```bash
# Build de test
eas build --platform android --profile preview

# Tester l'APK téléchargé

# Build production
eas build --platform android --profile production
```

### 3️⃣ PUBLIER SUR PLAY STORE (2h)
1. Créer compte Play Console: https://play.google.com/console (25$)
2. Créer nouvelle app "PipoMarket"
3. Uploader le `.aab` depuis expo.dev
4. Remplir fiche (voir GUIDE_PUBLICATION.md)
5. Soumettre pour examen

### 4️⃣ BUILD iOS (30 min) - OPTIONNEL
```bash
# Nécessite compte Apple Developer (99$/an)
eas build --platform ios --profile production
```

### 5️⃣ PUBLIER SUR APP STORE (3h)
1. Créer compte Apple Developer
2. Uploader via `eas submit -p ios`
3. Configurer App Store Connect
4. Soumettre pour examen

---

## 📋 AVANT DE COMMENCER

### Documents requis:
- ✅ Politique de confidentialité (obligatoire)
- ✅ Conditions d'utilisation
- ✅ Email de support

### Assets requis:
- ✅ Icône 512x512 (déjà dans assets/images/icon.png)
- ⬜ Feature Graphic 1024x500
- ⬜ 4-8 Screenshots

### Comptes requis:
- ✅ Compte Expo (gratuit)
- ⬜ Google Play Console (25$ une fois)
- ⬜ Apple Developer (99$/an) - OPTIONNEL

---

## 🎯 CONFIGURATION MINIMALE POUR ANDROID

### Étape 1: Vérifier app.json
```json
{
  "expo": {
    "name": "PipoMarket",
    "version": "1.0.0",
    "android": {
      "package": "com.pipomarket.app",
      "versionCode": 1
    }
  }
}
```

### Étape 2: Build
```bash
eas build -p android --profile production
```

### Étape 3: Télécharger AAB
Aller sur: https://expo.dev → Projects → pipomarket → Builds

### Étape 4: Upload sur Play Store
Google Play Console → Production → Créer version → Upload AAB

---

## 📱 TEST RAPIDE AVANT PUBLICATION

```bash
# 1. Build APK de test
eas build -p android --profile preview

# 2. Télécharger et installer sur votre téléphone

# 3. Vérifier:
- ✅ Inscription/Connexion
- ✅ Création startup
- ✅ Ajout produits
- ✅ Passage commande
- ✅ Paiement Mobile Money
- ✅ Notifications
```

---

## 💡 CONSEILS PRO

### ✅ À FAIRE:
- Tester sur au moins 2 appareils Android différents
- Demander à 5 amis de tester l'APK preview
- Créer une page Facebook/Instagram avant le lancement
- Préparer 10 posts pour la première semaine

### ❌ À ÉVITER:
- Publier sans avoir testé les paiements
- Oublier la politique de confidentialité
- Négliger la description de l'app
- Publier sans avoir de plan marketing

---

## 🎁 BONUS: SCRIPTS UTILES

### Vérifier que tout est OK:
```bash
npm run lint
expo doctor
```

### Tester en local:
```bash
npm start
# Scanner QR code avec Expo Go
```

### Mettre à jour version:
```json
// app.json
"version": "1.0.1",
"android": { "versionCode": 2 }
```

---

## 📞 BESOIN D'AIDE?

- 📖 Guide complet: `GUIDE_PUBLICATION.md`
- 🌐 Expo Docs: https://docs.expo.dev
- 💬 Discord: https://chat.expo.dev
- 📧 Support: [votre-email@pipomarket.com]

---

## ⏱️ TIMELINE RÉALISTE

| Étape | Durée | Détails |
|-------|-------|---------|
| Setup EAS | 10 min | Installation + login |
| Build Android | 30 min | Build serveur Expo |
| Tests APK | 2h | Tests complets |
| Config Play Store | 2h | Première fois |
| Examen Google | 1-3 jours | Automatique |
| **TOTAL** | **~1 semaine** | Premier lancement |

Pour les mises à jour: **1-2h** seulement!

---

🚀 **PRÊT À DÉCOLLER?**

```bash
# COMMANDE MAGIQUE:
eas build --platform android --profile production
```

Bonne chance! 🇨🇲
