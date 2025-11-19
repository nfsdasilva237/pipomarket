// screens/CartScreen.js - ✅ VERSION CORRIGÉE - UTILISE LE VRAI PANIER
import { addDoc, collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PaymentModal from '../components/PaymentModal';
import { auth, db } from '../config/firebase';
import { calculatePoints } from '../config/loyaltyConfig';
import notificationService from '../utils/notificationService';

export default function CartScreen({ navigation, route, cart, updateQuantity, removeFromCart }) {
  const [userPoints, setUserPoints] = useState(0);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [groupedCart, setGroupedCart] = useState({});

  useEffect(() => {
    loadUserPoints();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserPoints();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    // ✅ GROUPER LE PANIER PAR STARTUP
    if (cart && cart.length > 0) {
      const grouped = cart.reduce((acc, item) => {
        const startupId = item.startupId || 'unknown';
        if (!acc[startupId]) {
          acc[startupId] = [];
        }
        acc[startupId].push(item);
        return acc;
      }, {});
      setGroupedCart(grouped);
    } else {
      setGroupedCart({});
    }
  }, [cart]);

  const loadUserPoints = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const userDoc = await getDoc(doc(db, 'users', userId));
      const points = userDoc.data()?.loyaltyPoints || 0;
      setUserPoints(points);
    } catch (error) {
      console.error('Erreur chargement points:', error);
    }
  };

  const handleUpdateQuantity = (itemId, delta) => {
    const item = cart.find(i => i.id === itemId);
    if (!item) return;
    
    const newQuantity = item.quantity + delta;
    updateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = (itemId) => {
    Alert.alert('Supprimer', 'Retirer cet article du panier ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => removeFromCart(itemId),
      },
    ]);
  };

  const handleClearCart = () => {
    Alert.alert('Vider le panier', 'Voulez-vous vider tout le panier ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Vider',
        style: 'destructive',
        onPress: () => {
          cart.forEach(item => removeFromCart(item.id));
        },
      },
    ]);
  };

  // ✅ COMMANDER UNE STARTUP SPÉCIFIQUE
  const handleCheckoutStartup = async (startupId, items) => {
    try {
      // 1. Calculer total pour cette startup
      const startupTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // 2. Créer commande
      const orderItems = items.map(item => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        startupId: item.startupId,
      }));

      const order = await addDoc(collection(db, 'orders'), {
        userId: auth.currentUser.uid,
        items: orderItems,
        total: startupTotal,
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: new Date(),
      });

      // 3. Récupérer startup
      let startupData = null;
      let finalStartupId = startupId;

      if (!startupId || startupId === 'unknown') {
        // Chercher via premier produit
        const firstItem = items[0];
        const productDoc = await getDoc(doc(db, 'products', firstItem.id));
        
        if (productDoc.exists()) {
          finalStartupId = productDoc.data().startupId;
        } else {
          // Prendre première startup active
          const startupsQuery = query(collection(db, 'startups'), where('approved', '==', true));
          const startupsSnap = await getDocs(startupsQuery);
          
          if (!startupsSnap.empty) {
            const firstStartup = startupsSnap.docs[0];
            finalStartupId = firstStartup.id;
            startupData = firstStartup.data();
          }
        }
      }

      // Charger startup si pas encore chargée
      if (!startupData && finalStartupId) {
        const startupDoc = await getDoc(doc(db, 'startups', finalStartupId));
        if (startupDoc.exists()) {
          startupData = startupDoc.data();
        }
      }

      if (!startupData) {
        Alert.alert('Erreur', 'Startup introuvable');
        return;
      }

      // ✅ ENVOYER NOTIFICATION À LA STARTUP
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const customerName = userData.fullName || userData.name || 'Client';

        await notificationService.sendNotificationToStartup(
          finalStartupId,
          '🛍️ Nouvelle commande !',
          `Vous avez reçu une nouvelle commande de ${startupTotal.toLocaleString('fr-FR')} FCFA`,
          {
            type: 'new_order',
            orderId: order.id,
            shortOrderId: order.id.slice(0, 8),
            total: startupTotal,
            itemCount: items.length,
            customerName: customerName
          }
        );
        console.log(`✅ Notification envoyée à startup ${startupData.name}`);
      } catch (notifError) {
        console.error('⚠️ Erreur notification startup:', notifError);
        // Ne pas bloquer la commande si notification échoue
      }

      // 4. Préparer données paiement
      const finalPhone = startupData.ownerPhone || startupData.phone || '+237600000000';

      setOrderData({
        orderId: order.id,
        startupId: finalStartupId,
        userId: auth.currentUser.uid,
        total: startupTotal,
        startupPhone: finalPhone,
        startupName: startupData.name || 'PipoMarket',
        operator: 'mtn',
      });

      console.log('✅ Paiement préparé pour:', startupData.name, startupTotal, 'F');

      // 5. Ouvrir modal
      setPaymentModalVisible(true);

    } catch (error) {
      console.error('❌ Erreur checkout:', error);
      Alert.alert('Erreur', 'Impossible de créer la commande');
    }
  };

  // ✅ VIDER PANIER D'UNE STARTUP
  const removeStartupFromCart = (startupId) => {
    const itemsToRemove = cart.filter(item => item.startupId === startupId);
    itemsToRemove.forEach(item => removeFromCart(item.id));
  };

  const totalCart = cart?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
  const pointsToEarn = calculatePoints(totalCart, userPoints);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🛒 Mon Panier</Text>
          {cart && cart.length > 0 && (
            <TouchableOpacity onPress={handleClearCart}>
              <Text style={styles.clearButton}>Vider</Text>
            </TouchableOpacity>
          )}
        </View>

        {!cart || cart.length === 0 ? (
          /* PANIER VIDE */
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🛒</Text>
            <Text style={styles.emptyStateTitle}>Votre panier est vide</Text>
            <Text style={styles.emptyStateText}>
              Découvrez nos startups et ajoutez des produits !
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate('StartupsTab')}
            >
              <Text style={styles.emptyStateButtonText}>
                Explorer les startups
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* APERÇU POINTS TOTAL */}
            <TouchableOpacity
              style={styles.pointsPreview}
              onPress={() => navigation.navigate('Loyalty')}
              activeOpacity={0.8}
            >
              <View style={styles.pointsPreviewLeft}>
                <Text style={styles.pointsPreviewIcon}>🎁</Text>
                <View>
                  <Text style={styles.pointsPreviewTitle}>
                    Total : {pointsToEarn.totalPoints} points !
                  </Text>
                  <Text style={styles.pointsPreviewSubtitle}>
                    Sur toutes vos commandes
                  </Text>
                </View>
              </View>
              <Text style={styles.pointsPreviewArrow}>→</Text>
            </TouchableOpacity>

            {/* ✅ AFFICHER PAR STARTUP */}
            {Object.entries(groupedCart).map(([startupId, items]) => {
              const startupTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
              const startupPoints = calculatePoints(startupTotal, userPoints);

              return (
                <View key={startupId} style={styles.startupSection}>
                  {/* HEADER STARTUP */}
                  <View style={styles.startupHeader}>
                    <View style={styles.startupHeaderLeft}>
                      <Text style={styles.startupIcon}>🏢</Text>
                      <View>
                        <Text style={styles.startupName}>
                          {items[0]?.startupName || `Startup ${startupId.slice(0, 8)}`}
                        </Text>
                        <Text style={styles.startupItemCount}>
                          {items.length} article{items.length > 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeStartupFromCart(startupId)}
                    >
                      <Text style={styles.removeStartupButton}>🗑️</Text>
                    </TouchableOpacity>
                  </View>

                  {/* ARTICLES */}
                  {items.map((item) => (
                    <View key={item.id} style={styles.cartItem}>
                      {/* ✅ AFFICHER IMAGE OU EMOJI */}
{item.image && (
  item.image.startsWith('http') || 
  item.image.startsWith('file://') ||
  item.image.startsWith('data:')
) ? (
  <Image 
    source={{ uri: item.image }} 
    style={styles.cartItemImage}
    resizeMode="cover"
  />
) : (
  <Text style={styles.cartItemEmoji}>{item.image || '📦'}</Text>
)}
                      <View style={styles.cartItemInfo}>
                        <Text style={styles.cartItemName}>{item.name}</Text>
                        <Text style={styles.cartItemPrice}>
                          {item.price.toLocaleString()} FCFA
                        </Text>
                      </View>
                      <View style={styles.cartItemActions}>
                        <View style={styles.quantityControls}>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => handleUpdateQuantity(item.id, -1)}
                          >
                            <Text style={styles.quantityButtonText}>−</Text>
                          </TouchableOpacity>
                          <Text style={styles.quantity}>{item.quantity}</Text>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => handleUpdateQuantity(item.id, 1)}
                          >
                            <Text style={styles.quantityButtonText}>+</Text>
                          </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleRemoveItem(item.id)}
                        >
                          <Text style={styles.deleteButtonText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  {/* TOTAL ET BOUTON STARTUP */}
                  <View style={styles.startupFooter}>
                    <View style={styles.startupFooterInfo}>
                      <Text style={styles.startupTotal}>
                        {startupTotal.toLocaleString()} FCFA
                      </Text>
                      <Text style={styles.startupPoints}>
                        +{startupPoints.totalPoints} pts 🎁
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.startupCheckoutButton}
                      onPress={() => handleCheckoutStartup(startupId, items)}
                    >
                      <Text style={styles.startupCheckoutButtonText}>
                        Commander
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {/* RÉSUMÉ TOTAL */}
            <View style={styles.totalSection}>
              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Total général</Text>
                <Text style={styles.totalValue}>
                  {totalCart.toLocaleString()} FCFA
                </Text>
                <Text style={styles.totalPoints}>
                  +{pointsToEarn.totalPoints} points au total
                </Text>
              </View>
              <Text style={styles.totalHint}>
                💡 Chaque startup sera payée séparément
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* MODAL PAIEMENT */}
      <PaymentModal
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        orderData={orderData}
        onPaymentConfirmed={() => {
          setPaymentModalVisible(false);
          // Retirer items de la startup payée
          if (orderData?.startupId) {
            removeStartupFromCart(orderData.startupId);
          }
          Alert.alert(
            'Paiement enregistré',
            'Votre paiement a été enregistré. La startup va confirmer.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Si plus d'items, retour home
                  if (!cart || cart.filter(item => item.startupId !== orderData?.startupId).length === 0) {
                    navigation.navigate('HomeTab');
                  }
                }
              }
            ]
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scrollView: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'white' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  clearButton: { fontSize: 14, color: '#FF3B30', fontWeight: '600' },
  
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 100 },
  emptyStateIcon: { fontSize: 80, marginBottom: 20 },
  emptyStateTitle: { fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  emptyStateText: { fontSize: 15, color: '#8E8E93', textAlign: 'center', marginBottom: 24 },
  emptyStateButton: { backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyStateButtonText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  
  pointsPreview: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#007AFF', marginHorizontal: 16, marginTop: 16, marginBottom: 8, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  pointsPreviewLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  pointsPreviewIcon: { fontSize: 32, marginRight: 12 },
  pointsPreviewTitle: { fontSize: 15, fontWeight: 'bold', color: 'white', marginBottom: 2 },
  pointsPreviewSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  pointsPreviewArrow: { fontSize: 20, color: 'white', fontWeight: 'bold' },
  
  startupSection: { backgroundColor: 'white', marginHorizontal: 16, marginBottom: 16, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  
  startupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#F8F9FA', borderBottomWidth: 2, borderBottomColor: '#007AFF' },
  startupHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  startupIcon: { fontSize: 28, marginRight: 12 },
  startupName: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  startupItemCount: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  removeStartupButton: { fontSize: 24, padding: 4 },
  cartItemImage: {
  width: 50,
  height: 50,
  borderRadius: 8,
  marginRight: 12,
},
  
  cartItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  cartItemEmoji: { fontSize: 40, marginRight: 12 },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 4 },
  cartItemPrice: { fontSize: 14, color: '#8E8E93' },
  cartItemActions: { alignItems: 'flex-end' },
  quantityControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 8, marginBottom: 8 },
  quantityButton: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  quantityButtonText: { fontSize: 18, fontWeight: 'bold', color: '#007AFF' },
  quantity: { fontSize: 15, fontWeight: '600', color: '#000', paddingHorizontal: 12, minWidth: 30, textAlign: 'center' },
  deleteButton: { padding: 4 },
  deleteButtonText: { fontSize: 20 },
  
  startupFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#F8F9FA' },
  startupFooterInfo: { flex: 1 },
  startupTotal: { fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 2 },
  startupPoints: { fontSize: 13, color: '#34C759', fontWeight: '600' },
  startupCheckoutButton: { backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  startupCheckoutButtonText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  
  totalSection: { padding: 16 },
  totalCard: { backgroundColor: 'white', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#007AFF' },
  totalLabel: { fontSize: 14, color: '#8E8E93', marginBottom: 8 },
  totalValue: { fontSize: 28, fontWeight: 'bold', color: '#007AFF', marginBottom: 4 },
  totalPoints: { fontSize: 13, color: '#34C759', fontWeight: '600' },
  totalHint: { fontSize: 13, color: '#8E8E93', textAlign: 'center', fontStyle: 'italic' },
});