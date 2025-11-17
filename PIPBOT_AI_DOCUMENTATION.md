# 🤖 PipBot IA - Documentation Complète

## Vue d'ensemble

PipBot est un **assistant conversationnel intelligent ultra-avancé** pour PipoMarket qui utilise l'apprentissage automatique, l'analyse comportementale et le filtrage collaboratif pour offrir une expérience personnalisée à chaque utilisateur.

---

## 🎯 Fonctionnalités Principales

### 1. **Apprentissage des Préférences**
- Analyse automatique de l'historique d'achat
- Détection des catégories préférées
- Calcul du budget moyen
- Identification des startups favorites
- Analyse des mots-clés de recherche

### 2. **Recommandations Personnalisées**
- **30% Basé sur l'historique d'achat** - Produits similaires à ceux déjà achetés
- **25% Basé sur les catégories préférées** - Top produits dans vos catégories favorites
- **20% Filtrage collaboratif** - "Les utilisateurs similaires ont aussi aimé"
- **15% Basé sur le budget** - Produits dans votre gamme de prix
- **10% Tendances** - Nouveautés et produits populaires

### 3. **Contexte Conversationnel**
- Mémoire des conversations précédentes
- Résolution des références ("celui-ci", "ça", "le même")
- Questions de suivi intelligentes
- Détection du changement de sujet

### 4. **Analyse du Sentiment**
- Détection de l'humeur (positive, négative, neutre)
- Adaptation du ton de réponse
- Support proactif en cas de frustration

### 5. **Classification d'Intention Avancée**
- 25+ types d'intentions détectées
- Analyse sémantique du contexte
- Désambiguïsation intelligente

---

## 🏗️ Architecture du Système

```
services/
├── UserProfileService.js          # Gestion du profil utilisateur
├── ConversationContextService.js  # Contexte conversationnel
├── AdvancedRecommendationEngine.js # Moteur de recommandations
└── AIAssistantService.js          # Orchestrateur principal

screens/
└── PipBotScreen.js                # Interface utilisateur
```

---

## 📦 Services Détaillés

### UserProfileService.js

**Responsabilités:**
- Récupération du profil utilisateur complet
- Analyse des préférences
- Tracking des interactions
- Calcul du score d'engagement

**Méthodes principales:**

```javascript
// Obtenir le profil complet
await UserProfileService.getUserProfile(userId)
// Retourne:
{
  userId,
  orders: [],
  bdlOrders: [],
  favorites: [],
  searchHistory: [],
  interactions: [],
  preferences: {
    categories: { "Électronique": 5, "Mode": 3 },
    priceRange: { min, max, preferred },
    startups: {},
    keywords: {}
  },
  behaviorProfile: {
    purchaseFrequency,
    decisionTime,
    temporalPattern,
    conversionRate,
    repeatPurchaseRate
  },
  spendingProfile: {
    totalLifetimeValue,
    averageOrderValue,
    category: "vip" | "loyal" | "regular" | "occasional" | "new"
  },
  engagementScore: 85 // 0-100
}

// Tracker une interaction
await UserProfileService.trackInteraction('view', { productId: '123' })

// Tracker une recherche
await UserProfileService.trackSearch(query, results)
```

---

### ConversationContextService.js

**Responsabilités:**
- Maintenir le contexte de la conversation
- Extraire les entités (prix, couleurs, villes, produits)
- Résoudre les anaphores
- Générer des questions de clarification

**Méthodes principales:**

```javascript
// Initialiser une conversation
await ConversationContextService.initConversation()

// Extraire les entités d'un message
const entities = ConversationContextService.extractEntities(
  "Je cherche un téléphone rouge à moins de 50000 XAF",
  products,
  categories,
  startups
)
// Retourne:
{
  priceRange: [50000],
  maxBudget: 50000,
  colors: ['rouge'],
  category: 'Électronique',
  sortBy: 'price_asc'
}

// Vérifier si c'est une question de suivi
const isFollowUp = ConversationContextService.isFollowUp("Et celui-ci ?")

// Résoudre les références
const resolved = ConversationContextService.resolveReferences("Combien il coûte ?")

// Analyser le sentiment
const sentiment = ConversationContextService.analyzeSentiment("C'est génial !")
// Retourne: 'positive' | 'negative' | 'neutral'

// Obtenir un résumé du contexte
const summary = ConversationContextService.getContextSummary()
// Retourne:
{
  conversationLength: 15,
  currentTopic: 'SEARCH_PRODUCT',
  userMood: 'positive',
  questionsAsked: 8,
  productsDiscussed: 5,
  sessionDuration: 12 // minutes
}
```

