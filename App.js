import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth } from './config/firebase';
import adminService from './utils/adminService';
import { notificationService } from './utils/notificationService';
// Importation des écrans
import AddProductScreen from './screens/AddProductScreen';
import AddressesScreen from './screens/AddressesScreen';
import AdminAddStartupScreen from './screens/AdminAddStartupScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import AdminBoostRequestsScreen from './screens/AdminBoostRequestsScreen';
import AdminManageAmbassadorCodesScreen from './screens/AdminManageAmbassadorCodesScreen';
import AdminManageCategoriesScreen from './screens/AdminManageCategoriesScreen';
import AdminManagePromoCodesScreen from './screens/AdminManagePromoCodesScreen';
import AmbassadorDashboardScreen from './screens/AmbassadorDashboardScreen';
import CartScreen from './screens/CartScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import ChatScreen from './screens/ChatScreen';
import CheckoutScreen from './screens/CheckoutScreen';

import ConversationsListScreen from './screens/ConversationsListScreen';
import CreatePromoCodeScreen from './screens/CreatePromoCodeScreen';
import EditProductScreen from './screens/EditProductScreen'; // ← AJOUTER ICI
import BoostProductScreen from './screens/BoostProductScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import HelpScreen from './screens/HelpScreen';
import HomeScreen from './screens/HomeScreen';
import IntelligentSearchScreen from './screens/IntelligentSearchScreen';
import LanguageScreen from './screens/LanguageScreen';
import LoginScreen from './screens/LoginScreen';
import LoyaltyScreen from './screens/LoyaltyScreen';
import ManageSubscriptionScreen from './screens/ManageSubscriptionScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import OrdersScreen from './screens/OrdersScreen';
import PipBotScreen from './screens/PipBotScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import ProfileScreen from './screens/ProfileScreen';
import RegisterScreen from './screens/RegisterScreen';
import SettingsScreen from './screens/SettingsScreen';
import StartupDashboardScreen from './screens/StartupDashboardScreen';
import StartupDetailScreen from './screens/StartupDetailScreen';
import StartupMessagesScreen from './screens/StartupMessagesScreen';
import StartupsScreen from './screens/StartupsScreen';
import SubscriptionScreen from './screens/SubscriptionScreen';
import TermsScreen from './screens/TermsScreen';


// Configuration de la navigation
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Composant Tab Navigator pour les clients
function ClientTabs({ cart, addToCart, updateQuantity, removeFromCart, clearCart, unreadNotifications, handleNotificationRead }) {
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {/* ACCUEIL */}
      <Tab.Screen
        name="HomeTab"
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 24 }}>{focused ? '🏠' : '🏡'}</Text>
          ),
        }}
      >
        {(props) => <HomeScreen {...props} addToCart={addToCart} />}
      </Tab.Screen>

      {/* STARTUPS */}
      <Tab.Screen
        name="StartupsTab"
        component={StartupsScreen}
        options={{
          tabBarLabel: 'Startups',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 24 }}>{focused ? '🏢' : '🏪'}</Text>
          ),
        }}
      />

      {/* MESSAGES */}
      <Tab.Screen
        name="MessagesTab"
        component={ConversationsListScreen}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 24 }}>{focused ? '💬' : '💭'}</Text>
          ),
        }}
      />

      {/* NOTIFICATIONS */}
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Notifications',
          tabBarIcon: ({ focused }) => (
            <View style={{ position: 'relative' }}>
              <Text style={{ fontSize: 24 }}>{focused ? '🔔' : '🔕'}</Text>
            </View>
          ),
          tabBarBadge: unreadNotifications > 0 ? unreadNotifications : null,
          tabBarBadgeStyle: {
            backgroundColor: '#FF3B30',
            color: 'white',
            fontSize: 10,
            fontWeight: 'bold',
          },
        }}
      />

      {/* PANIER */}
      <Tab.Screen
        name="CartTab"
        options={{
          tabBarLabel: 'Panier',
          tabBarIcon: ({ focused }) => (
            <View style={{ position: 'relative' }}>
              <Text style={{ fontSize: 24 }}>{focused ? '🛒' : '🛍️'}</Text>
              {cartItemCount > 0 && (
                <View style={styles.miniCartBadge}>
                  <Text style={styles.miniCartBadgeText}>{cartItemCount}</Text>
                </View>
              )}
            </View>
          ),
          tabBarBadge: cartItemCount > 0 ? cartItemCount : null,
          tabBarBadgeStyle: {
            backgroundColor: '#FF3B30',
            color: 'white',
            fontSize: 10,
            fontWeight: 'bold',
          },
        }}
      >
        {(props) => (
          <CartScreen
            {...props}
            cart={cart}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
          />
        )}
      </Tab.Screen>

      {/* PROFIL */}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 24 }}>{focused ? '👤' : '👥'}</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  // État global du panier et des notifications
 const [cart, setCart] = useState([]);
