// screens/SubscriptionScreen.js - CHOIX ABONNEMENT
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../config/firebase';
import { SUBSCRIPTION_PLANS, subscriptionService } from '../utils/subscriptionService';

export default function SubscriptionScreen({ navigation, route }) {
  const startupId = route.params?.startupId || auth.currentUser?.uid;
  const [selectedPlan, setSelectedPlan] = useState('PRO');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (planId) => {
  setLoading(true);

  try {
    // ✅ Vérifier que l'utilisateur est connecté
    if (!auth.currentUser || !startupId) {
      Alert.alert('Erreur', 'Vous devez être connecté');
      setLoading(false);
      return;
    }

    // Vérifier si abonnement existe
    const subResult = await subscriptionService.getSubscription(startupId);
    
    if (subResult.success) {
      // Abonnement existe → CHANGER DE PLAN
      const result = await subscriptionService.changePlan(
        subResult.subscription.id,
        planId
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      Alert.alert(
        '✅ Plan modifié !',
        `Votre plan a été changé vers ${SUBSCRIPTION_PLANS[planId.toUpperCase()].name}.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } else {
      // Pas d'abonnement → CRÉER NOUVEAU
      Alert.alert(
        'Confirmer l\'abonnement',
        `Voulez-vous souscrire au plan ${SUBSCRIPTION_PLANS[planId.toUpperCase()].name} ?\n\n🎁 1er mois GRATUIT !`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Confirmer',
            onPress: async () => {
              const result = await subscriptionService.createSubscription(
                startupId,
                planId
              );

              if (!result.success) {
                throw new Error(result.error);
              }

              Alert.alert(
                '🎉 Abonnement activé !',
                `Votre période d\'essai d\'1 mois commence maintenant.`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            },
          },
        ]
      );
    }
  } catch (error) {
    Alert.alert('Erreur', error.message);
  } finally {
    setLoading(false);
  }
};

  const renderPlanCard = (planKey) => {
    const plan = SUBSCRIPTION_PLANS[planKey];
    const isSelected = selectedPlan === planKey;
    const isPopular = plan.popular;

    return (
      <TouchableOpacity
        key={planKey}
        style={[
          styles.planCard,
          isSelected && styles.planCardSelected,
          { borderColor: plan.color },
        ]}
        onPress={() => setSelectedPlan(planKey)}
      >
        {isPopular && (
          <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
            <Text style={styles.popularText}>⭐ POPULAIRE</Text>
          </View>
        )}

        <View style={styles.planHeader}>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={[styles.planBadge, { color: plan.color }]}>
            {plan.features.badge}
          </Text>
        </View>

        <Text style={styles.planDescription}>{plan.description}</Text>

        <View style={styles.priceContainer}>
          <Text style={styles.priceAmount}>
            {plan.price.toLocaleString()} F
          </Text>
          <Text style={styles.priceLabel}>/mois</Text>
        </View>

        <View style={styles.trialBadge}>
          <Text style={styles.trialText}>🎁 1er mois GRATUIT</Text>
        </View>

        <View style={styles.featuresContainer}>
          <Feature
            icon="📦"
            text={
              plan.features.maxProducts === 999999
                ? 'Produits illimités'
                : `${plan.features.maxProducts} produits max`
            }
          />
          <Feature
            icon="📋"
            text={
              plan.features.maxOrders === 999999
                ? 'Commandes illimitées'
                : `${plan.features.maxOrders} commandes/mois`
            }
          />
          <Feature
            icon="📷"
            text={`${plan.features.photosPerProduct} photos/produit`}
          />
          
          {plan.features.promoCodes > 0 && (
            <Feature
              icon="🎟️"
              text={
                plan.features.promoCodes === 999999
                  ? 'Codes promo illimités'
                  : `${plan.features.promoCodes} codes promo`
              }
            />
          )}

          {plan.features.featured && (
            <Feature
              icon="⭐"
              text={
                plan.features.featuredFrequency === 'top3'
                  ? 'TOP 3 permanent'
                  : 'Mise en avant 2x/semaine'
              }
            />
          )}

          <Feature
            icon="📊"
            text={
              plan.features.analytics === 'ai'
                ? 'Analytics IA + prédictions'
                : plan.features.analytics === 'advanced'
                ? 'Analytics avancées'
                : 'Statistiques de base'
            }
          />

          <Feature icon="💬" text={`Support ${plan.features.support}`} />

          <Feature icon="💰" text={`Commission ${plan.features.commission}%`} />

          {plan.features.customization && (
            <Feature icon="🎨" text="Personnalisation page" />
          )}

          {plan.features.socialMedia && (
            <Feature icon="📱" text="Featured réseaux sociaux" />
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.selectButton,
            isSelected && { backgroundColor: plan.color },
          ]}
          onPress={() => handleSubscribe(planKey)}
          disabled={loading}
        >
          <Text style={styles.selectButtonText}>
            {loading ? 'Chargement...' : 'Choisir ce plan'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choisir un abonnement</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>
            🚀 Boostez votre startup avec un abonnement !
          </Text>
          <Text style={styles.introText}>
            Profitez d'1 mois GRATUIT pour tester toutes les fonctionnalités
          </Text>
        </View>

        {renderPlanCard('STARTER')}
        {renderPlanCard('PRO')}
        {renderPlanCard('PREMIUM')}

        <View style={styles.guaranteeSection}>
          <Text style={styles.guaranteeTitle}>✅ Garanties</Text>
          <Text style={styles.guaranteeText}>
            • Annulation à tout moment{'\n'}
            • Sans engagement{'\n'}
            • Support client réactif{'\n'}
            • Paiement sécurisé Mobile Money
          </Text>
        </View>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Activation en cours...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function Feature({ icon, text }) {
  return (
    <View style={styles.feature}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 28,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  introSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  introText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    position: 'relative',
  },
  planCardSelected: {
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  planBadge: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  planDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  priceLabel: {
    fontSize: 16,
    color: '#8E8E93',
    marginLeft: 4,
  },
  trialBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  trialText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  featuresContainer: {
    marginBottom: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  selectButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  guaranteeSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginTop: 8,
  },
  guaranteeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  guaranteeText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 12,
  },
});