---

### AdvancedRecommendationEngine.js

**Responsabilités:**
- Générer des recommandations personnalisées
- Filtrage collaboratif
- Recommandations contextuelles
- Calcul de similarité entre utilisateurs/produits

**Méthodes principales:**

```javascript
// Recommandations personnalisées (algorithme hybride)
const recommendations = await AdvancedRecommendationEngine.getPersonalizedRecommendations(
  userId,
  allProducts,
  limit = 10
)
// Retourne un tableau de produits avec:
{
  ...product,
  recommendationScore: 8.5,
  recommendationReason: "Basé sur tes achats précédents"
}

// Recommandations contextuelles
const contextual = AdvancedRecommendationEngine.getContextualRecommendations(
  entities,
  allProducts,
  limit = 5
)

// Produits similaires
const similar = AdvancedRecommendationEngine.getSimilarProducts(
  productId,
  allProducts,
  limit = 5
)

// Produits populaires (fallback)
const popular = AdvancedRecommendationEngine.getPopularProducts(allProducts, 10)
```

**Algorithme de Filtrage Collaboratif:**

1. Trouver des utilisateurs similaires (similarité cosinus)
2. Récupérer leurs achats
3. Filtrer les produits déjà achetés
4. Scorer et trier par pertinence

---

### AIAssistantService.js

**Responsabilités:**
- Traiter les messages utilisateur
- Détecter l'intention avancée
- Générer des réponses intelligentes
- Orchestrer tous les services

**Méthodes principales:**

```javascript
// Traiter un message
const response = await AIAssistantService.processMessage(
  userMessage,
  products,
  startups,
  categories,
  bdlServices
)
// Retourne:
{
  text: "Voici mes recommandations pour toi...",
  actions: [
    { label: "Voir produit", action: "VIEW_PRODUCT", data: "productId" }
  ],
  suggestions: [],
  clarification: {
    question: "Tu préfères quel prix ?",
    options: ["Moins de 10,000", "10,000-50,000", "Plus de 50,000"]
  },
  sentiment: "positive",
  intent: "PERSONALIZED_RECOMMENDATIONS",
  entities: { category: "Mode", maxBudget: 50000 }
}
```

**Intentions Détectées:**

| Intention | Description | Exemples |
|-----------|-------------|----------|
| `PERSONALIZED_RECOMMENDATIONS` | Demande de recommandations | "Recommande-moi", "Que me conseilles-tu" |
| `PURCHASE_INTENT` | Volonté d'achat | "Je veux acheter", "Commander" |
| `PRICE_CONCERN` | Préoccupation prix | "C'est trop cher", "Moins cher" |
| `COMPARE_PRODUCTS` | Comparaison | "Comparer A et B", "Différence entre" |
| `STOCK_CHECK` | Vérification stock | "Disponible ?", "En stock ?" |
| `DELIVERY_INFO` | Informations livraison | "Délai de livraison", "Quand reçu ?" |
| `BDL_SERVICES` | Services créatifs | "Design graphique", "Montage vidéo" |
| `USER_ORDERS` | Commandes utilisateur | "Mes commandes", "Suivi" |
| `TRENDING` | Produits populaires | "Tendances", "Best sellers" |
| `NEW_ARRIVALS` | Nouveautés | "Nouveaux produits", "Dernières arrivées" |
| `HELP` | Aide | "Comment ça marche", "Aide" |
| `ISSUE_REPORT` | Problème technique | "Erreur", "Bug", "Ne marche pas" |

---

## 📊 Profil Utilisateur - Détails

### Score d'Engagement (0-100)

Calculé avec:
- **40 points** - Nombre de commandes (5 pts par commande)
- **20 points** - Services BDL commandés (10 pts par service)
- **15 points** - Produits favoris (2 pts par favori)
- **15 points** - Interactions (0.5 pt par interaction)
- **10 points** - Activité récente (2 pts par action 7 derniers jours)

