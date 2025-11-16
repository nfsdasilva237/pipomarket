// screens/LoginScreen.js - AVEC DÉTECTION RÔLE AUTOMATIQUE
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../config/firebase';
import adminService from '../utils/adminService';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert(
        'Email requis',
        'Veuillez entrer votre adresse email pour réinitialiser votre mot de passe'
      );
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Email envoyé ✅',
        `Un email de réinitialisation a été envoyé à ${email}. Vérifiez votre boîte de réception (et les spams).`
      );
    } catch (error) {
      console.error('Erreur reset password:', error);

      let errorMessage = 'Une erreur est survenue';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Aucun compte trouvé avec cet email';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Adresse email invalide';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Trop de tentatives. Réessayez plus tard';
      }

      Alert.alert('Erreur', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);

    try {
      // Connexion Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Récupérer le rôle
      const role = await adminService.getUserRole(user.uid);

      // Navigation selon le rôle
      if (role === 'admin') {
        navigation.replace('AdminDashboard');
      } else if (role === 'startup') {
        navigation.replace('StartupDashboard', { startupId: user.uid });
      } else if (role === 'ambassador') {
        navigation.replace('AmbassadorDashboard');
      } else {
        navigation.replace('Home');
      }
    } catch (error) {
      console.error('Erreur connexion:', error);
      
      let errorMessage = 'Une erreur est survenue';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Aucun compte trouvé avec cet email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Mot de passe incorrect';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email invalide';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Trop de tentatives. Réessayez plus tard';
      }
      
      Alert.alert('Erreur de connexion', errorMessage);
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
        <View style={styles.content}>
          {/* LOGO */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>PipoMarket</Text>
            <Text style={styles.subtitle}>Marketplace des Startups</Text>
          </View>

          {/* FORMULAIRE */}
          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="votre@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />

            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />

            <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
              <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          </View>

          {/* BOUTON CONNEXION */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.loginButtonText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          {/* LIEN INSCRIPTION */}
          <View style={styles.registerLink}>
            <Text style={styles.registerLinkText}>Pas encore de compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLinkButton}>S'inscrire</Text>
            </TouchableOpacity>
          </View>

          {/* INFO RÔLES */}
          <View style={styles.rolesInfo}>
            <Text style={styles.rolesInfoTitle}>Connexion automatique selon votre rôle :</Text>
            <Text style={styles.rolesInfoItem}>👤 Client → Marketplace</Text>
            <Text style={styles.rolesInfoItem}>🏢 Startup → Dashboard Vendeur</Text>
            <Text style={styles.rolesInfoItem}>👑 Admin → Panel Admin</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  keyboardView: { flex: 1 },
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  
  logoContainer: { alignItems: 'center', marginBottom: 48 },
  logo: { width: 120, height: 80, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#8E8E93' },
  
  form: { marginBottom: 24 },
  label: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 8 },
  input: { backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 16, borderWidth: 1, borderColor: '#E5E5EA' },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 8 },
  forgotPasswordText: { fontSize: 14, color: '#007AFF', fontWeight: '500' },
  
  loginButton: { backgroundColor: '#007AFF', borderRadius: 12, padding: 16, alignItems: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  loginButtonDisabled: { backgroundColor: '#C7C7CC' },
  loginButtonText: { color: 'white', fontSize: 17, fontWeight: 'bold' },
  
  registerLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  registerLinkText: { fontSize: 15, color: '#8E8E93' },
  registerLinkButton: { fontSize: 15, color: '#007AFF', fontWeight: '600' },
  
  rolesInfo: { marginTop: 32, backgroundColor: 'white', borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: '#007AFF' },
  rolesInfoTitle: { fontSize: 13, fontWeight: '600', color: '#000', marginBottom: 8 },
  rolesInfoItem: { fontSize: 12, color: '#8E8E93', marginTop: 4 },
});