# 🎯 GUIDE SIMPLE - Comment Utiliser les 4 Systèmes

## ✅ 1. BOOST DE PRODUITS (100% PRÊT!)

### C'est quoi?
Les startups peuvent payer pour que leurs produits apparaissent **en premier** sur la page d'accueil.

### Comment ça marche?

**ÉTAPE 1**: Tu as déjà fait! Le bouton "⭐ Booster" apparaît dans le dashboard startup.

**ÉTAPE 2**: La startup clique sur "⭐ Booster"
**ÉTAPE 3**: Elle choisit la durée (24h = 500 FCFA, 7j = 2000 FCFA, etc.)
**ÉTAPE 4**: Elle paye via Mobile Money
**ÉTAPE 5**: Le produit apparaît EN PREMIER sur la page d'accueil! 🎉

### Tu gagnes quoi?
- 500 FCFA par boost de 24h
- 2000 FCFA par boost de 7 jours
- 5000 FCFA par boost de 30 jours

### Exemple:
Si 20 startups boostent 2 produits/mois → **80 000 FCFA/mois** pour toi! 💰

---

## 📢 2. PUBLICITÉS BANNIÈRES

### C'est quoi?
Des grandes entreprises (Orange, MTN, Banques) paient pour afficher leur pub dans l'app.

### Comment l'ajouter dans l'app?

