# 🌐 Guide de Déploiement Web - PipoMarket

## Vue d'ensemble

Ce guide explique comment déployer la version web de PipoMarket sur votre hébergement Hostinger. La version web et les applications mobiles partagent la **même base de données Firebase**, donc toutes les données sont synchronisées automatiquement.

---

## 📋 Table des matières

1. [Comprendre Web vs Mobile](#1-comprendre-web-vs-mobile)
2. [Options de déploiement](#2-options-de-déploiement)
3. [Construction de la version web](#3-construction-de-la-version-web)
4. [Déploiement sur Hostinger](#4-déploiement-sur-hostinger)
5. [Configuration du domaine](#5-configuration-du-domaine)
6. [PWA - Application Web Progressive](#6-pwa---application-web-progressive)

---

## 1. Comprendre Web vs Mobile

### ✅ CE QUI EST SYNCHRONISÉ

Grâce à Firebase, **TOUT est synchronisé** entre web et mobile:
- ✅ Comptes utilisateurs (authentification)
- ✅ Produits et startups
- ✅ Commandes
- ✅ Abonnements
- ✅ Photos (Firebase Storage)
- ✅ Paiements Mobile Money

### ⚠️ DIFFÉRENCES TECHNIQUES

**Version Mobile (iOS/Android)**
- Notifications push natives
- Accès caméra optimisé
- Performance maximale
- Icône sur l'écran d'accueil
- Disponible dans les stores

**Version Web**
- Accessible depuis n'importe quel navigateur
- Pas d'installation requise
- Notifications web (limitées)
- Peut être installée comme PWA
- Mise à jour instantanée

### 💡 VOTRE SITUATION

Vous avez mentionné avoir déjà un "pipomarket" sur BDL Studio qui était une **vitrine** (site showcase). Cette nouvelle application web est **fonctionnelle** et peut:

**Option A**: Remplacer complètement l'ancien site vitrine
**Option B**: Coexister (ex: pipomarket.com = vitrine, app.pipomarket.com = application)
**Option C**: Utiliser un nouveau domaine sur Hostinger

---

## 2. Options de déploiement

### Option 1: Sous-domaine dédié (RECOMMANDÉ)
```
app.pipomarket.com  → Application web complète
pipomarket.com      → Site vitrine existant (BDL Studio)
```
**Avantages**:
- Garde l'ancien site vitrine pour marketing
- Application séparée et claire
- Facile à gérer

### Option 2: Remplacement complet
```
pipomarket.com → Nouvelle application web
```
**Avantages**:
- Un seul site à gérer
- URL principale pour l'app
- Plus simple pour les utilisateurs

### Option 3: Nouveau domaine Hostinger
```
market.votredomaine.com → Application web
```
**Avantages**:
- Indépendant de BDL Studio
- Contrôle total sur Hostinger

---

## 3. Construction de la version web

### Étape 1: Installer les dépendances
```bash
npm install
```

### Étape 2: Vérifier la configuration Firebase
La configuration dans `config/firebase.js` fonctionne déjà pour le web ✅

### Étape 3: Construire la version web
```bash
npx expo export:web
```

Cette commande crée un dossier `web-build/` avec tous les fichiers statiques:
- HTML
- CSS
- JavaScript
- Images optimisées

### Étape 4: Tester localement (optionnel)
```bash
npx serve web-build
```
Ouvre http://localhost:3000 pour tester

---

## 4. Déploiement sur Hostinger

### Méthode A: Via FTP (Simple)

**1. Connectez-vous à Hostinger**
- Allez sur hpanel.hostinger.com
- Connectez-vous à votre compte

**2. Ouvrez le gestionnaire de fichiers**
- Section "Fichiers" → "Gestionnaire de fichiers"
- Ou utilisez un client FTP comme FileZilla

**3. Trouvez le bon dossier**
Pour sous-domaine: `/domains/app.pipomarket.com/public_html`
Pour domaine principal: `/public_html`

**4. Upload des fichiers**
- Supprimez tous les fichiers dans le dossier cible
- Uploadez TOUT le contenu de `web-build/`
- ⚠️ N'uploadez PAS le dossier "web-build" lui-même, mais son CONTENU

**Structure finale sur Hostinger**:
```
/public_html/
├── index.html
├── static/
│   ├── js/
│   ├── css/
│   └── media/
├── _expo/
└── manifest.json
```

### Méthode B: Via Git (Avancé)

Si Hostinger supporte SSH:
```bash
# Sur votre serveur Hostinger
cd /public_html
git clone https://github.com/votre-repo/pipomarket.git temp
mv temp/web-build/* .
rm -rf temp
```

---

## 5. Configuration du domaine

### Pour un sous-domaine (app.pipomarket.com)

**1. Dans Hostinger → Domaines**
- Cliquez sur "Créer un sous-domaine"
- Nom: `app`
- Domaine parent: `pipomarket.com`

**2. Pointez vers le bon dossier**
- Racine du document: `/domains/app.pipomarket.com/public_html`

**3. Activez HTTPS**
- Section SSL/TLS
- "Activer SSL gratuit" (Let's Encrypt)
- ⚠️ Obligatoire pour Firebase Auth

### Pour domaine principal

Si vous remplacez l'ancien site:
- Uploadez directement dans `/public_html`
- HTTPS devrait déjà être activé

---

## 6. PWA - Application Web Progressive

Expo génère automatiquement les fichiers PWA. Cela permet:

✅ Installation sur l'écran d'accueil (comme une vraie app)
✅ Fonctionnement hors ligne (cache)
✅ Icône d'application
✅ Écran de démarrage

**Les utilisateurs peuvent "installer" l'app depuis le navigateur:**
- Chrome: Menu → "Installer PipoMarket"
- Safari iOS: Partager → "Sur l'écran d'accueil"
- Edge: Menu → "Installer cette application"

---

## 🚀 Checklist de déploiement

### Avant le déploiement
- [ ] Tester l'application localement avec `npx expo start --web`
- [ ] Vérifier que Firebase fonctionne (connexion, produits)
- [ ] Construire avec `npx expo export:web`
- [ ] Tester le build avec `npx serve web-build`

### Déploiement Hostinger
- [ ] Créer sous-domaine dans Hostinger (si nécessaire)
- [ ] Upload des fichiers via FTP ou gestionnaire de fichiers
- [ ] Vérifier que tous les fichiers sont présents
- [ ] Activer HTTPS/SSL

### Après le déploiement
- [ ] Tester l'URL (https://app.pipomarket.com)
- [ ] Tester connexion utilisateur
- [ ] Tester création de produit
- [ ] Tester commande
- [ ] Tester sur mobile (navigateur)
- [ ] Tester installation PWA

---

## 🔧 Dépannage

### Problème: Page blanche
**Solution**: Vérifiez la console du navigateur (F12)
- Si erreur Firebase → Vérifiez config/firebase.js
- Si erreur 404 → Vérifiez que index.html est à la racine

### Problème: Erreur SSL/HTTPS
**Solution**: Firebase Auth exige HTTPS
- Activez SSL gratuit dans Hostinger
- Attendez 10-15 minutes pour propagation

### Problème: Images ne chargent pas
**Solution**: Vérifiez Firebase Storage rules
```javascript
// Firestore Rules - Storage
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Problème: Application lente
**Solution**:
- Activez la compression Gzip dans Hostinger
- Utilisez un CDN si disponible
- Vérifiez votre forfait Hostinger (ressources)

---

## 📱 Comparaison finale

| Fonctionnalité | Web | iOS | Android |
|---|---|---|---|
| Accès aux données Firebase | ✅ | ✅ | ✅ |
| Authentification | ✅ | ✅ | ✅ |
| Upload images | ✅ | ✅ | ✅ |
| Paiement Mobile Money | ✅ | ✅ | ✅ |
| Notifications push | ⚠️ Limitées | ✅ | ✅ |
| Mode hors ligne | ⚠️ Basique | ✅ | ✅ |
| Performance | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Installation | Via navigateur | App Store | Play Store |
| Mise à jour | Instantanée | Review (~1 semaine) | Review (~3 jours) |

---

## 💡 Recommandation

**Pour votre cas spécifique:**

1. **Gardez le site vitrine BDL Studio** sur pipomarket.com
2. **Créez app.pipomarket.com** sur Hostinger pour l'application
3. **Publiez sur Play Store et App Store** pour l'expérience native
4. **Promouvez les 3 canaux**:
   - Site vitrine → Marketing et découverte
   - App web → Accès rapide sans installation
   - Apps mobiles → Expérience optimale

**Avantages**:
- Marketing (vitrine) séparé de l'application
- Flexibilité maximale
- Utilisateurs peuvent choisir web ou mobile
- Données synchronisées partout

---

## ⏰ Timeline de déploiement web

- **Construction**: 5 minutes
- **Upload Hostinger**: 10-20 minutes
- **Configuration domaine**: 10 minutes
- **Tests**: 30 minutes
- **Total**: ~1 heure

**Beaucoup plus rapide que les stores!** 🚀
- Play Store: 3-7 jours de review
- App Store: 1-2 semaines de review

---

## 🎯 Prochaines étapes

1. **Immédiat**: Décidez de votre stratégie (sous-domaine vs remplacement)
2. **Aujourd'hui**: Construisez et déployez la version web
3. **Cette semaine**: Lancez les builds iOS et Android pour les stores
4. **Semaine prochaine**: Soumettez aux stores pendant que le web est déjà live

La version web peut être **en ligne aujourd'hui** pendant que vous attendez l'approbation des stores! 🎉

---

## 📞 Besoin d'aide?

Si vous rencontrez des problèmes:
1. Vérifiez la console du navigateur (F12)
2. Vérifiez les logs Hostinger
3. Testez d'abord en local avec `npx serve web-build`
