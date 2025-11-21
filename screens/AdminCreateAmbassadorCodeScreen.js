// screens/AdminCreateAmbassadorCodeScreen.js - ✅ CODES AMBASSADEURS AVEC NOM
import { LinearGradient } from 'expo-linear-gradient';
import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../config/firebase';

export default function AdminCreateAmbassadorCodeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  // État du formulaire
  const [code, setCode] = useState('');
  const [ambassadorName, setAmbassadorName] = useState('');
  const [ambassadorEmail, setAmbassadorEmail] = useState('');
  const [ambassadorPhone, setAmbassadorPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [autoGenerate, setAutoGenerate] = useState(true); // ✅ Activé par défaut

  // ✅ FONCTION POUR GÉNÉRER CODE À PARTIR DU NOM
  const generateCodeFromName = (name) => {
    if (!name || name.trim().length === 0) return '';
    
    // Nettoyer le nom : enlever accents, espaces, caractères spéciaux
    const cleanName = name
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlever accents
      .replace(/[^A-Z\s]/g, '') // Garder seulement lettres et espaces
      .replace(/\s+/g, ''); // Enlever tous les espaces

    // Prendre les 5 premières lettres (ou moins si nom plus court)
    const namePart = cleanName.slice(0, 5).padEnd(5, 'X'); // Compléter avec X si < 5 lettres
    
    return `AMB-${namePart}`;
  };

  // ✅ GÉNÉRER CODE ALÉATOIRE (si désactivé auto)
  const generateRandomCode = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return `AMB-${result}`;
  };

  // ✅ Mettre à jour le code quand le nom change (si auto activé)
  const handleNameChange = (text) => {
    setAmbassadorName(text);
    if (autoGenerate) {
      const newCode = generateCodeFromName(text);
      setCode(newCode);
    }
  };

  const handleAutoGenerateToggle = (value) => {
    setAutoGenerate(value);
    if (value) {
      // Générer depuis le nom si disponible
      if (ambassadorName.trim()) {
        setCode(generateCodeFromName(ambassadorName));
      } else {
        setCode('');
      }
    } else {
      setCode('');
    }
  };

  const handleCreate = async () => {
    // Validation
    if (!code.trim()) {
      Alert.alert('Erreur', 'Le code est requis');
      return;
    }

    if (!ambassadorName.trim()) {
      Alert.alert('Erreur', 'Le nom de l\'ambassadeur est requis');
      return;
    }

    if (!ambassadorEmail.trim()) {
      Alert.alert('Erreur', 'L\'email est requis');
      return;
    }

    // Validation format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ambassadorEmail)) {
      Alert.alert('Erreur', 'Email invalide');
      return;
    }

    // ✅ Validation format code - accepte lettres maintenant
    if (!code.match(/^AMB-[A-Z]{5}$/)) {
      Alert.alert('Erreur', 'Le code doit être au format AMB-XXXXX (5 lettres majuscules après le tiret)\n\nExemple: AMB-MARIE ou AMB-PAULX');
      return;
    }

    setLoading(true);

    try {
      // Vérifier si le code existe déjà
      const existingCodeQuery = query(
        collection(db, 'ambassadorInviteCodes'),
        where('code', '==', code.toUpperCase())
      );
      const existingCodeSnapshot = await getDocs(existingCodeQuery);

      if (!existingCodeSnapshot.empty) {
        Alert.alert(
          'Code existant',
          'Ce code existe déjà. Voulez-vous en générer un nouveau automatiquement ?',
          [
            { text: 'Annuler', style: 'cancel', onPress: () => setLoading(false) },
            { 
              text: 'Générer nouveau', 
              onPress: () => {
                setCode(generateRandomCode());
                setLoading(false);
              }
            }
          ]
        );
        return;
      }

      // Vérifier si l'email existe déjà
      const existingEmailQuery = query(
        collection(db, 'ambassadorInviteCodes'),
        where('ambassadorEmail', '==', ambassadorEmail.toLowerCase().trim())
      );
      const existingEmailSnapshot = await getDocs(existingEmailQuery);

      if (!existingEmailSnapshot.empty) {
        Alert.alert(
          'Email déjà utilisé',
          'Un code existe déjà pour cet email. Voulez-vous continuer ?',
          [
            { text: 'Annuler', style: 'cancel', onPress: () => setLoading(false) },
            { text: 'Continuer', onPress: () => createCode() }
          ]
        );
        return;
      }

      await createCode();

    } catch (error) {
      console.error('Erreur création code:', error);
      Alert.alert('Erreur', 'Impossible de créer le code');
      setLoading(false);
    }
  };

  const createCode = async () => {
    try {
      const codeData = {
        code: code.toUpperCase().trim(),
        ambassadorName: ambassadorName.trim(),
        ambassadorEmail: ambassadorEmail.toLowerCase().trim(),
        ambassadorPhone: ambassadorPhone.trim() || null,
        notes: notes.trim() || null,
        
        used: false,
        disabled: false,
        
        usedBy: null,
        usedByEmail: null,
        usedAt: null,
        
        createdAt: serverTimestamp(),
        createdByAdmin: true,
      };

      await addDoc(collection(db, 'ambassadorInviteCodes'), codeData);

      Alert.alert(
        'Succès',
        `Code créé avec succès !\n\n📧 Envoyez ce code à ${ambassadorName} :\n\n🔑 ${code.toUpperCase()}`,
        [
          { 
            text: 'Créer un autre', 
            onPress: () => {
              setCode('');
              setAmbassadorName('');
              setAmbassadorEmail('');
              setAmbassadorPhone('');
              setNotes('');
              setLoading(false);
            }
          },
          { 
            text: 'Retour', 
            onPress: () => navigation.goBack() 
          }
        ]
      );

    } catch (error) {
      console.error('Erreur création:', error);
      Alert.alert('Erreur', 'Impossible de créer le code');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* HEADER */}
      <LinearGradient
        colors={['#4ECDC4', '#44B8B1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Créer Code Ambassadeur</Text>
          <Text style={styles.headerSubtitle}>Personnalisé</Text>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* INFO AMBASSADEUR */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Informations Ambassadeur</Text>

            <Text style={styles.label}>Nom complet *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Marie Kamdem"
              value={ambassadorName}
              onChangeText={handleNameChange}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: marie.kamdem@email.com"
              value={ambassadorEmail}
              onChangeText={setAmbassadorEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Téléphone (optionnel)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: +237 6XX XX XX XX"
              value={ambassadorPhone}
              onChangeText={setAmbassadorPhone}
              keyboardType="phone-pad"
            />
          </View>

          {/* CODE */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔑 Code d'Invitation</Text>

            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <Text style={styles.label}>Générer depuis le nom</Text>
                <Text style={styles.hint}>Format: AMB-XXXXX (lettres)</Text>
              </View>
              <Switch
                value={autoGenerate}
                onValueChange={handleAutoGenerateToggle}
                trackColor={{ false: '#E5E5EA', true: '#4ECDC4' }}
                thumbColor="white"
              />
            </View>

            {!autoGenerate && (
              <>
                <Text style={styles.label}>Code personnalisé *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: AMB-MARIE"
                  value={code}
                  onChangeText={(text) => setCode(text.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={9}
                />
                <Text style={styles.hint}>
                  Format requis: AMB-XXXXX (5 lettres après le tiret)
                </Text>
              </>
            )}

            {autoGenerate && code && (
              <View style={styles.generatedCodeBox}>
                <Text style={styles.generatedCodeLabel}>Code généré :</Text>
                <Text style={styles.generatedCodeValue}>{code}</Text>
                <Text style={styles.generatedCodeExplanation}>
                  Basé sur: {ambassadorName || 'le nom de l\'ambassadeur'}
                </Text>
                {ambassadorName.trim() && (
                  <TouchableOpacity
                    style={styles.regenerateButton}
                    onPress={() => setCode(generateRandomCode())}
                  >
                    <Text style={styles.regenerateButtonText}>🔄 Code aléatoire</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {autoGenerate && !code && (
              <View style={styles.infoBox}>
                <Text style={styles.infoIcon}>ℹ️</Text>
                <Text style={styles.infoText}>
                  Le code sera généré automatiquement quand vous entrerez le nom de l'ambassadeur
                </Text>
              </View>
            )}
          </View>

          {/* NOTES */}
          <View style={styles.section}>
            <Text style={styles.label}>Notes internes (optionnel)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ex: Ambassadeur recommandé par..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
            <Text style={styles.hint}>Ces notes ne seront visibles que par les admins</Text>
          </View>

          {/* RÉCAPITULATIF */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>📋 Récapitulatif</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Code:</Text>
              <Text style={styles.summaryValue}>{code || '---'}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Ambassadeur:</Text>
              <Text style={styles.summaryValue}>{ambassadorName || '---'}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Email:</Text>
              <Text style={styles.summaryValue}>{ambassadorEmail || '---'}</Text>
            </View>
            
            {ambassadorPhone && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Téléphone:</Text>
                <Text style={styles.summaryValue}>{ambassadorPhone}</Text>
              </View>
            )}
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Statut:</Text>
              <Text style={[styles.summaryValue, { color: code ? '#4ECDC4' : '#FF9500' }]}>
                {code ? '✅ Prêt à l\'emploi' : '⚠️ En attente du nom'}
              </Text>
            </View>
          </View>

          {/* EXEMPLES */}
          <View style={styles.examplesCard}>
            <Text style={styles.examplesTitle}>💡 Exemples de codes générés</Text>
            <View style={styles.exampleRow}>
              <Text style={styles.exampleName}>Marie Kamdem</Text>
              <Text style={styles.exampleCode}>→ AMB-MARIE</Text>
            </View>
            <View style={styles.exampleRow}>
              <Text style={styles.exampleName}>Paul Ngono</Text>
              <Text style={styles.exampleCode}>→ AMB-PAULN</Text>
            </View>
            <View style={styles.exampleRow}>
              <Text style={styles.exampleName}>Jean-Baptiste Talla</Text>
              <Text style={styles.exampleCode}>→ AMB-JEANB</Text>
            </View>
            <View style={styles.exampleRow}>
              <Text style={styles.exampleName}>Ali</Text>
              <Text style={styles.exampleCode}>→ AMB-ALIXX</Text>
            </View>
          </View>

          {/* INSTRUCTIONS */}
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>📨 Après création</Text>
            <Text style={styles.instructionsText}>
              1️⃣ Envoyez le code à l'ambassadeur par email{'\n'}
              2️⃣ L'ambassadeur s'inscrit avec ce code{'\n'}
              3️⃣ Son compte ambassadeur est créé automatiquement{'\n'}
              4️⃣ Il reçoit son code de parrainage personnel
            </Text>
          </View>

          <View style={{ height: Math.max(insets.bottom + 80, 120) }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* BOUTON CRÉER */}
      <View style={[styles.footer, { paddingBottom: insets.bottom || 20 }]}>
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? ['#A0A0A0', '#888888'] : ['#4ECDC4', '#44B8B1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.createButtonGradient}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.createButtonText}>✅ Créer le code ambassadeur</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  backButton: { fontSize: 28, color: 'white' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 2 },

  content: { flex: 1 },
  scrollContent: { padding: 20 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 16 },
  
  label: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 8 },
  input: { backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#000', borderWidth: 1, borderColor: '#E5E5EA', marginBottom: 16 },
  textArea: { height: 80, paddingTop: 14, textAlignVertical: 'top' },
  hint: { fontSize: 12, color: '#8E8E93', marginTop: -12, marginBottom: 16 },

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E5EA' },
  switchLeft: { flex: 1, marginRight: 16 },

  generatedCodeBox: { backgroundColor: '#E0F7F5', borderRadius: 12, padding: 20, borderWidth: 2, borderColor: '#4ECDC4', alignItems: 'center' },
  generatedCodeLabel: { fontSize: 13, color: '#2C9A8E', marginBottom: 8, fontWeight: '600' },
  generatedCodeValue: { fontSize: 28, fontWeight: 'bold', color: '#2C9A8E', letterSpacing: 2, fontFamily: 'monospace', marginBottom: 8 },
  generatedCodeExplanation: { fontSize: 12, color: '#2C9A8E', marginBottom: 12, fontStyle: 'italic' },
  regenerateButton: { backgroundColor: '#4ECDC4', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  regenerateButtonText: { color: 'white', fontSize: 14, fontWeight: 'bold' },

  infoBox: { flexDirection: 'row', backgroundColor: '#FFF9E6', borderRadius: 12, padding: 16, borderWidth: 2, borderColor: '#FFD700', alignItems: 'center' },
  infoIcon: { fontSize: 24, marginRight: 12 },
  infoText: { flex: 1, fontSize: 13, color: '#666', lineHeight: 18 },

  summaryCard: { backgroundColor: '#E0F7F5', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 2, borderColor: '#4ECDC4' },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C9A8E', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: '#666' },
  summaryValue: { fontSize: 14, fontWeight: 'bold', color: '#000', flex: 1, textAlign: 'right' },

  examplesCard: { backgroundColor: '#F0F8FF', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 2, borderColor: '#007AFF' },
  examplesTitle: { fontSize: 16, fontWeight: 'bold', color: '#007AFF', marginBottom: 16 },
  exampleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  exampleName: { fontSize: 14, color: '#666', flex: 1 },
  exampleCode: { fontSize: 14, fontWeight: 'bold', color: '#007AFF', fontFamily: 'monospace' },

  instructionsCard: { backgroundColor: '#FFF9E6', borderRadius: 16, padding: 20, borderWidth: 2, borderColor: '#FFD700' },
  instructionsTitle: { fontSize: 16, fontWeight: 'bold', color: '#CC9900', marginBottom: 12 },
  instructionsText: { fontSize: 13, color: '#666', lineHeight: 20 },

  footer: { backgroundColor: 'white', paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E5E5EA' },
  createButton: { borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  createButtonDisabled: { opacity: 0.6 },
  createButtonGradient: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  createButtonText: { fontSize: 17, fontWeight: 'bold', color: 'white' },
});