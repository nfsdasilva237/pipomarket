# 🚀 GUIDE PRATIQUE - Publication Play Store & App Store

## 📋 Vue d'ensemble rapide

| Plateforme | Temps build | Temps review | Coût | Difficulté |
|------------|-------------|--------------|------|------------|
| **Play Store** | 20-30 min | 3-7 jours | 25$ (unique) | ⭐⭐ Facile |
| **App Store** | 20-30 min | 1-2 semaines | 99$/an | ⭐⭐⭐ Moyen |

---

## 🎯 ÉTAPE 1: Préparation (AVANT de commencer)

### A. Créer les comptes développeurs

**Play Store (Android)**
1. Va sur: https://play.google.com/console/signup
2. Paye 25$ (une seule fois, à vie)
3. Remplis informations développeur
4. ⏱️ Activation: immédiate

**App Store (iOS)**
1. Va sur: https://developer.apple.com/programs/enroll/
2. Paye 99$/an
3. Remplis informations développeur
4. ⏱️ Activation: 24-48 heures (parfois plus long)

---

## 🔧 ÉTAPE 2: Installation EAS CLI

Ouvre ton terminal Windows et exécute:

```bash
npm install -g eas-cli
```

Vérifie l'installation:
```bash
eas --version
```

---

## 📱 ÉTAPE 3: Build ANDROID (Play Store)

### A. Connexion et initialisation

```bash
# 1. Se connecter à Expo
eas login

# 2. Initialiser le projet EAS
eas init

# 3. Configurer le projet
eas build:configure
```

Quand il demande:
- **"Select platform"**: Choisis `All` (pour préparer iOS aussi)

### B. Vérifier app.json

Assure-toi que ces infos sont correctes dans `app.json`:

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

### C. Lancer le build Android

```bash
eas build --platform android --profile production
```

**Ce qui va se passer:**
1. Upload de ton code vers Expo
2. Build dans le cloud (20-30 minutes)
3. Tu recevras un email quand c'est prêt
4. Tu pourras télécharger le fichier `.aab`

**Pendant l'attente**, prépare ta fiche Play Store (voir ÉTAPE 4).

---

## 📝 ÉTAPE 4: Préparer la fiche Play Store

### A. Assets nécessaires

**1. Feature Graphic (OBLIGATOIRE)**
- Dimensions: **1024 x 500 px**
- Format: PNG ou JPG
- Contenu: Logo + Texte "PipoMarket - Marketplace Camerounaise"
- Outil: Canva, Photoshop, ou GIMP

**2. Screenshots Android (MINIMUM 2)**
- Dimensions recommandées: **1080 x 1920 px** (ou captures de ton émulateur)
- Minimum: 2 screenshots
- Recommandé: 4-8 screenshots
- Contenu suggéré:
  - Écran d'accueil avec produits
  - Page produit
  - Panier
  - Profil startup
  - Commandes

**Comment prendre des screenshots:**
```bash
# Lance l'app en émulateur
npx expo run:android

# Dans l'émulateur, appuie sur les boutons capture d'écran
# Ou utilise ton téléphone Android et prends des captures
```

**3. Icône app**
- Déjà prêt: `assets/images/icon.png` (1024x1024)

### B. Textes à préparer

**Description courte (80 caractères max)**
```
Marketplace camerounaise - Découvrez et soutenez les startups locales
```

**Description complète (4000 caractères max)**
```
🛍️ PipoMarket - La marketplace qui met en valeur les startups camerounaises

Découvrez des produits uniques créés par des entrepreneurs locaux passionnés. PipoMarket connecte les startups camerounaises avec leurs clients, facilitant l'achat et la promotion de produits locaux.

✨ FONCTIONNALITÉS

🏪 Pour les acheteurs:
• Parcourez des centaines de produits de startups locales
• Commandez facilement avec livraison à domicile
• Payez via Mobile Money (Orange Money, MTN)
• Suivez vos commandes en temps réel
• Découvrez de nouvelles startups chaque jour

🚀 Pour les startups:
• Créez votre boutique en quelques minutes
• Gérez vos produits et stocks
• Recevez des commandes instantanément
• 3 formules d'abonnement adaptées à vos besoins
• Dashboard complet pour suivre vos ventes

💳 PAIEMENT SIMPLE
Paiement sécurisé via Mobile Money:
• Orange Money
• MTN Mobile Money
Transaction rapide et sécurisée

📦 CATÉGORIES
• Mode & Accessoires
• Alimentation & Boissons
• Technologie
• Artisanat
• Beauté & Cosmétiques
• Et bien plus...

🇨🇲 100% CAMEROUNAIS
PipoMarket est fier de soutenir l'entrepreneuriat local. Chaque achat aide une startup camerounaise à grandir.

Téléchargez maintenant et rejoignez le mouvement #ConsommerLocal 🇨🇲🔥

---

📧 Support: support@pipomarket.com
🌐 Site web: https://pipomarket.com
```