const [cartLoaded, setCartLoaded] = useState(false);
const [initializing, setInitializing] = useState(true);
const [initialRoute, setInitialRoute] = useState('Login');

// Charger panier au démarrage
useEffect(() => {
  loadCartFromStorage();
}, []);

// Vérifier l'authentification au démarrage
useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        // Récupérer le rôle de l'utilisateur
        const role = await adminService.getUserRole(user.uid);

        // Définir l'écran initial selon le rôle
        if (role === 'admin') {
          setInitialRoute('AdminDashboard');
        } else if (role === 'startup') {
          setInitialRoute('StartupDashboard');
        } else if (role === 'ambassador') {
          setInitialRoute('AmbassadorDashboard');
        } else {
          setInitialRoute('Home');
        }
      } catch (error) {
        console.error('Erreur récupération rôle:', error);
        setInitialRoute('Login');
      }
    } else {
      setInitialRoute('Login');
    }
    setInitializing(false);
  });

  return unsubscribe;
}, []);

const loadCartFromStorage = async () => {
  try {
    const savedCart = await AsyncStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  } catch (error) {
    console.error('Erreur chargement panier:', error);
  } finally {
    setCartLoaded(true);
  }
};

// Sauvegarder panier à chaque changement
useEffect(() => {
  if (cartLoaded) {
    saveCartToStorage();
  }
}, [cart, cartLoaded]);

