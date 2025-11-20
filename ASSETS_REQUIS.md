# 🎨 ASSETS REQUIS POUR PUBLICATION

## 📱 ICÔNES ET SPLASH

### ✅ DÉJÀ PRÉSENTS (si dans assets/images/)
- `icon.png` (1024x1024)
- `splash-icon.png` 
- `android-icon-foreground.png`
- `android-icon-monochrome.png`
- `favicon.png`

### ⬜ À CRÉER

#### Pour Google Play Store:
1. **Feature Graphic** (OBLIGATOIRE)
   - Taille: 1024x500 pixels
   - Format: PNG ou JPEG
   - Contenu: Banner attractif avec logo + slogan
   - Exemple: "PipoMarket - Marketplace des Startups 🇨🇲"

2. **Screenshots Téléphone** (min 2, max 8)
   - Taille: 1080x1920 ou 1080x2340
   - Format: PNG ou JPEG
   - Suggestions:
     * Page d'accueil
     * Liste produits
     * Détail produit
     * Panier
     * Dashboard startup
     * Profil utilisateur

3. **Screenshots Tablette** (optionnel mais recommandé)
   - 7 pouces: 1200x1920
   - 10 pouces: 1600x2560

#### Pour Apple App Store:
1. **Screenshots iPhone** (OBLIGATOIRE)
   - 6.7": 1290x2796 (iPhone 14 Pro Max)
   - 6.5": 1242x2688 (iPhone 11 Pro Max)
   - Min 3, max 10 par taille

2. **Screenshots iPad** (optionnel)
   - 12.9": 2048x2732 (iPad Pro)

---

## 🎬 COMMENT CRÉER LES SCREENSHOTS

### Méthode 1: Depuis l'émulateur
```bash
# Android Studio
1. Lancer app dans émulateur
2. Naviguer vers l'écran souhaité
3. Bouton "Take Screenshot" dans la barre d'outils
4. Sauvegarder

# iOS Simulator
1. Lancer app dans simulateur
2. Cmd + S pour screenshot
```

### Méthode 2: Depuis téléphone réel
```bash
# Android
1. Activer "Mode développeur"
2. Connecter USB
3. adb shell screencap -p /sdcard/screenshot.png
4. adb pull /sdcard/screenshot.png

# iOS
1. Connecter iPhone
2. Utiliser QuickTime Player > Nouvel enregistrement film
3. Sélectionner iPhone
4. Cmd + Shift + 5 pour screenshot
```

### Méthode 3: Outil en ligne
- https://www.mockuphone.com (gratuit)
- https://previewed.app (payant, professionnel)
- https://shots.so (gratuit)

---

## 🎨 TEMPLATE FEATURE GRAPHIC

### Spécifications:
- Dimensions: 1024 x 500 pixels
- Résolution: 72 DPI minimum
- Format: PNG 24-bit ou JPEG

### Contenu suggéré:
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  🏪  PIPOMARKET                                │
│                                                 │
│  La Marketplace des Startups Camerounaises     │
│                                                 │
│  🇨🇲 100% Made in Cameroon                     │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Outils pour créer:
- Canva (gratuit): https://canva.com
  * Template "Google Play Feature Graphic"
  * Dimensions personnalisées: 1024x500
  
- Figma (gratuit): https://figma.com
  * Créer nouveau fichier
  * Frame 1024x500
  
- Adobe Express (gratuit)
- GIMP (gratuit, logiciel)

---

## 📸 LISTE SCREENSHOTS SUGGÉRÉS

### 1. **Écran d'accueil**
- Vue des startups en vedette
- Barre de recherche visible
- Catégories

### 2. **Liste de produits**
- Plusieurs produits visibles
- Prix en FCFA
- Bouton panier

### 3. **Détail produit**
- Photos produit
- Description
- Prix
- Bouton "Ajouter au panier"

### 4. **Panier**
- Produits dans panier
- Total
- Bouton commander

### 5. **Dashboard Startup**
- Statistiques
- Graphiques
- Design premium

### 6. **Profil**
- Informations utilisateur
- Commandes
- Points fidélité

### 7. **Abonnements**
- 3 plans visibles
- Badges Premium/Pro/Starter

### 8. **Commandes**
- Liste commandes
- Statuts
- Détails

---

## 🎨 CHARTE GRAPHIQUE

### Couleurs principales:
```css
Primary: #667eea (Violet)
Secondary: #764ba2 (Violet foncé)
Success: #10d98c (Vert)
Warning: #FFA94D (Orange)
Error: #FF6B9D (Rose)
```

### Polices:
- Titres: System (Bold)
- Texte: System (Regular)

---

## ✅ CHECKLIST ASSETS

### Play Store:
- ⬜ Feature Graphic (1024x500)
- ⬜ Icon (512x512) - déjà dans app.json
- ⬜ Screenshots téléphone (min 2)
- ⬜ Screenshots tablette (optionnel)
- ⬜ Vidéo promo (optionnel, 30s max)

### App Store:
- ⬜ Icon (1024x1024) - déjà dans app.json
- ⬜ Screenshots iPhone 6.7" (min 3)
- ⬜ Screenshots iPhone 6.5" (min 3)
- ⬜ Screenshots iPad (optionnel)
- ⬜ Vidéo preview (optionnel, 30s max)

### Marketing:
- ⬜ Logo PNG transparent
- ⬜ Banner réseaux sociaux (1200x630)
- ⬜ Post Instagram (1080x1080)
- ⬜ Story Instagram (1080x1920)

---

## 🎥 VIDÉO PROMO (OPTIONNEL)

### Spécifications:
- Durée: 15-30 secondes
- Format: MP4, MOV, AVI
- Résolution: min 720p, recommandé 1080p
- Ratio: 16:9

### Contenu suggéré:
1. (0-5s) Logo + "PipoMarket"
2. (5-10s) Parcours produits
3. (10-15s) Ajout au panier
4. (15-20s) Dashboard startup
5. (20-25s) "Téléchargez maintenant"
6. (25-30s) Logo + stores

### Outils:
- CapCut (mobile, gratuit)
- iMovie (iOS, gratuit)
- DaVinci Resolve (gratuit)
- Adobe Premiere Rush (gratuit)

---

## 📂 STRUCTURE DOSSIER ASSETS

```
pipomarket/
├── assets/
│   ├── images/
│   │   ├── icon.png ✅
│   │   ├── splash-icon.png ✅
│   │   └── ...
│   └── store/
│       ├── feature-graphic.png ⬜
│       ├── screenshots/
│       │   ├── phone/
│       │   │   ├── 01-home.png ⬜
│       │   │   ├── 02-products.png ⬜
│       │   │   ├── 03-detail.png ⬜
│       │   │   └── 04-cart.png ⬜
│       │   └── tablet/
│       │       └── ...
│       └── video/
│           └── promo.mp4 ⬜
```

---

## 🆘 AIDE RAPIDE

### Besoin de screenshots professionnels?
Engagez un designer sur:
- Fiverr (15-50$)
- Upwork (20-100$)
- Designers camerounais locaux

### Ressources gratuites:
- Unsplash (photos)
- Pexels (photos)
- Icons8 (icônes)
- Flaticon (icônes)

### Templates Canva gratuits:
- "App Screenshots"
- "Mobile App Mockup"
- "Play Store Graphics"

---

💡 **ASTUCE PRO:** Créez d'abord vos screenshots, puis utilisez-les pour le marketing!

🎨 Bonne création!
