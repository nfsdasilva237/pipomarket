// screens/PipBotScreen.js - VERSION ULTRA-PREMIUM avec IA avancée
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../config/firebase';
import { bdlServices } from '../data/bdlServicesData';
import IntelligentSearchService from '../services/IntelligentSearch';

const { width } = Dimensions.get('window');

export default function PipBotScreen({ navigation }) {
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Salut ! Je suis PipBot, ton assistant intelligent sur PipoMarket !\n\nJe connais TOUT sur :\n- Les produits et leurs prix\n- Les startups partenaires\n- Les services BDL Studio\n- Tes commandes et ton historique\n- Les tendances et nouveautés\n\nQu'est-ce que je peux faire pour toi ?",
      isBot: true,
      timestamp: new Date(),
      actions: [],
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef();
  const typingAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  // DONNÉES COMPLÈTES PIPOMARKET
  const [products, setProducts] = useState([]);
  const [startups, setStartups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [userBDLOrders, setUserBDLOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataStats, setDataStats] = useState({});

  // Animations
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnimation, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(typingAnimation, { toValue: 0, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      typingAnimation.setValue(0);
    }
  }, [isTyping]);

  useEffect(() => {
    loadAllData();
  }, []);

  // CHARGER TOUTES LES DONNÉES
  const loadAllData = async () => {
    try {
      // Produits
      const productsSnap = await getDocs(collection(db, 'products'));
      const productsData = productsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);

      // Startups
      const startupsSnap = await getDocs(collection(db, 'startups'));
      const startupsData = startupsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStartups(startupsData);

      // Catégories depuis Firebase
      const catsSnap = await getDocs(collection(db, 'categories'));
      const catsData = catsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(catsData);

      // Commandes utilisateur
      const userId = auth.currentUser?.uid;
      if (userId) {
        const ordersSnap = await getDocs(
          query(collection(db, 'orders'), where('userId', '==', userId))
        );
        setUserOrders(ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const bdlOrdersSnap = await getDocs(
          query(collection(db, 'bdlServiceOrders'), where('userId', '==', userId))
        );
        setUserBDLOrders(bdlOrdersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }

      // Calculer stats
      const prices = productsData.map(p => p.price).filter(p => p > 0);
      setDataStats({
        totalProducts: productsData.length,
        totalStartups: startupsData.length,
        totalCategories: catsData.length,
        avgPrice: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
        minPrice: prices.length > 0 ? Math.min(...prices) : 0,
        maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
      });

    } catch (error) {
      console.error('Erreur chargement données PipBot:', error);
    } finally {
      setLoading(false);
    }
  };

  // NORMALISATION TEXTE
  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  };

  // RECHERCHE FLOUE AMÉLIORÉE
  const fuzzyMatch = (search, target, threshold = 0.6) => {
    const s = normalizeText(search);
    const t = normalizeText(target);

    if (t.includes(s)) return 1;
    if (s.includes(t)) return 0.9;

    // Calcul similarité Levenshtein simplifiée
    let matches = 0;
    for (let char of s) {
      if (t.includes(char)) matches++;
    }
    return matches / s.length;
  };

  // EXTRACTION MOTS-CLÉS INTELLIGENTE
  const extractKeywords = (text) => {
    const stopWords = ['le', 'la', 'les', 'un', 'une', 'des', 'je', 'tu', 'il', 'elle', 'on',
                       'nous', 'vous', 'ils', 'elles', 'de', 'du', 'a', 'et', 'ou', 'pour',
                       'dans', 'sur', 'avec', 'sans', 'cherche', 'trouve', 'voir', 'montre',
                       'donne', 'dis', 'me', 'moi', 'toi', 'ce', 'cette', 'ces', 'mon', 'ma',
                       'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'notre', 'votre', 'leur',
                       'est', 'sont', 'ai', 'as', 'avons', 'avez', 'ont', 'suis', 'es', 'sommes',
                       'etes', 'peux', 'peut', 'peuvent', 'veux', 'veut', 'veulent', 'fais', 'fait',
                       'qui', 'que', 'quoi', 'dont', 'où', 'quand', 'comment', 'pourquoi', 'combien'];

    return normalizeText(text)
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
  };

  // DÉTECTION D'INTENTION AVANCÉE
  const detectIntent = (msg) => {
    const normalized = normalizeText(msg);

    // Intentions prioritaires (ordre important!)

    // BDL Services
    if (/bdl|studio|design.*graphique|montage.*video|drone|shooting|community.*management|logo|flyer|carte.*visite|web.*dev/i.test(msg)) {
      return 'BDL_SERVICES';
    }

    // Commandes utilisateur
    if (/ma.*commande|mes.*commandes|mon.*achat|mes.*achats|historique|suivi|status.*commande/i.test(msg)) {
      return 'USER_ORDERS';
    }

    // Recommandations personnalisées
    if (/recommand|suggest|conseil|propose|quoi.*acheter|que.*prendre/i.test(msg)) {
      return 'RECOMMENDATIONS';
    }

    // Comparaison produits
    if (/compar|difference.*entre|mieux.*entre|versus|vs|ou.*choisir/i.test(msg)) {
      return 'COMPARE';
    }

    // Promotions/Offres
    if (/promo|solde|reduction|offre|discount|moins.*cher/i.test(msg)) {
      return 'PROMOTIONS';
    }

    // Startups
    if (/startup|entreprise|vendeur|boutique|magasin|seller|compagnie|partenaire/i.test(msg)) {
      return 'STARTUPS';
    }

    // Catégories
    if (/categorie|type.*produit|genre.*produit|section|rayon/i.test(msg)) {
      return 'CATEGORIES';
    }

    // Prix
    if (/prix|coute|combien|tarif|montant|coutent|budget/i.test(msg)) {
      return 'PRIX';
    }

    // Localisation
    if (/yaounde|douala|bafoussam|bamenda|ville|region|quartier|livr.*a|disponible.*a/i.test(msg)) {
      return 'LOCATION';
    }

    // Tendances
    if (/populaire|tendance|top|best|meilleures?.*vente|plus.*vend|hit/i.test(msg)) {
      return 'TRENDING';
    }

    // Nouveautés
    if (/nouveau|recent|dernier|nouveaute|latest|just.*arrive/i.test(msg)) {
      return 'NEW_ARRIVALS';
    }

    // Livraison
    if (/livr|expedi|recevoir|delai|transport|envoi/i.test(msg)) {
      return 'DELIVERY';
    }

    // Paiement
    if (/pay|mobile.*money|momo|orange.*money|argent|paiement|mode.*paiement/i.test(msg)) {
      return 'PAYMENT';
    }

    // Aide
    if (/aide|comment|marche|utiliser|fonctionne|help|tutoriel|guide/i.test(msg)) {
      return 'HELP';
    }

    // Stats
    if (/combien|nombre|statistique|total|compte|resume/i.test(msg)) {
      return 'STATS';
    }

    // Salutations
    if (/^(salut|bonjour|hello|hi|weh|yo|hey|coucou|bonsoir|bjr)/i.test(msg)) {
      return 'GREETING';
    }

    // Remerciements
    if (/merci|thanks|thank|cool|super|genial|parfait/i.test(msg)) {
      return 'THANKS';
    }

    // Au revoir
    if (/bye|au revoir|aurevoir|a plus|tchao|ciao|a\+/i.test(msg)) {
      return 'GOODBYE';
    }

    // Recherche produit par défaut
    return 'SEARCH_PRODUCT';
  };

  // GÉNÉRATION DE RÉPONSE INTELLIGENTE
  const generateResponse = async (userMessage) => {
    const intent = detectIntent(userMessage);
    const keywords = extractKeywords(userMessage);
    const normalized = normalizeText(userMessage);

    let response = '';
    let actions = [];

    switch(intent) {
      // ===== SALUTATION =====
      case 'GREETING': {
        const hour = new Date().getHours();
        const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
        const userName = auth.currentUser?.displayName?.split(' ')[0] || '';

        response = `${greeting}${userName ? ` ${userName}` : ''} !\n\n` +
                   `Bienvenue sur PipoMarket !\n\n` +
                   `Actuellement disponible :\n` +
                   `- ${dataStats.totalProducts} produits\n` +
                   `- ${dataStats.totalStartups} startups\n` +
                   `- ${dataStats.totalCategories} catégories\n` +
                   `- 6 services créatifs BDL Studio\n\n` +
                   `Comment puis-je t'aider aujourd'hui ?`;

        actions = [
          { label: 'Voir les produits', action: 'BROWSE_PRODUCTS' },
          { label: 'Services BDL', action: 'BDL_INFO' },
        ];
        break;
      }

      // ===== SERVICES BDL =====
      case 'BDL_SERVICES': {
        // Chercher service spécifique
        const serviceKeywords = {
          'design': 'design_graphique',
          'graphique': 'design_graphique',
          'logo': 'design_graphique',
          'flyer': 'design_graphique',
          'montage': 'montage_video',
          'video': 'montage_video',
          'clip': 'montage_video',
          'web': 'developpement_web',
          'site': 'developpement_web',
          'application': 'developpement_web',
          'drone': 'location_drone',
          'aerien': 'location_drone',
          'shooting': 'shooting_photo',
          'photo': 'shooting_photo',
          'community': 'community_management',
          'reseaux': 'community_management',
          'social': 'community_management',
        };

        let foundService = null;
        for (const [keyword, serviceId] of Object.entries(serviceKeywords)) {
          if (normalized.includes(keyword)) {
            foundService = bdlServices.find(s => s.id === serviceId);
            break;
          }
        }

        if (foundService) {
          response = `${foundService.icon} ${foundService.name}\n\n` +
                     `${foundService.description}\n\n` +
                     `Packages disponibles :\n\n`;

          foundService.packages.forEach((pkg, i) => {
            response += `${i + 1}. ${pkg.name}\n`;
            response += `   ${pkg.price.toLocaleString()} XAF\n`;
            response += `   ${pkg.description}\n\n`;
          });

          response += `Tu veux commander ce service ?`;

          actions = [
            { label: 'Commander', action: 'ORDER_BDL', data: foundService.id },
            { label: 'Autres services', action: 'LIST_BDL' },
          ];
        } else {
          response = `Services créatifs BDL Studio :\n\n`;

          bdlServices.forEach((service, i) => {
            response += `${service.icon} ${service.name}\n`;
            response += `   Prix: ${service.packages[0].price.toLocaleString()} - ${service.packages[service.packages.length-1].price.toLocaleString()} XAF\n\n`;
          });

          response += `Quel service t'intéresse ?`;

          actions = [
            { label: 'Design Graphique', action: 'BDL_DETAIL', data: 'design_graphique' },
            { label: 'Montage Vidéo', action: 'BDL_DETAIL', data: 'montage_video' },
            { label: 'Développement Web', action: 'BDL_DETAIL', data: 'developpement_web' },
          ];
        }
        break;
      }

      // ===== COMMANDES UTILISATEUR =====
      case 'USER_ORDERS': {
        if (!auth.currentUser) {
          response = `Tu dois être connecté pour voir tes commandes.\n\nConnecte-toi d'abord !`;
          actions = [{ label: 'Se connecter', action: 'LOGIN' }];
        } else if (userOrders.length === 0 && userBDLOrders.length === 0) {
          response = `Tu n'as pas encore de commandes.\n\nCommence à explorer nos ${dataStats.totalProducts} produits !`;
          actions = [{ label: 'Voir produits', action: 'BROWSE_PRODUCTS' }];
        } else {
          response = `Tes commandes :\n\n`;

          if (userOrders.length > 0) {
            response += `📦 Produits (${userOrders.length}):\n`;
            userOrders.slice(0, 3).forEach((order, i) => {
              const status = order.status === 'pending' ? '⏳ En attente' :
                           order.status === 'processing' ? '⚙️ En cours' :
                           order.status === 'delivered' ? '✅ Livré' : '📦 ' + order.status;
              response += `${i + 1}. #${order.id.substring(0, 8)} - ${status}\n`;
            });
            response += '\n';
          }

          if (userBDLOrders.length > 0) {
            response += `🎨 Services BDL (${userBDLOrders.length}):\n`;
            userBDLOrders.slice(0, 3).forEach((order, i) => {
              const status = order.status === 'pending' ? '⏳ En attente' :
                           order.status === 'in_progress' ? '⚙️ En cours' :
                           order.status === 'completed' ? '✅ Terminé' : '📋 ' + order.status;
              response += `${i + 1}. ${order.serviceName} - ${status}\n`;
            });
          }

          response += `\nVeux-tu voir les détails d'une commande ?`;
          actions = [{ label: 'Mes services BDL', action: 'MY_BDL_SERVICES' }];
        }
        break;
      }

      // ===== RECOMMANDATIONS =====
      case 'RECOMMENDATIONS': {
        const recommended = products
          .filter(p => p.rating >= 4 || p.sales > 10)
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 5);

        response = `Mes recommandations pour toi :\n\n`;

        recommended.forEach((p, i) => {
          response += `${i + 1}. ${p.name}\n`;
          response += `   ${p.price.toLocaleString()} XAF\n`;
          if (p.rating) response += `   Note: ${p.rating}/5\n`;
          if (p.startupName) response += `   Par: ${p.startupName}\n`;
          response += '\n';
        });

        response += `Ces produits sont populaires et bien notés !`;
        actions = [{ label: 'Voir tous les produits', action: 'BROWSE_PRODUCTS' }];
        break;
      }

      // ===== STARTUPS =====
      case 'STARTUPS': {
        const foundStartup = startups.find(s =>
          fuzzyMatch(s.name, userMessage) > 0.7
        );

        if (foundStartup) {
          const startupProducts = products.filter(p => p.startupId === foundStartup.id);

          response = `${foundStartup.name}\n\n` +
                     `📂 ${foundStartup.category || 'Divers'}\n` +
                     `📍 ${foundStartup.city || 'Cameroun'}\n` +
                     (foundStartup.rating ? `Rating: ${foundStartup.rating}/5\n` : '') +
                     (foundStartup.description ? `\n${foundStartup.description}\n` : '') +
                     `\n📦 ${startupProducts.length} produits disponibles:\n\n`;

          startupProducts.slice(0, 5).forEach((p, i) => {
            response += `${i + 1}. ${p.name} - ${p.price.toLocaleString()} XAF\n`;
          });

          if (startupProducts.length > 5) {
            response += `\n... et ${startupProducts.length - 5} autres produits !`;
          }
        } else {
          response = `Nos ${startups.length} startups partenaires :\n\n`;

          startups.slice(0, 8).forEach((s, i) => {
            const prodCount = products.filter(p => p.startupId === s.id).length;
            response += `${i + 1}. ${s.name}\n`;
            if (s.category) response += `   📂 ${s.category}\n`;
            response += `   📦 ${prodCount} produits\n\n`;
          });

          if (startups.length > 8) {
            response += `... et ${startups.length - 8} autres startups !`;
          }
        }
        break;
      }

      // ===== CATÉGORIES =====
      case 'CATEGORIES': {
        const foundCat = categories.find(c =>
          fuzzyMatch(c.name || c.id, userMessage) > 0.7
        );

        if (foundCat) {
          const catProducts = products.filter(p =>
            p.category === (foundCat.name || foundCat.id)
          ).slice(0, 8);

          response = `📂 Catégorie "${foundCat.name || foundCat.id}"\n\n` +
                     `${catProducts.length} produits:\n\n`;

          catProducts.forEach((p, i) => {
            response += `${i + 1}. ${p.name}\n`;
            response += `   ${p.price.toLocaleString()} XAF\n`;
            if (p.startupName) response += `   🏢 ${p.startupName}\n`;
            response += '\n';
          });
        } else {
          response = `📂 Catégories disponibles :\n\n`;

          categories.forEach((cat, i) => {
            const count = products.filter(p => p.category === (cat.name || cat.id)).length;
            response += `${i + 1}. ${cat.emoji || '📦'} ${cat.name || cat.id}\n`;
            response += `   ${count} produit${count > 1 ? 's' : ''}\n\n`;
          });

          response += `Quelle catégorie veux-tu explorer ?`;
        }
        break;
      }

      // ===== PRIX =====
      case 'PRIX': {
        // Chercher produit spécifique
        let foundProduct = null;
        for (const product of products) {
          if (fuzzyMatch(product.name, userMessage) > 0.7) {
            foundProduct = product;
            break;
          }
        }

        if (foundProduct) {
          response = `💰 ${foundProduct.name}\n\n` +
                     `Prix: ${foundProduct.price.toLocaleString()} XAF\n\n` +
                     `🏢 Vendu par: ${foundProduct.startupName || 'Startup'}\n` +
                     `📍 ${foundProduct.city || 'Disponible'}\n` +
                     (foundProduct.stock ? `📦 Stock: ${foundProduct.stock}\n` : '') +
                     (foundProduct.description ? `\n${foundProduct.description}\n` : '');

          actions = [{ label: 'Voir produit', action: 'VIEW_PRODUCT', data: foundProduct.id }];
        } else {
          response = `💰 Aperçu des prix sur PipoMarket :\n\n` +
                     `📉 Prix minimum: ${dataStats.minPrice.toLocaleString()} XAF\n` +
                     `📊 Prix moyen: ${dataStats.avgPrice.toLocaleString()} XAF\n` +
                     `📈 Prix maximum: ${dataStats.maxPrice.toLocaleString()} XAF\n\n` +
                     `${dataStats.totalProducts} produits disponibles\n\n` +
                     `Quel produit t'intéresse ?`;
        }
        break;
      }

      // ===== LOCALISATION =====
      case 'LOCATION': {
        const cityMap = {
          'yaounde': ['yaounde', 'yaoundé', 'yde'],
          'douala': ['douala', 'dla'],
          'bafoussam': ['bafoussam'],
          'bamenda': ['bamenda']
        };

        let cityName = null;
        for (const [city, variations] of Object.entries(cityMap)) {
          if (variations.some(v => normalized.includes(v))) {
            cityName = city.charAt(0).toUpperCase() + city.slice(1);
            break;
          }
        }

        if (cityName) {
          const cityProducts = products.filter(p =>
            p.city && normalizeText(p.city).includes(normalizeText(cityName))
          );

          if (cityProducts.length > 0) {
            response = `📍 Produits à ${cityName} (${cityProducts.length}):\n\n`;

            cityProducts.slice(0, 8).forEach((p, i) => {
              response += `${i + 1}. ${p.name}\n`;
              response += `   ${p.price.toLocaleString()} XAF\n`;
              if (p.startupName) response += `   🏢 ${p.startupName}\n`;
              response += '\n';
            });

            if (cityProducts.length > 8) {
              response += `... et ${cityProducts.length - 8} autres produits !`;
            }
          } else {
            response = `Pas de produits spécifiques à ${cityName} pour le moment.\n\n` +
                       `Mais on a ${dataStats.totalProducts} produits disponibles !`;
          }
        } else {
          response = `📍 Villes disponibles :\n\n` +
                     `- Yaoundé\n- Douala\n- Bafoussam\n- Bamenda\n\n` +
                     `Dans quelle ville cherches-tu ?`;
        }
        break;
      }

      // ===== TENDANCES =====
      case 'TRENDING': {
        const trending = products
          .sort((a, b) => (b.sales || 0) - (a.sales || 0) || (b.rating || 0) - (a.rating || 0))
          .slice(0, 8);

        response = `🔥 Top ${trending.length} produits tendance :\n\n`;

        trending.forEach((p, i) => {
          response += `${i + 1}. ${p.name}\n`;
          response += `   ${p.price.toLocaleString()} XAF\n`;
          if (p.sales) response += `   🛒 ${p.sales} ventes\n`;
          if (p.rating) response += `   ⭐ ${p.rating}/5\n`;
          response += '\n';
        });

        response += `Ces produits cartonnent en ce moment !`;
        break;
      }

      // ===== NOUVEAUTÉS =====
      case 'NEW_ARRIVALS': {
        const newProducts = products
          .filter(p => p.createdAt)
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
            const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
            return dateB - dateA;
          })
          .slice(0, 8);

        response = `🆕 Dernières nouveautés :\n\n`;

        newProducts.forEach((p, i) => {
          response += `${i + 1}. ${p.name}\n`;
          response += `   ${p.price.toLocaleString()} XAF\n`;
          if (p.startupName) response += `   🏢 ${p.startupName}\n`;
          response += '\n';
        });

        response += `Découvre ces nouveaux produits !`;
        break;
      }

      // ===== STATS =====
      case 'STATS': {
        response = `📊 Statistiques PipoMarket :\n\n` +
                   `📦 ${dataStats.totalProducts} produits\n` +
                   `🏢 ${dataStats.totalStartups} startups\n` +
                   `📂 ${dataStats.totalCategories} catégories\n` +
                   `🎨 6 services BDL Studio\n\n` +
                   `💰 Prix moyen: ${dataStats.avgPrice.toLocaleString()} XAF\n` +
                   `📉 Min: ${dataStats.minPrice.toLocaleString()} XAF\n` +
                   `📈 Max: ${dataStats.maxPrice.toLocaleString()} XAF\n\n`;

        if (auth.currentUser) {
          response += `Tes commandes:\n` +
                     `📦 ${userOrders.length} commande(s)\n` +
                     `🎨 ${userBDLOrders.length} service(s) BDL`;
        }
        break;
      }

      // ===== LIVRAISON =====
      case 'DELIVERY': {
        response = `🚚 Informations livraison :\n\n` +
                   `📦 Délais moyens :\n` +
                   `• Yaoundé : 1-2 jours ⚡\n` +
                   `• Douala : 2-3 jours 🚗\n` +
                   `• Autres villes : 3-5 jours 🛣️\n\n` +
                   `💡 Les délais exacts sont sur chaque produit !\n\n` +
                   `✅ Suivi en temps réel disponible\n` +
                   `📞 Support client disponible`;
        break;
      }

      // ===== PAIEMENT =====
      case 'PAYMENT': {
        response = `💳 Modes de paiement :\n\n` +
                   `✅ Mobile Money\n` +
                   `   • MTN MoMo\n` +
                   `   • Orange Money\n\n` +
                   `✅ Paiement à la livraison\n` +
                   `✅ Carte bancaire (bientôt)\n\n` +
                   `🔒 Paiement 100% sécurisé\n` +
                   `💰 Pas de frais cachés\n` +
                   `📱 Simple et rapide`;
        break;
      }

      // ===== AIDE =====
      case 'HELP': {
        response = `❓ Comment utiliser PipoMarket :\n\n` +
                   `1️⃣ Parcours les produits\n` +
                   `2️⃣ Ajoute au panier 🛒\n` +
                   `3️⃣ Passe ta commande\n` +
                   `4️⃣ Choisis ton paiement\n` +
                   `5️⃣ Reçois chez toi ! 📦\n\n` +
                   `🎨 Services BDL Studio :\n` +
                   `• Design graphique\n` +
                   `• Montage vidéo\n` +
                   `• Développement web\n` +
                   `• Et plus...\n\n` +
                   `💬 Pose-moi tes questions !`;

        actions = [
          { label: 'Voir produits', action: 'BROWSE_PRODUCTS' },
          { label: 'Services BDL', action: 'BDL_INFO' },
        ];
        break;
      }

      // ===== REMERCIEMENTS =====
      case 'THANKS': {
        response = `De rien ! 😊\n\nJe suis là pour t'aider !\n\nAutre question ?`;
        break;
      }

      // ===== AU REVOIR =====
      case 'GOODBYE': {
        response = `À bientôt sur PipoMarket ! 👋\n\nBonnes découvertes ! 🚀`;
        break;
      }

      // ===== RECHERCHE PRODUIT =====
      case 'SEARCH_PRODUCT':
      default: {
        if (keywords.length === 0) {
          response = `🤔 Je n'ai pas bien compris.\n\n` +
                     `Essaye de me demander :\n\n` +
                     `🔍 "Montre-moi des téléphones"\n` +
                     `🏢 "Quelles startups ?"\n` +
                     `📂 "Catégories disponibles"\n` +
                     `🎨 "Services BDL Studio"\n` +
                     `💰 "Prix moyen des produits"\n` +
                     `🔥 "Produits populaires"\n` +
                     `📦 "Mes commandes"\n\n` +
                     `Reformule ta question !`;
          break;
        }

        // Utiliser le service de recherche intelligent
        const searchResult = await IntelligentSearchService.intelligentSearch(
          userMessage,
          products
        );

        if (searchResult.results.length > 0) {
          response = `🔍 J'ai trouvé ${searchResult.results.length} produit(s) :\n\n`;

          searchResult.results.slice(0, 8).forEach((p, i) => {
            response += `${i + 1}. 📦 ${p.name}\n`;
            response += `   💰 ${p.price.toLocaleString()} XAF\n`;
            if (p.startupName) response += `   🏢 ${p.startupName}\n`;
            if (p.city) response += `   📍 ${p.city}\n`;
            response += '\n';
          });

          if (searchResult.results.length > 8) {
            response += `... et ${searchResult.results.length - 8} autres résultats !`;
          }

          response += `\nTu veux plus de détails sur un produit ?`;
        } else {
          // Suggestions alternatives
          const suggestions = categories.slice(0, 3).map(c => c.name || c.id);

          response = `😔 Aucun résultat pour "${userMessage}"\n\n` +
                     `💡 Suggestions :\n\n` +
                     `• Cherche dans nos catégories :\n`;

          suggestions.forEach(s => {
            response += `  - ${s}\n`;
          });

          response += `\n• Ou essaye :\n` +
                     `  - "produits populaires"\n` +
                     `  - "nouveautés"\n` +
                     `  - "services BDL"\n\n` +
                     `Reformule ta recherche !`;
        }
        break;
      }
    }

    return { text: response, actions };
  };

  // ENVOI MESSAGE
  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      isBot: false,
      timestamp: new Date(),
      actions: [],
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setIsTyping(true);

    setTimeout(async () => {
      const botResponse = await generateResponse(currentInput);
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponse.text,
        isBot: true,
        timestamp: new Date(),
        actions: botResponse.actions || [],
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 500);
  };

  // QUICK REPLIES
  const quickReplies = [
    { id: '1', text: '🔥 Tendances', message: 'Produits populaires' },
    { id: '2', text: '🎨 BDL Studio', message: 'Services BDL Studio' },
    { id: '3', text: '🏢 Startups', message: 'Liste des startups' },
    { id: '4', text: '📂 Catégories', message: 'Catégories disponibles' },
    { id: '5', text: '🆕 Nouveautés', message: 'Nouveaux produits' },
    { id: '6', text: '📦 Mes commandes', message: 'Mes commandes' },
  ];

  const handleQuickReply = (message) => {
    setInputText(message);
    setTimeout(() => handleSend(), 100);
  };

  // HANDLE ACTIONS
  const handleAction = (action, data) => {
    switch (action) {
      case 'BROWSE_PRODUCTS':
        navigation.navigate('HomeTab');
        break;
      case 'BDL_INFO':
      case 'LIST_BDL':
        setInputText('Services BDL Studio');
        setTimeout(() => handleSend(), 100);
        break;
      case 'ORDER_BDL':
      case 'BDL_DETAIL':
        const service = bdlServices.find(s => s.id === data);
        if (service) {
          navigation.navigate('BDLServiceDetail', { serviceId: service.id });
        }
        break;
      case 'MY_BDL_SERVICES':
        navigation.navigate('MyBDLServices');
        break;
      case 'LOGIN':
        navigation.navigate('Login');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient
          colors={['#275471', '#1a3a4f']}
          style={styles.loadingGradient}
        >
          <Animated.View style={[styles.loadingIconContainer, { transform: [{ scale: pulseAnimation }] }]}>
            <Text style={styles.loadingIcon}>🤖</Text>
          </Animated.View>
          <ActivityIndicator size="large" color="#f4a04b" style={{ marginTop: 20 }} />
          <Text style={styles.loadingText}>Initialisation de PipBot...</Text>
          <Text style={styles.loadingSubtext}>Synchronisation des données...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header Premium */}
      <LinearGradient
        colors={['#275471', '#1a3a4f']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.botAvatarContainer}>
            <Animated.Text style={[styles.botAvatar, { transform: [{ scale: pulseAnimation }] }]}>
              🤖
            </Animated.Text>
            <View style={styles.onlineIndicator} />
          </View>
          <Text style={styles.headerTitle}>PipBot Assistant</Text>
          <Text style={styles.headerSubtitle}>
            {dataStats.totalProducts} produits • {dataStats.totalStartups} startups • En ligne
          </Text>
        </View>

        <View style={styles.placeholder} />
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View key={message.id}>
              <View
                style={[
                  styles.messageBubble,
                  message.isBot ? styles.botBubble : styles.userBubble,
                ]}
              >
                {message.isBot && (
                  <View style={styles.botIconContainer}>
                    <Text style={styles.botIcon}>🤖</Text>
                  </View>
                )}
                <View style={[
                  styles.messageContent,
                  message.isBot ? styles.botContent : styles.userContent,
                ]}>
                  <Text style={[
                    styles.messageText,
                    message.isBot ? styles.botText : styles.userText,
                  ]}>
                    {message.text}
                  </Text>
                </View>
              </View>

              {/* Action buttons */}
              {message.actions && message.actions.length > 0 && (
                <View style={styles.actionsContainer}>
                  {message.actions.map((action, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.actionButton}
                      onPress={() => handleAction(action.action, action.data)}
                    >
                      <Text style={styles.actionButtonText}>{action.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}

          {isTyping && (
            <View style={[styles.messageBubble, styles.botBubble]}>
              <View style={styles.botIconContainer}>
                <Text style={styles.botIcon}>🤖</Text>
              </View>
              <Animated.View style={[styles.typingIndicator, { opacity: typingAnimation }]}>
                <View style={styles.typingDot} />
                <View style={[styles.typingDot, { marginLeft: 4 }]} />
                <View style={[styles.typingDot, { marginLeft: 4 }]} />
              </Animated.View>
            </View>
          )}
        </ScrollView>

        {/* Quick Replies */}
        {messages.length <= 2 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickRepliesContainer}
            contentContainerStyle={styles.quickRepliesContent}
          >
            {quickReplies.map((reply) => (
              <TouchableOpacity
                key={reply.id}
                style={styles.quickReplyButton}
                onPress={() => handleQuickReply(reply.message)}
              >
                <Text style={styles.quickReplyText}>{reply.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Pose ta question à PipBot..."
            placeholderTextColor="#8E8E93"
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <LinearGradient
              colors={inputText.trim() ? ['#f4a04b', '#e8943f'] : ['#C7C7CC', '#B0B0B0']}
              style={styles.sendButtonGradient}
            >
              <Text style={styles.sendButtonText}>➤</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    fontSize: 60,
  },
  loadingText: {
    marginTop: 24,
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  botAvatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  botAvatar: {
    fontSize: 36,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#275471',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },

  // Messages
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  botBubble: {
    justifyContent: 'flex-start',
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  botIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  botIcon: {
    fontSize: 24,
  },
  messageContent: {
    maxWidth: '75%',
    padding: 14,
    borderRadius: 18,
  },
  botContent: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userContent: {
    backgroundColor: '#275471',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  botText: {
    color: '#000',
  },
  userText: {
    color: 'white',
  },

  // Actions
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 48,
    marginBottom: 12,
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#275471',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },

  // Typing
  typingIndicator: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8E8E93',
  },

  // Quick Replies
  quickRepliesContainer: {
    maxHeight: 60,
  },
  quickRepliesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  quickReplyButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: '#275471',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickReplyText: {
    color: '#275471',
    fontSize: 13,
    fontWeight: '600',
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 12,
    fontSize: 15,
    maxHeight: 120,
    color: '#000',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
});
