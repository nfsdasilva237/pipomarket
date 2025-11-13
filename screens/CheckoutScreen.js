// screens/CheckoutScreen.js - AVEC CODES PROMO
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
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
import { auth, db } from '../config/firebase';
import promoCodeService from '../utils/promoCodeService';

export default function CheckoutScreen({ navigation, route, cart, clearCart }) {
  const { deliveryAddress } = route.params || {};
  
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  
  // CODES PROMO
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState('');
  
  // Calculs
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingCost = 2000; // FCFA
  
  // Réduction code promo
  let discount = 0;
  let finalShippingCost = shippingCost;
  
  if (appliedPromo) {
    const discountCalc = promoCodeService.calculateDiscount(
      appliedPromo, 
      subtotal, 
      shippingCost
    );
    
    discount = discountCalc.amount;
    
    if (discountCalc.freeShipping) {
      finalShippingCost = 0;
    }
  }
  
  const total = subtotal - discount + finalShippingCost;

  // APPLIQUER CODE PROMO
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      Alert.alert('Erreur', 'Entrez un code promo');
      return;
    }
    
    setPromoLoading(true);
    setPromoMessage('');
    
    // Extraire les IDs des startups du panier
    const startupIds = [...new Set(cart.map(item => item.startupId).filter(Boolean))];
    
    const result = await promoCodeService.validatePromoCode(
      promoCode,
      subtotal,
      startupIds
    );
    
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

  // RETIRER CODE PROMO
  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoMessage('');
  };

  // PASSER LA COMMANDE
  const handlePlaceOrder = async () => {
    if (!deliveryAddress) {
      Alert.alert('Erreur', 'Veuillez sélectionner une adresse de livraison');
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

      // Créer la commande
      const orderData = {
        userId: userId,
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          startupId: item.startupId,
          startupName: item.startupName,
        })),
        
        // Montants
        subtotal: subtotal,
        shippingCost: finalShippingCost,
        discount: discount,
        total: total,
        
        // Code promo
        promoCode: appliedPromo ? {
          id: appliedPromo.id,
          code: appliedPromo.code,
          type: appliedPromo.type,
          value: appliedPromo.value,
          discountAmount: discount
        } : null,
        
        // Autres infos
        deliveryAddress: deliveryAddress,
        paymentMethod: paymentMethod,
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);

      // Appliquer le code promo (incrémenter usage)
      if (appliedPromo) {
        await promoCodeService.applyPromoCode(appliedPromo.id, userId);
      }

      // Vider le panier
      clearCart();

      Alert.alert(
        '✅ Commande confirmée !',
        `Votre commande #${docRef.id.slice(0, 8)} a été enregistrée.\n\nTotal: ${total.toLocaleString('fr-FR')} FCFA`,
        [
          {
            text: 'Voir mes commandes',
            onPress: () => navigation.navigate('Orders'),
          },
        ]
      );

      navigation.navigate('Home');

    } catch (error) {
      console.error('Erreur commande:', error);
      Alert.alert('Erreur', 'Impossible de passer la commande');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Paiement</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* ADRESSE DE LIVRAISON */}
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

        {/* RÉCAPITULATIF */}
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

        {/* CODE PROMO */}
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
          
          {promoMessage && !appliedPromo && (
            <Text style={styles.promoError}>{promoMessage}</Text>
          )}
        </View>

        {/* MODE DE PAIEMENT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 Mode de paiement</Text>
          
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
                <Text style={styles.paymentOptionTitle}>Mobile Money</Text>
                <Text style={styles.paymentOptionSubtitle}>MTN / Orange Money</Text>
              </View>
            </View>
            {paymentMethod === 'mobile_money' && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'cash_on_delivery' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('cash_on_delivery')}
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
        </View>

        {/* TOTAL */}
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
                {appliedPromo?.type === 'free_shipping' ? (
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

      {/* BOUTON COMMANDER */}
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
  
  // Adresse
  addressCard: { backgroundColor: 'white', borderRadius: 12, padding: 16 },
  addressName: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  addressText: { fontSize: 14, color: '#666', marginBottom: 2 },
  addAddressButton: { backgroundColor: 'white', borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: '#007AFF', borderStyle: 'dashed' },
  addAddressText: { fontSize: 15, fontWeight: '600', color: '#007AFF' },
  
  // Récap
  cartItem: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 8 },
  cartItemName: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 4 },
  cartItemDetails: { fontSize: 13, color: '#666', marginBottom: 4 },
  cartItemPrice: { fontSize: 15, fontWeight: 'bold', color: '#007AFF' },
  
  // CODE PROMO
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
  promoError: { marginTop: 8, fontSize: 13, color: '#FF3B30' },
  
  // Paiement
  paymentOption: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 2, borderColor: '#E5E5EA' },
  paymentOptionSelected: { borderColor: '#007AFF', backgroundColor: '#F0F8FF' },
  paymentOptionContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  paymentOptionIcon: { fontSize: 32, marginRight: 12 },
  paymentOptionText: { flex: 1 },
  paymentOptionTitle: { fontSize: 15, fontWeight: 'bold', color: '#000', marginBottom: 2 },
  paymentOptionSubtitle: { fontSize: 13, color: '#666' },
  checkmark: { fontSize: 24, color: '#007AFF', fontWeight: 'bold' },
  
  // Total
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
  
  // Footer
  footer: { backgroundColor: 'white', padding: 20, borderTopWidth: 1, borderTopColor: '#E5E5EA' },
  orderButton: { backgroundColor: '#007AFF', borderRadius: 12, padding: 16, alignItems: 'center' },
  orderButtonDisabled: { backgroundColor: '#C7C7CC' },
  orderButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