**Catégorie:** Shopping
**Type de contenu:** Pour tous publics
**E-mail de contact:** Ton email
**Politique de confidentialité:** Tu devras en créer une (voir section ci-dessous)

---

## 🔒 ÉTAPE 5: Politique de confidentialité (OBLIGATOIRE)

Tu DOIS avoir une URL de politique de confidentialité. Deux options:

### Option A: Créer une page sur ton site BDL Studio

Crée une page `pipomarket.com/privacy` avec ce template:

```markdown
# Politique de confidentialité - PipoMarket

Dernière mise à jour: [Date]

## 1. Données collectées
Nous collectons:
- Nom et prénom
- Adresse email
- Numéro de téléphone
- Informations de livraison
- Historique de commandes

## 2. Utilisation des données
Vos données sont utilisées pour:
- Traiter vos commandes
- Vous contacter concernant vos achats
- Améliorer nos services

## 3. Partage des données
Nous ne vendons jamais vos données. Nous les partageons uniquement avec:
- Les startups pour traiter vos commandes
- Les services de paiement (Mobile Money)

## 4. Sécurité
Vos données sont stockées de manière sécurisée sur Firebase (Google Cloud).

## 5. Vos droits
Vous pouvez:
- Consulter vos données
- Demander leur suppression
- Modifier vos informations

Contact: [votre-email]
```

### Option B: Utiliser un générateur en ligne

- https://www.privacypolicygenerator.info/
- https://app-privacy-policy-generator.firebaseapp.com/

---

## 📤 ÉTAPE 6: Soumission sur Play Store

### A. Télécharger le build

1. Quand le build est prêt, va sur: https://expo.dev/accounts/[ton-compte]/projects/pipomarket/builds
2. Clique sur le build Android
3. Télécharge le fichier `.aab`

### B. Upload sur Play Console

1. Va sur: https://play.google.com/console
2. Clique **"Créer une application"**
3. Remplis:
   - Nom: **PipoMarket**
   - Langue par défaut: **Français**
   - Type: **Application**
   - Gratuite/Payante: **Gratuite**

4. **Section "Production"** → **"Créer une version"**
5. Upload le fichier `.aab`
6. Remplis tous les champs:
   - Feature graphic
   - Screenshots
   - Description courte
   - Description complète
   - Icône
   - Catégorie
   - Email de contact
   - Politique de confidentialité

7. **Questionnaire de contenu**:
   - Pas de contenu pour adultes: **Non**
   - Annonces: **Non** (sauf si tu fais de la pub)
   - Collecte de données: **Oui** (email, nom, téléphone)

8. **Tarification**: Gratuite dans tous les pays

9. Clique **"Vérifier la version"**
10. Clique **"Déployer en production"**

### C. Attente de la review

- ⏱️ **3 à 7 jours** en moyenne
- Tu recevras un email de Google
- Statut visible dans Play Console

---

## 🍎 ÉTAPE 7: Build iOS (App Store)

### A. Prérequis

**Important**: Tu DOIS avoir un Mac ou accès à un Mac pour certaines étapes (signature des apps). Mais EAS peut gérer ça pour toi dans le cloud!

### B. Configuration iOS dans app.json

