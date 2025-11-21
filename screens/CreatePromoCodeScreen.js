// screens/CreatePromoCodeScreen.js - CRÉER CODE PROMO (STARTUP)
import { useState } from 'react';
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
import promoCodeService from '../utils/promoCodeService';

export default function CreatePromoCodeScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [code, setCode] = useState('');
  const [type, setType] = useState('percentage'); // 'percentage', 'fixed', 'free_shipping'
  const [value, setValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [firstOrderOnly, setFirstOrderOnly] = useState(false);
  
  // Dates
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(null);

  const handleCreatePromo = async () => {
    // Validation
    if (!code.trim()) {
      Alert.alert('Erreur', 'Entrez un code promo');
      return;
    }
    
    if (code.length < 4) {
      Alert.alert('Erreur', 'Le code doit contenir au moins 4 caractères');
      return;
    }
    
    if (!value || parseFloat(value) <= 0) {
      Alert.alert('Erreur', 'Entrez une valeur valide');
      return;
    }
    
    if (type === 'percentage' && parseFloat(value) > 100) {
      Alert.alert('Erreur', 'Le pourcentage ne peut pas dépasser 100%');
      return;
    }

    setLoading(true);

    const promoData = {
      code: code.toUpperCase(),
      type: type,
      value: parseFloat(value),
      minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : 0,
      maxUses: maxUses ? parseInt(maxUses) : null,
      maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
      firstOrderOnly: firstOrderOnly,
      startDate: startDate,
      endDate: endDate,
    };

    const result = await promoCodeService.createPromoCode(promoData);

    setLoading(false);

    if (result.success) {
      Alert.alert(
        '✅ Code créé !',
        `Le code "${code.toUpperCase()}" a été créé avec succès.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      Alert.alert('❌ Erreur', result.error || 'Impossible de créer le code');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Créer Code Promo</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* CODE */}
        <View style={styles.section}>
          <Text style={styles.label}>Code Promo *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: NOEL2024"
            value={code}
            onChangeText={(text) => setCode(text.toUpperCase())}
            autoCapitalize="characters"
            maxLength={20}
          />
          <Text style={styles.hint}>4-20 caractères, sans espaces</Text>
        </View>

        {/* TYPE DE RÉDUCTION */}
        <View style={styles.section}>
          <Text style={styles.label}>Type de Réduction *</Text>
          
          <TouchableOpacity
            style={[styles.typeOption, type === 'percentage' && styles.typeOptionSelected]}
            onPress={() => setType('percentage')}
          >
            <View style={styles.typeOptionContent}>
              <Text style={styles.typeOptionIcon}>%</Text>
              <View>
                <Text style={styles.typeOptionTitle}>Pourcentage</Text>
                <Text style={styles.typeOptionSubtitle}>Ex: 20% de réduction</Text>
              </View>
            </View>
            {type === 'percentage' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeOption, type === 'fixed' && styles.typeOptionSelected]}
            onPress={() => setType('fixed')}
          >
            <View style={styles.typeOptionContent}>
              <Text style={styles.typeOptionIcon}>💰</Text>
              <View>
                <Text style={styles.typeOptionTitle}>Montant Fixe</Text>
                <Text style={styles.typeOptionSubtitle}>Ex: 5.000 FCFA de réduction</Text>
              </View>
            </View>
            {type === 'fixed' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeOption, type === 'free_shipping' && styles.typeOptionSelected]}
            onPress={() => setType('free_shipping')}
          >
            <View style={styles.typeOptionContent}>
              <Text style={styles.typeOptionIcon}>🚚</Text>
              <View>
                <Text style={styles.typeOptionTitle}>Livraison Gratuite</Text>
                <Text style={styles.typeOptionSubtitle}>Frais de livraison offerts</Text>
              </View>
            </View>
            {type === 'free_shipping' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        </View>

        {/* VALEUR */}
        {type !== 'free_shipping' && (
          <View style={styles.section}>
            <Text style={styles.label}>
              {type === 'percentage' ? 'Pourcentage (%) *' : 'Montant (FCFA) *'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={type === 'percentage' ? '20' : '5000'}
              value={value}
              onChangeText={setValue}
              keyboardType="numeric"
            />
            <Text style={styles.hint}>
              {type === 'percentage' 
                ? 'Entre 1 et 100%' 
                : 'Montant en FCFA'}
            </Text>
          </View>
        )}

        {/* MONTANT MINIMUM */}
        <View style={styles.section}>
          <Text style={styles.label}>Montant Minimum de Commande</Text>
          <TextInput
            style={styles.input}
            placeholder="10000"
            value={minOrderAmount}
            onChangeText={setMinOrderAmount}
            keyboardType="numeric"
          />
          <Text style={styles.hint}>Commande minimale pour utiliser le code (optionnel)</Text>
        </View>

        {/* LIMITE D'UTILISATION */}
        <View style={styles.section}>
          <Text style={styles.label}>Nombre Maximum d'Utilisations</Text>
          <TextInput
            style={styles.input}
            placeholder="100"
            value={maxUses}
            onChangeText={setMaxUses}
            keyboardType="numeric"
          />
          <Text style={styles.hint}>Laissez vide pour illimité</Text>
        </View>

        {/* RÉDUCTION MAX (pour %) */}
        {type === 'percentage' && (
          <View style={styles.section}>
            <Text style={styles.label}>Réduction Maximum (FCFA)</Text>
            <TextInput
              style={styles.input}
              placeholder="50000"
              value={maxDiscountAmount}
              onChangeText={setMaxDiscountAmount}
              keyboardType="numeric"
            />
            <Text style={styles.hint}>Plafonner la réduction maximum (optionnel)</Text>
          </View>
        )}

        {/* PREMIÈRE COMMANDE */}
        <View style={styles.section}>
          <View style={styles.switchContainer}>
            <View style={styles.switchLeft}>
              <Text style={styles.switchLabel}>Réservé aux Nouveaux Clients</Text>
              <Text style={styles.switchSubtitle}>Seulement pour leur première commande</Text>
            </View>
            <Switch
              value={firstOrderOnly}
              onValueChange={setFirstOrderOnly}
              trackColor={{ false: '#C7C7CC', true: '#34C759' }}
              thumbColor="white"
            />
          </View>
        </View>

        {/* APERÇU */}
        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>📋 Aperçu</Text>
          <View style={styles.previewCard}>
            <Text style={styles.previewCode}>🎁 {code.toUpperCase() || 'VOTRECODE'}</Text>
            <Text style={styles.previewDescription}>
              {type === 'percentage' && `${value || '0'}% de réduction`}
              {type === 'fixed' && `${value ? parseInt(value).toLocaleString('fr-FR') : '0'} FCFA de réduction`}
              {type === 'free_shipping' && 'Livraison gratuite'}
            </Text>
            {minOrderAmount && (
              <Text style={styles.previewCondition}>
                • Commande min: {parseInt(minOrderAmount).toLocaleString('fr-FR')} FCFA
              </Text>
            )}
            {maxUses && (
              <Text style={styles.previewCondition}>
                • Limité à {maxUses} utilisations
              </Text>
            )}
            {firstOrderOnly && (
              <Text style={styles.previewCondition}>
                • Nouveaux clients uniquement
              </Text>
            )}
          </View>
        </View>

        {/* EXEMPLES */}
        <View style={styles.examplesSection}>
          <Text style={styles.examplesTitle}>💡 Exemples de codes</Text>
          <View style={styles.exampleCard}>
            <Text style={styles.exampleCode}>BIENVENUE10</Text>
            <Text style={styles.exampleDesc}>10% pour nouveaux clients</Text>
          </View>
          <View style={styles.exampleCard}>
            <Text style={styles.exampleCode}>NOEL2024</Text>
            <Text style={styles.exampleDesc}>5.000 FCFA sur commande +20.000 FCFA</Text>
          </View>
          <View style={styles.exampleCard}>
            <Text style={styles.exampleCode}>LIVRAISONGRATUITE</Text>
            <Text style={styles.exampleDesc}>Livraison offerte</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreatePromo}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.createButtonText}>Créer le Code Promo</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scrollView: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'white', marginBottom: 16 },
  backButton: { fontSize: 28, color: '#007AFF' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  
  section: { paddingHorizontal: 20, marginBottom: 24 },
  label: { fontSize: 15, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  input: { backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, borderWidth: 1, borderColor: '#E5E5EA' },
  hint: { fontSize: 13, color: '#8E8E93', marginTop: 6 },
  
  typeOption: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 2, borderColor: '#E5E5EA' },
  typeOptionSelected: { borderColor: '#007AFF', backgroundColor: '#F0F8FF' },
  typeOptionContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  typeOptionIcon: { fontSize: 32, marginRight: 12 },
  typeOptionTitle: { fontSize: 15, fontWeight: 'bold', color: '#000', marginBottom: 2 },
  typeOptionSubtitle: { fontSize: 13, color: '#666' },
  checkmark: { fontSize: 24, color: '#007AFF', fontWeight: 'bold' },
  
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 16 },
  switchLeft: { flex: 1, marginRight: 12 },
  switchLabel: { fontSize: 15, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  switchSubtitle: { fontSize: 13, color: '#666' },
  
  previewSection: { paddingHorizontal: 20, marginBottom: 24 },
  previewTitle: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 12 },
  previewCard: { backgroundColor: '#007AFF', borderRadius: 16, padding: 20 },
  previewCode: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 8 },
  previewDescription: { fontSize: 16, color: 'white', marginBottom: 12 },
  previewCondition: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  
  examplesSection: { paddingHorizontal: 20, marginBottom: 24 },
  examplesTitle: { fontSize: 15, fontWeight: 'bold', color: '#000', marginBottom: 12 },
  exampleCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#34C759' },
  exampleCode: { fontSize: 15, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  exampleDesc: { fontSize: 13, color: '#666' },
  
  footer: { backgroundColor: 'white', padding: 20, borderTopWidth: 1, borderTopColor: '#E5E5EA' },
  createButton: { backgroundColor: '#007AFF', borderRadius: 12, padding: 16, alignItems: 'center' },
  createButtonDisabled: { backgroundColor: '#C7C7CC' },
  createButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
