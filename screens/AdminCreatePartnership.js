// screens/AdminCreatePartnership.js
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as partnershipsService from '../utils/partnershipsService';

export default function AdminCreatePartnership({ navigation }) {
  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [type, setType] = useState('payment_integration');
  const [commissionRate, setCommissionRate] = useState('5');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const partnershipTypes = [
    { id: 'payment_integration', label: '💳 Intégration Paiement', icon: '💳' },
    { id: 'delivery_service', label: '🚚 Service Livraison', icon: '🚚' },
    { id: 'marketing_partnership', label: '📢 Partenariat Marketing', icon: '📢' },
    { id: 'data_provider', label: '📊 Fournisseur de Données', icon: '📊' },
    { id: 'technology_partner', label: '⚙️ Partenaire Technologique', icon: '⚙️' },
    { id: 'financial_institution', label: '🏦 Institution Financière', icon: '🏦' },
  ];

  const handleCreatePartnership = async () => {
    if (!partnerName.trim()) {
      Alert.alert('Erreur', 'Le nom du partenaire est requis');
      return;
    }
    if (!partnerEmail.trim()) {
      Alert.alert('Erreur', 'L\'email du partenaire est requis');
      return;
    }
    if (!commissionRate || parseFloat(commissionRate) < 0) {
      Alert.alert('Erreur', 'Le taux de commission doit être supérieur ou égal à 0');
      return;
    }

    setLoading(true);

    try {
      const partnershipData = {
        partnerName: partnerName.trim(),
        partnerEmail: partnerEmail.trim(),
        partnerPhone: partnerPhone.trim(),
        type,
        commissionRate: parseFloat(commissionRate),
        description: description.trim(),
      };

      const result = await partnershipsService.createPartnership(partnershipData);

      if (result.success) {
        Alert.alert(
          'Succès',
          'Partenariat créé avec succès!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de créer le partenariat');
      }
    } catch (error) {
      console.error('Erreur création partenariat:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#4ECDC4', '#44B8B1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🤝 Créer Partenariat</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Informations Partenaire</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom du partenaire *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Orange Money"
                value={partnerName}
                onChangeText={setPartnerName}
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email de contact *</Text>
              <TextInput
                style={styles.input}
                placeholder="contact@orange.cm"
                value={partnerEmail}
                onChangeText={setPartnerEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Téléphone (optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="+237 6XX XX XX XX"
                value={partnerPhone}
                onChangeText={setPartnerPhone}
                keyboardType="phone-pad"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Type de Partenariat</Text>

            <View style={styles.typesGrid}>
              {partnershipTypes.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.typeCard,
                    type === t.id && styles.typeCardActive,
                  ]}
                  onPress={() => setType(t.id)}
                >
                  <Text style={styles.typeIcon}>{t.icon}</Text>
                  <Text style={[
                    styles.typeLabel,
                    type === t.id && styles.typeLabelActive,
                  ]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Conditions Financières</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Taux de commission (%) *</Text>
              <TextInput
                style={styles.input}
                placeholder="5"
                value={commissionRate}
                onChangeText={setCommissionRate}
                keyboardType="decimal-pad"
                placeholderTextColor="#94a3b8"
              />
              <Text style={styles.hint}>
                Pourcentage prélevé sur chaque transaction (0-100%)
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description (optionnel)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Détails du partenariat..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>À propos des partenariats</Text>
              <Text style={styles.infoText}>
                Les partenariats permettent d'intégrer des services externes (paiement, livraison, etc.) 
                et de générer des revenus via les commissions.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleCreatePartnership}
            disabled={loading}
          >
            <LinearGradient
              colors={['#4ECDC4', '#44B8B1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitButtonGradient}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Création en cours...' : '✓ Créer le Partenariat'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  section: { backgroundColor: 'white', marginHorizontal: 20, marginTop: 20, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0' },
  textArea: { minHeight: 100, paddingTop: 14 },
  hint: { fontSize: 12, color: '#94a3b8', marginTop: 6 },
  typesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  typeCard: { flex: 1, minWidth: '45%', backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: '#e2e8f0' },
  typeCardActive: { borderColor: '#4ECDC4', backgroundColor: '#F0FFFE' },
  typeIcon: { fontSize: 32, marginBottom: 8 },
  typeLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', textAlign: 'center' },
  typeLabelActive: { color: '#4ECDC4' },
  infoBox: { flexDirection: 'row', backgroundColor: '#EFF6FF', borderRadius: 12, padding: 16, marginHorizontal: 20, marginTop: 20, borderWidth: 1, borderColor: '#BFDBFE' },
  infoIcon: { fontSize: 24, marginRight: 12 },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e40af', marginBottom: 4 },
  infoText: { fontSize: 13, color: '#475569', lineHeight: 18 },
  submitButton: { marginHorizontal: 20, marginTop: 20, borderRadius: 16, overflow: 'hidden', shadowColor: '#4ECDC4', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  submitButtonGradient: { paddingVertical: 18, alignItems: 'center' },
  submitButtonText: { fontSize: 17, fontWeight: 'bold', color: 'white' },
});