Vérifie que `app.json` contient:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.pipomarket.app",
      "buildNumber": "1"
    }
  }
}
```

### C. Lancer le build iOS

```bash
eas build --platform ios --profile production
```

**EAS va te demander:**
- **"Generate a new Apple Distribution Certificate?"**: Choisis **Yes**
- **"Generate a new Apple Provisioning Profile?"**: Choisis **Yes**

EAS va gérer automatiquement:
- Création des certificats
- Signature de l'app
- Upload vers Apple

**⏱️ Durée**: 20-30 minutes

### D. Pendant l'attente: Prépare App Store Connect

1. Va sur: https://appstoreconnect.apple.com
2. Clique **"Mes apps"** → **"+"** → **"Nouvelle app"**
3. Remplis:
   - **Plateformes**: iOS
   - **Nom**: PipoMarket
   - **Langue principale**: Français
   - **Bundle ID**: com.pipomarket.app (doit correspondre à app.json)
   - **SKU**: pipomarket (identifiant unique, choisis ce que tu veux)

---

## 📝 ÉTAPE 8: Préparer la fiche App Store

### A. Assets nécessaires

**1. Screenshots iPhone (OBLIGATOIRE)**

Tu as besoin de 2 tailles minimum:

**iPhone 6.7" (iPhone 15 Pro Max, 14 Pro Max, etc.)**
- Dimensions: **1290 x 2796 px**
- Minimum: 3 screenshots

**iPhone 6.5" (iPhone 11 Pro Max, XS Max, etc.)**
- Dimensions: **1242 x 2688 px**
- Minimum: 3 screenshots

**Comment les créer:**
- Utilise le simulateur iOS (si tu as un Mac)
- Ou redimensionne tes screenshots Android avec Photoshop/GIMP
- Ou utilise un outil comme https://www.mokup.ai/

**2. Screenshots iPad (OPTIONNEL)**

Si tu veux supporter iPad:
- Dimensions: **2048 x 2732 px**

**3. Icône app**
- Déjà prêt: `assets/images/icon.png` (1024x1024)

### B. Textes à préparer

**Nom de l'app (30 caractères max)**
```
PipoMarket
```

**Sous-titre (30 caractères max)**
```
Marketplace Camerounaise
```

**Description (4000 caractères max)**
```
🛍️ PipoMarket - La marketplace qui met en valeur les startups camerounaises

Découvrez des produits uniques créés par des entrepreneurs locaux passionnés. PipoMarket connecte les startups camerounaises avec leurs clients, facilitant l'achat et la promotion de produits locaux.

✨ FONCTIONNALITÉS

🏪 Pour les acheteurs:
• Parcourez des centaines de produits de startups locales
• Commandez facilement avec livraison à domicile
• Payez via Mobile Money (Orange Money, MTN)
• Suivez vos commandes en temps réel
• Découvrez de nouvelles startups chaque jour

🚀 Pour les startups:
• Créez votre boutique en quelques minutes
• Gérez vos produits et stocks
• Recevez des commandes instantanément
• 3 formules d'abonnement adaptées à vos besoins
• Dashboard complet pour suivre vos ventes

💳 PAIEMENT SIMPLE
Paiement sécurisé via Mobile Money:
• Orange Money
• MTN Mobile Money
Transaction rapide et sécurisée

📦 CATÉGORIES
• Mode & Accessoires
• Alimentation & Boissons
• Technologie
• Artisanat
• Beauté & Cosmétiques
• Et bien plus...

🇨🇲 100% CAMEROUNAIS
PipoMarket est fier de soutenir l'entrepreneuriat local. Chaque achat aide une startup camerounaise à grandir.

Téléchargez maintenant et rejoignez le mouvement #ConsommerLocal 🇨🇲🔥

---

