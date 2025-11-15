// screens/BDLOrderFormScreen.js - Formulaire de commande service BDL
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
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
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../config/firebase';
import { bdlBranding } from '../data/bdlServicesData';

export default function BDLOrderFormScreen({ route, navigation }) {
  const { serviceId, serviceName, packageId, packageName, packagePrice } = route.params;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    projectDescription: '',
    desiredDate: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Le téléphone est requis';
    } else if (!/^[0-9]{9,}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Numéro de téléphone invalide';
    }

    if (!formData.projectDescription.trim()) {
      newErrors.projectDescription = 'Veuillez décrire votre projet';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumettre la demande
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setLoading(true);

    try {
      const userId = auth.currentUser?.uid;

      // Créer la demande de service
      const orderData = {
        userId: userId || null,
        serviceId,
        serviceName,
        packageId,
        packageName,
        packagePrice,
        customerInfo: {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
        },
        projectDescription: formData.projectDescription.trim(),
        desiredDate: formData.desiredDate.trim() || null,
        status: 'pending', // pending, in_progress, completed, cancelled
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        messages: [], // Pour le chat
      };

      const docRef = await addDoc(collection(db, 'bdlServiceOrders'), orderData);

      // Succès
      Alert.alert(
        'Demande envoyée !',
        `Votre demande de ${serviceName} a été envoyée avec succès.\n\nNuméro de demande : ${docRef.id.substring(0, 8).toUpperCase()}\n\nNous vous contacterons sous peu.`,
        [
          {
            text: 'Voir mes demandes',
            onPress: () => navigation.navigate('MyBDLServices'),
          },
          {
            text: 'Retour à l\'accueil',
            onPress: () => navigation.navigate('HomeTab'),
          },
        ]
      );
    } catch (error) {
      console.error('Erreur création demande:', error);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de l\'envoi de votre demande. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={[styles.header, { backgroundColor: bdlBranding.colors.primary }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>← Retour</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Commander</Text>
            <Text style={styles.headerSubtitle}>{serviceName}</Text>
            <View style={styles.packageBadge}>
              <Text style={styles.packageBadgeText}>{packageName}</Text>
              <Text style={styles.packageBadgePrice}>
                {packagePrice.toLocaleString()} XAF
              </Text>
            </View>
          </View>

          {/* Formulaire */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Vos informations</Text>

            {/* Prénom */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Prénom *</Text>
              <TextInput
                style={[styles.input, errors.firstName && styles.inputError]}
                placeholder="Votre prénom"
                value={formData.firstName}
                onChangeText={(text) => {
                  setFormData({ ...formData, firstName: text });
                  if (errors.firstName) {
                    setErrors({ ...errors, firstName: null });
                  }
                }}
                autoCapitalize="words"
              />
              {errors.firstName && (
                <Text style={styles.errorText}>{errors.firstName}</Text>
              )}
            </View>

            {/* Nom */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom *</Text>
              <TextInput
                style={[styles.input, errors.lastName && styles.inputError]}
                placeholder="Votre nom"
                value={formData.lastName}
                onChangeText={(text) => {
                  setFormData({ ...formData, lastName: text });
                  if (errors.lastName) {
                    setErrors({ ...errors, lastName: null });
                  }
                }}
                autoCapitalize="words"
              />
              {errors.lastName && (
                <Text style={styles.errorText}>{errors.lastName}</Text>
              )}
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="votre.email@example.com"
                value={formData.email}
                onChangeText={(text) => {
                  setFormData({ ...formData, email: text });
                  if (errors.email) {
                    setErrors({ ...errors, email: null });
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Téléphone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Téléphone *</Text>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                placeholder="6 XX XX XX XX"
                value={formData.phone}
                onChangeText={(text) => {
                  setFormData({ ...formData, phone: text });
                  if (errors.phone) {
                    setErrors({ ...errors, phone: null });
                  }
                }}
                keyboardType="phone-pad"
              />
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}
            </View>

            {/* Description du projet */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description du projet *</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  errors.projectDescription && styles.inputError
                ]}
                placeholder="Décrivez votre projet en détail..."
                value={formData.projectDescription}
                onChangeText={(text) => {
                  setFormData({ ...formData, projectDescription: text });
                  if (errors.projectDescription) {
                    setErrors({ ...errors, projectDescription: null });
                  }
                }}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              {errors.projectDescription && (
                <Text style={styles.errorText}>{errors.projectDescription}</Text>
              )}
            </View>

            {/* Date souhaitée */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date souhaitée (optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Dans 2 semaines, 15/03/2025"
                value={formData.desiredDate}
                onChangeText={(text) => setFormData({ ...formData, desiredDate: text })}
              />
              <Text style={styles.helperText}>
                Indiquez quand vous souhaitez recevoir votre commande
              </Text>
            </View>

            {/* Bouton Commander */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: bdlBranding.colors.accent },
                loading && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Envoi en cours...' : 'Envoyer la demande'}
              </Text>
            </TouchableOpacity>

            {/* Info */}
            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <Text style={styles.infoText}>
                Votre demande sera traitée dans les 24h. Vous recevrez une confirmation par email et pourrez suivre l'avancement dans "Mes Services".
              </Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },

  // Header
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  backButton: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
  },
  packageBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  packageBadgePrice: {
    color: '#f4a04b',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Form
  formSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputError: {
    borderColor: '#FF3B30',
    borderWidth: 2,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  helperText: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },

  // Submit Button
  submitButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#f4a04b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#275471',
  },

  // Info Box
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 18,
  },
});
