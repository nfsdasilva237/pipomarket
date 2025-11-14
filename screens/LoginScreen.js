// screens/LoginScreen.js - VERSION MODERNE
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { auth } from '../config/firebase';
import adminService from '../utils/adminService';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Email ou mot de passe incorrect';
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
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* HEADER AVEC LOGO */}
          <View style={styles.header}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.welcomeText}>Bon retour!</Text>
            <Text style={styles.title}>Connectez-vous</Text>
            <Text style={styles.subtitle}>Accédez à votre compte PipoMarket</Text>
          </View>

          {/* CARTE FORMULAIRE */}
          <View style={styles.formCard}>
            {/* EMAIL */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>📧 Email</Text>
              <TextInput
                style={styles.input}
                placeholder="votre@email.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            {/* MOT DE PASSE */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>🔒 Mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            {/* MOT DE PASSE OUBLIÉ */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Mot de passe oublié?</Text>
            </TouchableOpacity>

            {/* BOUTON CONNEXION */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Se connecter</Text>
                  <Text style={styles.loginButtonIcon}>→</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* SÉPARATEUR */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* INSCRIPTION */}
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerButtonText}>Créer un compte</Text>
          </TouchableOpacity>

          {/* INFO RÔLES */}
          <View style={styles.rolesInfo}>
            <Text style={styles.rolesInfoTitle}>💡 Connexion automatique</Text>
            <View style={styles.rolesGrid}>
              <View style={styles.roleItem}>
                <Text style={styles.roleIcon}>👤</Text>
                <Text style={styles.roleText}>Client</Text>
              </View>
              <View style={styles.roleItem}>
                <Text style={styles.roleIcon}>🏢</Text>
                <Text style={styles.roleText}>Startup</Text>
              </View>
              <View style={styles.roleItem}>
                <Text style={styles.roleIcon}>👥</Text>
                <Text style={styles.roleText}>Ambassadeur</Text>
              </View>
              <View style={styles.roleItem}>
                <Text style={styles.roleIcon}>👑</Text>
                <Text style={styles.roleText}>Admin</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#007AFF' },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 24,
    tintColor: 'white',
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
  },

  // Formulaire
  formCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },

  inputContainer: { marginBottom: 20 },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },

  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },

  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    backgroundColor: '#C7C7CC',
    shadowOpacity: 0,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  loginButtonIcon: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 40,
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 16,
  },

  // Inscription
  registerButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Rôles
  rolesInfo: {
    marginHorizontal: 20,
    marginTop: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  rolesInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 12,
  },
  roleItem: {
    alignItems: 'center',
    width: 70,
  },
  roleIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  roleText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    textAlign: 'center',
  },
});