### Catégories de Dépensiers

| Catégorie | Dépense totale | Emoji |
|-----------|----------------|-------|
| `new` | 0 XAF | 🆕 |
| `occasional` | < 50,000 XAF | ⭐ |
| `regular` | 50,000 - 200,000 XAF | 💎 |
| `loyal` | 200,000 - 500,000 XAF | 👑 |
| `vip` | > 500,000 XAF | 🔥 |

### Profil Comportemental

```javascript
behaviorProfile: {
  // Fréquence d'achat moyenne (en jours)
  purchaseFrequency: 30,

  // Temps de décision moyen (en heures)
  decisionTime: 48,

  // Pattern temporel
  temporalPattern: {
    peakHour: 14,           // 14h
    peakDay: 5,             // Vendredi
    peakDayName: "Vendredi",
    isWeekendShopper: false,
    isNightShopper: false
  },

  // Activité récente
  recentActivity: {
    last30Days: 3,
    last90Days: 8
  },

  // Taux de conversion (%)
  conversionRate: 15.5,

  // Taille moyenne du panier
  averageCartSize: 2.3,

  // Taux de réachat (%)
  repeatPurchaseRate: 40,

  // Heure préférée d'achat
  preferredShoppingTime: {
    hour: 14,
    period: "après-midi"
  }
}
```

---

## 🎨 Interface Utilisateur - PipBotScreen

### Composants Visuels

1. **Header Premium**
   - Avatar animé du bot (pulsation)
   - Indicateur en ligne
   - Score d'engagement en temps réel
   - Bouton reset de conversation

2. **Messages**
   - Bulles différenciées (bot vs utilisateur)
   - Avatar du bot par message
   - Affichage debug (mode dev) : intention + sentiment
   - Animations smooth

3. **Actions Intelligentes**
   - Boutons d'action contextuelle
   - Navigation directe vers produits/services
   - Ajout au panier en un clic

4. **Questions de Clarification**
   - Affichage automatique si besoin
   - Options cliquables
   - Design distinct

5. **Animations**
   - **Thinking** (🧠) : Rotation pendant l'analyse
   - **Typing** (🤖) : Dots animés
   - **Avatar** : Pulsation constante
   - **Indicateur en ligne** : Point vert

6. **Suggestions Intelligentes**
   - Personnalisées selon le profil
   - Scroll horizontal
   - Mise à jour contextuelle

---

## 🚀 Utilisation

### Initialisation

```javascript
import PipBotScreen from './screens/PipBotScreen';

// Navigation
navigation.navigate('PipBot');
```

### Flow Typique

1. **Chargement**
   - Récupération des données (produits, startups, catégories)
   - Chargement du profil utilisateur
   - Initialisation du contexte conversationnel
   - Génération du message de bienvenue personnalisé

2. **Interaction Utilisateur**
   - Utilisateur tape un message
   - Tracking de la recherche
   - Analyse par IA (thinking animation)
   - Extraction d'entités
   - Détection d'intention
   - Génération de réponse
   - Affichage avec actions

3. **Actions**
   - Clic sur bouton d'action
   - Navigation appropriée
   - Tracking de l'interaction
   - Mise à jour du contexte

---

## 📈 Optimisations

### Performance

1. **Cache**
   - Profil utilisateur : 5 minutes
   - Produits/Startups : Session complète

2. **Lazy Loading**
   - Chargement asynchrone des données
   - Messages chargés par batch

3. **Debouncing**
   - Typing animation
   - Suggestions updates

### Précision IA

1. **Normalisation de Texte**
   - Suppression des accents
   - Lowercase
   - Trimming

2. **Fuzzy Matching**
   - Seuil de similarité : 0.6-0.8
   - Levenshtein distance

3. **Stop Words**
   - Liste française complète
   - Filtrage intelligent des mots-clés

---

## 🔒 Sécurité & Vie Privée

- ✅ Données stockées localement (AsyncStorage)
- ✅ Profil anonymisé possible
- ✅ Pas de partage de données personnelles
- ✅ Conformité RGPD-ready

---

## 🐛 Debug Mode

En mode développement (`__DEV__`), chaque message bot affiche:
- **Intent détecté**
- **Sentiment analysé**
- **Entités extraites** (via console)

