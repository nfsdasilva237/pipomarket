// screens/BDLPackageOrderScreen.js - Commande d'un package BDL Studio
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../config/firebase';
import bdlOrderService from '../utils/bdlOrderService';

export default function BDLPackageOrderScreen({ route, navigation }) {
  const { service, package: pkg } = route.params;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [details, setDetails] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitOrder = async () => {
    // Validation
    if (!name || !phone) {
      Alert.alert('Champs requis', 'Veuillez remplir au moins votre nom et téléphone.');
      return;
    }

    if (paymentMethod === 'mobile_money' && !paymentPhone) {
      Alert.alert('Téléphone requis', 'Veuillez entrer le numéro Mobile Money pour le paiement.');
      return;
    }

    if (!auth.currentUser) {
      Alert.alert('Connexion requise', 'Vous devez être connecté pour passer commande.');
      navigation.navigate('Login');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        serviceId: service.id,
        serviceName: service.name,
        serviceIcon: service.icon,
        packageId: pkg.id,
        packageName: pkg.name,
        packagePrice: pkg.price,
        packageFeatures: pkg.features,
        projectDetails: details,
        paymentMethod: paymentMethod,
        paymentPhone: paymentMethod === 'mobile_money' ? paymentPhone : '',
      };

      const result = await bdlOrderService.createOrder(orderData);

      if (result.success) {
        // Naviguer vers l'écran de confirmation
        navigation.replace('BDLOrderSuccess', {
          orderId: result.orderId,
          order: result.order
        });
      }
    } catch (error) {
      console.error('Erreur commande:', error);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de la création de votre commande. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <LinearGradient
          colors={['#275471', '#f4a04b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <Text style={styles.heroIcon}>{service.icon}</Text>
          <Text style={styles.heroTitle}>Commander</Text>
          <Text style={styles.heroSubtitle}>{pkg.name}</Text>
        </LinearGradient>

        {/* RÉSUMÉ COMMANDE */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>📋 Résumé de votre commande</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service</Text>
              <Text style={styles.summaryValue}>{service.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Package</Text>
              <Text style={styles.summaryValue}>{pkg.name}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryRowTotal]}>
              <Text style={styles.summaryLabelTotal}>Total</Text>
              <Text style={styles.summaryValueTotal}>
                {pkg.price.toLocaleString('fr-FR')} XAF
              </Text>
            </View>
          </View>

          {/* FEATURES */}
          <View style={styles.featuresCard}>
            <Text style={styles.featuresTitle}>✨ Inclus dans ce package :</Text>
            {pkg.features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* FORMULAIRE */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>👤 Vos informations</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom complet *</Text>
            <TextInput
              style={styles.input}
              placeholder="Votre nom"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="votre.email@exemple.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Téléphone *</Text>
            <TextInput
              style={styles.input}
              placeholder="6XXXXXXXX"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Détails de votre projet (optionnel)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Décrivez brièvement votre projet, vos besoins spécifiques, délais souhaités..."
              value={details}
              onChangeText={setDetails}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              placeholderTextColor="#999"
            />
          </View>

          {/* MÉTHODE DE PAIEMENT */}
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>💳 Méthode de paiement</Text>

            <TouchableOpacity
              style={[
                styles.paymentMethod,
                paymentMethod === 'mobile_money' && styles.paymentMethodActive
              ]}
              onPress={() => setPaymentMethod('mobile_money')}
            >
              <View style={styles.paymentMethodLeft}>
                <View style={[
                  styles.radio,
                  paymentMethod === 'mobile_money' && styles.radioActive
                ]}>
                  {paymentMethod === 'mobile_money' && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.paymentMethodText}>📱 Mobile Money</Text>
              </View>
              <Text style={styles.paymentMethodSubtext}>Orange Money, MTN MoMo</Text>
            </TouchableOpacity>

            {paymentMethod === 'mobile_money' && (
              <View style={styles.mobileMoneyInput}>
                <Text style={styles.label}>Numéro Mobile Money *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="6XXXXXXXX"
                  value={paymentPhone}
                  onChangeText={setPaymentPhone}
                  keyboardType="phone-pad"
                  placeholderTextColor="#999"
                />
                <Text style={styles.helperText}>
                  💡 Vous recevrez une notification de paiement sur ce numéro
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.paymentMethod,
                paymentMethod === 'cash' && styles.paymentMethodActive
              ]}
              onPress={() => setPaymentMethod('cash')}
            >
              <View style={styles.paymentMethodLeft}>
                <View style={[
                  styles.radio,
                  paymentMethod === 'cash' && styles.radioActive
                ]}>
                  {paymentMethod === 'cash' && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.paymentMethodText}>💵 Paiement à la livraison</Text>
              </View>
              <Text style={styles.paymentMethodSubtext}>Espèces lors du projet</Text>
            </TouchableOpacity>
          </View>

          {/* BOUTON COMMANDER */}
          <TouchableOpacity
            style={[styles.orderButton, loading && styles.orderButtonDisabled]}
            onPress={handleSubmitOrder}
            activeOpacity={0.8}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ['#ccc', '#999'] : ['#275471', '#f4a04b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.orderGradient}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="white" />
                  <Text style={styles.orderText}>Traitement...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.orderIcon}>🛒</Text>
                  <Text style={styles.orderText}>Confirmer la commande</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.infoText}>
            🔒 Paiement sécurisé • Vos données sont protégées
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },

  // HERO
  hero: {
    padding: 32,
    paddingTop: 48,
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  heroIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
    textAlign: 'center',
  },

  // SUMMARY
  summarySection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryRowTotal: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: '#275471',
    marginTop: 8,
    paddingTop: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  summaryLabelTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryValueTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#275471',
  },

  // FEATURES
  featuresCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f4a04b',
  },
  featuresTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  featureCheck: {
    fontSize: 14,
    color: '#4CAF50',
    marginRight: 8,
    fontWeight: 'bold',
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },

  // FORM
  formSection: {
    padding: 20,
    paddingTop: 0,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
  },

  // PAYMENT
  paymentSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  paymentMethod: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  paymentMethodActive: {
    borderColor: '#275471',
    backgroundColor: '#F0F7FF',
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: '#275471',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#275471',
  },
  paymentMethodText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  paymentMethodSubtext: {
    fontSize: 12,
    color: '#666',
    marginLeft: 32,
  },
  mobileMoneyInput: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
  },

  // BUTTON
  orderButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#275471',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  orderButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  orderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  orderIcon: {
    fontSize: 20,
  },
  orderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});