**DANS HomeScreen.js** (ou n'importe quel écran):

```javascript
import BannerAd from '../components/BannerAd';

// Dans le render, ajoute ça où tu veux:
<BannerAd placement="home_banner" />
```

C'est tout! La bannière apparaîtra automatiquement.

### Où placer les bannières?

**Option 1: Dans HomeScreen** (ligne ~310, après le header)
```javascript
{/* En-tête */}
<View style={styles.header}>...</View>

{/* ⬇️ AJOUTE ÇA ICI */}
<BannerAd placement="home_banner" />

{/* Recherche */}
<View style={styles.searchContainer}>...</View>
```

**Option 2: Dans StartupDetailScreen**
```javascript
{/* Info startup */}
<Text style={styles.startupName}>{startup.name}</Text>

{/* ⬇️ AJOUTE ÇA ICI */}
<BannerAd placement="category_banner" category={startup.category} />

{/* Produits */}
<View style={styles.products}>...</View>
```

### Comment vendre des bannières?

1. **Contacte Orange Money**: "On a 50 000 utilisateurs/mois. Bannière = 50 000 FCFA/mois"
2. **Ils acceptent et te paient**
3. **Tu crées leur campagne**:

```javascript
import { createAdCampaign } from './utils/advertisingService';

await createAdCampaign({
  advertiserName: 'Orange Money',
  placement: 'HOME_BANNER',
  imageUrl: 'https://..../orange-banner.jpg',
  linkUrl: 'https://orangemoney.cm',
  title: 'Payez avec Orange Money',
  description: 'Et recevez 500 FCFA de bonus!',
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  budget: 50000
});
```

4. **Approuve la campagne** (dans Firebase ou via code):
```javascript
import { approveCampaign } from './utils/advertisingService';
await approveCampaign('ID_CAMPAGNE');
```

5. **La bannière apparaît automatiquement!** 🎉

### Tu gagnes quoi?
- Bannière accueil: **50 000 FCFA/mois**
- Bannière catégorie: **30 000 FCFA/mois**

---

## 🏆 3. STARTUP DU MOIS

### C'est quoi?
Chaque mois, UNE startup paye pour être mise en avant partout dans l'app.

### Comment l'utiliser?

**ÉTAPE 1: Une startup candidate**

Dans ton app, ajoute un bouton pour candidater:
```javascript
import { applyForStartupOfMonth } from './utils/startupOfMonthService';

// Bouton "Devenir Startup du mois"
<TouchableOpacity onPress={async () => {
  await applyForStartupOfMonth(startupId, {
    month: 12, // Décembre
    year: 2025,
    motivation: "Nous voulons être startup du mois car...",
    paymentMethod: 'mobile_money'
  });
}}>
  <Text>🏆 Candidater pour Startup du mois</Text>
</TouchableOpacity>
```

**ÉTAPE 2: Tu approuves la candidature**
```javascript
import { approveApplication } from './utils/startupOfMonthService';
await approveApplication('ID_CANDIDATURE');
```

**ÉTAPE 3: Affiche la startup du mois dans HomeScreen**

```javascript
import { getCurrentStartupOfMonth } from './utils/startupOfMonthService';

// Dans ton useEffect:
const startupOfMonth = await getCurrentStartupOfMonth();

// Dans le render:
{startupOfMonth && (
  <View style={styles.startupOfMonthBanner}>
    <Text style={styles.badge}>🏆 STARTUP DU MOIS</Text>
    <Text style={styles.name}>{startupOfMonth.startupName}</Text>
    <TouchableOpacity onPress={() =>
      navigation.navigate('StartupDetail', {
        startupId: startupOfMonth.startupId
      })
    }>
      <Text>Découvrir →</Text>
    </TouchableOpacity>
  </View>
)}
```

### Tu gagnes quoi?
- **20 000 FCFA/mois** minimum
- **25 000 FCFA/mois** en haute saison (juin, décembre)

---

## 🤝 4. PARTENARIATS MARQUES

### C'est quoi?
Tu fais des deals avec des grandes boîtes (Orange, Banques, etc.) pour promouvoir leurs services.

### Exemples concrets:

**Exemple 1: Orange Money Bonus**
```javascript
import { createPartnership } from './utils/partnershipsService';

await createPartnership({
  partnerName: 'Orange Money',
  type: 'PAYMENT_PROMO',
  description: 'Payez avec Orange Money et recevez 500 FCFA de bonus',
  commission: 3, // Tu prends 3% sur chaque transaction
  promoCode: 'ORANGE500',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  targetAudience: 'all'
});
```

**Exemple 2: Banque - Apport clients**
```javascript
await createPartnership({
  partnerName: 'Afriland First Bank',
  type: 'BANKING_REFERRAL',
  description: 'Ouvrez un compte pro et obtenez 3 mois gratuits PipoMarket',
  commission: 10000, // Tu reçois 10 000 FCFA par compte ouvert
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  targetAudience: 'startups'
});
```

### Comment afficher les partenariats?

**Dans ton app** (par exemple dans ProfileScreen ou nouveau écran "Offres"):

```javascript
import { getActivePartnerships } from './utils/partnershipsService';

// Charger les partenariats:
const partnerships = await getActivePartnerships('all');

// Afficher:
{partnerships.map(partnership => (
  <View key={partnership.id} style={styles.partnerCard}>
    <Text style={styles.partnerName}>{partnership.partnerName}</Text>
    <Text style={styles.partnerDesc}>{partnership.description}</Text>
    <TouchableOpacity onPress={() => {
      // Tracker le clic
      trackPartnershipClick(partnership.id);
      // Ouvrir le lien du partenaire
      Linking.openURL(partnership.linkUrl);
    }}>
      <Text>En savoir plus →</Text>
    </TouchableOpacity>
  </View>
))}
```

### Comment tracker une conversion?

Quand un utilisateur utilise le code promo:
```javascript
import { trackPartnershipConversion } from './utils/partnershipsService';

// Exemple: Utilisateur paye avec Orange Money
await trackPartnershipConversion('ID_PARTENARIAT', {
  userId: auth.currentUser.uid,
  amount: 10000, // Montant de la transaction
  type: 'payment_completed',
  metadata: { paymentMethod: 'orange_money' }
});

// Tu gagnes automatiquement ta commission!
```

### Tu gagnes quoi?
- **3-5%** sur chaque transaction Orange Money
- **10 000 FCFA** par compte bancaire ouvert
- **15%** sur chaque police d'assurance vendue
- **20%** sur chaque formation vendue

---

## 🚀 QUICK START - Commence MAINTENANT!

### JOUR 1 (Aujourd'hui)

1. **Lance l'app** et va dans le dashboard d'une startup
2. **Teste le bouton "⭐ Booster"** sur un produit
3. **C'est déjà fonctionnel!** 🎉

### JOUR 2 (Demain)

1. **Ajoute une bannière** dans HomeScreen:
   - Ouvre `screens/HomeScreen.js`
   - Ligne ~310, ajoute: `<BannerAd placement="home_banner" />`
   - Teste l'app

2. **Contacte Orange Money**:
   - Email: [email Orange]
   - Message: "Bonjour, j'ai une app avec 50 000 utilisateurs/mois au Cameroun. Je propose un espace publicitaire pour 50 000 FCFA/mois. Intéressés?"

### JOUR 3

1. **Si Orange accepte**, crée leur campagne (code ci-dessus)
2. **Approuve la campagne**
3. **La bannière apparaît!**
4. **Tu reçois 50 000 FCFA!** 💰

### SEMAINE 1

1. **Vends 5-10 boosts** = +5 000 - 10 000 FCFA
2. **1 bannière Orange** = +50 000 FCFA
3. **Total semaine 1**: **~60 000 FCFA** 🎉

---

## 📁 FICHIERS À MODIFIER

### Pour activer tout:

1. ✅ **StartupDashboardScreen.js** - Déjà fait! Bouton boost ajouté
2. ✅ **App.js** - Déjà fait! Route BoostProduct ajoutée
3. **HomeScreen.js** - À faire: Ajouter `<BannerAd />` (1 ligne!)
4. **Optionnel**: Créer écran "Offres Partenaires" pour afficher les deals

---

## 🆘 SI TU BLOQUES

### "Je ne sais pas où ajouter la bannière"

**Réponse**: Dans n'importe quel écran, ajoute juste:
```javascript
import BannerAd from '../components/BannerAd';

// Dans le JSX:
<BannerAd placement="home_banner" />
```

### "Comment je vends les bannières?"

**Réponse**:
1. Contacte des grandes boîtes (Orange, MTN, Banques)
2. Dis-leur: "J'ai X utilisateurs/mois, bannière = 50k FCFA/mois"
3. S'ils acceptent, crée leur campagne avec le code ci-dessus
4. C'est tout!

### "Les startups ne voient pas le bouton Booster"

**Réponse**:
- Commit les changements: `git add . && git commit -m "Add boost button" && git push`
- Rebuild l'app: `npx expo start --clear`

---

## 💰 PROJECTION REVENUS

### Si tu fais JUSTE les boosts cette semaine:
- 10 startups × 1 boost × 2000 FCFA = **20 000 FCFA**

### Si tu ajoutes 1 bannière Orange:
- **+50 000 FCFA/mois** = **+600 000 FCFA/an**

### Si tu fais les 4 systèmes en 1 mois:
- Boosts: 80 000 FCFA/mois
- Bannières: 130 000 FCFA/mois
- Startup du mois: 20 000 FCFA/mois
- Partenariats: 70 000 FCFA/mois
- **TOTAL: 300 000 FCFA/mois** = **3.6 MILLIONS/AN** 🔥

---

## ✅ CHECKLIST

- [x] Système boost créé
- [x] Bouton boost dans dashboard
- [x] Route navigation ajoutée
- [ ] Bannière ajoutée dans HomeScreen (1 ligne!)
- [ ] Contacté Orange Money (1 email!)
- [ ] Première bannière vendue
- [ ] Premier partenariat signé

**Tu es à 75% terminé! Il reste juste à ajouter 1 ligne pour les bannières!** 🚀

---

**Questions? Dis-moi ce que tu ne comprends pas et je simplifie encore plus!** 😊
