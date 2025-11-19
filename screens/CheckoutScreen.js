// screens/CheckoutScreen.js - ✅ VERSION FINALE AVEC LIVRAISON FLEXIBLE
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OrderConfirmationModal from '../components/OrderConfirmationModal';
import { auth, db } from '../config/firebase';
import notificationService from '../utils/notificationService';
import promoCodeService from '../utils/promoCodeService';

export default function CheckoutScreen({ navigation, route, cart: globalCart, clearCart }) {
  const { deliveryAddress, cart: routeCart } = route.params || {};
  const cart = routeCart || globalCart;

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState(null);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [orderConfirmationData, setOrderConfirmationData] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState('');

  // ✅ NOUVEAU: Gérer la livraison
  const [deliveryOption, setDeliveryOption] = useState('standard'); // 'standard' ou 'free'
  const [startupDeliverySettings, setStartupDeliverySettings] = useState({});

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // ✅ CHARGER LES PARAMÈTRES DE LIVRAISON DES STARTUPS
  useEffect(() => {
    loadStartupDeliverySettings();
  }, [cart]);

  const loadStartupDeliverySettings = async () => {
    try {
      const startupIds = [...new Set(cart.map(item => item.startupId).filter(Boolean))];
      const settings = {};

      for (const startupId of startupIds) {
        const startupDoc = await getDoc(doc(db, 'startups', startupId));
        if (startupDoc.exists()) {
          const data = startupDoc.data();
          settings[startupId] = {
            offersFreeDelivery: data.offersFreeDelivery || false,
            deliveryCost: data.deliveryCost || 2000, // Par défaut 2000 FCFA
            freeDeliveryMinAmount: data.freeDeliveryMinAmount || 0,
          };
        } else {
          settings[startupId] = {
            offersFreeDelivery: false,
            deliveryCost: 2000,
            freeDeliveryMinAmount: 0,
          };
        }
      }

      setStartupDeliverySettings(settings);

      // Vérifier si toutes les startups offrent la livraison gratuite
      const allFree = Object.values(settings).every(s => s.offersFreeDelivery);
      if (allFree) {
        setDeliveryOption('free');
      }
    } catch (error) {
      console.error('Erreur chargement paramètres livraison:', error);
    }
  };

  // ✅ CALCULER LE COÛT DE LIVRAISON
  const calculateShippingCost = () => {
    if (deliveryOption === 'free') return 0;

    // Vérifier si le montant qualifie pour la livraison gratuite
    const startupIds = [...new Set(cart.map(item => item.startupId))];
    let totalShipping = 0;

    for (const startupId of startupIds) {
      const settings = startupDeliverySettings[startupId];
      if (!settings) continue;

      const startupTotal = cart
        .filter(item => item.startupId === startupId)
        .reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Si la startup offre la livraison gratuite au-dessus d'un montant
      if (settings.freeDeliveryMinAmount > 0 && startupTotal >= settings.freeDeliveryMinAmount) {
        continue; // Gratuit pour cette startup
      }

      totalShipping += settings.deliveryCost;
    }

    return totalShipping;
  };

  const shippingCost = calculateShippingCost();

  let discount = 0;
  let finalShippingCost = shippingCost;

  if (appliedPromo) {
    const discountCalc = promoCodeService.calculateDiscount(appliedPromo, subtotal, shippingCost);
    discount = discountCalc.amount;
    if (discountCalc.freeShipping) {
      finalShippingCost = 0;
    }
  }

  const total = subtotal - discount + finalShippingCost;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      Alert.alert('Erreur', 'Entrez un code promo');
      return;
    }

    setPromoLoading(true);
    setPromoMessage('');

    const startupIds = [...new Set(cart.map(item => item.startupId).filter(Boolean))];
    const result = await promoCodeService.validatePromoCode(promoCode, subtotal, startupIds);

    setPromoLoading(false);

    if (result.valid) {
      setAppliedPromo(result.promo);
      setPromoMessage(result.message);
      Alert.alert('✅ Code appliqué !', result.message);
    } else {
      setAppliedPromo(null);
      setPromoMessage('');
      Alert.alert('❌ Code invalide', result.error);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoMessage('');
  };

  // ✅ FONCTION POUR NETTOYER LES UNDEFINED
  const cleanData = (obj) => {
    const cleaned = {};
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      if (value !== undefined && value !== null) {
        if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
          // Nettoyer récursivement les objets
          cleaned[key] = cleanData(value);
        } else {
          cleaned[key] = value;
        }
      }
    });
    return cleaned;
  };

  const handlePlaceOrder = async () => {
    if (!deliveryAddress) {
      Alert.alert('Erreur', 'Veuillez sélectionner une adresse de livraison');
      return;
    }

    if (paymentMethod === 'mobile_money' && !mobileMoneyProvider) {
      Alert.alert('Erreur', 'Veuillez choisir MTN ou Orange Money');
      return;
    }

    setLoading(true);

    try {
      const userId = auth.currentUser?.uid;

      if (!userId) {
        Alert.alert('Erreur', 'Vous devez être connecté');
        setLoading(false);
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.exists() ? userDoc.data() : {};

      console.log('👤 Infos client:', {
        name: userData.fullName || userData.name,
        email: userData.email,
        phone: userData.phone
      });

      // ✅ CONSTRUIRE LES DONNÉES SANS UNDEFINED
      const orderData = {
        userId: userId,
        customerInfo: {
          name: userData.fullName || userData.name || 'Client',
          email: userData.email || auth.currentUser.email || '',
          phone: userData.phone || deliveryAddress?.phone || '',
          userId: userId,
        },
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          startupId: item.startupId,
          startupName: item.startupName || '',
          image: item.image || '',
        })),
        subtotal: subtotal,
        shippingCost: finalShippingCost,
        discount: discount,
        total: total,
        deliveryAddress: {
          name: deliveryAddress.name || '',
          street: deliveryAddress.street || '',
          city: deliveryAddress.city || '',
          phone: deliveryAddress.phone || '',
          additionalInfo: deliveryAddress.additionalInfo || '',
          fullAddress: `${deliveryAddress.street}, ${deliveryAddress.city}`,
        },
        paymentMethod: paymentMethod,
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: serverTimestamp(),
      };

      // ✅ AJOUTER PROMO SEULEMENT SI EXISTE
      if (appliedPromo) {
        orderData.promoCode = {
          id: appliedPromo.id,
          code: appliedPromo.code,
          type: appliedPromo.type,
          value: appliedPromo.value,
          discountAmount: discount
        };
      }

      // ✅ AJOUTER MOBILE MONEY SEULEMENT SI SÉLECTIONNÉ
      if (paymentMethod === 'mobile_money' && mobileMoneyProvider) {
        orderData.mobileMoneyProvider = mobileMoneyProvider;
      }

      console.log('📦 Données commande AVANT nettoyage:', orderData);

      // ✅ NETTOYER LES UNDEFINED
      const cleanedOrderData = cleanData(orderData);

      console.log('📦 Données commande APRÈS nettoyage:', cleanedOrderData);

      const docRef = await addDoc(collection(db, 'orders'), cleanedOrderData);

      const fullOrderId = docRef.id;
      const shortOrderId = docRef.id.slice(0, 8);

      console.log('✅ Commande créée:', {
        fullId: fullOrderId,
        shortId: shortOrderId
      });

      // ✅ ENVOYER NOTIFICATIONS AUX STARTUPS
      const startupGroups = cart.reduce((acc, item) => {
        if (!acc[item.startupId]) {
          acc[item.startupId] = {
            id: item.startupId,
            name: item.startupName || 'Startup',
            total: 0,
            items: []
          };
        }
        acc[item.startupId].total += item.price * item.quantity;
        acc[item.startupId].items.push(item);
        return acc;
      }, {});

      // Notifier chaque startup concernée
      await Promise.all(
        Object.values(startupGroups).map(async (startup) => {
          try {
            await notificationService.sendNotificationToStartup(
              startup.id,
              '🛍️ Nouvelle commande !',
              `Vous avez reçu une nouvelle commande de ${startup.total.toLocaleString('fr-FR')} FCFA`,
              {
                type: 'new_order',
                orderId: fullOrderId,
                shortOrderId: shortOrderId,
                total: startup.total,
                itemCount: startup.items.length,
                customerName: userData.fullName || userData.name || 'Client'
              }
            );
            console.log(`✅ Notification envoyée à startup ${startup.name}`);
          } catch (notifError) {
            console.error('⚠️ Erreur notification startup:', notifError);
            // Ne pas bloquer la commande si notification échoue
          }
        })
      );

      if (appliedPromo) {
        await promoCodeService.applyPromoCode(appliedPromo.id, userId);
      }

      clearCart();

      let startupPayments = null;

      if (paymentMethod === 'mobile_money' && mobileMoneyProvider) {
        const startupGroups = cart.reduce((acc, item) => {
          if (!acc[item.startupId]) {
            acc[item.startupId] = {
              id: item.startupId,
              name: item.startupName,
              total: 0,
            };
          }
          acc[item.startupId].total += item.price * item.quantity;
          return acc;
        }, {});

        startupPayments = await Promise.all(
          Object.values(startupGroups).map(async (sp) => {
            try {
              const startupDoc = await getDoc(doc(db, 'startups', sp.id));
              if (startupDoc.exists()) {
                const startupData = startupDoc.data();
                return {
                  ...sp,
                  mtnPhone: startupData.mtnPhone || null,
                  orangePhone: startupData.orangePhone || null,
                };
              }
              return sp;
            } catch (error) {
              console.error('Erreur récupération startup:', error);
              return sp;
            }
          })
        );
      }

      setOrderConfirmationData({
        orderId: shortOrderId,
        orderIdFull: fullOrderId,
        total: total,
        paymentMethod: paymentMethod,
        mobileMoneyProvider: paymentMethod === 'mobile_money' ? mobileMoneyProvider : null,
        startupPayments: paymentMethod === 'mobile_money' ? startupPayments : null,
        customerName: userData.fullName || userData.name || 'Client',
      });

      setConfirmationModalVisible(true);

    } catch (error) {
      console.error('❌ Erreur commande:', error);
      Alert.alert('Erreur', error.message || 'Impossible de passer la commande');
    } finally {
      setLoading(false);
    }
  };

  // ✅ VÉRIFIER SI LIVRAISON GRATUITE DISPONIBLE
  const hasFreeDeliveryOption = Object.values(startupDeliverySettings).some(s => s.offersFreeDelivery);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Paiement</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Adresse de livraison</Text>
          {deliveryAddress ? (
            <View style={styles.addressCard}>
              <Text style={styles.addressName}>{deliveryAddress.name}</Text>
              <Text style={styles.addressText}>{deliveryAddress.street}</Text>
              <Text style={styles.addressText}>{deliveryAddress.city}</Text>
              <Text style={styles.addressText}>{deliveryAddress.phone}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={() => navigation.navigate('Addresses')}
            >
              <Text style={styles.addAddressText}>+ Ajouter une adresse</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ✅ NOUVEAU: OPTIONS DE LIVRAISON */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚚 Mode de livraison</Text>

          <TouchableOpacity
            style={[
              styles.deliveryOption,
              deliveryOption === 'standard' && styles.deliveryOptionSelected,
            ]}
            onPress={() => setDeliveryOption('standard')}
          >
            <View style={styles.deliveryOptionContent}>
              <Text style={styles.deliveryOptionIcon}>📦</Text>
              <View style={styles.deliveryOptionText}>
                <Text style={styles.deliveryOptionTitle}>Livraison standard</Text>
                <Text style={styles.deliveryOptionSubtitle}>
                  {calculateShippingCost().toLocaleString('fr-FR')} FCFA
                </Text>
              </View>
            </View>
            {deliveryOption === 'standard' && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>

          {hasFreeDeliveryOption && (
            <TouchableOpacity
              style={[
                styles.deliveryOption,
                deliveryOption === 'free' && styles.deliveryOptionSelected,
              ]}
              onPress={() => setDeliveryOption('free')}
            >
              <View style={styles.deliveryOptionContent}>
                <Text style={styles.deliveryOptionIcon}>🎁</Text>
                <View style={styles.deliveryOptionText}>
                  <Text style={styles.deliveryOptionTitle}>Livraison gratuite</Text>
                  <Text style={styles.deliveryOptionSubtitle}>
                    Retrait en point relais
                  </Text>
                </View>
              </View>
              {deliveryOption === 'free' && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📦 Récapitulatif ({cart.length} articles)</Text>
          {cart.map((item) => (
            <View key={item.id} style={styles.cartItem}>
              <Text style={styles.cartItemName}>{item.name}</Text>
              <Text style={styles.cartItemDetails}>
                {item.quantity} x {item.price.toLocaleString('fr-FR')} FCFA
              </Text>
              <Text style={styles.cartItemPrice}>
                {(item.price * item.quantity).toLocaleString('fr-FR')} FCFA
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎁 Code Promo</Text>

          {!appliedPromo ? (
            <View style={styles.promoInputContainer}>
              <TextInput
                style={styles.promoInput}
                placeholder="Entrer le code"
                value={promoCode}
                onChangeText={setPromoCode}
                autoCapitalize="characters"
                editable={!promoLoading}
              />
              <TouchableOpacity
                style={[styles.promoButton, promoLoading && styles.promoButtonDisabled]}
                onPress={handleApplyPromo}
                disabled={promoLoading}
              >
                {promoLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.promoButtonText}>Appliquer</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.promoAppliedContainer}>
              <View style={styles.promoAppliedLeft}>
                <Text style={styles.promoAppliedCode}>✅ {appliedPromo.code}</Text>
                <Text style={styles.promoAppliedDiscount}>
                  -{discount.toLocaleString('fr-FR')} FCFA
                </Text>
              </View>
              <TouchableOpacity onPress={handleRemovePromo}>
                <Text style={styles.promoRemoveButton}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 Mode de paiement</Text>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'cash_on_delivery' && styles.paymentOptionSelected,
            ]}
            onPress={() => {
              setPaymentMethod('cash_on_delivery');
              setMobileMoneyProvider(null);
            }}
          >
            <View style={styles.paymentOptionContent}>
              <Text style={styles.paymentOptionIcon}>💵</Text>
              <View style={styles.paymentOptionText}>
                <Text style={styles.paymentOptionTitle}>Paiement à la livraison</Text>
                <Text style={styles.paymentOptionSubtitle}>En espèces</Text>
              </View>
            </View>
            {paymentMethod === 'cash_on_delivery' && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'mobile_money' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('mobile_money')}
          >
            <View style={styles.paymentOptionContent}>
              <Text style={styles.paymentOptionIcon}>📱</Text>
              <View style={styles.paymentOptionText}>
                <Text style={styles.paymentOptionTitle}>Paiement Mobile</Text>
                <Text style={styles.paymentOptionSubtitle}>MTN / Orange Money</Text>
              </View>
            </View>
            {paymentMethod === 'mobile_money' && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>

          {paymentMethod === 'mobile_money' && (
            <View style={styles.mobileMoneyOptions}>
              <Text style={styles.mobileMoneyLabel}>Choisissez votre opérateur:</Text>

              <TouchableOpacity
                style={[
                  styles.providerOption,
                  mobileMoneyProvider === 'mtn' && styles.providerOptionSelected,
                ]}
                onPress={() => setMobileMoneyProvider('mtn')}
              >
                <View style={styles.providerContent}>
                  <Text style={styles.providerIcon}>💛</Text>
                  <View style={styles.providerText}>
                    <Text style={styles.providerTitle}>Mobile Money</Text>
                    <Text style={styles.providerSubtitle}>MTN Cameroon</Text>
                    <Text style={styles.providerCode}>*126*1*1*...</Text>
                  </View>
                </View>
                {mobileMoneyProvider === 'mtn' && (
                  <Text style={styles.providerCheckmark}>✓</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.providerOption,
                  mobileMoneyProvider === 'orange' && styles.providerOptionSelected,
                ]}
                onPress={() => setMobileMoneyProvider('orange')}
              >
                <View style={styles.providerContent}>
                  <Text style={styles.providerIcon}>🧡</Text>
                  <View style={styles.providerText}>
                    <Text style={styles.providerTitle}>Orange Money</Text>
                    <Text style={styles.providerSubtitle}>Orange Cameroun</Text>
                    <Text style={styles.providerCode}>#150*1*1*...</Text>
                  </View>
                </View>
                {mobileMoneyProvider === 'orange' && (
                  <Text style={styles.providerCheckmark}>✓</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Total</Text>
          <View style={styles.totalCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Sous-total</Text>
              <Text style={styles.totalValue}>
                {subtotal.toLocaleString('fr-FR')} FCFA
              </Text>
            </View>

            {appliedPromo && (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, styles.discountLabel]}>
                  Réduction ({appliedPromo.code})
                </Text>
                <Text style={[styles.totalValue, styles.discountValue]}>
                  -{discount.toLocaleString('fr-FR')} FCFA
                </Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Livraison</Text>
              <Text style={styles.totalValue}>
                {finalShippingCost === 0 ? (
                  <Text style={styles.freeShipping}>Gratuit</Text>
                ) : (
                  `${finalShippingCost.toLocaleString('fr-FR')} FCFA`
                )}
              </Text>
            </View>

            <View style={styles.totalDivider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabelFinal}>Total</Text>
              <Text style={styles.totalValueFinal}>
                {total.toLocaleString('fr-FR')} FCFA
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.orderButton, loading && styles.orderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading || !deliveryAddress}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.orderButtonText}>
              Passer la commande • {total.toLocaleString('fr-FR')} FCFA
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {orderConfirmationData && (
        <OrderConfirmationModal
          visible={confirmationModalVisible}
          onClose={() => {
            setConfirmationModalVisible(false);
            clearCart();
            navigation.navigate('Home');
          }}
          orderId={orderConfirmationData.orderId}
          orderIdFull={orderConfirmationData.orderIdFull}
          total={orderConfirmationData.total}
          paymentMethod={orderConfirmationData.paymentMethod}
          mobileMoneyProvider={orderConfirmationData.mobileMoneyProvider}
          startupPayments={orderConfirmationData.startupPayments}
          userId={auth.currentUser?.uid}
          onViewOrders={() => {
            navigation.navigate('Orders');
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scrollView: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'white' },
  backButton: { fontSize: 28, color: '#007AFF' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  section: { marginTop: 16, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 12 },
  addressCard: { backgroundColor: 'white', borderRadius: 12, padding: 16 },
  addressName: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  addressText: { fontSize: 14, color: '#666', marginBottom: 2 },
  addAddressButton: { backgroundColor: 'white', borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: '#007AFF', borderStyle: 'dashed' },
  addAddressText: { fontSize: 15, fontWeight: '600', color: '#007AFF' },

  // ✅ NOUVEAU: Styles options livraison
  deliveryOption: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 2, borderColor: '#E5E5EA' },
  deliveryOptionSelected: { borderColor: '#34C759', backgroundColor: '#F0FFF4' },
  deliveryOptionContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  deliveryOptionIcon: { fontSize: 32, marginRight: 12 },
  deliveryOptionText: { flex: 1 },
  deliveryOptionTitle: { fontSize: 15, fontWeight: 'bold', color: '#000', marginBottom: 2 },
  deliveryOptionSubtitle: { fontSize: 13, color: '#666' },

  cartItem: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 8 },
  cartItemName: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 4 },
  cartItemDetails: { fontSize: 13, color: '#666', marginBottom: 4 },
  cartItemPrice: { fontSize: 15, fontWeight: 'bold', color: '#007AFF' },
  promoInputContainer: { flexDirection: 'row', gap: 8 },
  promoInput: { flex: 1, backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, borderWidth: 1, borderColor: '#E5E5EA' },
  promoButton: { backgroundColor: '#007AFF', borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', minWidth: 100 },
  promoButtonDisabled: { backgroundColor: '#C7C7CC' },
  promoButtonText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  promoAppliedContainer: { backgroundColor: '#E3F2FD', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 2, borderColor: '#007AFF' },
  promoAppliedLeft: { flex: 1 },
  promoAppliedCode: { fontSize: 15, fontWeight: 'bold', color: '#007AFF', marginBottom: 4 },
  promoAppliedDiscount: { fontSize: 14, color: '#34C759', fontWeight: '600' },
  promoRemoveButton: { fontSize: 24, color: '#FF3B30', fontWeight: 'bold', paddingLeft: 12 },
  paymentOption: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 2, borderColor: '#E5E5EA' },
  paymentOptionSelected: { borderColor: '#007AFF', backgroundColor: '#F0F8FF' },
  paymentOptionContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  paymentOptionIcon: { fontSize: 32, marginRight: 12 },
  paymentOptionText: { flex: 1 },
  paymentOptionTitle: { fontSize: 15, fontWeight: 'bold', color: '#000', marginBottom: 2 },
  paymentOptionSubtitle: { fontSize: 13, color: '#666' },
  checkmark: { fontSize: 24, color: '#007AFF', fontWeight: 'bold' },
  mobileMoneyOptions: { marginLeft: 16, marginTop: 8, marginBottom: 8, paddingLeft: 16, borderLeftWidth: 3, borderLeftColor: '#007AFF' },
  mobileMoneyLabel: { fontSize: 14, fontWeight: '600', color: '#007AFF', marginBottom: 12 },
  providerOption: { backgroundColor: '#F9F9F9', borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 2, borderColor: '#E5E5EA' },
  providerOptionSelected: { borderColor: '#34C759', backgroundColor: '#F0FFF4' },
  providerContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  providerIcon: { fontSize: 28, marginRight: 12 },
  providerText: { flex: 1 },
  providerTitle: { fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 2 },
  providerSubtitle: { fontSize: 12, color: '#666', marginBottom: 2 },
  providerCode: { fontSize: 11, color: '#8E8E93', fontFamily: 'monospace' },
  providerCheckmark: { fontSize: 20, color: '#34C759', fontWeight: 'bold' },
  totalCard: { backgroundColor: 'white', borderRadius: 12, padding: 16 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  totalLabel: { fontSize: 15, color: '#666' },
  totalValue: { fontSize: 15, fontWeight: '600', color: '#000' },
  discountLabel: { color: '#34C759' },
  discountValue: { color: '#34C759' },
  freeShipping: { color: '#34C759', fontWeight: 'bold' },
  totalDivider: { height: 1, backgroundColor: '#E5E5EA', marginVertical: 12 },
  totalLabelFinal: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  totalValueFinal: { fontSize: 20, fontWeight: 'bold', color: '#007AFF' },
  footer: { backgroundColor: 'white', padding: 20, borderTopWidth: 1, borderTopColor: '#E5E5EA' },
  orderButton: { backgroundColor: '#007AFF', borderRadius: 12, padding: 16, alignItems: 'center' },
  orderButtonDisabled: { backgroundColor: '#C7C7CC' },
  orderButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
