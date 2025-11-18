// screens/ManageSubscriptionScreen.js - GESTION ABONNEMENT
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../config/firebase';
import { SUBSCRIPTION_PLANS, subscriptionService } from '../utils/subscriptionService';

export default function ManageSubscriptionScreen({ navigation, route }) {
  const startupId = route.params?.startupId || auth.currentUser?.uid;
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const [subResult, statsResult] = await Promise.all([
        subscriptionService.getSubscription(startupId),
        subscriptionService.getSubscriptionStats(startupId),
      ]);

      if (subResult.success) {
        setSubscription(subResult.subscription);
      }

      if (statsResult.success) {
        setStats(statsResult.stats);
      }
    } catch (error) {
      console.error('Erreur chargement abonnement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRenewSubscription = async () => {
    const price = subscription.currentPrice || subscription.selectedPrice;
    Alert.alert(
      'Renouveler l\'abonnement',
      `Montant : ${price.toLocaleString()} FCFA\n\nProcéder au paiement Mobile Money ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Payer',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await subscriptionService.paySubscription(subscription.id);

              if (!result.success) {
                throw new Error(result.error);
              }

              // Afficher instructions Mobile Money
              Alert.alert(
                '💳 Paiement Mobile Money',
                `Composez :\n\n#150*50*VOTRE_NUMERO*${result.amount}#\n\nMontant : ${result.amount.toLocaleString()} FCFA\n\nAprès paiement, confirmez ci-dessous.`,
                [
                  {
                    text: 'J\'ai payé',
                    onPress: async () => {
                      await subscriptionService.confirmSubscriptionPayment(result.paymentId);
                      Alert.alert('✅ Succès', 'Abonnement renouvelé !');
                      loadSubscription();
                    },
                  },
                  { text: 'Annuler', style: 'cancel' },
                ]
              );
            } catch (error) {
              Alert.alert('Erreur', error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Annuler l\'abonnement',
      'Êtes-vous sûr de vouloir annuler votre abonnement ? Vous perdrez l\'accès aux fonctionnalités premium à la fin de la période.',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await subscriptionService.cancelSubscription(subscription.id);

              if (!result.success) {
                throw new Error(result.error);
              }

              Alert.alert('✅ Abonnement annulé', 'Vous conservez l\'accès jusqu\'à la fin de la période.');
              loadSubscription();
            } catch (error) {
              Alert.alert('Erreur', error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleChangePlan = () => {
    navigation.navigate('Subscription', { startupId, changePlan: true });
  };

  const handlePayNow = async () => {
    Alert.alert(
      '💳 Payer maintenant',
      `Plan choisi: ${subscription.selectedPlanName}\nMontant: ${subscription.selectedPrice?.toLocaleString()} F/mois\n\nEn payant maintenant, vous conservez vos fonctionnalités PREMIUM actuelles et votre abonnement sera activé immédiatement.\n\nProcéder au paiement Mobile Money ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Payer',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await subscriptionService.createPaymentRequest(subscription.id);

              if (!result.success) {
                throw new Error(result.error);
              }

              // Afficher instructions Mobile Money
              Alert.alert(
                '💳 Instructions de paiement',
                `Montant : ${result.amount.toLocaleString()} FCFA\n\nMoyens de paiement:\n\n1. Mobile Money:\n   - Orange Money\n   - MTN Mobile Money\n   - Moov Money\n\n2. Virement bancaire:\n   Compte PipoMarket\n\nAprès paiement, envoyez une capture d'écran de votre preuve de paiement à notre WhatsApp:\n+237 XXX XXX XXX\n\nVotre abonnement sera activé dans les 24h après vérification.`,
                [
                  {
                    text: 'OK, compris',
                    onPress: () => {
                      Alert.alert(
                        '✅ Demande enregistrée',
                        'Votre demande de paiement a été enregistrée. Envoyez votre preuve de paiement sur WhatsApp pour activation rapide.'
                      );
                      loadSubscription();
                    },
                  },
                ]
              );
            } catch (error) {
              Alert.alert('Erreur', error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'trial':
        return '#34C759';
      case 'active':
        return '#007AFF';
      case 'pending_payment':
        return '#FF9500';
      case 'suspended':
        return '#FF3B30';
      case 'expired':
        return '#FF3B30';
      case 'cancelled':
        return '#8E8E93';
      default:
        return '#8E8E93';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'trial':
        return '🎁 Période d\'essai';
      case 'active':
        return '✅ Actif';
      case 'pending_payment':
        return '⏳ Paiement en attente';
      case 'suspended':
        return '🔴 Suspendu';
      case 'expired':
        return '❌ Expiré';
      case 'cancelled':
        return '⚠️ Annulé';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!subscription) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Abonnement</Text>
        </View>

        <View style={styles.noSubscription}>
          <Text style={styles.noSubscriptionIcon}>📦</Text>
          <Text style={styles.noSubscriptionTitle}>Aucun abonnement</Text>
          <Text style={styles.noSubscriptionText}>
            Choisissez un plan pour accéder aux fonctionnalités premium
          </Text>
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={() => navigation.navigate('Subscription', { startupId })}
          >
            <Text style={styles.subscribeButtonText}>Choisir un plan</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const plan = SUBSCRIPTION_PLANS[subscription.currentPlanId?.toUpperCase()] || SUBSCRIPTION_PLANS.STARTER;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon abonnement</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Carte Plan */}
        <View style={[styles.planCard, { borderColor: plan.color }]}>
          <View style={styles.planHeader}>
            <View>
              <Text style={styles.planName}>{subscription.currentPlanName}</Text>
              <Text style={[styles.planBadge, { color: plan.color }]}>
                {plan.features.badge}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(subscription.status) },
              ]}
            >
              <Text style={styles.statusText}>
                {getStatusLabel(subscription.status)}
              </Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Prix actuel</Text>
            <Text style={styles.priceValue}>
              {subscription.currentPrice === 0 ? 'GRATUIT' : `${subscription.currentPrice?.toLocaleString()} FCFA/mois`}
            </Text>
          </View>

          {subscription.status === 'trial' && subscription.selectedPrice > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Prix après essai</Text>
              <Text style={[styles.priceValue, { color: '#FF9500' }]}>
                {subscription.selectedPrice?.toLocaleString()} FCFA/mois
              </Text>
            </View>
          )}

          {stats && (
            <View style={styles.daysRow}>
              <Text style={styles.daysLabel}>
                {stats.isTrial ? 'Jours d\'essai restants' : 'Jours restants'}
              </Text>
              <Text style={styles.daysValue}>{stats.daysRemaining} jours</Text>
            </View>
          )}

          {stats && stats.nextBillingDate && (
            <View style={styles.billingRow}>
              <Text style={styles.billingLabel}>Prochain paiement</Text>
              <Text style={styles.billingValue}>
                {stats.nextBillingDate.toLocaleDateString('fr-FR')}
              </Text>
            </View>
          )}
        </View>

        {/* Statistiques d'utilisation */}
        {stats && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>📊 Utilisation</Text>

            <View style={styles.statItem}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>Produits</Text>
                <Text style={styles.statNumbers}>
                  {stats.productsUsed} / {stats.productsMax === 999999 ? '∞' : stats.productsMax}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(stats.productsPercentage, 100)}%`,
                      backgroundColor:
                        stats.productsPercentage > 80 ? '#FF3B30' : '#34C759',
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>Commandes ce mois</Text>
                <Text style={styles.statNumbers}>
                  {stats.ordersUsed} / {stats.ordersMax === 999999 ? '∞' : stats.ordersMax}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(stats.ordersPercentage, 100)}%`,
                      backgroundColor:
                        stats.ordersPercentage > 80 ? '#FF3B30' : '#34C759',
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsCard}>
          {subscription.status === 'active' && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleChangePlan}
              >
                <Text style={styles.actionButtonIcon}>🔄</Text>
                <Text style={styles.actionButtonText}>Changer de plan</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonDanger]}
                onPress={handleCancelSubscription}
              >
                <Text style={styles.actionButtonIcon}>❌</Text>
                <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
                  Annuler l'abonnement
                </Text>
              </TouchableOpacity>
            </>
          )}

          {subscription.status === 'trial' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonPrimary]}
                onPress={handlePayNow}
              >
                <Text style={styles.actionButtonIcon}>💳</Text>
                <Text style={[styles.actionButtonText, { color: 'white' }]}>
                  Payer maintenant ({subscription.selectedPrice?.toLocaleString()} F)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleChangePlan}
              >
                <Text style={styles.actionButtonIcon}>⬆️</Text>
                <Text style={styles.actionButtonText}>Changer de plan</Text>
              </TouchableOpacity>
            </>
          )}

          {subscription.status === 'pending_payment' && (
            <>
              <View style={styles.warningBox}>
                <Text style={styles.warningIcon}>⏳</Text>
                <View style={styles.warningContent}>
                  <Text style={styles.warningTitle}>Paiement en attente</Text>
                  <Text style={styles.warningText}>
                    Votre demande de paiement a été enregistrée. Envoyez votre preuve de paiement sur WhatsApp pour activation rapide.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonPrimary]}
                onPress={handlePayNow}
              >
                <Text style={styles.actionButtonIcon}>💳</Text>
                <Text style={[styles.actionButtonText, { color: 'white' }]}>
                  Payer maintenant
                </Text>
              </TouchableOpacity>
            </>
          )}

          {(subscription.status === 'expired' || subscription.status === 'cancelled' || subscription.status === 'suspended') && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={handleRenewSubscription}
            >
              <Text style={styles.actionButtonIcon}>🔄</Text>
              <Text style={[styles.actionButtonText, { color: 'white' }]}>
                Renouveler l'abonnement
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Fonctionnalités */}
        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>✨ Vos fonctionnalités</Text>
          {renderFeature('📦', `${plan.features.maxProducts === 999999 ? 'Produits illimités' : `${plan.features.maxProducts} produits max`}`)}
          {renderFeature('📋', `${plan.features.maxOrders === 999999 ? 'Commandes illimitées' : `${plan.features.maxOrders} commandes/mois`}`)}
          {renderFeature('🎟️', plan.features.promoCodes > 0 ? `${plan.features.promoCodes === 999999 ? 'Codes promo illimités' : `${plan.features.promoCodes} codes promo`}` : 'Pas de codes promo')}
          {plan.features.featured && renderFeature('⭐', 'Mise en avant')}
          {renderFeature('📊', `Analytics ${plan.features.analytics}`)}
          {renderFeature('💰', `Commission ${plan.features.commission}%`)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function renderFeature(icon, text) {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E93',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButtonText: {
    fontSize: 28,
    color: '#007AFF',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  noSubscription: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noSubscriptionIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  noSubscriptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  noSubscriptionText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  subscribeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  planBadge: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 15,
    color: '#8E8E93',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  daysLabel: {
    fontSize: 15,
    color: '#8E8E93',
  },
  daysValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#34C759',
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  billingLabel: {
    fontSize: 15,
    color: '#8E8E93',
  },
  billingValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  statItem: {
    marginBottom: 16,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#000',
  },
  statNumbers: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  actionsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9500',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  actionButtonPrimary: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0,
  },
  actionButtonDanger: {
    borderBottomWidth: 0,
  },
  actionButtonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  actionButtonText: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
  actionButtonTextDanger: {
    color: '#FF3B30',
  },
  featuresCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#000',
  },
});
