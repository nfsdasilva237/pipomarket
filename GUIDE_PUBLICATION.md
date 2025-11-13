# 🚀 GUIDE DE PUBLICATION - PIPOMARKET

## ✅ CE QUI EST PRÊT

Votre application est maintenant prête pour la publication ! Voici ce qui a été fait :

### Code
- ✅ Warnings ESLint réduits (0 erreurs, 3 warnings non-bloquants)
- ✅ Dépendances npm installées (0 vulnérabilités)
- ✅ Code optimisé avec useCallback pour meilleures performances
- ✅ Configuration Firebase en place
- ✅ Règles Firestore sécurisées

### Configuration
- ✅ app.json complété avec toutes les métadonnées
- ✅ eas.json créé pour EAS Build
- ✅ Bundle identifiers configurés: `com.pipomarket.app`
- ✅ Permissions Android/iOS définies
- ✅ Icônes et splash screens configurés

---

## 📋 ÉTAPES POUR PUBLIER

### 1. Prérequis

#### A. Créer un compte EAS (gratuit)
```bash
npm install -g eas-cli
eas login
```

Créer un compte sur https://expo.dev si vous n'en avez pas.

#### B. Lier le projet
```bash
eas build:configure
```

Cela va créer un `projectId` dans votre app.json automatiquement.

#### C. Comptes développeur (payants)
- **Google Play Console**: 25$ (paiement unique)
  - https://play.google.com/console
- **Apple Developer Program**: 99$/an
  - https://developer.apple.com/programs/

---

### 2. Configuration Firebase Native

Pour Android et iOS, vous devez ajouter les fichiers de configuration native :

#### Android (google-services.json)
1. Aller sur https://console.firebase.google.com
2. Sélectionner votre projet `pipomarket-4da97`
3. Cliquer sur l'icône Android (ou ajouter une app Android)
4. Package name : `com.pipomarket.app`
5. Télécharger `google-services.json`
6. Le placer dans : `/google-services.json` (racine du projet)
7. Ajouter dans `app.json` :
```json
"android": {
  "googleServicesFile": "./google-services.json",
  ...
}
```

#### iOS (GoogleService-Info.plist)
1. Dans Firebase Console, ajouter une app iOS
2. Bundle ID: `com.pipomarket.app`
3. Télécharger `GoogleService-Info.plist`
4. Le placer dans : `/GoogleService-Info.plist`
5. Ajouter dans `app.json` :
```json
"ios": {
  "googleServicesFile": "./GoogleService-Info.plist",
  ...
}
```

---

### 3. Build Android (Google Play Store)

#### A. Premier build
```bash
eas build --platform android --profile production
```

Cette commande va :
- Compiler votre app en AAB (Android App Bundle)
- Prendre environ 10-15 minutes
- Vous donner un lien de téléchargement

#### B. Soumettre sur Google Play
```bash
eas submit --platform android
```

OU manuellement :
1. Aller sur https://play.google.com/console
2. Créer une nouvelle application
3. Uploader l'AAB téléchargé
4. Remplir les informations :
   - Screenshots (2-8 images)
   - Description courte (80 caractères max)
   - Description complète
   - Icône 512x512
   - Feature graphic 1024x500
   - Politique de confidentialité (URL)

---

### 4. Build iOS (App Store)

#### A. Premier build
```bash
eas build --platform ios --profile production
```

#### B. Soumettre sur App Store
```bash
eas submit --platform ios
```

Vous aurez besoin :
- Compte Apple Developer (99$/an)
- App Store Connect configuré
- Certificats et profils (EAS gère ça automatiquement)

---

## 🔧 CONFIGURATIONS IMPORTANTES

### 1. Changer le projectId EAS

Après `eas build:configure`, votre `app.json` sera mis à jour avec le vrai projectId :
```json
"extra": {
  "eas": {
    "projectId": "votre-vrai-id-ici"
  }
}
```

### 2. Vérifier les assets

Assurez-vous que tous ces fichiers existent :
- ✅ `./assets/images/icon.png` (1024x1024)
- ✅ `./assets/images/splash-icon.png`
- ✅ `./assets/images/android-icon-foreground.png`
- ✅ `./assets/images/android-icon-monochrome.png`
- ✅ `./assets/images/favicon.png`

### 3. Tester avant publication

```bash
# Build preview (APK pour tester sur Android)
eas build --platform android --profile preview

# Une fois le build terminé, télécharger l'APK et tester
```

---

## 📱 SCREENSHOTS REQUIS

