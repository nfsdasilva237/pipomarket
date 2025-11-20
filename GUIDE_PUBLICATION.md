# 📱 GUIDE DE PUBLICATION PIPOMARKET

## 🎯 PRÉ-REQUIS

### 1. Comptes nécessaires
- ✅ Compte Expo (https://expo.dev)
- ⬜ Compte Google Play Console (99$ à vie)
- ⬜ Compte Apple Developer (99$/an)

### 2. Installations
```bash
npm install -g eas-cli
eas login
```

---

## 🔧 ÉTAPE 1: CONFIGURATION EAS

### 1.1 Initialiser EAS
```bash
cd /home/user/pipomarket
eas init
```

Cela va créer/mettre à jour votre `projectId` dans app.json

### 1.2 Configurer les credentials
```bash
# Pour Android
eas credentials

# Pour iOS (nécessite compte Apple Developer)
eas credentials -p ios
```

---

## 🤖 ÉTAPE 2: BUILD ANDROID (Play Store)

### 2.1 Build de test (APK)
```bash
eas build --platform android --profile preview
```

Testez l'APK sur un appareil réel avant de continuer.

### 2.2 Build de production (AAB)
```bash
eas build --platform android --profile production
```

### 2.3 Télécharger le AAB
Une fois le build terminé, téléchargez le fichier `.aab` depuis:
- https://expo.dev/accounts/[votre-compte]/projects/pipomarket/builds

---

## 🍎 ÉTAPE 3: BUILD iOS (App Store)

### 3.1 Configuration Apple
1. Créer un compte Apple Developer (99$/an)
2. Créer un App ID dans Apple Developer Console
3. Configurer Bundle Identifier: `com.pipomarket.app`

### 3.2 Build de production
```bash
eas build --platform ios --profile production
```

### 3.3 Télécharger l'IPA
Téléchargez depuis expo.dev après le build

---

## 📤 ÉTAPE 4: SOUMISSION PLAY STORE

### 4.1 Configuration Google Play Console

1. **Créer une nouvelle application**
   - Allez sur https://play.google.com/console
   - Cliquez "Créer une application"
   - Nom: PipoMarket
   - Langue par défaut: Français
   - Type: Application
   - Gratuit/Payant: Gratuit

2. **Compléter la fiche de l'application**
   
   **Description courte (80 caractères max):**
   ```
   Marketplace pour startups camerounaises - Achetez local, soutenez l'innovation
   ```
   
   **Description complète (4000 caractères max):**
   ```
   🇨🇲 PipoMarket - La Marketplace des Startups Camerounaises

   Découvrez et soutenez les startups innovantes du Cameroun ! PipoMarket connecte entrepreneurs et clients dans un écosystème digital moderne.

   🏢 POUR LES STARTUPS:
   • Créez votre boutique en ligne en quelques minutes
   • 3 plans d'abonnement flexibles (5K, 10K, 20K FCFA/mois)
   • 1 mois PREMIUM gratuit pour démarrer
   • Gestion complète des produits et commandes
   • Dashboard analytics en temps réel
   • Codes promo et promotions
   • Système de notifications clients
   • Paiements Mobile Money intégrés

   🛒 POUR LES CLIENTS:
   • Découvrez des produits 100% camerounais
   • Navigation intuitive par catégories
   • Recherche avancée
   • Panier et favoris
   • Suivi de commandes en temps réel
   • Programme de fidélité avec points
   • Chat direct avec les vendeurs
   • Paiement sécurisé Mobile Money

   💎 FONCTIONNALITÉS PREMIUM:
   • Produits illimités
   • Commandes illimitées
   • Analytics IA avancés
   • Mise en avant TOP 3 permanent
   • Support prioritaire

   🎁 PROGRAMME AMBASSADEUR:
   Gagnez des récompenses en parrainant des startups

   📱 TÉLÉCHARGEZ MAINTENANT
   Rejoignez la révolution digitale camerounaise !

   🇨🇲 Made in Cameroon | Pour le Cameroun
   ```

3. **Assets graphiques requis:**
   - ✅ Icône (512x512 PNG)
   - ⬜ Feature Graphic (1024x500 PNG)
   - ⬜ Screenshots (min 2):
     - Téléphone: 1080x1920 ou 1080x2340
     - Tablette 7": 1200x1920
     - Tablette 10": 1600x2560

4. **Catégorisation:**
   - Catégorie: Shopping
   - Type de contenu: E-commerce
   - Public cible: 16+
   - Contenu: Shopping, Paiements

5. **Questionnaire de contenu:**
   - Contient des annonces: Non
   - Achats intégrés: Non (les paiements sont externes)
   - Collecte d'informations sensibles: Oui (email, téléphone)
   - Politique de confidentialité: [URL à fournir]

### 4.2 Upload du AAB

1. Aller dans "Production" > "Créer une version"
2. Upload le fichier `.aab`
3. Remplir les notes de version:
   ```
   🎉 Première version de PipoMarket!

   ✨ Fonctionnalités:
   - Marketplace complète pour startups
   - Gestion de boutique en ligne
   - Système d'abonnements (Starter, Pro, Premium)
   - Paiement Mobile Money
   - Programme de fidélité
   - Chat vendeur-client
   - Notifications push

   🇨🇲 Fabriqué au Cameroun, pour le Cameroun
   ```

4. **Enregistrer** puis **Examiner la version**
5. **Déployer en production**

### 4.3 Soumission avec EAS (Alternative)
```bash
eas submit -p android
```

---

## 🍎 ÉTAPE 5: SOUMISSION APP STORE

### 5.1 Configuration App Store Connect

1. **Créer une app**
   - Allez sur https://appstoreconnect.apple.com
   - "Mes apps" > "+"
   - Nom: PipoMarket
   - Langue: Français
   - Bundle ID: com.pipomarket.app
   - SKU: pipomarket-ios

2. **Informations de l'app**
   
   **Sous-titre (30 caractères):**
   ```
   Marketplace startups Cameroun
   ```
   
   **Description (4000 caractères):**
   ```
   [Même description que Play Store]
   ```
   
   **Mots-clés (100 caractères):**
   ```
   startup,cameroun,marketplace,shopping,local,business,commerce,ecommerce
   ```

3. **Captures d'écran requises:**
   - iPhone 6.7" (1290x2796)
   - iPhone 6.5" (1242x2688)
   - iPad Pro 12.9" (2048x2732)

4. **Informations de contact:**
   - Nom: [Votre nom]
   - Email: [Votre email de support]
   - Téléphone: [Numéro camerounais]
   - URL marketing: [Votre site]
   - URL politique: [URL politique de confidentialité]

5. **Âge minimum:**
   - Sélectionner 17+ (Commerce)

### 5.2 Upload de l'IPA

```bash
eas submit -p ios
```

Ou manuellement:
1. Télécharger l'IPA depuis expo.dev
2. Utiliser Transporter (Mac) pour l'upload
3. Attendre le traitement (10-60 minutes)

### 5.3 Soumission finale

1. Dans App Store Connect, sélectionner le build
2. Remplir les informations de conformité d'exportation:
   - Contenu chiffrement: Non
3. Ajouter les captures d'écran
4. **Soumettre pour examen**

⏰ Délai: 24-48h pour examen Apple

---

## 📝 ÉTAPE 6: DOCUMENTS LÉGAUX

### 6.1 Politique de confidentialité (OBLIGATOIRE)

Créez un document avec:
- Données collectées (email, téléphone, nom)
- Utilisation des données
- Partage avec tiers (Firebase, services paiement)
- Droits de l'utilisateur
- Contact

Hébergez sur:
- Votre site web
- GitHub Pages
- Google Sites

### 6.2 Conditions d'utilisation

Définissez:
- Règles d'utilisation
- Responsabilités startups/clients
- Politique de remboursement
- Résolution de litiges
- Loi applicable (Cameroun)

---

## 🧪 ÉTAPE 7: TESTS PRÉ-LANCEMENT

### 7.1 Tests internes (Play Store)
```bash
# Créer un track de test interne
eas build --platform android --profile preview
```

Partagez l'APK avec 5-10 testeurs

### 7.2 Tests bêta (TestFlight pour iOS)
```bash
eas build --platform ios --profile preview
```

Apple vous donne un lien TestFlight

### 7.3 Checklist finale
- ⬜ Tester toutes les fonctionnalités
- ⬜ Vérifier paiements Mobile Money
- ⬜ Tester notifications push
- ⬜ Vérifier upload d'images
- ⬜ Tester sur différents appareils
- ⬜ Vérifier performances
- ⬜ Tester en réseau lent
- ⬜ Vérifier textes/traductions

---

## 🚀 ÉTAPE 8: LANCEMENT

### 8.1 Stratégie de lancement

**Jour J-7:**
- ✅ Publier en "test fermé" Play Store
- ✅ Inviter 20-50 utilisateurs bêta
- ✅ Collecter feedback

**Jour J-3:**
- ✅ Corriger bugs critiques
- ✅ Préparer communication (réseaux sociaux)
- ✅ Créer page web de présentation

**Jour J:**
- ✅ Publier en production
- ✅ Annoncer sur réseaux sociaux
- ✅ Contacter presse tech camerounaise
- ✅ Poster dans groupes Facebook/WhatsApp startups

### 8.2 Suivi post-lancement

**Jour J+1 à J+7:**
- Surveiller crashs (Firebase Crashlytics)
- Répondre aux avis
- Monitorer analytics
- Support utilisateurs réactif

**Jour J+7 à J+30:**
- Collecter feedback
- Planifier mise à jour 1.1
- Optimiser conversion
- Marketing ciblé

---

## 📊 ÉTAPE 9: ANALYTICS & MONITORING

### 9.1 Configurer Firebase Analytics
```bash
# Déjà configuré dans votre app
# Vérifier dans Firebase Console
```

### 9.2 Métriques à suivre
- Installations quotidiennes
- Utilisateurs actifs (DAU/MAU)
- Taux de rétention J1, J7, J30
- Taux de conversion (visiteur → inscription)
- Taux d'abandon panier
- Revenus par utilisateur (ARPU)

### 9.3 Crashlytics
```bash
# Ajouter Firebase Crashlytics
npm install @react-native-firebase/crashlytics
```

---

## 🔄 ÉTAPE 10: MISES À JOUR

### 10.1 Incrémenter versions

**app.json:**
```json
{
  "version": "1.0.1",  // Version visible (Major.Minor.Patch)
  "ios": {
    "buildNumber": "2"  // Incrémenter à chaque build
  },
  "android": {
    "versionCode": 2   // Incrémenter à chaque build
  }
}
```

### 10.2 Build nouvelle version
```bash
# Android
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production
```

### 10.3 Soumission mise à jour
```bash
# Android (automatique avec Play Store)
eas submit -p android

# iOS
eas submit -p ios
```

---

## 💰 COÛTS ESTIMÉS

| Service | Coût | Fréquence |
|---------|------|-----------|
| Google Play Console | 25$ | Une fois |
| Apple Developer | 99$ | Annuel |
| EAS Build (Expo) | Gratuit* | - |
| Firebase (Spark Plan) | Gratuit | Mensuel |
| Hébergement web docs | 0-10$ | Mensuel |

*EAS Build: 30 builds gratuits/mois, puis $29/mois pour illimité

**TOTAL PREMIÈRE ANNÉE:** ~150$ + 0-120$ hébergement = **170-270$**

---

## 🆘 DÉPANNAGE

### Erreur: "App Bundle not signed"
```bash
eas credentials
# Recréer le keystore
```

### Erreur: "Invalid Bundle ID"
Vérifier que `app.json` et Apple Developer correspondent exactement

### Erreur: "Firebase not configured"
Vérifier que `google-services.json` et `GoogleService-Info.plist` existent

### Build qui échoue
```bash
# Nettoyer et rebuild
rm -rf node_modules
npm install
eas build --clear-cache
```

---

## 📞 SUPPORT

- Documentation Expo: https://docs.expo.dev
- Forum Expo: https://forums.expo.dev
- Stack Overflow: tag `expo` et `react-native`
- Discord Expo: https://chat.expo.dev

---

## ✅ CHECKLIST FINALE AVANT PUBLICATION

### Technique
- ⬜ Tests sur Android réel
- ⬜ Tests sur iOS réel (si possible)
- ⬜ Vérifier crashs Firebase
- ⬜ Tester paiements Mobile Money en prod
- ⬜ Vérifier notifications push fonctionnent
- ⬜ Performance: app < 50MB
- ⬜ Temps de chargement < 3s

### Légal
- ⬜ Politique de confidentialité publiée
- ⬜ Conditions d'utilisation publiées
- ⬜ Mentions légales (société, contact)
- ⬜ Conformité RGPD/lois locales

### Marketing
- ⬜ Description app finalisée
- ⬜ Screenshots (min 4)
- ⬜ Vidéo démo (optionnel mais recommandé)
- ⬜ Site web vitrine
- ⬜ Pages réseaux sociaux créées

### Store
- ⬜ Icône 512x512
- ⬜ Feature graphic 1024x500
- ⬜ Screenshots toutes tailles
- ⬜ Catégorie sélectionnée
- ⬜ Mots-clés optimisés
- ⬜ Classification de contenu

---

🎉 **FÉLICITATIONS!** Vous êtes prêt à lancer PipoMarket!

Bon courage pour le lancement! 🚀🇨🇲