---

## 🔄 Évolutions Futures

### Court terme
- [ ] Support multilingue (Anglais, Français)
- [ ] Reconnaissance vocale
- [ ] Suggestions de produits visuelles (images)
- [ ] Partage de recommandations

### Moyen terme
- [ ] Intégration ChatGPT/Claude API
- [ ] Analyse d'images (recherche visuelle)
- [ ] Comparaison de prix en temps réel
- [ ] Alertes de baisse de prix

### Long terme
- [ ] Prédiction de besoins
- [ ] Assistant proactif
- [ ] Chatbot vocal complet
- [ ] Réalité augmentée (essai virtuel)

---

## 📝 Exemples de Conversations

### Exemple 1 : Recommandations Personnalisées

```
USER: Recommande-moi quelque chose

BOT: Salut Jean ! Voici mes recommandations PERSONNALISÉES pour toi :

1. 📦 Samsung Galaxy A54
   💰 285,000 XAF
   ✨ Similaire à "iPhone 13" que tu as acheté

2. 📦 AirPods Pro 2
   💰 85,000 XAF
   ✨ Top produit dans ta catégorie favorite: Électronique

3. 📦 MacBook Air M2
   💰 950,000 XAF
   ✨ 3 utilisateurs similaires ont aimé ce produit

Ces recommandations sont basées sur :
• Tes 5 commande(s)
• Tes préférences (3 catégories)
• Ton budget moyen (~150,000 XAF)

Score d'engagement: 72/100 🎯

[Boutons: Voir produit 1 | Voir produit 2 | Voir produit 3]
```

### Exemple 2 : Recherche avec Budget

```
USER: Téléphone rouge à moins de 100000

BOT: 🔍 J'ai trouvé 4 produits :

1. 📦 Redmi Note 12 Pro (Rouge)
   💰 95,000 XAF
   🏢 TechPro Cameroun
   📍 Yaoundé

2. 📦 Samsung A14 (Rouge Corail)
   💰 85,000 XAF
   🏢 Mobile Zone
   📍 Douala

3. 📦 Infinix Hot 30i (Rouge)
   💰 65,000 XAF
   🏢 SmartPhones CM
   📍 Yaoundé

Tu veux plus de détails sur un produit ?

[Boutons: Voir tout | Comparer | Filtrer]
```

### Exemple 3 : Question de Suivi

```
USER: Recommande-moi un téléphone

BOT: J'ai trouvé plusieurs téléphones. Tu préfères voir les moins chers, les plus populaires, ou les nouveautés ?

[Options: Prix bas | Populaires | Nouveautés]

USER: Prix bas

BOT: Voici les meilleurs téléphones au meilleur prix :

1. 📦 Tecno Spark 10 Pro
   💰 55,000 XAF
   ⭐ 4.2/5
   🏢 Mobile Center

2. 📦 Infinix Hot 30i
   💰 65,000 XAF
   ⭐ 4.5/5
   🏢 SmartPhones CM

[Actions...]
```

---

## 🎓 Best Practices

### Pour les Développeurs

1. **Toujours tracker les interactions**
```javascript
await UserProfileService.trackInteraction('view', { productId });
```

2. **Invalider le cache après updates**
```javascript
UserProfileService.clearCache();
```

3. **Gérer les erreurs gracieusement**
```javascript
try {
  const response = await AIAssistantService.processMessage(...);
} catch (error) {
  console.error(error);
  // Afficher message d'erreur sympathique
}
```

4. **Tester avec différents profils**
- Nouvel utilisateur
- Utilisateur régulier
- VIP avec historique
- Utilisateur frustré (sentiment négatif)

---

## 📞 Support

Pour toute question ou problème :
- 📧 Email: dev@pipomarket.com
- 📱 Slack: #pipbot-ai
- 📚 Wiki: wiki.pipomarket.com/pipbot

---

## 🏆 Crédits

**Développé avec ❤️ pour PipoMarket**

Technologies utilisées:
- React Native
- Firebase Firestore
- Expo
- AsyncStorage
- Algorithmes ML custom

---

**Version:** 2.0
**Dernière mise à jour:** 2025-01-17
**Statut:** ✅ Production Ready
