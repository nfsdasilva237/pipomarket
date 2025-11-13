// INSTRUCTIONS POUR METTRE À JOUR App.js

// 1. AJOUTEZ CES IMPORTS (en haut avec les autres screens)
import ChatScreen from './screens/ChatScreen';
import ConversationsListScreen from './screens/ConversationsListScreen';
import StartupMessagesScreen from './screens/StartupMessagesScreen';

// 2. DANS LE ClientStack, AJOUTEZ CES ÉCRANS :

function ClientStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: 'white' },
        headerTintColor: '#007AFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="ClientTabs"
        component={ClientTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="StartupDetail"
        component={StartupDetailScreen}
        options={({ route }) => ({
          title: route.params?.startupName || 'Détails',
        })}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: 'Commande' }}
      />
      
      {/* NOUVEAUX ÉCRANS CHAT */}
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({
          title: route.params?.startupName || route.params?.clientName || 'Chat',
        })}
      />
      <Stack.Screen
        name="Conversations"
        component={ConversationsListScreen}
        options={{ title: 'Mes conversations' }}
      />
    </Stack.Navigator>
  );
}

// 3. DANS LE StartupStack, AJOUTEZ CET ÉCRAN :

function StartupStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: 'white' },
        headerTintColor: '#007AFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="StartupDashboard"
        component={StartupDashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddProduct"
        component={AddProductScreen}
        options={{ title: 'Ajouter un produit' }}
      />
      
      {/* NOUVEAUX ÉCRANS CHAT */}
      <Stack.Screen
        name="StartupMessages"
        component={StartupMessagesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({
          title: route.params?.clientName || 'Chat',
        })}
      />
    </Stack.Navigator>
  );
}

// 4. DANS ClientTabs (le Tab.Navigator), AJOUTEZ L'ONGLET MESSAGES :

function ClientTabs() {
  const { cart } = useCart();

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
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24 }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Startups"
        component={StartupsScreen}
        options={{
          tabBarLabel: 'Startups',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24 }}>🏢</Text>
          ),
        }}
      />
      
      {/* NOUVEL ONGLET MESSAGES */}
      <Tab.Screen
        name="Messages"
        component={ConversationsListScreen}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24 }}>💬</Text>
          ),
        }}
      />
      
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarLabel: 'Panier',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24 }}>🛒</Text>
          ),
          tabBarBadge: cart.length > 0 ? cart.length : null,
        }}
      />
    </Tab.Navigator>
  );
}

// VOILÀ ! Votre navigation est prête pour le chat !
