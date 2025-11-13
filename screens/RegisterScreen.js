// screens/RegisterScreen.js - VERSION FINALE AVEC FEEDBACK VISUEL
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import {
  ActivityIndicator,
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
import { auth, db } from '../config/firebase';
import adminService from '../utils/adminService';
import ambassadorService from '../utils/ambassadorService';
export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [accountType, setAccountType] = useState('client');
  const [startupName, setStartupName] = useState('');
  const [loading, setLoading] = useState(false);

  // État
  const [promoCode, setPromoCode] = useState('');
  
  // AMBASSADOR SECRET
  const [showAmbassadorInput, setShowAmbassadorInput] = useState(false);
  const [ambassadorCode, setAmbassadorCode] = useState('');
  const [ambassadorCodeValid, setAmbassadorCodeValid] = useState(false);
  
  // ADMIN SECRET
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [adminCodeValid, setAdminCodeValid] = useState(false);

  // Valider code admin en temps réel
  const handleAdminCodeChange = (code) => {
    setAdminCode(code);
    setAdminCodeValid(adminService.verifyAdminCode(code));
  };

  // Valider code ambassadeur en temps réel
  const handleAmbassadorCodeChange = (code) => {
    setAmbassadorCode(code);
    setAmbassadorCodeValid(ambassadorService.verifyAmbassadorCode(code));
  };

  const handleRegister = async () => {
    // Validations (code admin OPTIONNEL)
    if (!email || !password || !name) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (accountType === 'startup' && !startupName) {
      Alert.alert('Erreur', 'Veuillez entrer le nom de votre startup');
      return;
    }

    if (accountType === 'ambassador' && !ambassadorCodeValid) {
      Alert.alert('Erreur', 'Code ambassadeur invalide ou manquant');
      return;
    }

    setLoading(true);

    try {
      // Créer compte Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Déterminer le rôle
      let finalRole = accountType;
      if (adminCode && adminService.verifyAdminCode(adminCode)) {
        finalRole = 'admin';
      }

      // Créer document utilisateur
      const userData = {
        email: email,
        name: name,
        phone: phone || '',
        role: finalRole,
        createdAt: new Date(),
        loyaltyPoints: 0,
      };

      if (finalRole === 'admin') {
        userData.isAdmin = true;
      }

      await setDoc(doc(db, 'users', user.uid), userData);

      // Si startup, créer document startup
      if (accountType === 'startup' && finalRole !== 'admin') {
        const startupData = {
          name: startupName,
          ownerId: user.uid,
          ownerName: name,
          ownerEmail: email,
          ownerPhone: phone || '',
          createdAt: new Date(),
          active: true,
          verified: false,
          products: 0,
          rating: 5.0,
        };

        await setDoc(doc(db, 'startups', user.uid), startupData);
      }

      // Link promo code if provided and not admin
      if (promoCode && finalRole !== 'admin') {
        await ambassadorService.linkPromoCodeToUser(user.uid, promoCode);
      }

      // Créer ambassadeur si code valide
      if (accountType === 'ambassador' && ambassadorCodeValid) {
        const ambassadorResult = await ambassadorService.createAmbassador(user.uid, userData);
        if (!ambassadorResult.success) {
          throw new Error(ambassadorResult.error);
        }
      }

      // Message succès selon le rôle
      const successMessage = 
        finalRole === 'admin' 
          ? '🎉 Compte Administrateur créé avec succès !\n\nVous avez maintenant le contrôle total sur PipoMarket.'
          : accountType === 'startup'
          ? '🏢 Compte Startup créé avec succès !\n\nVous pouvez maintenant vendre vos produits.'
          : accountType === 'ambassador'
          ? '� Compte Ambassadeur créé avec succès !\n\nVous pouvez maintenant gérer vos recommandations.'
          : '�👋 Bienvenue sur PipoMarket !\n\nCommencez à découvrir les produits.';

      Alert.alert(
        'Succès !',
        successMessage,
        [
          {
            text: 'OK',
            onPress: () => {
              if (finalRole === 'admin') {
                navigation.replace('AdminDashboard');
              } else if (accountType === 'startup') {
                navigation.replace('StartupDashboard', { startupId: user.uid });
              } else if (accountType === 'ambassador') {
                navigation.replace('AmbassadorDashboard');
              } else {
                navigation.replace('Home');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Erreur inscription:', error);
      
      let errorMessage = 'Une erreur est survenue';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Cet email est déjà utilisé';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email invalide';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Mot de passe trop faible';
      }
      
      Alert.alert('Erreur', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Rejoignez PipoMarket</Text>

          {/* TYPE DE COMPTE */}
          <View style={styles.accountTypeContainer}>
            <TouchableOpacity
              style={[
                styles.accountTypeButton,
                accountType === 'client' && styles.accountTypeButtonActive,
              ]}
              onPress={() => setAccountType('client')}
            >
              <Text style={styles.accountTypeIcon}>👤</Text>
              <Text
                style={[
                  styles.accountTypeText,
                  accountType === 'client' && styles.accountTypeTextActive,
                ]}
              >
                Client
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.accountTypeButton,
                accountType === 'startup' && styles.accountTypeButtonActive,
              ]}
              onPress={() => setAccountType('startup')}
            >
              <Text style={styles.accountTypeIcon}>🏢</Text>
              <Text
                style={[
                  styles.accountTypeText,
                  accountType === 'startup' && styles.accountTypeTextActive,
                ]}
              >
                Startup
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.accountTypeButton,
                accountType === 'ambassador' && styles.accountTypeButtonActive,
              ]}
              onPress={() => setAccountType('ambassador')}
            >
              <Text style={styles.accountTypeIcon}>👥</Text>
              <Text
                style={[
                  styles.accountTypeText,
                  accountType === 'ambassador' && styles.accountTypeTextActive,
                ]}
              >
                Ambassadeur
              </Text>
            </TouchableOpacity>
          </View>

          {/* FORMULAIRE */}
          <View style={styles.form}>
            <Text style={styles.label}>Nom complet *</Text>
            <TextInput
              style={styles.input}
              placeholder="Votre nom"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="votre@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Téléphone</Text>
            <TextInput
              style={styles.input}
              placeholder="+237 6XX XXX XXX"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            {accountType === 'ambassador' && (
              <>
                <Text style={styles.label}>Code d'invitation Ambassadeur *</Text>
                <TextInput
                  style={[
                    styles.input,
                    ambassadorCodeValid && styles.inputValid,
                    ambassadorCode && !ambassadorCodeValid && styles.inputInvalid,
                  ]}
                  placeholder="Code d'invitation"
                  value={ambassadorCode}
                  onChangeText={handleAmbassadorCodeChange}
                  autoCapitalize="none"
                />
                {ambassadorCode && (
                  <Text
                    style={[
                      styles.validationText,
                      ambassadorCodeValid ? styles.validText : styles.invalidText,
                    ]}
                  >
                    {ambassadorCodeValid
                      ? '✓ Code valide'
                      : '✗ Code invalide'}
                  </Text>
                )}
              </>
            )}

            {accountType === 'startup' && (
              <>
                <Text style={styles.label}>Nom de la startup *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ma Startup"
                  value={startupName}
                  onChangeText={setStartupName}
                />
              </>
            )}

            <Text style={styles.label}>Mot de passe *</Text>
            <TextInput
              style={styles.input}
              placeholder="Minimum 6 caractères"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Text style={styles.label}>Confirmer mot de passe *</Text>
            <TextInput
              style={styles.input}
              placeholder="Retapez votre mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <Text style={styles.label}>Code Ambassadeur (Optionnel)</Text>
<TextInput
  style={styles.input}
  placeholder="AMB-12345"
  value={promoCode}
  onChangeText={setPromoCode}
  autoCapitalize="characters"
/>

            {/* OPTION ADMIN (CACHÉ) */}
            <TouchableOpacity
              onPress={() => setShowAdminInput(!showAdminInput)}
              onLongPress={() => setShowAdminInput(true)}
              style={styles.adminTrigger}
            >
              <Text style={styles.adminTriggerText}>👑</Text>
            </TouchableOpacity>

            {showAdminInput && (
              <View style={styles.adminSection}>
                <Text style={styles.label}>🔐 Code Administrateur (Optionnel)</Text>
                <View style={styles.adminInputContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.adminInput,
                      adminCode && (adminCodeValid ? styles.adminInputValid : styles.adminInputInvalid)
                    ]}
                    placeholder="Code secret admin (laisser vide si client/startup)"
                    value={adminCode}
                    onChangeText={handleAdminCodeChange}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                  {adminCode && (
                    <Text style={styles.adminValidationIcon}>
                      {adminCodeValid ? '✅' : '❌'}
                    </Text>
                  )}
                </View>
                <Text style={styles.adminHint}>
                  ✨ Laissez vide pour un compte normal{'\n'}
                  👑 Entrez le code secret pour devenir admin{'\n'}
                  {adminCodeValid && '🎉 Code valide ! Vous serez admin !'}
                </Text>
              </View>
            )}
          </View>

          {/* BOUTON INSCRIPTION */}
          <TouchableOpacity
            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            
            disabled={loading}
            
          >
            
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.registerButtonText}>
                {adminCodeValid ? '👑 Créer Admin' : 'S\'inscrire'}
              </Text>
              
            )}
            
          </TouchableOpacity>

          {/* LIEN CONNEXION */}
          <View style={styles.loginLink}>
            <Text style={styles.loginLinkText}>Déjà un compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLinkButton}>Se connecter</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
  
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  header: { marginBottom: 20 },
  backButton: { fontSize: 32, color: '#007AFF' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#8E8E93', marginBottom: 32 },
  
  accountTypeContainer: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  accountTypeButton: { flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: '#E5E5EA' },
  accountTypeButtonActive: { borderColor: '#007AFF', backgroundColor: '#F0F8FF' },
  accountTypeIcon: { fontSize: 32, marginBottom: 8 },
  accountTypeText: { fontSize: 15, fontWeight: '600', color: '#8E8E93' },
  accountTypeTextActive: { color: '#007AFF' },
  
  form: { marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#000', marginBottom: 8, marginTop: 8 },
  input: { backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 16, borderWidth: 1, borderColor: '#E5E5EA' },
  
  adminTrigger: { alignItems: 'center', padding: 8, marginVertical: 8 },
  adminTriggerText: { fontSize: 24, opacity: 0.3 },
  adminSection: { marginTop: 16, backgroundColor: '#FFF3CD', borderRadius: 12, padding: 16, borderWidth: 2, borderColor: '#FFD700' },
  adminInputContainer: { position: 'relative' },
  adminInput: { backgroundColor: '#FFFAEB', borderColor: '#FFD700', marginBottom: 8 },
  adminInputValid: { borderColor: '#34C759', backgroundColor: '#F0FFF4' },
  adminInputInvalid: { borderColor: '#FF3B30', backgroundColor: '#FFF0F0' },
  adminValidationIcon: { position: 'absolute', right: 16, top: 14, fontSize: 20 },
  adminHint: { fontSize: 12, color: '#8E8E93', marginTop: 4, fontStyle: 'italic', lineHeight: 18 },
  
  registerButton: { backgroundColor: '#007AFF', borderRadius: 12, padding: 16, alignItems: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  registerButtonDisabled: { backgroundColor: '#C7C7CC' },
  registerButtonText: { color: 'white', fontSize: 17, fontWeight: 'bold' },
  
  loginLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginLinkText: { fontSize: 15, color: '#8E8E93' },
  loginLinkButton: { fontSize: 15, color: '#007AFF', fontWeight: '600' },
});