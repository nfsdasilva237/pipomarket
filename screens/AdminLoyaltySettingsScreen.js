// screens/AdminLoyaltySettingsScreen.js - ✅ PARAMÈTRES SYSTÈME

import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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
import { db } from '../config/firebase';
import { loyaltyConfig } from '../config/loyaltyConfig';

export default function AdminLoyaltySettingsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    systemEnabled: true,
    minOrderAmount: loyaltyConfig.limits.minOrderAmount,
    maxEligibleAmount: loyaltyConfig.limits.maxEligibleAmount,
    maxDiscountPerOrder: loyaltyConfig.limits.maxDiscountPerOrder,
    maxCreditPerOrder: loyaltyConfig.limits.maxCreditPerOrder,
    standardCommission: loyaltyConfig.commission.standard,
    premiumCommission: loyaltyConfig.commission.premium,
    loyaltyFundPercentage: loyaltyConfig.commission.loyaltyFundPercentage,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'loyaltySettings'));
      if (settingsDoc.exists()) {
        setSettings({ ...settings, ...settingsDoc.data() });
      }
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      Alert.alert(
        'Sauvegarder',
        'Confirmer la sauvegarde des paramètres ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Sauvegarder',
            onPress: async () => {
              try {
                const settingsRef = doc(db, 'settings', 'loyaltySettings');
                const settingsDoc = await getDoc(settingsRef);

                if (settingsDoc.exists()) {
                  await updateDoc(settingsRef, settings);
                } else {
                  await setDoc(settingsRef, settings);
                }

                Alert.alert('Succès', 'Paramètres sauvegardés');
              } catch (error) {
                Alert.alert('Erreur', 'Impossible de sauvegarder');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9333EA" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* HEADER */}
      <LinearGradient
        colors={['#9333EA', '#7E22CE', '#6B21A8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>⚙️ Paramètres</Text>
          <Text style={styles.headerSubtitle}>Configuration système</Text>
        </View>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* ÉTAT DU SYSTÈME */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔌 État du système</Text>
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Système activé</Text>
                <Text style={styles.settingDescription}>
                  Active/désactive tout le programme de fidélité
                </Text>
              </View>
              <Switch
                value={settings.systemEnabled}
                onValueChange={(value) =>
                  setSettings({ ...settings, systemEnabled: value })
                }
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="white"
              />
            </View>
          </View>
        </View>

        {/* LIMITES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛡️ Limites de sécurité</Text>

          <View style={styles.settingCard}>
            <Text style={styles.settingLabel}>Commande minimum (FCFA)</Text>
            <Text style={styles.settingDescription}>
              Montant min pour utiliser récompenses
            </Text>
            <TextInput
              style={styles.input}
              value={String(settings.minOrderAmount)}
              onChangeText={(text) =>
                setSettings({ ...settings, minOrderAmount: parseInt(text) || 0 })
              }
              keyboardType="numeric"
              placeholder="3000"
            />
          </View>

          <View style={styles.settingCard}>
            <Text style={styles.settingLabel}>Montant éligible max (FCFA)</Text>
            <Text style={styles.settingDescription}>
              Max éligible aux réductions %
            </Text>
            <TextInput
              style={styles.input}
              value={String(settings.maxEligibleAmount)}
              onChangeText={(text) =>
                setSettings({
                  ...settings,
                  maxEligibleAmount: parseInt(text) || 0,
                })
              }
              keyboardType="numeric"
              placeholder="10000"
            />
          </View>

          <View style={styles.settingCard}>
            <Text style={styles.settingLabel}>Réduction max (FCFA)</Text>
            <Text style={styles.settingDescription}>
              Plafond de réduction par commande
            </Text>
            <TextInput
              style={styles.input}
              value={String(settings.maxDiscountPerOrder)}
              onChangeText={(text) =>
                setSettings({
                  ...settings,
                  maxDiscountPerOrder: parseInt(text) || 0,
                })
              }
              keyboardType="numeric"
              placeholder="2000"
            />
          </View>

          <View style={styles.settingCard}>
            <Text style={styles.settingLabel}>Crédit max (FCFA)</Text>
            <Text style={styles.settingDescription}>
              Crédit max utilisable par commande
            </Text>
            <TextInput
              style={styles.input}
              value={String(settings.maxCreditPerOrder)}
              onChangeText={(text) =>
                setSettings({
                  ...settings,
                  maxCreditPerOrder: parseInt(text) || 0,
                })
              }
              keyboardType="numeric"
              placeholder="5000"
            />
          </View>
        </View>

        {/* COMMISSIONS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Commissions</Text>

          <View style={styles.settingCard}>
            <Text style={styles.settingLabel}>Commission standard (%)</Text>
            <Text style={styles.settingDescription}>
              Startups non-premium
            </Text>
            <TextInput
              style={styles.input}
              value={String(settings.standardCommission)}
              onChangeText={(text) =>
                setSettings({
                  ...settings,
                  standardCommission: parseFloat(text) || 0,
                })
              }
              keyboardType="decimal-pad"
              placeholder="5"
            />
          </View>

          <View style={styles.settingCard}>
            <Text style={styles.settingLabel}>Commission premium (%)</Text>
            <Text style={styles.settingDescription}>
              Startups premium
            </Text>
            <TextInput
              style={styles.input}
              value={String(settings.premiumCommission)}
              onChangeText={(text) =>
                setSettings({
                  ...settings,
                  premiumCommission: parseFloat(text) || 0,
                })
              }
              keyboardType="decimal-pad"
              placeholder="3"
            />
          </View>

          <View style={styles.settingCard}>
            <Text style={styles.settingLabel}>Part fond fidélité (%)</Text>
            <Text style={styles.settingDescription}>
              % des commissions → fond fidélité
            </Text>
            <TextInput
              style={styles.input}
              value={String(settings.loyaltyFundPercentage)}
              onChangeText={(text) =>
                setSettings({
                  ...settings,
                  loyaltyFundPercentage: parseFloat(text) || 0,
                })
              }
              keyboardType="decimal-pad"
              placeholder="40"
            />
          </View>
        </View>

        {/* BOUTON SAUVEGARDER */}
        <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
          <LinearGradient
            colors={['#34C759', '#28A745']}
            style={styles.saveButtonGradient}
          >
            <Text style={styles.saveButtonText}>💾 Sauvegarder</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* INFO */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ Informations</Text>
          <Text style={styles.infoText}>
            • Les modifications prennent effet immédiatement{'\n'}
            • Les transactions en cours ne sont pas affectées{'\n'}
            • Vérifiez le fond de fidélité régulièrement
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: { fontSize: 28, color: 'white', fontWeight: 'bold' },
  headerCenter: { flex: 1, marginLeft: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  placeholder: { width: 44 },

  content: { flex: 1 },

  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },

  settingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: { flex: 1, marginRight: 16 },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  settingDescription: { fontSize: 13, color: '#666', lineHeight: 18 },

  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a1a',
    marginTop: 12,
  },

  saveButton: {
    marginHorizontal: 20,
    marginTop: 32,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveButtonText: { fontSize: 18, fontWeight: 'bold', color: 'white' },

  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  infoText: { fontSize: 13, color: '#666', lineHeight: 20 },
});