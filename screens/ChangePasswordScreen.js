// screens/ChangePasswordScreen.js
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  EmailAuthProvider, 
  reauthenticateWithCredential, 
  updatePassword 
} from 'firebase/auth';
import { auth } from '../config/firebase';

export default function ChangePasswordScreen({ navigation }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
    // Validations
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit être différent de l\'ancien');
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('Utilisateur non connecté');
      }

      // Ré-authentifier l'utilisateur
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Changer le mot de passe
      await updatePassword(user, newPassword);

      Alert.alert(
        'Succès',
        'Votre mot de passe a été changé avec succès !',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      
      let errorMessage = 'Impossible de changer le mot de passe';
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Mot de passe actuel incorrect';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Le mot de passe est trop faible';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Veuillez vous reconnecter avant de changer votre mot de passe';
      }

      Alert.alert('Erreur', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Changer le mot de passe</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* INFO SÉCURITÉ */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🔒</Text>
          <Text style={styles.infoTitle}>Sécurité</Text>
          <Text style={styles.infoText}>
            Choisissez un mot de passe fort contenant au moins 6 caractères.
          </Text>
        </View>

        {/* FORMULAIRE */}
        <View style={styles.form}>
          {/* MOT DE PASSE ACTUEL */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mot de passe actuel *</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Entrez votre mot de passe actuel"
                placeholderTextColor="#8E8E93"
                secureTextEntry={!showCurrentPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <Text style={styles.eyeIcon}>
                  {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* NOUVEAU MOT DE PASSE */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nouveau mot de passe *</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Entrez le nouveau mot de passe"
                placeholderTextColor="#8E8E93"
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Text style={styles.eyeIcon}>
                  {showNewPassword ? '👁️' : '👁️‍🗨️'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.inputHint}>
              Minimum 6 caractères
            </Text>
          </View>

          {/* CONFIRMER MOT DE PASSE */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmer le mot de passe *</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirmez le nouveau mot de passe"
                placeholderTextColor="#8E8E93"
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Text style={styles.eyeIcon}>
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* BOUTON SAUVEGARDER */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>🔒 Changer le mot de passe</Text>
            )}
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
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
  content: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 15,
    color: '#000',
  },
  eyeButton: {
    padding: 16,
  },
  eyeIcon: {
    fontSize: 20,
  },
  inputHint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  buttonContainer: {
    padding: 20,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
