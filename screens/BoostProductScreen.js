import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { BOOST_TYPES, purchaseBoost } from '../utils/boostService';

const BoostProductScreen = ({ route, navigation }) => {
  const { product } = route.params;
  const [selectedBoost, setSelectedBoost] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePurchaseBoost = async () => {
    if (!selectedBoost) {
      Alert.alert('Erreur', 'Veuillez sélectionner un type de boost');
      return;
    }

    Alert.alert(
      'Confirmer l\'achat',
      `Acheter ${selectedBoost.name} pour ${selectedBoost.price} FCFA ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await purchaseBoost(
                product.id,
                Object.keys(BOOST_TYPES).find(
                  key => BOOST_TYPES[key].id === selectedBoost.id
                )
              );

              Alert.alert(
                'Boost activé! 🎉',
                result.message,
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack()
                  }
                ]
              );
            } catch (error) {
              Alert.alert('Erreur', error.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
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
      >
        <View style={styles.boostHeader}>
          <View>
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Booster votre produit</Text>
        <Text style={styles.subtitle}>
          Augmentez la visibilité de "{product.name}"
        </Text>
      </View>

      <View style={styles.benefitsSection}>
        <Text style={styles.sectionTitle}>📈 Pourquoi booster ?</Text>
        <View style={styles.benefitCard}>
          <Text style={styles.benefitText}>
            🎯 <Text style={styles.bold}>Apparaissez en premier</Text> dans les résultats de recherche
          </Text>
        </View>
        <View style={styles.benefitCard}>
          <Text style={styles.benefitText}>
            👀 <Text style={styles.bold}>10x plus de vues</Text> en moyenne
          </Text>
        </View>
        <View style={styles.benefitCard}>
          <Text style={styles.benefitText}>
            💰 <Text style={styles.bold}>3x plus de ventes</Text> constatées
          </Text>
        </View>
      </View>

      <View style={styles.boostsSection}>
        <Text style={styles.sectionTitle}>Choisissez votre boost</Text>
        {Object.keys(BOOST_TYPES).map(renderBoostOption)}
      </View>

      <View style={styles.footerSection}>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ Comment ça marche ?</Text>
          <Text style={styles.infoText}>
            1. Sélectionnez la durée de boost
          </Text>
          <Text style={styles.infoText}>
            2. Payez via Mobile Money
          </Text>
          <Text style={styles.infoText}>
            3. Votre produit est mis en avant immédiatement
          </Text>
          <Text style={styles.infoText}>
            4. Suivez vos statistiques en temps réel
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.purchaseButton, !selectedBoost && styles.purchaseButtonDisabled]}
          onPress={handlePurchaseBoost}
          disabled={!selectedBoost || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.purchaseButtonText}>
                {selectedBoost
                  ? `Acheter pour ${selectedBoost.price.toLocaleString()} FCFA`
                  : 'Sélectionnez un boost'}
              </Text>
              {selectedBoost && (
                <Text style={styles.purchaseButtonSubtext}>
                  Paiement Mobile Money sécurisé
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d'
  },
  benefitsSection: {
    padding: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15
  },
  benefitCard: {
    backgroundColor: '#e8f5e9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10
  },
  benefitText: {
    fontSize: 14,
    color: '#2e7d32',
    lineHeight: 20
  },
  bold: {
    fontWeight: 'bold'
  },
  boostsSection: {
    padding: 20,
    paddingTop: 0
  },
  boostCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  boostCardSelected: {
    borderColor: '#e67e22',
    backgroundColor: '#fff8f0'
  },
  boostHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  boostName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5
  },
  boostDescription: {
    fontSize: 13,
    color: '#7f8c8d'
  },
  priceContainer: {
    alignItems: 'flex-end'
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e67e22'
  },
  currency: {
    fontSize: 12,
    color: '#7f8c8d'
  },
  savingsBadge: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 15
  },
  savingsText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '600'
  },
  featuresContainer: {
    marginTop: 10
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  checkmark: {
    fontSize: 16,
    color: '#27ae60',
    marginRight: 8,
    fontWeight: 'bold'
  },
  featureText: {
    fontSize: 14,
    color: '#34495e',
    flex: 1
  },
  selectedBadge: {
    backgroundColor: '#e67e22',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-end',
    marginTop: 10
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12
  },
  footerSection: {
    padding: 20
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 10
  },
  infoText: {
    fontSize: 13,
    color: '#0d47a1',
    marginBottom: 5,
    paddingLeft: 10
  },
  purchaseButton: {
    backgroundColor: '#e67e22',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4
  },
  purchaseButtonDisabled: {
    backgroundColor: '#bdc3c7',
    opacity: 0.6
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  purchaseButtonSubtext: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
    opacity: 0.9
  },
  cancelButton: {
    paddingVertical: 15,
    alignItems: 'center'
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontSize: 16
  }
});

export default BoostProductScreen;