### Google Play Store
Vous devez fournir :
- **Téléphone** : Au moins 2 screenshots (max 8)
  - Format : JPG ou PNG
  - Dimension min : 320px
  - Dimension max : 3840px
  - Ratio : entre 16:9 et 9:16

- **Tablette 7"** : Au moins 1 screenshot
- **Tablette 10"** : Au moins 1 screenshot

### App Store (iOS)
- Screenshots pour différentes tailles d'iPhone
- Screenshots pour iPad si supporté

---

## 🔐 SÉCURITÉ - POINTS IMPORTANTS

### Avant publication

1. **Retirer les console.log de debug** (optionnel mais recommandé)
```bash
# Pour trouver tous les console.log :
grep -r "console.log" --include="*.js" --exclude-dir=node_modules .
```

2. **Activer Firebase App Check** (fortement recommandé)
   - Protège contre les abus d'API
   - https://firebase.google.com/docs/app-check

3. **Vérifier les règles Firestore**
   - ✅ Déjà configurées dans `firestore.rules`
   - Déployer : `firebase deploy --only firestore:rules`

---

## 📄 DOCUMENTS REQUIS

### 1. Politique de confidentialité (OBLIGATOIRE)
Créer une page web avec votre politique de confidentialité :
- Quelles données vous collectez
- Comment elles sont utilisées
- Comment les supprimer

Exemple : https://yourwebsite.com/privacy-policy

### 2. Conditions d'utilisation (Recommandé)
https://yourwebsite.com/terms-of-service

### 3. Contact support
Un email de contact pour les utilisateurs.

---

## 🚨 CHECKLIST FINALE AVANT PUBLICATION

- [ ] Fichiers Firebase natifs ajoutés (google-services.json, GoogleService-Info.plist)
- [ ] projectId EAS configuré dans app.json
- [ ] Tous les assets (icônes, splash) présents et au bon format
- [ ] App testée sur vraiment devices (pas juste émulateur)
- [ ] Screenshots préparés (2-8 pour Android)
- [ ] Politique de confidentialité créée et hébergée
- [ ] Description de l'app rédigée (courte et longue)
- [ ] Compte Google Play Console créé (25$)
- [ ] Compte Apple Developer créé si iOS (99$/an)
- [ ] Tous les flux testés :
  - [ ] Inscription/Connexion
  - [ ] Ajout au panier
  - [ ] Paiement
  - [ ] Upload de photo
  - [ ] Notifications
  - [ ] Messages/Chat

---

## 💡 COMMANDES UTILES

```bash
# Voir l'état de vos builds
eas build:list

# Voir les détails d'un build
eas build:view [build-id]

# Tester localement (development build)
eas build --platform android --profile development

# Voir les logs de build
eas build:view --logs

# Soumettre une nouvelle version
# 1. Mettre à jour la version dans app.json
# 2. Build
eas build --platform android --profile production
# 3. Submit
eas submit --platform android
```

---

## 🎯 TIMELINE ESTIMÉE

| Étape | Temps |
|-------|-------|
| Configuration EAS | 10-15 min |
| Ajout fichiers Firebase | 5-10 min |
| Premier build Android | 15-20 min |
| Préparation screenshots | 30-60 min |
| Création compte Google Play | 15-30 min |
| Soumission app | 20-40 min |
| **TOTAL** | **~2-3 heures** |
| Validation Google Play | **1-7 jours** |

---

## 📞 SUPPORT

### Documentation officielle
- Expo : https://docs.expo.dev
- EAS Build : https://docs.expo.dev/build/introduction/
- EAS Submit : https://docs.expo.dev/submit/introduction/

### En cas de problème
1. Vérifier les logs : `eas build:view --logs`
2. Consulter la doc Expo
3. Forum Expo : https://forums.expo.dev

---

## 🎉 APRÈS PUBLICATION

Une fois l'app publiée :

### Mises à jour futures
Pour publier une nouvelle version :
1. Modifier le code
2. Incrémenter la version dans `app.json` :
   - Android : `versionCode` (1, 2, 3...)
   - iOS : `buildNumber` (1, 2, 3...)
   - version générale : "1.0.1", "1.0.2"...
3. Rebuild et resubmit :
```bash
eas build --platform android --profile production
eas submit --platform android
```

### Monitoring
- Firebase Analytics (déjà configuré)
- Google Play Console (statistiques)
- App Store Connect (statistiques iOS)

---

**Bonne chance pour votre publication ! 🚀**

*Si vous avez des questions, n'hésitez pas !*