📧 Support: support@pipomarket.com
🌐 Site web: https://pipomarket.com
```

**Mots-clés (100 caractères max, séparés par virgules)**
```
marketplace,cameroun,startup,shopping,local,made in cameroon,artisan,entrepreneur
```

**Catégorie primaire:** Shopping
**Catégorie secondaire:** Business

**URL de support:** https://pipomarket.com/support (crée cette page)
**URL marketing:** https://pipomarket.com
**URL politique de confidentialité:** https://pipomarket.com/privacy

---

## 📤 ÉTAPE 9: Soumission sur App Store

### A. Upload du build

Quand EAS a terminé:
1. Va sur: https://expo.dev/accounts/[ton-compte]/projects/pipomarket/builds
2. Le build iOS apparaît automatiquement dans App Store Connect après 10-15 minutes
3. Rafraîchis App Store Connect

### B. Remplir la fiche App Store Connect

1. **Informations sur l'app:**
   - Upload tous les screenshots
   - Description, sous-titre, mots-clés
   - URL de support et confidentialité

2. **Classification du contenu:**
   - Âge: 4+ (tout public)
   - Pas de contenu sensible

3. **Informations sur les prix:**
   - Gratuite
   - Disponible dans tous les pays

4. **Préparation pour la soumission:**
   - Section "Informations sur la version"
   - Nouveautés de cette version: "Première version de PipoMarket"
   - Copyright: "2025 PipoMarket"

5. **Clique "Envoyer pour examen"**

### C. Attente de la review

- ⏱️ **1 à 2 semaines** en moyenne (parfois moins)
- Statut visible dans App Store Connect
- Apple peut demander des clarifications (réponds rapidement)

---

## 🎯 CHECKLIST COMPLÈTE

### Avant de commencer
- [ ] Compte Play Store créé et payé (25$)
- [ ] Compte Apple Developer créé et payé (99$)
- [ ] EAS CLI installé (`npm install -g eas-cli`)
- [ ] Politique de confidentialité en ligne

### Assets préparés
- [ ] Feature Graphic Play Store (1024x500)
- [ ] Screenshots Android (min 2, recommandé 4-8)
- [ ] Screenshots iPhone 6.7" (1290x2796, min 3)
- [ ] Screenshots iPhone 6.5" (1242x2688, min 3)
- [ ] Descriptions écrites (courte + longue)
- [ ] Mots-clés App Store
- [ ] Email de contact
- [ ] URLs support et marketing

### Build Android
- [ ] `eas login`
- [ ] `eas init`
- [ ] `eas build --platform android --profile production`
- [ ] Télécharger .aab quand prêt
- [ ] Créer app sur Play Console
- [ ] Upload .aab et remplir fiche
- [ ] Soumettre pour review

### Build iOS
- [ ] Vérifier app.json (bundleIdentifier)
- [ ] Créer app sur App Store Connect
- [ ] `eas build --platform ios --profile production`
- [ ] Attendre que build apparaisse dans App Store Connect
- [ ] Remplir fiche App Store
- [ ] Soumettre pour review

### Après soumission
- [ ] Vérifier emails (Google + Apple)
- [ ] Répondre rapidement aux questions
- [ ] Surveiller les reviews

---

## ⚠️ PROBLÈMES COURANTS

### "Build failed: Invalid bundle identifier"
**Solution:** Vérifie que `bundleIdentifier` (iOS) et `package` (Android) dans `app.json` sont corrects et uniques.

### "You need to create an app on App Store Connect first"
**Solution:** Crée l'app sur App Store Connect AVANT de lancer le build iOS, avec le même Bundle ID.

### "Screenshots have wrong dimensions"
**Solution:** Utilise exactement les dimensions requises. Pas d'approximation!

### "Missing privacy policy"
**Solution:** Tu DOIS avoir une URL accessible publiquement avec ta politique de confidentialité.

### Build très long (>1h)
**Solution:** Normal parfois. Vérifie sur expo.dev que le build n'a pas échoué. Si échoué, check les logs.

---

## 📞 AIDE ET SUPPORT

**Documentation EAS Build:**
- https://docs.expo.dev/build/introduction/

**Play Console Help:**
- https://support.google.com/googleplay/android-developer/

**App Store Connect Help:**
- https://developer.apple.com/support/app-store-connect/

**Firebase Issues:**
- Check Firebase Console: https://console.firebase.google.com

---

## ⏰ TIMING RÉALISTE

| Étape | Temps |
|-------|-------|
| Créer comptes développeurs | 30 min |
| Préparer assets (screenshots, textes) | 2-3 heures |
| Build Android | 30 min |
| Remplir fiche Play Store | 1 heure |
| Build iOS | 30 min |
| Remplir fiche App Store | 1 heure |
| **TOTAL travail actif** | **~6 heures** |
| | |
| Review Play Store | 3-7 jours |
| Review App Store | 1-2 semaines |
| **TOTAL jusqu'à publication** | **1-2 semaines** |

---

## 🚀 COMMANDE RÉCAPITULATIVE

Voici TOUTES les commandes dans l'ordre:

```bash
# 1. Installation
npm install -g eas-cli

# 2. Connexion
eas login

# 3. Initialisation
eas init

# 4. Build Android
eas build --platform android --profile production

# 5. Build iOS (après que Android soit lancé)
eas build --platform ios --profile production

# 6. Vérifier les builds
# Va sur: https://expo.dev
```

---

## 💡 CONSEILS FINAUX

1. **Fais Android d'abord** - Plus simple, review plus rapide
2. **Teste TOUT avant de soumettre** - Une rejection retarde de plusieurs jours
3. **Prépare tous les assets AVANT** de commencer les builds
4. **Réponds vite** aux questions de Google/Apple
5. **Screenshot = super important** - Montre les meilleures fonctionnalités
6. **Description = vente** - Explique pourquoi télécharger ton app

---

## ✅ C'EST PARTI!

Demain matin, commence par:

1. **Créer les comptes** (Play Store + Apple Developer)
2. **Préparer les assets** pendant que les comptes s'activent
3. **Lancer les builds** dans l'après-midi
4. **Remplir les fiches** pendant que les builds tournent
5. **Soumettre** dès que tout est prêt

**Dans 1-2 semaines: PipoMarket sur les stores!** 🎉🚀

Bon courage! 💪
