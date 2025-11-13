// screens/LoyaltyScreen.js
// Écran de gestion des points de fidélité

import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
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
import { auth, db } from '../config/firebase';
import {
  getUserLevel,
  getLevelProgress,
  loyaltyConfig,
} from '../config/loyaltyConfig';

export default function LoyaltyScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [userPoints, setUserPoints] = useState(0);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [activeRewards, setActiveRewards] = useState([]);

  useEffect(() => {
    loadLoyaltyData();
  }, []);

  const loadLoyaltyData = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        navigation.replace('Login');
        return;
      }

      // Charger les points de l'utilisateur
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      setUserPoints(userData?.loyaltyPoints || 0);

      // Charger l'historique des points
      const historyQuery = query(
        collection(db, 'pointsHistory'),
        where('userId', '==', userId)
      );
      const historySnapshot = await getDocs(historyQuery);
      const history = [];
      historySnapshot.forEach((doc) => {
        history.push({ id: doc.id, ...doc.data() });
      });
      // Trier par date décroissante
      history.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
      setPointsHistory(history);

      // Charger les récompenses actives
      const rewardsQuery = query(
        collection(db, 'userRewards'),
        where('userId', '==', userId),
        where('used', '==', false)
      );
      const rewardsSnapshot = await getDocs(rewardsQuery);
      const rewards = [];
      rewardsSnapshot.forEach((doc) => {
        rewards.push({ id: doc.id, ...doc.data() });
      });
      setActiveRewards(rewards);
    } catch (error) {
      console.error('Erreur chargement fidélité:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemReward = async (reward) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      // Vérifier que l'utilisateur a assez de points
      if (userPoints < reward.pointsCost) {
        Alert.alert('Points insuffisants', 'Vous n\'avez pas assez de points pour cette récompense.');
        return;
      }

      Alert.alert(
        'Échanger des points',
        `Voulez-vous échanger ${reward.pointsCost} points contre "${reward.name}" ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Confirmer',
            onPress: async () => {
              try {
                // Déduire les points
                const userRef = doc(db, 'users', userId);
                const newPoints = userPoints - reward.pointsCost;
                await updateDoc(userRef, {
                  loyaltyPoints: newPoints
                });

                // Créer la récompense dans userRewards
                await addDoc(collection(db, 'userRewards'), {
                  userId,
                  rewardId: reward.id,
                  rewardName: reward.name,
                  rewardType: reward.type,
                  rewardValue: reward.value,
                  pointsSpent: reward.pointsCost,
                  used: false,
                  redeemedAt: serverTimestamp(),
                });

                // Ajouter dans l'historique
                await addDoc(collection(db, 'pointsHistory'), {
                  userId,
                  points: -reward.pointsCost,
                  type: 'redeemed',
                  description: `Échange: ${reward.name}`,
                  createdAt: serverTimestamp(),
                });

                Alert.alert('Succès !', `Vous avez échangé ${reward.pointsCost} points contre "${reward.name}". La récompense est disponible dans vos récompenses actives.`);

                // Recharger les données
                loadLoyaltyData();
              } catch (error) {
                console.error('Erreur échange récompense:', error);
                Alert.alert('Erreur', 'Impossible d\'échanger la récompense. Réessayez.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur échange:', error);
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

  const currentLevel = getUserLevel(userPoints);
  const levelProgress = getLevelProgress(userPoints);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Programme de Fidélité</Text>
          <View style={styles.placeholder} />
        </View>

        {/* CARTE POINTS */}
        <View style={[styles.pointsCard, { backgroundColor: currentLevel.color }]}>
          <View style={styles.pointsCardHeader}>
            <View>
              <Text style={styles.pointsCardLevel}>
                {currentLevel.icon} Niveau {currentLevel.name}
              </Text>
              <Text style={styles.pointsCardTitle}>Vos Points</Text>
            </View>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsBadgeText}>{userPoints}</Text>
            </View>
          </View>

          {/* PROGRESSION */}
          {!levelProgress.isMaxLevel && (
            <View style={styles.progressSection}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressText}>
                  Prochain niveau: {levelProgress.nextLevel?.icon}{' '}
                  {levelProgress.nextLevel?.name}
                </Text>
                <Text style={styles.progressText}>
                  {levelProgress.pointsToNext} points restants
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${levelProgress.progress}%` },
                  ]}
                />
              </View>
            </View>
          )}

          {/* AVANTAGES DU NIVEAU */}
          <View style={styles.benefitsSection}>
            <Text style={styles.benefitsTitle}>Vos avantages :</Text>
            {currentLevel.benefits.map((benefit, index) => (
              <Text key={index} style={styles.benefitItem}>
                ✓ {benefit}
              </Text>
            ))}
          </View>
        </View>

        {/* RÉCOMPENSES ACTIVES */}
        {activeRewards.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎁 Mes Récompenses Actives</Text>
            {activeRewards.map((reward) => (
              <View key={reward.id} style={styles.activeRewardCard}>
                <Text style={styles.activeRewardIcon}>{reward.icon}</Text>
                <View style={styles.activeRewardInfo}>
                  <Text style={styles.activeRewardName}>{reward.name}</Text>
                  <Text style={styles.activeRewardExpiry}>
                    Expire: {reward.expiresAt?.toDate().toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity style={styles.useRewardButton}>
                  <Text style={styles.useRewardButtonText}>Utiliser</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* RÉCOMPENSES DISPONIBLES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Récompenses Disponibles</Text>
          <Text style={styles.sectionSubtitle}>
            Échangez vos points contre des avantages
          </Text>

          {loyaltyConfig.rewards.map((reward) => {
            const canRedeem = userPoints >= reward.pointsCost;
            return (
              <View
                key={reward.id}
                style={[
                  styles.rewardCard,
                  !canRedeem && styles.rewardCardDisabled,
                ]}
              >
                <Text style={styles.rewardIcon}>{reward.icon}</Text>
                <View style={styles.rewardInfo}>
                  <Text
                    style={[
                      styles.rewardName,
                      !canRedeem && styles.rewardTextDisabled,
                    ]}
                  >
                    {reward.name}
                  </Text>
                  <Text
                    style={[
                      styles.rewardDescription,
                      !canRedeem && styles.rewardTextDisabled,
                    ]}
                  >
                    {reward.description}
                  </Text>
                  <Text style={styles.rewardCost}>
                    💰 {reward.pointsCost} points
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.redeemButton,
                    !canRedeem && styles.redeemButtonDisabled,
                  ]}
                  disabled={!canRedeem}
                  onPress={() => handleRedeemReward(reward)}
                >
                  <Text
                    style={[
                      styles.redeemButtonText,
                      !canRedeem && styles.redeemButtonTextDisabled,
                    ]}
                  >
                    {canRedeem ? 'Échanger' : 'Bloqué'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* HISTORIQUE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Historique des Points</Text>

          {pointsHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📋</Text>
              <Text style={styles.emptyStateText}>
                Aucun historique pour le moment
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Effectuez des achats pour gagner des points !
              </Text>
            </View>
          ) : (
            pointsHistory.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <View style={styles.historyIcon}>
                  <Text style={styles.historyIconText}>
                    {item.type === 'earned' ? '➕' : '➖'}
                  </Text>
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle}>{item.description}</Text>
                  <Text style={styles.historyDate}>
                    {item.createdAt?.toDate().toLocaleDateString()}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.historyPoints,
                    item.type === 'earned' && styles.historyPointsPositive,
                  ]}
                >
                  {item.type === 'earned' ? '+' : '-'}
                  {item.points}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* COMMENT ÇA MARCHE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>❓ Comment ça marche ?</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Gagner des points</Text>
            <Text style={styles.infoText}>
              • 1 point = 100 FCFA dépensés{'\n'}
              • Bonus selon votre niveau{'\n'}
              • Points crédités après chaque achat
            </Text>

            <Text style={styles.infoTitle}>Les niveaux</Text>
            {loyaltyConfig.levels.map((level) => (
              <Text key={level.name} style={styles.infoText}>
                {level.icon} {level.name}: {level.minPoints}
                {level.maxPoints !== Infinity && `-${level.maxPoints}`} points
                (+{level.bonus}% bonus)
              </Text>
            ))}

            <Text style={styles.infoTitle}>Utiliser vos points</Text>
            <Text style={styles.infoText}>
              • Échangez contre des récompenses{'\n'}
              • Appliquez au moment du paiement{'\n'}
              • Les récompenses expirent après 90 jours
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  pointsCard: {
    margin: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  pointsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pointsCardLevel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  pointsCardTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  pointsBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pointsBadgeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  progressSection: {
    marginBottom: 20,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  benefitsSection: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 16,
    borderRadius: 12,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  benefitItem: {
    fontSize: 13,
    color: 'white',
    marginBottom: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  activeRewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeRewardIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  activeRewardInfo: {
    flex: 1,
  },
  activeRewardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  activeRewardExpiry: {
    fontSize: 12,
    color: '#8E8E93',
  },
  useRewardButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  useRewardButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rewardCardDisabled: {
    opacity: 0.5,
  },
  rewardIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  rewardCost: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  rewardTextDisabled: {
    color: '#8E8E93',
  },
  redeemButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  redeemButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  redeemButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  redeemButtonTextDisabled: {
    color: '#8E8E93',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  historyIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyIconText: {
    fontSize: 20,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  historyPoints: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  historyPointsPositive: {
    color: '#34C759',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 8,
  },
});
