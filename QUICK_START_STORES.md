# ⚡ QUICK START - Publication Stores (Demain Matin)

## 🎯 CE QU'IL FAUT FAIRE DANS L'ORDRE

### 1️⃣ MATIN (1-2h) - Créer les comptes

**Play Store:**
- Va sur: https://play.google.com/console/signup
- Paye 25$ (CB)
- ✅ Prêt immédiatement

**App Store:**
- Va sur: https://developer.apple.com/programs/enroll/
- Paye 99$/an (CB)
- ⏱️ Activation: 24-48h (commence quand même les étapes suivantes)

---

### 2️⃣ MIDI (2-3h) - Préparer les assets

**A. Crée les screenshots (priorité 1)**

Sur ton téléphone Android:
1. Lance l'app: `npx expo start`
2. Scanne le QR code avec Expo Go
3. Prends 4-6 screenshots:
   - Écran d'accueil
   - Page produit
   - Panier
   - Profil startup

Sauvegarde-les dans un dossier `screenshots/`

**B. Feature Graphic (Play Store)**
- Va sur Canva.com (gratuit)
- Crée un design 1024x500px
- Ajoute: Logo + "PipoMarket - Marketplace Camerounaise"
- Télécharge en PNG

**C. Politique de confidentialité**
- Copie le template dans `TEMPLATES_STORES.md`
- Mets-le sur ton site: `pipomarket.com/privacy`

---

### 3️⃣ APRÈS-MIDI (1h) - Build Android

```bash
# Installation
npm install -g eas-cli

# Connexion
eas login

# Init
eas init

# Build Android
eas build --platform android --profile production
```

⏱️ **Durée build**: 20-30 minutes

Pendant l'attente → Passe à l'étape 4

---

### 4️⃣ PENDANT LE BUILD - Préparer Play Store

1. Va sur: https://play.google.com/console
2. Clique "Créer une application"
3. Nom: **PipoMarket**
4. Type: **Application**, Gratuite

**Ouvre `TEMPLATES_STORES.md` et copie-colle:**
- Description courte
- Description complète
- Email: support@pipomarket.com
- URL privacy: https://pipomarket.com/privacy

**Prépare:**
- Feature Graphic (1024x500)
- Screenshots (minimum 2)
- Icône: `assets/images/icon.png`

---

### 5️⃣ FIN D'APRÈS-MIDI - Soumission Play Store

1. Build Android terminé → Télécharge le fichier `.aab`
2. Play Console → Production → Créer une version
3. Upload le `.aab`
4. Upload Feature Graphic + Screenshots
5. Remplis tous les champs
6. **"Déployer en production"**

✅ **FAIT!** Attente: 3-7 jours

---

### 6️⃣ SOIR (1h) - Build iOS

**Seulement si compte Apple activé** (sinon, fais ça demain ou après-demain)

```bash
eas build --platform ios --profile production
```

Pendant le build:
1. Va sur: https://appstoreconnect.apple.com
2. Créer app: PipoMarket
3. Bundle ID: com.pipomarket.app

⏱️ **Durée build**: 20-30 minutes

---

### 7️⃣ PLUS TARD - Soumission App Store

Après que le build iOS apparaisse dans App Store Connect:

1. Upload screenshots iPhone (voir dimensions dans ACTION_STORES.md)
2. Copie-colle textes de `TEMPLATES_STORES.md`
3. Remplis tous les champs
4. **"Envoyer pour examen"**

✅ **FAIT!** Attente: 1-2 semaines

---

## 📁 FICHIERS IMPORTANTS

| Fichier | Usage |
|---------|-------|
| **QUICK_START_STORES.md** | Ce fichier (vue rapide) |
| **ACTION_STORES.md** | Guide complet détaillé |
| **TEMPLATES_STORES.md** | Tous les textes prêts |
| **ASSETS_REQUIS.md** | Dimensions images exactes |

---

## ⚡ COMMANDES ESSENTIELLES

```bash
# Installation
npm install -g eas-cli

# Connexion
eas login

# Initialisation
eas init

# Build Android (lance en premier)
eas build --platform android --profile production

# Build iOS (lance après, ou en même temps)
eas build --platform ios --profile production

# Vérifier les builds
# Va sur: https://expo.dev
```

---

## 💰 BUDGET

- Play Store: **25$** (une fois)
- App Store: **99$** (par an)
- **Total: ~124$**

---

## ⏰ TIMING

| Action | Durée |
|--------|-------|
| Créer comptes | 30 min |
| Préparer assets | 2-3h |
| Builds (Android + iOS) | 1h total (automatique) |
| Remplir fiches stores | 2h |
| **Total aujourd'hui** | **~6h** |
| Review stores | 3-14 jours (attente) |

---

## 🎯 OBJECTIF DE LA JOURNÉE

✅ Compte Play Store créé
✅ Compte Apple Developer créé
✅ Assets (screenshots, feature graphic) prêts
✅ Build Android soumis sur Play Store
✅ Build iOS lancé (soumission après activation compte)

**Si tu fais tout ça demain = apps en ligne dans 1-2 semaines!** 🚀

---

## 🆘 SI TU BLOQUES

**Build échoue?**
- Check les logs sur expo.dev
- Vérifie `app.json` (bundleIdentifier, package)

**Pas de Mac pour iOS?**
- Pas besoin! EAS gère tout dans le cloud

**Screenshots mauvaise dimension?**
- Utilise exactement les dimensions requises
- Voir `ASSETS_REQUIS.md`

**Compte Apple pas activé?**
- Continue avec Android
- Fais iOS quand compte activé (24-48h)

---

## 📞 RESSOURCES

**Expo Dashboard:**
https://expo.dev

**Play Console:**
https://play.google.com/console

**App Store Connect:**
https://appstoreconnect.apple.com

**Documentation EAS:**
https://docs.expo.dev/build/introduction/

---

## ✅ CHECKLIST RAPIDE

### Avant de dormir ce soir
- [ ] Lis ce document en entier
- [ ] Lis `ACTION_STORES.md` (plus détaillé)
- [ ] Prépare CB pour payer les comptes (25$ + 99$)

### Demain matin (7h-9h)
- [ ] Créer compte Play Store (25$)
- [ ] Créer compte Apple Developer (99$)
- [ ] Café ☕

### Demain midi (12h-15h)
- [ ] Prendre screenshots sur téléphone
- [ ] Créer Feature Graphic sur Canva
- [ ] Copier politique confidentialité sur site
- [ ] Déjeuner 🍽️

### Demain après-midi (15h-18h)
- [ ] Installer EAS: `npm install -g eas-cli`
- [ ] Build Android: `eas build --platform android`
- [ ] Créer app sur Play Console
- [ ] Remplir fiche Play Store
- [ ] Télécharger .aab et soumettre
- [ ] Build iOS: `eas build --platform ios`

### Demain soir (19h-20h)
- [ ] Créer app sur App Store Connect
- [ ] Préparer screenshots iPhone (redimensionner)
- [ ] Repos! 😴

### Après-demain ou quand compte Apple activé
- [ ] Remplir fiche App Store
- [ ] Soumettre pour review
- [ ] 🎉 C'EST FINI!

---

## 🎉 MOTIVATION

**Android review**: 3-7 jours → En ligne fin de semaine prochaine!
**iOS review**: 1-2 semaines → En ligne dans 2-3 semaines max!

**Dans 1 mois**: PipoMarket sur tous les stores! 🚀

**Allez! Tu peux le faire!** 💪🇨🇲

---

**Commence demain par ACTION_STORES.md pour les détails complets.**

**Bon courage!** 🔥
