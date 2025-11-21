// screens/AdminSetStartupOfMonth.js
import { LinearGradient } from 'expo-linear-gradient';
import { collection, getDocs, query, where } from 'firebase/firestore';
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
import { db } from '../config/firebase';
import * as startupOfMonthService from '../utils/startupOfMonthService';

export default function AdminSetStartupOfMonth({ navigation }) {
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [amount, setAmount] = useState('20000');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadStartups();
  }, []);

  const loadStartups = async () => {
    try {
      const q = query(
        collection(db, 'startups'),
        where('active', '==', true)
      );
      const querySnapshot = await getDocs(q);
      const startupsData = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data && data.name) {
          startupsData.push({
            id: doc.id,
            ...data,
          });
        }
      });

      setStartups(startupsData);
    } catch (error) {
      console.error('Erreur chargement startups:', error);
      Alert.alert('Erreur', 'Impossible de charger les startups');
    } finally {
      setLoading(false);
    }
  };

  const filteredStartups = startups.filter((startup) =>
    startup.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSetStartupOfMonth = async () => {
    if (!selectedStartup) {
      Alert.alert('Erreur', 'Veuillez sélectionner une startup');
      return;
    }

    if (!amount || parseFloat(amount) < 15000) {
      Alert.alert('Erreur', 'Le montant minimum est de 15 000 FCFA');
      return;
    }

    Alert.alert(
      'Confirmer',
      `Définir "${selectedStartup.name}" comme Startup du Mois pour ${parseFloat(amount).toLocaleString('fr-FR')} FCFA ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setSubmitting(true);
            try {
              const result = await startupOfMonthService.setStartupOfMonth(
                selectedStartup.id,
                selectedStartup.name,
                selectedStartup.logo || '🏪',
                parseFloat(amount)
              );

              if (result.success) {
                Alert.alert(
                  'Succès',
                  'Startup du Mois définie avec succès!',
                  [
                    {
                      text: 'OK',
                      onPress: () => navigation.goBack(),
                    },
                  ]
                );
              } else {
                Alert.alert('Erreur', result.error || 'Impossible de définir la startup');
              }
            } catch (error) {
              console.error('Erreur définition startup du mois:', error);
              Alert.alert('Erreur', 'Une erreur est survenue');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#FFD700', '#FFA500']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏆 Startup du Mois</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une startup..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        {selectedStartup && (
          <View style={styles.selectedSection}>
            <Text style={styles.selectedLabel}>Startup sélectionnée:</Text>
            <View style={styles.selectedCard}>
              <Text style={styles.selectedLogo}>{selectedStartup.logo || '🏪'}</Text>
              <View style={styles.selectedInfo}>
                <Text style={styles.selectedName}>{selectedStartup.name}</Text>
                <Text style={styles.selectedCategory}>{selectedStartup.category}</Text>
              </View>
              <TouchableOpacity
                style={styles.unselectButton}
                onPress={() => setSelectedStartup(null)}
              >
                <Text style={styles.unselectButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.amountSection}>
              <Text style={styles.label}>Montant (FCFA) *</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="20000"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholderTextColor="#94a3b8"
              />
              <Text style={styles.hint}>Minimum: 15 000 FCFA • Recommandé: 20 000 FCFA</Text>
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSetStartupOfMonth}
              disabled={submitting}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitButtonGradient}
              >
                <Text style={styles.submitButtonText}>
                  {submitting ? 'En cours...' : '✓ Définir comme Startup du Mois'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>Chargement des startups...</Text>
          </View>
        ) : filteredStartups.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏢</Text>
            <Text style={styles.emptyText}>Aucune startup trouvée</Text>
          </View>
        ) : (
          <ScrollView style={styles.startupsList} showsVerticalScrollIndicator={false}>
            {filteredStartups.map((startup) => (
              <TouchableOpacity
                key={startup.id}
                style={[
                  styles.startupCard,
                  selectedStartup?.id === startup.id && styles.startupCardSelected,
                ]}
                onPress={() => setSelectedStartup(startup)}
              >
                <Text style={styles.startupLogo}>{startup.logo || '🏪'}</Text>
                <View style={styles.startupInfo}>
                  <Text style={styles.startupName}>{startup.name}</Text>
                  <Text style={styles.startupCategory}>{startup.category}</Text>
                  <View style={styles.startupStats}>
                    <Text style={styles.startupStat}>⭐ {startup.rating || '5.0'}</Text>
                    <Text style={styles.startupStat}>📦 {startup.products || 0} produits</Text>
                  </View>
                </View>
                {selectedStartup?.id === startup.id && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.3)', alignItems: 'center', justifyContent: 'center' },
  backButtonText: { fontSize: 24, color: 'white', fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  content: { flex: 1 },
  searchSection: { backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  searchIcon: { fontSize: 20, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#1e293b', paddingVertical: 12 },
  selectedSection: { backgroundColor: 'white', marginHorizontal: 20, marginTop: 20, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  selectedLabel: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 12 },
  selectedCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF9E6', borderRadius: 12, padding: 16, borderWidth: 2, borderColor: '#FFD700' },
  selectedLogo: { fontSize: 40, marginRight: 16 },
  selectedInfo: { flex: 1 },
  selectedName: { fontSize: 17, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  selectedCategory: { fontSize: 13, color: '#64748b' },
  unselectButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0, 0, 0, 0.1)', alignItems: 'center', justifyContent: 'center' },
  unselectButtonText: { fontSize: 18, color: '#64748b' },
  amountSection: { marginTop: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
  amountInput: { backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0' },
  hint: { fontSize: 12, color: '#94a3b8', marginTop: 6 },
  submitButton: { marginTop: 20, borderRadius: 12, overflow: 'hidden', shadowColor: '#FFD700', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  submitButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  submitButtonText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 16, fontSize: 15, color: '#64748b' },
  emptyState: { alignItems: 'center', paddingVertical: 80 },
  emptyIcon: { fontSize: 72, marginBottom: 16, opacity: 0.6 },
  emptyText: { fontSize: 17, fontWeight: '600', color: '#94a3b8' },
  startupsList: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  startupCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 2, borderColor: 'transparent' },
  startupCardSelected: { borderColor: '#FFD700', backgroundColor: '#FFF9E6' },
  startupLogo: { fontSize: 40, marginRight: 16 },
  startupInfo: { flex: 1 },
  startupName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  startupCategory: { fontSize: 13, color: '#64748b', marginBottom: 8 },
  startupStats: { flexDirection: 'row', gap: 12 },
  startupStat: { fontSize: 12, color: '#64748b' },
  checkmark: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFD700', alignItems: 'center', justifyContent: 'center' },
  checkmarkText: { fontSize: 18, color: '#000', fontWeight: 'bold' },
});