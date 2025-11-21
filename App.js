// App.js - ✅ VERSION ULTRA SAFE SANS ERREURS
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { auth } from './config/firebase';
import { FavoritesProvider } from './contexts/FavoritesContext';
import StartupDeliverySettingsScreen from './screens/StartupDeliverySettingsScreen';
import PushNotificationService from './services/PushNotificationService';
import adminService from './utils/adminService';
import { notificationService } from './utils/notificationService';

// Importation des écrans
import AddProductScreen from './screens/AddProductScreen';
import AddressesScreen from './screens/AddressesScreen';
import AdminAddStartupScreen from './screens/AdminAddStartupScreen';
import AdminBDLOrdersScreen from './screens/AdminBDLOrdersScreen';
import AdminCreateAmbassadorCodeScreen from './screens/AdminCreateAmbassadorCodeScreen';
import AdminCreateStartupScreen from './screens/AdminCreateStartupScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import AdminLoyaltyDashboardScreen from './screens/AdminLoyaltyDashboardScreen';
import AdminLoyaltyRewardsScreen from './screens/AdminLoyaltyRewardsScreen';
import AdminLoyaltySettingsScreen from './screens/AdminLoyaltySettingsScreen';
import AdminLoyaltyTransactionsScreen from './screens/AdminLoyaltyTransactionsScreen';
import AdminLoyaltyUsersScreen from './screens/AdminLoyaltyUsersScreen';
import AdminManageAmbassadorCodesScreen from './screens/AdminManageAmbassadorCodesScreen';
import AdminManageCategoriesScreen from './screens/AdminManageCategoriesScreen';
import AdminManagePromoCodesScreen from './screens/AdminManagePromoCodesScreen';
import AdminManageStartupCodesScreen from './screens/AdminManageStartupCodesScreen';
import AdminSubscriptionsScreen from './screens/AdminSubscriptionsScreen';
import AmbassadorDashboardScreen from './screens/AmbassadorDashboardScreen';
import BDLMyOrdersScreen from './screens/BDLMyOrdersScreen';
import BDLOrderSuccessScreen from './screens/BDLOrderSuccessScreen';
import BDLPackageOrderScreen from './screens/BDLPackageOrderScreen';
import BDLServiceDetailScreen from './screens/BDLServiceDetailScreen';
import BDLStudioHomeScreen from './screens/BDLStudioHomeScreen';
import BoostProductScreen from './screens/BoostProductScreen';
import CartScreen from './screens/CartScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import ChatScreen from './screens/ChatScreen';
import CheckoutScreen from './screens/CheckoutScreen';
import ContactScreen from './screens/ContactScreen';
import ConversationsListScreen from './screens/ConversationsListScreen';
import CreatePromoCodeScreen from './screens/CreatePromoCodeScreen';
import EditProductScreen from './screens/EditProductScreen';
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
import StartupPaymentSettingsScreen from './screens/StartupPaymentSettingsScreen';
import StartupsScreen from './screens/StartupsScreen';
import SubscriptionScreen from './screens/SubscriptionScreen';
import TermsScreen from './screens/TermsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// TABS CLIENT
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
          height: Platform.OS === 'ios' ? 88 : 65,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: Platform.OS === 'ios' ? 4 : 0,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ focused }) => {
            const icon = focused ? '🏠' : '🏡';
            return <Text style={styles.tabIcon}>{icon}</Text>;
          },
        }}
      >
         {(props) => <HomeScreen {...props} addToCart={addToCart} />}
      </Tab.Screen>

      <Tab.Screen
        name="StartupsTab"
        component={StartupsScreen}
        options={{
          tabBarLabel: 'Startups',
          tabBarIcon: ({ focused }) => {
            const icon = focused ? '🏢' : '🏪';
            return <Text style={styles.tabIcon}>{icon}</Text>;
          },
        }}
      />

      <Tab.Screen
        name="MessagesTab"
        component={ConversationsListScreen}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ focused }) => {
            const icon = focused ? '💬' : '💭';
            return <Text style={styles.tabIcon}>{icon}</Text>;
          },
        }}
      />

      <Tab.Screen
        name="CartTab"
        options={{
          tabBarLabel: 'Panier',
          tabBarIcon: ({ focused }) => {
            const icon = focused ? '🛒' : '🛍️';
            return (
              <View style={styles.tabIconContainer}>
                <Text style={styles.tabIcon}>{icon}</Text>
                {cartItemCount > 0 && (
                  <View style={styles.miniCartBadge}>
                    <Text style={styles.miniCartBadgeText}>{cartItemCount}</Text>
                  </View>
                )}
              </View>
            );
          },
          tabBarBadge: cartItemCount > 0 ? cartItemCount : null,
          tabBarBadgeStyle: styles.tabBadge,
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

      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ focused }) => {
            const icon = focused ? '👤' : '👥';
            return <Text style={styles.tabIcon}>{icon}</Text>;
          },
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [cart, setCart] = useState([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const navigationRef = useRef(null);

  useEffect(() => {
    loadCartFromStorage();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const role = await adminService.getUserRole(user.uid);
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

  const handleNotificationRead = () => {
    setUnreadNotifications(count => Math.max(0, count - 1));
  };

  useEffect(() => {
    const setupPushNotifications = async (uid) => {
      if (!uid) return;
      try {
        if (Platform.OS !== 'web') {
          const pushResult = await PushNotificationService.initialize();
          if (pushResult.success) {
            console.log('Push notifications initialized:', pushResult.token);
          }
        }
      } catch (error) {
        console.log('Push notifications setup error:', error.message);
      }
    };

    const setupFirebaseNotifications = async (uid) => {
      if (!uid) return;
      try {
        const permissionGranted = await notificationService.requestPermissions();
        if (permissionGranted?.success) {
          const tokenResult = await notificationService.registerDeviceToken(uid);
          if (tokenResult?.success) {
            notificationService.setupNotificationHandlers((notification) => {
              if (!notification?.data) return;
              if (notification.data.type === 'payment_received' || 
                  notification.data.type === 'order' ||
                  notification.data.type === 'message' ||
                  notification.data.type === 'bdl_service') {
                setUnreadNotifications(count => count + 1);
              }
            });
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

    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user?.uid) return;
      setUnreadNotifications(0);
      setupPushNotifications(user.uid);
      setupFirebaseNotifications(user.uid);
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
      PushNotificationService.cleanup();
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

  if (initializing) {
    return (
      <FavoritesProvider>
        <SafeAreaProvider>
          <View style={styles.loadingContainer}>
            <Image
              source={require('./assets/logo.png')}
              style={styles.loadingLogo}
              resizeMode="contain"
            />
            <Text style={styles.loadingText}>PipoMarket</Text>
            <Text style={styles.loadingSubtext}>Chargement...</Text>
          </View>
        </SafeAreaProvider>
      </FavoritesProvider>
    );
  }

  return (
    <FavoritesProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName={initialRoute}
            screenOptions={{
              headerStyle: { backgroundColor: '#007AFF' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' },
            }}
          >
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
            
            <Stack.Screen name="Home" options={{ headerShown: false }}>
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

            <Stack.Screen
              name="StartupDetail"
              options={({ route, navigation }) => ({
                title: route.params?.startupName || 'Produits',
                headerStyle: { backgroundColor: 'white' },
                headerTintColor: '#007AFF',
                headerRight: () => (
                  <TouchableOpacity
                    style={styles.cartButton}
                    onPress={() => navigation.navigate('Home', { screen: 'CartTab', initial: false })}
                  >
                    <Text style={styles.cartButtonText}>🛒</Text>
                    {cartItemCount > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{cartItemCount.toString()}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ),
              })}
            >
              {(props) => <StartupDetailScreen {...props} cart={cart} addToCart={addToCart} />}
            </Stack.Screen>

            <Stack.Screen name="ProductDetail" options={{ headerShown: false }}>
              {(props) => <ProductDetailScreen {...props} cart={cart} addToCart={addToCart} />}
            </Stack.Screen>

            <Stack.Screen name="Loyalty" component={LoyaltyScreen} options={{ headerShown: false }} />
            <Stack.Screen name="BDLStudioHome" component={BDLStudioHomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="BDLServiceDetail" component={BDLServiceDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="BDLPackageOrder" component={BDLPackageOrderScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Contact" component={ContactScreen} options={{ headerShown: false }} />
            <Stack.Screen name="BDLOrderSuccess" component={BDLOrderSuccessScreen} options={{ headerShown: false }} />
            <Stack.Screen name="BDLMyOrders" component={BDLMyOrdersScreen} options={{ headerShown: false }} />
            
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={({ route }) => ({
                title: route.params?.startupName || route.params?.clientName || 'Chat',
                headerStyle: { backgroundColor: 'white' },
                headerTintColor: '#007AFF',
              })}
            />

            <Stack.Screen
              name="Checkout"
              options={{ 
                title: '💳 Paiement',
                headerStyle: { backgroundColor: 'white' },
                headerTintColor: '#007AFF',
              }}
            >
              {(props) => <CheckoutScreen {...props} cart={cart} clearCart={clearCart} />}
            </Stack.Screen>

            <Stack.Screen name="Orders" component={OrdersScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Addresses" component={AddressesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Help" component={HelpScreen} options={{ headerShown: false }} />
            <Stack.Screen name="StartupDeliverySettings" component={StartupDeliverySettingsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Language" component={LanguageScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Terms" component={TermsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PipBot" component={PipBotScreen} options={{ headerShown: false }} />
            <Stack.Screen name="IntelligentSearch" component={IntelligentSearchScreen} options={{ headerShown: false }} />
            <Stack.Screen name="StartupDashboard" component={StartupDashboardScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ManageSubscription" component={ManageSubscriptionScreen} options={{ headerShown: false }} />
            <Stack.Screen 
              name="AddProduct" 
              component={AddProductScreen}
              options={{ 
                title: '➕ Ajouter un produit',
                headerStyle: { backgroundColor: 'white' },
                headerTintColor: '#007AFF',
              }}
            />


<Stack.Screen 
  name="AdminLoyaltyDashboard" 
  component={AdminLoyaltyDashboardScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen 
  name="AdminLoyaltyUsers" 
  component={AdminLoyaltyUsersScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen 
  name="AdminLoyaltyTransactions" 
  component={AdminLoyaltyTransactionsScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen 
  name="AdminLoyaltySettings" 
  component={AdminLoyaltySettingsScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen 
  name="AdminLoyaltyRewards" 
  component={AdminLoyaltyRewardsScreen}
  options={{ headerShown: false }}
/>
            
            <Stack.Screen name="StartupMessages" component={StartupMessagesScreen} options={{ headerShown: false }} />
            {/* ✅ GESTION ABONNEMENTS */}
            <Stack.Screen name="AdminSubscriptions" component={AdminSubscriptionsScreen} options={{ headerShown: false }}/>
            <Stack.Screen name="CreatePromoCode" component={CreatePromoCodeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AdminBDLOrders" component={AdminBDLOrdersScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AdminManagePromoCodes" component={AdminManagePromoCodesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AdminManageCategories" component={AdminManageCategoriesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AdminAddStartup" component={AdminAddStartupScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AdminManageAmbassadorCodesScreen" component={AdminManageAmbassadorCodesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AdminManageAmbassadorCodes" component={AdminManageAmbassadorCodesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AdminCreateStartup" component={AdminCreateStartupScreen} />
            <Stack.Screen name="AdminManageStartupCodes" component={AdminManageStartupCodesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="StartupPaymentSettings" component={StartupPaymentSettingsScreen} options={{ headerShown: false }} />
            <Stack.Screen
  name="EditProduct"
  component={EditProductScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AmbassadorDashboard" component={AmbassadorDashboardScreen} options={{ headerShown: false }} />
            <Stack.Screen 
  name="AdminCreateAmbassadorCode"  // ✅ NOUVELLE ROUTE
  component={AdminCreateAmbassadorCodeScreen} 
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

          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </FavoritesProvider>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    fontSize: 24,
  },
  tabIconContainer: {
    position: 'relative',
  },
  tabBadge: {
    backgroundColor: '#FF3B30',
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
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
    width: 120,
    height: 120,
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
    color: '#938e8eff',
  },
});