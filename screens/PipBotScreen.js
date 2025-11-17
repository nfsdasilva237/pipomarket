// screens/PipBotScreen.js - ASSISTANT IA ULTRA-INTELLIGENT v2.0
import { LinearGradient } from 'expo-linear-gradient';
import { collection, getDocs } from 'firebase/firestore';
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
import { bdlServices } from '../data/bdlStudioServices';
import AIAssistantService from '../services/AIAssistantService';
import ConversationContextService from '../services/ConversationContextService';
import UserProfileService from '../services/UserProfileService';

const { width } = Dimensions.get('window');

export default function PipBotScreen({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const scrollViewRef = useRef();
  const typingAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const thinkingRotation = useRef(new Animated.Value(0)).current;

  // DONNÉES
  const [products, setProducts] = useState([]);
  const [startups, setStartups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);

  // Animations
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.15,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1200,
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
    if (isThinking) {
      Animated.loop(
        Animated.timing(thinkingRotation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      thinkingRotation.setValue(0);
    }
  }, [isThinking]);

  useEffect(() => {
    initializePipBot();
  }, []);

  // INITIALISATION
  const initializePipBot = async () => {
    try {
      // Charger toutes les données
      const [productsData, startupsData, categoriesData, profile] = await Promise.all([
        loadProducts(),
        loadStartups(),
        loadCategories(),
        UserProfileService.getUserProfile()
      ]);

      setProducts(productsData);
      setStartups(startupsData);
      setCategories(categoriesData);
      setUserProfile(profile);

      // Initialiser la conversation
      await ConversationContextService.initConversation();

      // Message de bienvenue personnalisé
      const welcomeMessage = await generateWelcomeMessage(profile, productsData);
      setMessages([welcomeMessage]);

      // Générer des suggestions personnalisées
      if (profile) {
        const personalizedSuggestions = await generatePersonalizedSuggestions(
          profile,
          productsData
        );
        setSuggestions(personalizedSuggestions);
      } else {
        setSuggestions(getDefaultSuggestions());
      }

    } catch (error) {
      console.error('Erreur initialisation PipBot:', error);
      setMessages([{
        id: '1',
        text: "Salut ! Je suis PipBot, ton assistant intelligent.\n\nUne erreur s'est produite, mais je suis toujours là pour t'aider !",
        isBot: true,
        timestamp: new Date(),
        actions: []
      }]);
      setSuggestions(getDefaultSuggestions());
    } finally {
      setLoading(false);
    }
  };

  // CHARGEMENT DES DONNÉES
  const loadProducts = async () => {
    try {
      const productsSnap = await getDocs(collection(db, 'products'));
      return productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      return [];
    }
  };

  const loadStartups = async () => {
    try {
      const startupsSnap = await getDocs(collection(db, 'startups'));
      return startupsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Erreur chargement startups:', error);
      return [];
    }
  };

  const loadCategories = async () => {
    try {
      const catsSnap = await getDocs(collection(db, 'categories'));
      return catsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
      return [];
    }
  };

  // GÉNÉRATION MESSAGE DE BIENVENUE
  const generateWelcomeMessage = async (profile, productsData) => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
    const userName = profile?.displayName?.split(' ')[0] || '';

    let text = `${greeting}${userName ? ` ${userName}` : ''} ! 🤖\n\n`;

    if (profile) {
      // Message personnalisé pour utilisateur connecté
      text += `Ravi de te revoir !\n\n`;

      if (profile.engagementScore) {
        text += `🎯 Ton score d'engagement : ${profile.engagementScore}/100\n`;
      }

      if (profile.orders.length > 0) {
        text += `📦 Tu as ${profile.orders.length} commande(s)\n`;
      }

      if (profile.spendingProfile) {
        const category = profile.spendingProfile.category;
        const categoryEmoji = {
          'new': '🆕',
          'occasional': '⭐',
          'regular': '💎',
          'loyal': '👑',
          'vip': '🔥'
        };
        text += `${categoryEmoji[category] || '⭐'} Statut : ${category}\n`;
      }

      text += `\n💡 JE PEUX T'AIDER À :\n`;
      text += `• Trouver des produits PARFAITS pour toi\n`;
      text += `• Te recommander selon tes goûts\n`;
      text += `• Comparer des produits\n`;
      text += `• Suivre tes commandes\n`;
      text += `• Découvrir les services BDL Studio\n\n`;

      // Recommandation basée sur le comportement
      if (profile.behaviorProfile?.preferredShoppingTime) {
        const timeInfo = profile.behaviorProfile.preferredShoppingTime;
        text += `⏰ Tu achètes souvent le ${timeInfo.period}\n`;
      }

      if (Object.keys(profile.preferences.categories || {}).length > 0) {
        const topCat = Object.entries(profile.preferences.categories)
          .sort(([, a], [, b]) => b - a)[0];
        if (topCat) {
          text += `❤️ Ta catégorie préférée : ${topCat[0]}\n`;
        }
      }

      text += `\nQue cherches-tu aujourd'hui ?`;

    } else {
      // Message pour utilisateur non connecté
      text += `Bienvenue sur PipoMarket !\n\n`;
      text += `Je suis ton assistant IA personnel 🚀\n\n`;
      text += `📊 ACTUELLEMENT :\n`;
      text += `• ${productsData.length} produits disponibles\n`;
      text += `• ${new Set(productsData.map(p => p.startupId)).size} startups partenaires\n`;
      text += `• 6 services créatifs BDL Studio\n\n`;
      text += `💬 DEMANDE-MOI TOUT :\n`;
      text += `• Rechercher des produits\n`;
      text += `• Voir les tendances\n`;
      text += `• Comparer des prix\n`;
      text += `• Services créatifs\n`;
      text += `• Et bien plus !\n\n`;
      text += `Comment puis-je t'aider ?`;
    }

    return {
      id: '1',
      text,
      isBot: true,
      timestamp: new Date(),
      actions: profile ? [
        { label: '🎯 Recommandations', message: 'Recommande-moi des produits' },
        { label: '📦 Mes commandes', message: 'Mes commandes' }
      ] : [
        { label: '🔥 Tendances', message: 'Produits populaires' },
        { label: '🆕 Nouveautés', message: 'Nouveaux produits' }
      ]
    };
  };

  // GÉNÉRATION SUGGESTIONS PERSONNALISÉES
  const generatePersonalizedSuggestions = async (profile, productsData) => {
    const suggestions = [];

    // Basé sur les catégories préférées
    if (profile.preferences?.categories) {
      const topCategories = Object.entries(profile.preferences.categories)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 2);

      topCategories.forEach(([cat]) => {
        suggestions.push({
          id: `cat_${cat}`,
          text: `📂 ${cat}`,
          message: `Montre-moi des produits dans ${cat}`
        });
      });
    }

    // Basé sur le budget
    if (profile.spendingProfile?.averageOrderValue) {
      const avgBudget = Math.round(profile.spendingProfile.averageOrderValue);
      suggestions.push({
        id: 'budget',
        text: `💰 ~${avgBudget.toLocaleString()} XAF`,
        message: `Produits autour de ${avgBudget.toLocaleString()} XAF`
      });
    }

    // Nouveautés dans les catégories préférées
    suggestions.push({
      id: 'new_in_fav',
      text: '🆕 Nouveautés pour toi',
      message: 'Nouveaux produits dans mes catégories préférées'
    });

    // Recommandations personnalisées
    suggestions.push({
      id: 'personalized',
      text: '✨ Juste pour toi',
      message: 'Recommande-moi quelque chose'
    });

    // Services BDL si intéressé
    if (profile.bdlOrders?.length > 0) {
      suggestions.push({
        id: 'bdl',
        text: '🎨 Services BDL',
        message: 'Services BDL Studio'
      });
    }

    return suggestions.slice(0, 6);
  };

  // SUGGESTIONS PAR DÉFAUT
  const getDefaultSuggestions = () => [
    { id: '1', text: '🔥 Tendances', message: 'Produits populaires' },
    { id: '2', text: '🎨 BDL Studio', message: 'Services BDL Studio' },
    { id: '3', text: '🏢 Startups', message: 'Liste des startups' },
    { id: '4', text: '📂 Catégories', message: 'Catégories disponibles' },
    { id: '5', text: '🆕 Nouveautés', message: 'Nouveaux produits' },
    { id: '6', text: '💰 Bon marché', message: 'Produits à moins de 20,000 XAF' }
  ];

  // ENVOI MESSAGE
  const handleSend = async () => {
    if (!inputText.trim()) return;

    // Tracker la recherche
    await UserProfileService.trackSearch(inputText, products);

    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      isBot: false,
      timestamp: new Date(),
      actions: []
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setIsThinking(true);

    setTimeout(async () => {
      setIsThinking(false);
      setIsTyping(true);

      try {
        // Utiliser le service d'IA avancé
        const response = await AIAssistantService.processMessage(
          currentInput,
          products,
          startups,
          categories,
          bdlServices
        );

        setTimeout(() => {
          const botMessage = {
            id: (Date.now() + 1).toString(),
            text: response.text,
            isBot: true,
            timestamp: new Date(),
            actions: response.actions || [],
            suggestions: response.suggestions || [],
            clarification: response.clarification,
            sentiment: response.sentiment,
            intent: response.intent
          };

          setMessages(prev => [...prev, botMessage]);
          setIsTyping(false);

          // Mettre à jour les suggestions basées sur le contexte
          if (response.suggestions && response.suggestions.length > 0) {
            setSuggestions(response.suggestions.slice(0, 6).map((s, i) => ({
              id: `sug_${i}`,
              text: s.label || s.data?.name,
              message: s.data?.name || s.label,
              data: s.data
            })));
          }

          // Tracker l'interaction
          if (response.intent) {
            UserProfileService.trackInteraction('chat_message', {
              intent: response.intent,
              sentiment: response.sentiment,
              hasEntities: Object.keys(response.entities || {}).length > 0
            });
          }

        }, 800 + Math.random() * 400);

      } catch (error) {
        console.error('Erreur traitement message:', error);

        const errorMessage = {
          id: (Date.now() + 1).toString(),
          text: "Oups ! J'ai eu un petit problème 😅\n\nPeux-tu reformuler ta question ?",
          isBot: true,
          timestamp: new Date(),
          actions: []
        };

        setMessages(prev => [...prev, errorMessage]);
        setIsTyping(false);
      }
    }, 600 + Math.random() * 400);
  };

  // QUICK REPLY
  const handleQuickReply = (suggestion) => {
    setInputText(suggestion.message);
    setTimeout(() => handleSend(), 100);
  };

  // HANDLE ACTIONS
  const handleAction = async (action, data) => {
    switch (action.action || action) {
      case 'LOGIN':
        navigation.navigate('Login');
        break;

      case 'BROWSE_PRODUCTS':
      case 'VIEW_PRODUCTS':
        navigation.navigate('HomeTab');
        break;

      case 'VIEW_PRODUCT':
        if (data) {
          await UserProfileService.trackInteraction('view', { productId: data });
          navigation.navigate('ProductDetail', { productId: data });
        }
        break;

      case 'ADD_TO_CART':
        if (data) {
          const product = products.find(p => p.id === data);
          if (product) {
            await UserProfileService.trackInteraction('add_to_cart', { productId: data });

            const confirmMessage = {
              id: Date.now().toString(),
              text: `✅ "${product.name}" ajouté au panier !\n\nVeux-tu continuer tes achats ou passer commande ?`,
              isBot: true,
              timestamp: new Date(),
              actions: [
                { label: 'Voir panier', action: 'VIEW_CART' },
                { label: 'Continuer', action: 'BROWSE_PRODUCTS' }
              ]
            };
            setMessages(prev => [...prev, confirmMessage]);
          }
        }
        break;

      case 'VIEW_CART':
        navigation.navigate('Cart');
        break;

      case 'BDL_INFO':
      case 'LIST_BDL':
        setInputText('Services BDL Studio');
        setTimeout(() => handleSend(), 100);
        break;

      case 'BDL_DETAIL':
        if (data) {
          navigation.navigate('BDLServiceDetail', { serviceId: data });
        }
        break;

      case 'MY_ORDERS':
        navigation.navigate('Orders');
        break;

      case 'MY_BDL_SERVICES':
        navigation.navigate('MyBDLServices');
        break;

      case 'VIEW_PROMOTIONS':
        navigation.navigate('Promotions');
        break;

      case 'CONTACT_SUPPORT':
        navigation.navigate('Support');
        break;

      case 'LIST_CATEGORIES':
        setInputText('Catégories disponibles');
        setTimeout(() => handleSend(), 100);
        break;

      case 'FILTER_PRICE':
        if (data) {
          setInputText(`Produits à moins de ${data.toLocaleString()} XAF`);
          setTimeout(() => handleSend(), 100);
        }
        break;

      default:
        if (action.message) {
          setInputText(action.message);
          setTimeout(() => handleSend(), 100);
        }
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
          <Text style={styles.loadingText}>Initialisation de PipBot IA...</Text>
          <Text style={styles.loadingSubtext}>Analyse de tes préférences...</Text>
          {userProfile && (
            <Text style={styles.loadingSubtext}>
              {userProfile.orders.length} commandes • Score: {userProfile.engagementScore}/100
            </Text>
          )}
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
          <Text style={styles.headerTitle}>PipBot IA</Text>
          <Text style={styles.headerSubtitle}>
            Assistant intelligent • {userProfile ? `Score ${userProfile.engagementScore}/100` : 'En ligne'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={async () => {
            await ConversationContextService.resetContext();
            initializePipBot();
          }}
          style={styles.resetButton}
        >
          <Text style={styles.resetButtonText}>🔄</Text>
        </TouchableOpacity>
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

                  {/* Afficher le sentiment et l'intention (debug mode) */}
                  {__DEV__ && message.intent && (
                    <Text style={styles.debugText}>
                      Intent: {message.intent} | Sentiment: {message.sentiment}
                    </Text>
                  )}
                </View>
              </View>

              {/* Action buttons */}
              {message.actions && message.actions.length > 0 && (
                <View style={styles.actionsContainer}>
                  {message.actions.map((action, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.actionButton}
                      onPress={() => handleAction(action, action.data)}
                    >
                      <Text style={styles.actionButtonText}>
                        {action.label || action.text}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Clarification question */}
              {message.clarification && (
                <View style={styles.clarificationContainer}>
                  <Text style={styles.clarificationText}>
                    {message.clarification.question}
                  </Text>
                  <View style={styles.clarificationOptions}>
                    {message.clarification.options.map((option, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.clarificationOption}
                        onPress={() => {
                          setInputText(option);
                          setTimeout(() => handleSend(), 100);
                        }}
                      >
                        <Text style={styles.clarificationOptionText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ))}

          {isThinking && (
            <View style={[styles.messageBubble, styles.botBubble]}>
              <View style={styles.botIconContainer}>
                <Animated.Text
                  style={[
                    styles.botIcon,
                    {
                      transform: [{
                        rotate: thinkingRotation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg']
                        })
                      }]
                    }
                  ]}
                >
                  🧠
                </Animated.Text>
              </View>
              <View style={styles.thinkingIndicator}>
                <Text style={styles.thinkingText}>Analyse en cours...</Text>
              </View>
            </View>
          )}

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

        {/* Smart Suggestions */}
        {suggestions.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.suggestionsContainer}
            contentContainerStyle={styles.suggestionsContent}
          >
            {suggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion.id}
                style={styles.suggestionButton}
                onPress={() => handleQuickReply(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion.text}</Text>
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
            placeholder="Pose ta question à PipBot IA..."
            placeholderTextColor="#8E8E93"
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isTyping || isThinking}
          >
            <LinearGradient
              colors={inputText.trim() && !isTyping && !isThinking ? ['#f4a04b', '#e8943f'] : ['#C7C7CC', '#B0B0B0']}
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
  resetButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 20,
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
  debugText: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
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

  // Clarification
  clarificationContainer: {
    marginLeft: 48,
    marginBottom: 12,
  },
  clarificationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  clarificationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  clarificationOption: {
    backgroundColor: '#f4a04b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clarificationOptionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },

  // Thinking & Typing
  thinkingIndicator: {
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  thinkingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
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

  // Suggestions
  suggestionsContainer: {
    maxHeight: 60,
  },
  suggestionsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  suggestionButton: {
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
  suggestionText: {
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
