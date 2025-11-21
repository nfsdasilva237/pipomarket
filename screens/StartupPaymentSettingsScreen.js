// screens/StartupPaymentSettingsScreen.js - PARAMÈTRES PAIEMENT STARTUP
import { doc, getDoc, updateDoc } from 'firebase/firestore';
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

export default function StartupPaymentSettingsScreen({ navigation, route }) {
  const { startupId } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [startup, setStartup] = useState(null);

  // Champs
  const [mtnPhone, setMtnPhone] = useState('');
  const [orangePhone, setOrangePhone] = useState('');

  useEffect(() => {
    loadStartupData();
  }, []);

  const loadStartupData = async () => {
    try {
      const startupDoc = await getDoc(doc(db, 'startups', startupId));

      if (!startupDoc.exists()) {
        Alert.alert('Erreur', 'Startup introuvable');
        navigation.goBack();
        return;
      }

      const data = startupDoc.data();
      setStartup({ id: startupDoc.id, ...data });

      // Charger numéros existants
      setMtnPhone(data.mtnPhone || '');
      setOrangePhone(data.orangePhone || '');
    } catch (error) {
      console.error('Erreur chargement startup:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const validatePhone = (phone) => {
    if (!phone) return true; // Optionnel
    // Format camerounais: 6XXXXXXXX (9 chiffres)
    const phoneRegex = /^6\d{8}$/;
    return phoneRegex.test(phone);
  };

  const handleSave = async () => {
    // Validation
    if (mtnPhone && !validatePhone(mtnPhone)) {
      Alert.alert('Erreur', 'Numéro MTN invalide. Format: 6XXXXXXXX (9 chiffres)');
      return;
    }

    if (orangePhone && !validatePhone(orangePhone)) {
      Alert.alert('Erreur', 'Numéro Orange invalide. Format: 6XXXXXXXX (9 chiffres)');
      return;
    }

    if (!mtnPhone && !orangePhone) {
      Alert.alert('Attention', 'Ajoutez au moins un numéro de paiement mobile');
      return;
    }

    setSaving(true);

    try {
      await updateDoc(doc(db, 'startups', startupId), {
        mtnPhone: mtnPhone || null,
        orangePhone: orangePhone || null,
        updatedAt: new Date(),
      });

      Alert.alert(
        'Succès',
        'Numéros de paiement mis à jour !\n\nVos clients pourront maintenant payer directement sur ces numéros.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder');
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Paiements Mobiles</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* INTRO */}
        <View style={styles.introCard}>
          <Text style={styles.introIcon}>💳</Text>
          <Text style={styles.introTitle}>Recevez vos paiements</Text>
          <Text style={styles.introText}>
            Ajoutez vos numéros Mobile Money et Orange Money pour recevoir
            directement les paiements de vos clients.
          </Text>
        </View>

        {/* MOBILE MONEY (MTN) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.providerIcon}>💛</Text>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Mobile Money</Text>
              <Text style={styles.sectionSubtitle}>MTN Cameroon</Text>
            </View>
          </View>

          <Text style={styles.label}>Numéro Mobile Money</Text>
          <TextInput
            style={styles.input}
            placeholder="6XXXXXXXX"
            value={mtnPhone}
            onChangeText={setMtnPhone}
            keyboardType="phone-pad"
            maxLength={9}
          />
          <Text style={styles.hint}>
            Format: 6XXXXXXXX (9 chiffres)
            {'\n'}Code de paiement: *126*1*1*{mtnPhone || '6XXXXXXXX'}*[MONTANT]#
          </Text>

          {mtnPhone && validatePhone(mtnPhone) && (
            <View style={styles.exampleCard}>
              <Text style={styles.exampleTitle}>✓ Exemple de code:</Text>
              <Text style={styles.exampleCode}>
                *126*1*1*{mtnPhone}*5000#
              </Text>
              <Text style={styles.exampleText}>
                Vos clients composeront ce code pour vous payer 5000 FCFA
              </Text>
            </View>
          )}
        </View>

        {/* ORANGE MONEY */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.providerIcon}>🧡</Text>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Orange Money</Text>
              <Text style={styles.sectionSubtitle}>Orange Cameroun</Text>
            </View>
          </View>

          <Text style={styles.label}>Numéro Orange Money</Text>
          <TextInput
            style={styles.input}
            placeholder="6XXXXXXXX"
            value={orangePhone}
            onChangeText={setOrangePhone}
            keyboardType="phone-pad"
            maxLength={9}
          />
          <Text style={styles.hint}>
            Format: 6XXXXXXXX (9 chiffres)
            {'\n'}Code de paiement: #150*1*1*{orangePhone || '6XXXXXXXX'}*[MONTANT]#
          </Text>

          {orangePhone && validatePhone(orangePhone) && (
            <View style={styles.exampleCard}>
              <Text style={styles.exampleTitle}>✓ Exemple de code:</Text>
              <Text style={styles.exampleCode}>
                #150*1*1*{orangePhone}*5000#
              </Text>
              <Text style={styles.exampleText}>
                Vos clients composeront ce code pour vous payer 5000 FCFA
              </Text>
            </View>
          )}
        </View>

        {/* INFO */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            <Text style={styles.infoBold}>Conseil:</Text> Ajoutez au moins un
            numéro pour permettre à vos clients de vous payer facilement.
            {'\n\n'}
            Vous pouvez ajouter les deux numéros pour offrir plus de choix à
            vos clients.
          </Text>
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
            <Text style={styles.saveButtonText}>Sauvegarder</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 15, color: '#8E8E93' },

  scrollView: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: { fontSize: 28, color: '#007AFF' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },

  introCard: {
    backgroundColor: '#E3F2FD',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  introIcon: { fontSize: 48, marginBottom: 12 },
  introTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },

  section: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  providerIcon: { fontSize: 32, marginRight: 12 },
  sectionHeaderText: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 2 },
  sectionSubtitle: { fontSize: 13, color: '#8E8E93' },

  label: { fontSize: 14, fontWeight: '600', color: '#000', marginBottom: 8 },
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    fontFamily: 'monospace',
  },
  hint: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 18,
    marginBottom: 12,
    fontFamily: 'monospace',
  },

  exampleCard: {
    backgroundColor: '#F0FFF4',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#34C759',
  },
  exampleTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#34C759',
    marginBottom: 6,
  },
  exampleCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  exampleText: { fontSize: 11, color: '#666', lineHeight: 16 },

  infoCard: {
    backgroundColor: '#FFF3E0',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  infoIcon: { fontSize: 24, marginRight: 12 },
  infoText: { flex: 1, fontSize: 13, color: '#666', lineHeight: 18 },
  infoBold: { fontWeight: 'bold', color: '#000' },

  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: { backgroundColor: '#C7C7CC' },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});