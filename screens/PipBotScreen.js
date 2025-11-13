// screens/PipBotScreen.js - ✅ VERSION ULTRA-AMÉLIORÉE v2
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { db } from '../config/firebase';

export default function PipBotScreen({ navigation }) {
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Salut ! Je suis PipBot 🤖\n\nJe connais TOUS les produits et startups sur PipoMarket !\n\nQu'est-ce que je peux faire pour toi aujourd'hui ?",
      isBot: true,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef();

  // DONNÉES RÉELLES PIPOMARKET
  const [products, setProducts] = useState([]);
  const [startups, setStartups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPipoMarketData();
  }, []);

  // CHARGER LES VRAIES DONNÉES
  const loadPipoMarketData = async () => {
    try {
      // Charger produits
      const productsSnap = await getDocs(collection(db, 'products'));
      const productsData = productsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);

      // Charger startups
      const startupsSnap = await getDocs(collection(db, 'startups'));
      const startupsData = startupsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStartups(startupsData);

      // Extraire catégories uniques
      const cats = [...new Set(productsData.map(p => p.category).filter(Boolean))];
      setCategories(cats);

    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  // UTILITAIRES - Normalisation texte
  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlever accents
      .trim();
  };

  // Recherche floue - tolère fautes d'orthographe
  const fuzzySearch = (searchTerm, targetText) => {
    const search = normalizeText(searchTerm);
    const target = normalizeText(targetText);
    
    // Correspondance exacte
    if (target.includes(search)) return true;
    
    // Correspondance partielle (au moins 70% des caractères)
    let matches = 0;
    for (let char of search) {
      if (target.includes(char)) matches++;
    }
    return matches / search.length >= 0.7;
  };

  // Extraire mots-clés importants
  const extractKeywords = (text) => {
    const stopWords = ['le', 'la', 'les', 'un', 'une', 'des', 'je', 'tu', 'il', 
                       'elle', 'on', 'nous', 'vous', 'ils', 'elles', 'de', 'du', 
                       'a', 'et', 'ou', 'pour', 'dans', 'sur', 'avec', 'sans',
                       'cherche', 'trouve', 'voir', 'montre', 'donne', 'dis', 'me'];
    
    return normalizeText(text)
      .split(' ')
      .filter(word => word.length > 2 && !stopWords.includes(word));
  };

  // ✅ DÉTECTION D'INTENTION AMÉLIORÉE
  const detectIntent = (msg) => {
    // Intentions spécifiques en premier (ordre important!)
    if (/startup|entreprise|vendeur|boutique|magasin|seller|compagnie/i.test(msg)) {
      return 'STARTUPS';
    }
    if (/categorie|type.*produit|genre.*produit|section/i.test(msg)) {
      return 'CATEGORIES';
    }
    if (/prix|coute|combien|tarif|montant|coutent/i.test(msg)) {
      return 'PRIX';
    }
    if (/yaounde|douala|bafoussam|bamenda|ville|region|quartier/i.test(msg)) {
      return 'VILLE';
    }
    if (/populaire|tendance|top|best|meilleures?.*vente|plus.*vend/i.test(msg)) {
      return 'POPULAIRE';
    }
    if (/nouveau|recent|dernier|nouveaute|latest/i.test(msg)) {
      return 'NOUVEAUTES';
    }
    if (/livr|expedi|recevoir|delai|transport/i.test(msg)) {
      return 'LIVRAISON';
    }
    if (/pay|mobile.*money|momo|orange.*money|argent|paiement/i.test(msg)) {
      return 'PAIEMENT';
    }
    if (/aide|comment|marche|utiliser|fonctionne|help/i.test(msg)) {
      return 'AIDE';
    }
    if (/combien|nombre|statistique|total|compte/i.test(msg)) {
      return 'STATS';
    }
    if (/salut|bonjour|hello|hi|weh|yo|hey|coucou|bonsoir/i.test(msg)) {
      return 'SALUTATION';
    }
    if (/merci|thanks|thank/i.test(msg)) {
      return 'MERCI';
    }
    if (/bye|au revoir|aurevoir|a plus|tchao|ciao/i.test(msg)) {
      return 'AUREVOIR';
    }
    
    // Recherche produit par défaut
    return 'SEARCH_PRODUCT';
  };

  // FONCTION PRINCIPALE - RÉPONSES INTELLIGENTES
  const getBotResponse = async (userMessage) => {
    const msg = normalizeText(userMessage);
    const keywords = extractKeywords(userMessage);
    const intent = detectIntent(userMessage);

    // Si pas de données chargées
    if (products.length === 0 && intent !== 'SALUTATION') {
      return "⏳ Chargement des produits en cours...\n\nMerci de patienter un instant !";
    }

    // =====================================
    // ROUTER PAR INTENTION
    // =====================================
    
    switch(intent) {
      // =====================================
      case 'SALUTATION':
      // =====================================
        const timeOfDay = new Date().getHours();
        let greeting = timeOfDay < 12 ? 'Bonjour' : timeOfDay < 18 ? 'Bon après-midi' : 'Bonsoir';
        
        return `${greeting} ! 👋\n\n` +
               `Bienvenue sur PipoMarket !\n\n` +
               `📊 Actuellement disponible :\n` +
               `• ${products.length} produits\n` +
               `• ${startups.length} startups\n` +
               `• ${categories.length} catégories\n\n` +
               `Comment puis-je t'aider ?`;

      // =====================================
      case 'STARTUPS':
      // =====================================
        // Chercher startup spécifique
        const foundStartup = startups.find(s => fuzzySearch(s.name, msg));
        
        if (foundStartup) {
          const startupProducts = products.filter(p => p.startupId === foundStartup.id).slice(0, 5);
          
          return `🏢 ${foundStartup.name}\n\n` +
                 `📂 ${foundStartup.category || 'Divers'}\n` +
                 `📍 ${foundStartup.city || 'Cameroun'}\n` +
                 `⭐ ${foundStartup.rating || '5.0'} étoiles\n` +
                 `${foundStartup.description ? `\n${foundStartup.description}\n` : ''}` +
                 `\n📦 ${startupProducts.length} produit${startupProducts.length > 1 ? 's' : ''} :\n\n` +
                 startupProducts.map((p, i) => 
                   `${i + 1}. ${p.name} - ${p.price?.toLocaleString('fr-FR')} FCFA`
                 ).join('\n');
        }

        // Lister startups
        const startupsList = startups.slice(0, 10);
        let response = `🏢 Startups sur PipoMarket (${startups.length} au total) :\n\n`;
        
        startupsList.forEach((s, i) => {
          response += `${i + 1}. ${s.name}\n`;
          if (s.category) response += `   📂 ${s.category}\n`;
          if (s.city) response += `   📍 ${s.city}\n`;
          response += '\n';
        });
        
        if (startups.length > 10) {
          response += `\n💡 Et ${startups.length - 10} autres startups...\n\n`;
        }
        
        return response + 'Quelle startup t\'intéresse ?';

      // =====================================
      case 'CATEGORIES':
      // =====================================
        // Chercher catégorie spécifique
        const foundCat = categories.find(cat => fuzzySearch(cat, msg));
        
        if (foundCat) {
          const catProducts = products.filter(p => p.category === foundCat).slice(0, 8);
          
          let response = `📂 Catégorie "${foundCat}" :\n\n`;
          response += `${catProducts.length} produit${catProducts.length > 1 ? 's' : ''} disponible${catProducts.length > 1 ? 's' : ''}\n\n`;
          
          catProducts.forEach((p, i) => {
            response += `${i + 1}. ${p.name}\n`;
            response += `   💰 ${p.price?.toLocaleString('fr-FR')} FCFA\n`;
            if (p.startupName) response += `   🏢 ${p.startupName}\n`;
            response += '\n';
          });
          
          return response + '💡 Veux-tu voir plus de détails ?';
        }

        // Lister toutes les catégories
        return `📂 Catégories disponibles sur PipoMarket :\n\n` +
               categories.map((cat, i) => {
                 const count = products.filter(p => p.category === cat).length;
                 return `${i + 1}. ${cat} (${count} produit${count > 1 ? 's' : ''})`;
               }).join('\n') +
               '\n\nQuelle catégorie veux-tu explorer ?';

      // =====================================
      case 'PRIX':
      // =====================================
        // Chercher produit spécifique dans la question
        let foundProduct = null;
        
        for (const product of products) {
          if (fuzzySearch(product.name, msg)) {
            foundProduct = product;
            break;
          }
        }

        if (foundProduct) {
          return `💰 Prix de "${foundProduct.name}" :\n\n` +
                 `✨ ${foundProduct.price?.toLocaleString('fr-FR')} FCFA\n\n` +
                 `🏢 Vendu par : ${foundProduct.startupName || 'Startup'}\n` +
                 `📍 ${foundProduct.city || 'Plusieurs villes'}\n` +
                 `${foundProduct.stock ? `📦 Stock : ${foundProduct.stock}\n` : ''}` +
                 `${foundProduct.available === false ? '⚠️ Indisponible actuellement\n' : ''}` +
                 `\nVeux-tu commander ?`;
        }

        // Fourchette de prix
        const prices = products.map(p => p.price).filter(p => p && p > 0);
        if (prices.length > 0) {
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
          
          return `💰 Prix sur PipoMarket :\n\n` +
                 `📉 Minimum : ${minPrice.toLocaleString('fr-FR')} FCFA\n` +
                 `📊 Moyenne : ${avgPrice.toLocaleString('fr-FR')} FCFA\n` +
                 `📈 Maximum : ${maxPrice.toLocaleString('fr-FR')} FCFA\n\n` +
                 `📦 ${products.length} produits disponibles\n\n` +
                 `Quel produit t'intéresse ?`;
        }
        break;

      // =====================================
      case 'VILLE':
      // =====================================
        const cities = {
          'yaounde': ['yaounde', 'yaoundé', 'yde'],
          'douala': ['douala', 'dla'],
          'bafoussam': ['bafoussam'],
          'bamenda': ['bamenda']
        };

        for (const [city, variations] of Object.entries(cities)) {
          if (variations.some(v => msg.includes(v))) {
            const cityProducts = products.filter(p => 
              p.city && normalizeText(p.city).includes(city)
            ).slice(0, 8);

            if (cityProducts.length > 0) {
              let response = `📍 Produits à ${city.charAt(0).toUpperCase() + city.slice(1)} (${cityProducts.length}) :\n\n`;
              cityProducts.forEach((p, i) => {
                response += `${i + 1}. ${p.name}\n`;
                response += `   💰 ${p.price?.toLocaleString('fr-FR')} FCFA\n`;
                if (p.startupName) response += `   🏢 ${p.startupName}\n`;
                response += '\n';
              });
              return response + 'Lequel t\'intéresse ?';
            }
            
            return `Désolé, aucun produit à ${city.charAt(0).toUpperCase() + city.slice(1)} pour le moment. 😔\n\nMais on a ${products.length} autres produits disponibles !`;
          }
        }
        break;

      // =====================================
      case 'POPULAIRE':
      // =====================================
        const popular = products
          .filter(p => p.sales || p.views || p.rating)
          .sort((a, b) => (b.sales || 0) - (a.sales || 0) || (b.rating || 0) - (a.rating || 0))
          .slice(0, 8);

        if (popular.length > 0) {
          let response = `🔥 Top ${popular.length} produits populaires :\n\n`;
          popular.forEach((p, i) => {
            response += `${i + 1}. ⭐ ${p.name}\n`;
            response += `   💰 ${p.price?.toLocaleString('fr-FR')} FCFA\n`;
            if (p.sales) response += `   🛒 ${p.sales} ventes\n`;
            if (p.rating) response += `   ⭐ ${p.rating}/5\n`;
            response += '\n';
          });
          return response + 'Lequel veux-tu voir ?';
        }
        break;

      // =====================================
      case 'NOUVEAUTES':
      // =====================================
        const recent = products
          .filter(p => p.createdAt)
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
            const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
            return dateB - dateA;
          })
          .slice(0, 8);

        if (recent.length > 0) {
          let response = `🆕 Nouveautés PipoMarket :\n\n`;
          recent.forEach((p, i) => {
            response += `${i + 1}. ${p.name}\n`;
            response += `   💰 ${p.price?.toLocaleString('fr-FR')} FCFA\n`;
            if (p.startupName) response += `   🏢 ${p.startupName}\n`;
            response += '\n';
          });
          return response + 'Lequel t\'intéresse ?';
        }
        break;

      // =====================================
      case 'STATS':
      // =====================================
        const totalPrice = products.reduce((sum, p) => sum + (p.price || 0), 0);
        const avgPrice = products.length > 0 ? Math.round(totalPrice / products.length) : 0;
        const availableProducts = products.filter(p => p.available !== false).length;
        
        return `📊 Statistiques PipoMarket :\n\n` +
               `📦 ${products.length} produits au total\n` +
               `✅ ${availableProducts} disponibles\n` +
               `🏢 ${startups.length} startups partenaires\n` +
               `📂 ${categories.length} catégories\n` +
               `💰 Prix moyen : ${avgPrice.toLocaleString('fr-FR')} FCFA\n\n` +
               `Qu'est-ce que tu veux découvrir ?`;

      // =====================================
      case 'LIVRAISON':
      // =====================================
        return `🚚 Livraison PipoMarket :\n\n` +
               `Les délais varient selon les startups.\n\n` +
               `📦 En général :\n` +
               `• Yaoundé : 1-2 jours ⚡\n` +
               `• Douala : 2-3 jours 🚗\n` +
               `• Autres villes : 3-5 jours 🛣️\n\n` +
               `💡 Astuce : Les délais exacts sont affichés sur chaque produit !\n\n` +
               `Quel produit veux-tu commander ?`;

      // =====================================
      case 'PAIEMENT':
      // =====================================
        return `💳 Paiement sur PipoMarket :\n\n` +
               `✅ Mobile Money (MTN, Orange)\n` +
               `✅ Paiement à la livraison\n` +
               `✅ Carte bancaire (bientôt)\n\n` +
               `🔒 Paiement 100% sécurisé\n` +
               `💰 Pas de frais cachés\n\n` +
               `Tu choisis ton mode de paiement au moment de la commande !`;

      // =====================================
      case 'AIDE':
      // =====================================
        return `❓ Comment utiliser PipoMarket :\n\n` +
               `1️⃣ Parcours les produits 👀\n` +
               `2️⃣ Ajoute au panier 🛒\n` +
               `3️⃣ Passe ta commande 📝\n` +
               `4️⃣ Choisis ton mode de paiement 💳\n` +
               `5️⃣ Reçois chez toi ! 📦\n\n` +
               `💬 Je suis là pour répondre à tes questions !\n\n` +
               `Que veux-tu savoir ?`;

      // =====================================
      case 'MERCI':
      // =====================================
        return `De rien ! 😊\n\nC'est un plaisir de t'aider !\n\nN'hésite pas si tu as d'autres questions ! 💪`;

      // =====================================
      case 'AUREVOIR':
      // =====================================
        return `À bientôt sur PipoMarket ! 👋\n\nReviens quand tu veux ! 🚀`;

      // =====================================
      case 'SEARCH_PRODUCT':
      default:
      // =====================================
        // Recherche dans tous les produits avec keywords
        if (keywords.length === 0) {
          return `🤔 Hmm, je n'ai pas bien compris "${userMessage}".\n\n` +
                 `💡 Je peux t'aider avec :\n\n` +
                 `🔍 Chercher des produits\n` +
                 `💰 Voir les prix\n` +
                 `📂 Explorer les catégories\n` +
                 `🏢 Découvrir les startups\n` +
                 `📍 Trouver par ville\n` +
                 `🔥 Voir les populaires\n` +
                 `🆕 Voir les nouveautés\n` +
                 `📊 Statistiques\n\n` +
                 `Essaye une autre formulation ! 😊`;
        }

        const searchResults = products.filter(p => {
          const productText = `${p.name} ${p.description} ${p.category}`.toLowerCase();
          
          // Vérifier correspondance avec les mots-clés
          return keywords.some(keyword => 
            productText.includes(keyword) || 
            fuzzySearch(keyword, productText)
          );
        }).slice(0, 8);

        if (searchResults.length > 0) {
          let response = `🔍 Super ! J'ai trouvé ${searchResults.length} produit${searchResults.length > 1 ? 's' : ''} :\n\n`;
          
          searchResults.forEach((p, index) => {
            response += `${index + 1}. 📦 ${p.name}\n`;
            response += `   💰 ${p.price?.toLocaleString('fr-FR')} FCFA\n`;
            if (p.startupName) response += `   🏢 ${p.startupName}\n`;
            if (p.city) response += `   📍 ${p.city}\n`;
            response += '\n';
          });
          
          response += `Veux-tu plus d'infos sur l'un de ces produits ?`;
          return response;
        } else {
          return `😔 Désolé, je n'ai pas trouvé de produit pour "${userMessage}".\n\n` +
                 `💡 Essaye avec :\n` +
                 `• Un autre mot (ex: "téléphone" au lieu de "phone")\n` +
                 `• Une catégorie (Beauté, Technologie...)\n` +
                 `• Une startup\n` +
                 `• "produits populaires"\n\n` +
                 `Ou demande-moi "quelles catégories ?" 😊`;
        }
    }

    // Fallback
    return `🤔 Je ne suis pas sûr de comprendre.\n\nPeux-tu reformuler ta question ?`;
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setIsTyping(true);

    setTimeout(async () => {
      const botResponse = await getBotResponse(currentInput);
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        isBot: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 800);
  };

  const quickReplies = [
    { id: '1', text: '🏢 Startups', message: 'Liste des startups' },
    { id: '2', text: '📂 Catégories', message: 'Quelles catégories ?' },
    { id: '3', text: '🔥 Populaires', message: 'Produits populaires' },
    { id: '4', text: '🆕 Nouveautés', message: 'Nouveaux produits' },
    { id: '5', text: '📊 Stats', message: 'Statistiques PipoMarket' },
  ];

  const handleQuickReply = (message) => {
    setInputText(message);
    setTimeout(() => handleSend(), 100);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement de PipBot...</Text>
          <Text style={styles.loadingSubtext}>Synchronisation des données...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>PipBot Assistant</Text>
          <Text style={styles.headerSubtitle}>
            🟢 {products.length} produits • {startups.length} startups
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

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
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.isBot ? styles.botBubble : styles.userBubble,
              ]}
            >
              {message.isBot && <Text style={styles.botIcon}>🤖</Text>}
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
          ))}

          {isTyping && (
            <View style={[styles.messageBubble, styles.botBubble]}>
              <Text style={styles.botIcon}>🤖</Text>
              <View style={styles.typingIndicator}>
                <Text style={styles.typingDot}>●</Text>
                <Text style={styles.typingDot}>●</Text>
                <Text style={styles.typingDot}>●</Text>
              </View>
            </View>
          )}
        </ScrollView>

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

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Pose ta question..."
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
            <Text style={styles.sendButtonText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { marginTop: 16, fontSize: 16, color: '#000', fontWeight: '600' },
  loadingSubtext: { marginTop: 8, fontSize: 14, color: '#8E8E93' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  backButton: { fontSize: 28, color: '#007AFF' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  headerSubtitle: { fontSize: 11, color: '#34C759', marginTop: 2, fontWeight: '600' },
  placeholder: { width: 40 },
  keyboardView: { flex: 1 },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16 },
  messageBubble: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  botBubble: { justifyContent: 'flex-start' },
  userBubble: { justifyContent: 'flex-end' },
  botIcon: { fontSize: 32, marginRight: 8 },
  messageContent: { maxWidth: '75%', padding: 12, borderRadius: 16 },
  botContent: { backgroundColor: 'white', borderBottomLeftRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  userContent: { backgroundColor: '#007AFF', borderBottomRightRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 22 },
  botText: { color: '#000' },
  userText: { color: 'white' },
  typingIndicator: { flexDirection: 'row', backgroundColor: 'white', padding: 12, borderRadius: 16, gap: 4 },
  typingDot: { fontSize: 20, color: '#8E8E93', opacity: 0.5 },
  quickRepliesContainer: { maxHeight: 60 },
  quickRepliesContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  quickReplyButton: { backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#007AFF' },
  quickReplyText: { color: '#007AFF', fontSize: 13, fontWeight: '600' },
  inputContainer: { flexDirection: 'row', padding: 16, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#E5E5EA', alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: '#F2F2F7', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, marginRight: 8, fontSize: 15, maxHeight: 100, color: '#000' },
  sendButton: { width: 40, height: 40, backgroundColor: '#007AFF', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { backgroundColor: '#C7C7CC' },
  sendButtonText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
});