const saveCartToStorage = async () => {
  try {
    await AsyncStorage.setItem('cart', JSON.stringify(cart));
  } catch (error) {
    console.error('Erreur sauvegarde panier:', error);
  }
};
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const handleNotificationRead = () => {
    setUnreadNotifications(count => Math.max(0, count - 1));
  };

  useEffect(() => {
    // Configuration des notifications
    const setupNotifications = async (uid) => {
      if (!uid) {
        console.error('setupNotifications: uid est requis');
        return;
      }

      try {
        // Demander les permissions de notification
        const permissionGranted = await notificationService.requestPermissions();
        
        if (permissionGranted?.success) {
          // Enregistrer le token de l'appareil
          const tokenResult = await notificationService.registerDeviceToken(uid);
          
          if (tokenResult?.success) {
            // Configurer les gestionnaires de notifications
            notificationService.setupNotificationHandlers((notification) => {
              if (!notification?.data) return;

              // Gérer la notification reçue
              if (notification.data.type === 'payment_received') {
                setUnreadNotifications(count => count + 1);
              }
            });

            // Charger le compteur initial de notifications
            const unreadCount = await notificationService.getUnreadCount(uid);
            if (typeof unreadCount === 'number') {
              setUnreadNotifications(unreadCount);
            }
          }
        }
      } catch (error) {
        console.error('Erreur configuration notifications:', error);
      }
    };

    // Écouter l'état de l'authentification
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user?.uid) return;
      
      // Reset du compteur à chaque connexion
      setUnreadNotifications(0);
      
      // Configurer les notifications avec l'ID de l'utilisateur
      setupNotifications(user.uid);
      
      // Enregistrer le token de l'appareil
      notificationService.registerDeviceToken(user.uid).catch(error => {
        console.error('Erreur enregistrement token:', error);
      });
      
      // Charger le compte de notifications non lues
      notificationService.getUnreadCount(user.uid)
        .then(count => {
          if (typeof count === 'number' && !isNaN(count)) {
            setUnreadNotifications(count);
          }
        })
        .catch(error => console.error('Erreur chargement notifications:', error));
    });

    return () => {
      unsubscribe();
      notificationService.cleanup();
    };
  }, []);

  const addToCart = (product) => {
    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.id === product.id);
      
      if (existingItem) {
        return currentCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...currentCart, { ...product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCart(currentCart => currentCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(currentCart =>
        currentCart.map(item =>
          item.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  const clearCart = async () => {
  setCart([]);
  try {
    await AsyncStorage.removeItem('cart');
  } catch (error) {
    console.error('Erreur nettoyage panier:', error);
  }
};
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  // Afficher écran de chargement pendant vérification auth
  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingLogo}>🛒</Text>
        <Text style={styles.loadingText}>PipoMarket</Text>
        <Text style={styles.loadingSubtext}>Chargement...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {/* AUTHENTIFICATION */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{ headerShown: false }}
        />

        {/* ÉCRANS CLIENT (avec Tabs) */}
        <Stack.Screen 
          name="Home"
          options={{ headerShown: false }}
        >
          {(props) => (
            <ClientTabs
              {...props}
              cart={cart}
              addToCart={addToCart}
              updateQuantity={updateQuantity}
              removeFromCart={removeFromCart}
              clearCart={clearCart}
              unreadNotifications={unreadNotifications}
              handleNotificationRead={handleNotificationRead}
            />
          )}
        </Stack.Screen>

        {/* DÉTAILS */}
        <Stack.Screen
          name="StartupDetail"
          options={({ route, navigation }) => ({
            title: route.params?.startupName || 'Produits',
            headerStyle: {
              backgroundColor: 'white',
            },
            headerTintColor: '#007AFF',
            headerRight: () => (
              <TouchableOpacity
                style={styles.cartButton}
                onPress={() => navigation.navigate('Home', { screen: 'CartTab', initial: false })}
              >
                <Text style={styles.cartButtonText}>🛒</Text>
                {cartItemCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{cartItemCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ),
          })}
        >
          {(props) => (
            <StartupDetailScreen
              {...props}
              cart={cart}
              addToCart={addToCart}
            />
          )}
        </Stack.Screen>

        <Stack.Screen 
          name="ProductDetail" 
          options={{ headerShown: false }}
        >
          {(props) => (
            <ProductDetailScreen
              {...props}
              cart={cart}
              addToCart={addToCart}
            />
          )}
        </Stack.Screen>

        {/* FONCTIONNELS */}
        <Stack.Screen 
          name="Loyalty" 
          component={LoyaltyScreen} 
          options={{ headerShown: false }} 
        />

        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={({ route }) => ({
            title: route.params?.startupName || route.params?.clientName || 'Chat',
            headerStyle: {
              backgroundColor: 'white',
            },
            headerTintColor: '#007AFF',
          })}
        />

        <Stack.Screen
          name="Checkout"
          options={{ 
            title: '💳 Paiement',
            headerStyle: {
              backgroundColor: 'white',
            },
            headerTintColor: '#007AFF',
          }}
        >
          {(props) => (
            <CheckoutScreen
              {...props}
              cart={cart}
              clearCart={clearCart}
            />
          )}
        </Stack.Screen>

        <Stack.Screen 
          name="Orders" 
          component={OrdersScreen} 
          options={{ headerShown: false }} 
        />

        <Stack.Screen 
          name="Favorites" 
          component={FavoritesScreen} 
          options={{ headerShown: false }} 
        />

        <Stack.Screen 
          name="Addresses" 
          component={AddressesScreen} 
          options={{ headerShown: false }} 
        />

        <Stack.Screen 
          name="Notifications" 
          component={NotificationsScreen} 
          options={{ headerShown: false }} 
        />

        <Stack.Screen 
          name="Help" 
          component={HelpScreen} 
          options={{ headerShown: false }} 
        />

        {/* PARAMÈTRES */}
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ headerShown: false }} 
        />

        <Stack.Screen 
          name="EditProfile" 
          component={EditProfileScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen 
          name="ChangePassword" 
          component={ChangePasswordScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen 
          name="Language" 
          component={LanguageScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen 
          name="PrivacyPolicy" 
          component={PrivacyPolicyScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen 
          name="Terms" 
          component={TermsScreen}
          options={{ headerShown: false }}
        />

        {/* IA FEATURES */}
        <Stack.Screen
          name="PipBot"
          component={PipBotScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="IntelligentSearch"
          component={IntelligentSearchScreen}
          options={{ headerShown: false }}
        />

        {/* STARTUP */}
        <Stack.Screen 
          name="StartupDashboard" 
          component={StartupDashboardScreen}
          options={{ headerShown: false }}
        />

        {/* ✅ NOUVEAU : Abonnements */}
      <Stack.Screen 
        name="Subscription" 
        component={SubscriptionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ManageSubscription" 
        component={ManageSubscriptionScreen}
        options={{ headerShown: false }}
      />
   
        
        <Stack.Screen 
          name="AddProduct" 
          component={AddProductScreen}
          options={{ 
            title: '➕ Ajouter un produit',
            headerStyle: {
              backgroundColor: 'white',
            },
            headerTintColor: '#007AFF',
          }}
        />

        <Stack.Screen 
          name="StartupMessages" 
          component={StartupMessagesScreen}
          options={{ headerShown: false }}
        />

        {/* CODE PROMO */}
        <Stack.Screen 
          name="CreatePromoCode" 
          component={CreatePromoCodeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
  name="AdminDashboard"
  component={AdminDashboardScreen}
  options={{ headerShown: false }}
/>

<Stack.Screen
  name="AdminBoostRequests"
  component={AdminBoostRequestsScreen}
  options={{ headerShown: false }}
/>

        {/* ✅ GESTION CODES PROMO */}
<Stack.Screen 
  name="AdminManagePromoCodes" 
  component={AdminManagePromoCodesScreen}
  options={{ headerShown: false }}
/>

{/* ✅ GESTION CATÉGORIES */}
<Stack.Screen 
  name="AdminManageCategories" 
  component={AdminManageCategoriesScreen}
  options={{ headerShown: false }}
/>

{/* ADMIN - GESTION CODES AMBASSADEUR (déjà là, juste vérifier) */}

        {/* ADMIN - ADD STARTUP */}
        <Stack.Screen 
          name="AdminAddStartup" 
          component={AdminAddStartupScreen}
          options={{ headerShown: false }}
        />
{/* ADMIN - GESTION AMBASSADEURS */}
<Stack.Screen 
  name="AdminManageAmbassadorCodesScreen" 
  component={AdminManageAmbassadorCodesScreen}
  options={{ headerShown: false }}
/>
        {/* ADMIN - GESTION CODES AMBASSADEUR */}
        <Stack.Screen 
          name="AdminManageAmbassadorCodes" 
          component={AdminManageAmbassadorCodesScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
  name="EditProduct"
  component={EditProductScreen}
  options={{ headerShown: false }}
/>

        <Stack.Screen
          name="BoostProduct"
          component={BoostProductScreen}
          options={{
            title: '⭐ Booster votre produit',
            headerStyle: { backgroundColor: 'white' },
            headerTintColor: '#FF9500',
          }}
        />

        {/* ÉCRAN AMBASSADOR */}
        <Stack.Screen 
          name="AmbassadorDashboard" 
          component={AmbassadorDashboardScreen}
          options={{ 
            title: '👥 Tableau de bord Ambassadeur',
            headerStyle: {
              backgroundColor: 'white',
            },
            headerTintColor: '#007AFF',
            headerShown: true 
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  cartButton: {
    marginRight: 15,
    position: 'relative',
  },
  cartButtonText: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  miniCartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniCartBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingLogo: {
    fontSize: 80,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 16,
    color: '#8E8E93',
  },
});