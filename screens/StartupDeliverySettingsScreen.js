// screens/StartupDeliverySettingsScreen.js - CONFIGURATION LIVRAISON STARTUP
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../config/firebase';

export default function StartupDeliverySettingsScreen({ navigation, route }) {
  const { startupId: paramStartupId } = route.params || {};
  const startupId = paramStartupId || auth.currentUser?.uid;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [startup, setStartup] = useState(null);

  // États des paramètres
  const [offersFreeDelivery, setOffersFreeDelivery] = useState(false);
  const [deliveryCost, setDeliveryCost] = useState('2000');
  const [freeDeliveryMinAmount, setFreeDeliveryMinAmount] = useState('0');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const startupDoc = await getDoc(doc(db, 'startups', startupId));
      
      if (!startupDoc.exists()) {
        Alert.alert('Erreur', 'Startup introuvable');
        navigation.goBack();
        return;
      }

      const data = startupDoc.data();
      setStartup({ id: startupDoc.id, ...data });

      // Charger les paramètres actuels
      setOffersFreeDelivery(data.offersFreeDelivery || false);
      setDeliveryCost(String(data.deliveryCost || 2000));
      setFreeDeliveryMinAmount(String(data.freeDeliveryMinAmount || 0));

    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
      Alert.alert('Erreur', 'Impossible de charger les paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    const cost = parseInt(deliveryCost) || 0;
    const minAmount = parseInt(freeDeliveryMinAmount) || 0;

    if (cost < 0) {
      Alert.alert('Erreur', 'Le coût de livraison doit être positif');
      return;
    }

    if (minAmount < 0) {
      Alert.alert('Erreur', 'Le montant minimum doit être positif');
      return;
    }

    setSaving(true);

    try {
      await updateDoc(doc(db, 'startups', startupId), {
        offersFreeDelivery,
        deliveryCost: cost,
        freeDeliveryMinAmount: minAmount,
        updatedAt: new Date(),
      });

      Alert.alert(
        '✅ Paramètres sauvegardés',
        'Vos paramètres de livraison ont été mis à jour',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les paramètres');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres de livraison</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* INFO */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            Configurez les options de livraison pour vos clients. Vous pouvez
            offrir la livraison gratuite ou définir un coût personnalisé.
          </Text>
        </View>

        {/* SECTION 1: LIVRAISON GRATUITE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎁 Livraison gratuite</Text>

          <View style={styles.switchCard}>
            <View style={styles.switchContent}>
              <Text style={styles.switchLabel}>Offrir la livraison gratuite</Text>
              <Text style={styles.switchDescription}>
                Activez cette option pour proposer la livraison gratuite à vos
                clients
              </Text>
            </View>
            <Switch
              value={offersFreeDelivery}
              onValueChange={setOffersFreeDelivery}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              thumbColor="white"
            />
          </View>

          {offersFreeDelivery && (
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxIcon}>✅</Text>
              <Text style={styles.infoBoxText}>
                Vos clients verront l'option "Livraison gratuite" lors du paiement
              </Text>
            </View>
          )}
        </View>

        {/* SECTION 2: COÛT STANDARD */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💵 Coût de livraison standard</Text>

          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>
              Prix de livraison (FCFA)
            </Text>
            <TextInput
              style={styles.input}
              value={deliveryCost}
              onChangeText={setDeliveryCost}
              keyboardType="numeric"
              placeholder="2000"
              placeholderTextColor="#C7C7CC"
            />
            <Text style={styles.inputHelper}>
              Montant que vos clients paieront pour la livraison standard
            </Text>
          </View>

          {!offersFreeDelivery && (
            <View style={styles.warningBox}>
              <Text style={styles.warningBoxIcon}>ℹ️</Text>
              <Text style={styles.warningBoxText}>
                Vos clients paieront {deliveryCost} FCFA pour la livraison
              </Text>
            </View>
          )}
        </View>

        {/* SECTION 3: LIVRAISON GRATUITE CONDITIONNELLE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Livraison gratuite conditionnelle</Text>

          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>
              Montant minimum pour livraison gratuite (FCFA)
            </Text>
            <TextInput
              style={styles.input}
              value={freeDeliveryMinAmount}
              onChangeText={setFreeDeliveryMinAmount}
              keyboardType="numeric"
              placeholder="10000"
              placeholderTextColor="#C7C7CC"
            />
            <Text style={styles.inputHelper}>
              Offrez la livraison gratuite si le panier dépasse ce montant.
              Mettez 0 pour désactiver.
            </Text>
          </View>

          {parseInt(freeDeliveryMinAmount) > 0 && (
            <View style={styles.successBox}>
              <Text style={styles.successBoxIcon}>🎁</Text>
              <Text style={styles.successBoxText}>
                Livraison gratuite si achat ≥{' '}
                {parseInt(freeDeliveryMinAmount).toLocaleString('fr-FR')} FCFA
              </Text>
            </View>
          )}
        </View>

        {/* RÉCAPITULATIF */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Récapitulatif</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Livraison gratuite :</Text>
              <Text style={styles.summaryValue}>
                {offersFreeDelivery ? '✅ Oui' : '❌ Non'}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Coût standard :</Text>
              <Text style={styles.summaryValue}>
                {parseInt(deliveryCost).toLocaleString('fr-FR')} FCFA
              </Text>
            </View>

            {parseInt(freeDeliveryMinAmount) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Gratuit si achat ≥ :</Text>
                <Text style={styles.summaryValue}>
                  {parseInt(freeDeliveryMinAmount).toLocaleString('fr-FR')} FCFA
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* EXEMPLES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Exemples</Text>

          <View style={styles.exampleCard}>
            <Text style={styles.exampleTitle}>Panier 5 000 FCFA :</Text>
            <Text style={styles.exampleText}>
              {offersFreeDelivery
                ? '→ Livraison gratuite'
                : parseInt(freeDeliveryMinAmount) > 0 &&
                  5000 >= parseInt(freeDeliveryMinAmount)
                ? '→ Livraison gratuite'
                : `→ Livraison ${deliveryCost} FCFA`}
            </Text>
          </View>

          <View style={styles.exampleCard}>
            <Text style={styles.exampleTitle}>Panier 15 000 FCFA :</Text>
            <Text style={styles.exampleText}>
              {offersFreeDelivery
                ? '→ Livraison gratuite'
                : parseInt(freeDeliveryMinAmount) > 0 &&
                  15000 >= parseInt(freeDeliveryMinAmount)
                ? '→ Livraison gratuite'
                : `→ Livraison ${deliveryCost} FCFA`}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* BOUTON SAUVEGARDER */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>💾 Sauvegarder</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#8E8E93',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    fontSize: 28,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  section: {
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  switchCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  switchContent: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  infoBoxIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    color: '#2E7D32',
  },
  inputCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  inputHelper: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
    lineHeight: 16,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  warningBoxIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  warningBoxText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  successBoxIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  successBoxText: {
    flex: 1,
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  exampleCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 13,
    color: '#007AFF',
  },
  footer: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
