import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BOOST_TYPES, PAYMENT_NUMBERS, requestBoost } from '../utils/boostService';
import { auth } from '../config/firebase';

const BoostProductScreen = ({ route, navigation }) => {
  const { product, startupId } = route.params;
  const [selectedBoost, setSelectedBoost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [requestResult, setRequestResult] = useState(null);

  const handleRequestBoost = async () => {
    if (!selectedBoost) {
      Alert.alert('Erreur', 'Veuillez sélectionner un type de boost');
      return;
    }

    setLoading(true);
    try {
      const boostKey = Object.keys(BOOST_TYPES).find(
        key => BOOST_TYPES[key].id === selectedBoost.id
      );

      const result = await requestBoost(
        product.id,
        boostKey,
        startupId || product.startupId || auth.currentUser?.uid
      );

      setRequestResult(result);
      setShowPaymentModal(true);
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowPaymentModal(false);
    Alert.alert(
      'Demande enregistrée',
      'Votre demande de boost est en attente. Une fois le paiement reçu, votre boost sera activé.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const renderBoostOption = (boostKey) => {
    const boost = BOOST_TYPES[boostKey];
    const isSelected = selectedBoost?.id === boost.id;

    return (
      <TouchableOpacity
        key={boost.id}
        style={[styles.boostCard, isSelected && styles.boostCardSelected]}
        onPress={() => setSelectedBoost(boost)}
        activeOpacity={0.8}
      >
        <View style={styles.boostHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.boostName}>{boost.name}</Text>
            <Text style={styles.boostDescription}>{boost.description}</Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{boost.price.toLocaleString()}</Text>
            <Text style={styles.currency}>FCFA</Text>
          </View>
        </View>

        {boost.savings && (
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>
              💰 Économisez {boost.savings.toLocaleString()} FCFA
            </Text>
          </View>
        )}

        <View style={styles.featuresContainer}>
          {boost.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {isSelected && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedText}>✓ Sélectionné</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={['#FF9500', '#FF6B00']} style={styles.header}>
          <Text style={styles.title}>🚀 Booster votre produit</Text>
          <Text style={styles.subtitle}>"{product.name}"</Text>
        </LinearGradient>

        {/* Avantages */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>📈 Pourquoi booster ?</Text>
          <View style={styles.benefitCard}>
            <Text style={styles.benefitEmoji}>🎯</Text>
            <View style={styles.benefitTextContainer}>
              <Text style={styles.benefitTitle}>Apparaissez en premier</Text>
              <Text style={styles.benefitDesc}>Dans les résultats de recherche</Text>
            </View>
          </View>
          <View style={styles.benefitCard}>
            <Text style={styles.benefitEmoji}>👀</Text>
            <View style={styles.benefitTextContainer}>
              <Text style={styles.benefitTitle}>10x plus de vues</Text>
              <Text style={styles.benefitDesc}>En moyenne sur vos produits</Text>
            </View>
          </View>
          <View style={styles.benefitCard}>
            <Text style={styles.benefitEmoji}>💰</Text>
            <View style={styles.benefitTextContainer}>
              <Text style={styles.benefitTitle}>3x plus de ventes</Text>
              <Text style={styles.benefitDesc}>Constatées par nos startups</Text>
            </View>
          </View>
        </View>

        {/* Options de Boost */}
        <View style={styles.boostsSection}>
          <Text style={styles.sectionTitle}>⚡ Choisissez votre boost</Text>
          {Object.keys(BOOST_TYPES).map(renderBoostOption)}
        </View>

        {/* Instructions */}
        <View style={styles.infoSection}>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>ℹ️ Comment ça marche ?</Text>
            <Text style={styles.infoStep}>1. Sélectionnez la durée de boost</Text>
            <Text style={styles.infoStep}>2. Cliquez sur "Demander le boost"</Text>
            <Text style={styles.infoStep}>3. Payez via Mobile Money au numéro indiqué</Text>
            <Text style={styles.infoStep}>4. Votre boost est activé après validation</Text>
          </View>
        </View>

        {/* Bouton */}
        <View style={styles.footerSection}>
          <TouchableOpacity
            style={[styles.purchaseButton, !selectedBoost && styles.purchaseButtonDisabled]}
            onPress={handleRequestBoost}
            disabled={!selectedBoost || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.purchaseButtonText}>
                  {selectedBoost
                    ? `Demander le boost - ${selectedBoost.price.toLocaleString()} FCFA`
                    : 'Sélectionnez un boost'}
                </Text>
                {selectedBoost && (
                  <Text style={styles.purchaseButtonSubtext}>
                    Paiement Mobile Money
                  </Text>
                )}
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de Paiement */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalEmoji}>💳</Text>
              <Text style={styles.modalTitle}>Paiement en attente</Text>
            </View>

            <Text style={styles.modalDescription}>
              Votre demande de boost a été enregistrée. Pour activer le boost, veuillez effectuer le paiement :
            </Text>

            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Montant à payer</Text>
              <Text style={styles.amountValue}>{selectedBoost?.price.toLocaleString()} FCFA</Text>
            </View>

            <View style={styles.paymentMethodsBox}>
              <Text style={styles.paymentMethodsTitle}>📱 Numéros de paiement Mobile Money</Text>

              <View style={styles.paymentMethod}>
                <View style={styles.paymentMethodIcon}>
                  <Text style={styles.paymentMethodEmoji}>🟠</Text>
                </View>
                <View style={styles.paymentMethodInfo}>
                  <Text style={styles.paymentMethodName}>Orange Money</Text>
                  <Text style={styles.paymentMethodNumber}>{PAYMENT_NUMBERS.orange}</Text>
                </View>
              </View>

              <View style={styles.paymentMethod}>
                <View style={styles.paymentMethodIcon}>
                  <Text style={styles.paymentMethodEmoji}>🟡</Text>
                </View>
                <View style={styles.paymentMethodInfo}>
                  <Text style={styles.paymentMethodName}>MTN Mobile Money</Text>
                  <Text style={styles.paymentMethodNumber}>{PAYMENT_NUMBERS.mtn}</Text>
                </View>
              </View>
            </View>

            <View style={styles.referenceBox}>
              <Text style={styles.referenceLabel}>Référence à mentionner :</Text>
              <Text style={styles.referenceValue}>BOOST-{requestResult?.requestId?.slice(0, 8).toUpperCase()}</Text>
            </View>

            <Text style={styles.modalNote}>
              ⏳ Votre boost sera activé dès que nous aurons confirmé la réception du paiement (généralement sous 24h).
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleCloseModal}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>J'ai compris</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollView: { flex: 1 },

  header: {
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 8 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)' },

  benefitsSection: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 16 },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  benefitEmoji: { fontSize: 32, marginRight: 16 },
  benefitTextContainer: { flex: 1 },
  benefitTitle: { fontSize: 16, fontWeight: 'bold', color: '#2e7d32', marginBottom: 2 },
  benefitDesc: { fontSize: 13, color: '#388e3c' },

  boostsSection: { padding: 20, paddingTop: 0 },
  boostCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  boostCardSelected: { borderColor: '#FF9500', backgroundColor: '#fff8f0' },
  boostHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  boostName: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 4 },
  boostDescription: { fontSize: 13, color: '#7f8c8d' },
  priceContainer: { alignItems: 'flex-end' },
  price: { fontSize: 28, fontWeight: 'bold', color: '#FF9500' },
  currency: { fontSize: 12, color: '#7f8c8d' },
  savingsBadge: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  savingsText: { fontSize: 13, color: '#856404', fontWeight: '600' },
  featuresContainer: { marginTop: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  checkmark: { fontSize: 16, color: '#27ae60', marginRight: 10, fontWeight: 'bold' },
  featureText: { fontSize: 14, color: '#34495e', flex: 1 },
  selectedBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-end',
    marginTop: 12,
  },
  selectedText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  infoSection: { padding: 20, paddingTop: 0 },
  infoBox: { backgroundColor: '#e3f2fd', padding: 20, borderRadius: 16 },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: '#1976d2', marginBottom: 12 },
  infoStep: { fontSize: 14, color: '#0d47a1', marginBottom: 8, paddingLeft: 8 },

  footerSection: { padding: 20 },
  purchaseButton: {
    backgroundColor: '#FF9500',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  purchaseButtonDisabled: { backgroundColor: '#bdc3c7', shadowOpacity: 0 },
  purchaseButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  purchaseButtonSubtext: { color: '#fff', fontSize: 12, marginTop: 4, opacity: 0.9 },
  cancelButton: { paddingVertical: 16, alignItems: 'center' },
  cancelButtonText: { color: '#7f8c8d', fontSize: 16 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: { alignItems: 'center', marginBottom: 16 },
  modalEmoji: { fontSize: 48, marginBottom: 8 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50' },
  modalDescription: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 20 },

  amountBox: {
    backgroundColor: '#FF9500',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  amountLabel: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 4 },
  amountValue: { fontSize: 32, fontWeight: 'bold', color: 'white' },

  paymentMethodsBox: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  paymentMethodsTitle: { fontSize: 14, fontWeight: 'bold', color: '#2c3e50', marginBottom: 12 },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  paymentMethodIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  paymentMethodEmoji: { fontSize: 20 },
  paymentMethodInfo: { flex: 1 },
  paymentMethodName: { fontSize: 14, fontWeight: '600', color: '#2c3e50', marginBottom: 2 },
  paymentMethodNumber: { fontSize: 18, fontWeight: 'bold', color: '#FF9500' },

  referenceBox: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  referenceLabel: { fontSize: 12, color: '#856404', marginBottom: 4 },
  referenceValue: { fontSize: 18, fontWeight: 'bold', color: '#856404' },

  modalNote: { fontSize: 12, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 18 },

  modalButton: {
    backgroundColor: '#FF9500',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default BoostProductScreen;
