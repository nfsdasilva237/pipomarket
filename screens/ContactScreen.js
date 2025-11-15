// screens/ContactScreen.js - Formulaire de contact BDL Studio
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ContactScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleWhatsAppContact = () => {
    if (!name || !phone || !message) {
      Alert.alert('Champs requis', 'Veuillez remplir au moins votre nom, téléphone et message.');
      return;
    }

    const whatsappNumber = '237XXXXXXXXX'; // À REMPLACER par le numéro BDL Studio
    const text = `Bonjour BDL Studio,\n\nNom: ${name}\nEmail: ${email || 'Non fourni'}\nTéléphone: ${phone}\n\nMessage:\n${message}`;
    const url = `whatsapp://send?phone=${whatsappNumber}&text=${encodeURIComponent(text)}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Erreur', 'WhatsApp n\'est pas installé sur votre appareil.');
        }
      })
      .catch((err) => {
        console.error('Erreur WhatsApp:', err);
        Alert.alert('Erreur', 'Impossible d\'ouvrir WhatsApp.');
      });
  };

  const handleEmailContact = () => {
    if (!name || !email || !message) {
      Alert.alert('Champs requis', 'Veuillez remplir au moins votre nom, email et message.');
      return;
    }

    const emailAddress = 'contact@bdlstudio.com'; // À REMPLACER par l'email BDL Studio
    const subject = 'Demande de contact - PipoMarket';
    const body = `Nom: ${name}\nEmail: ${email}\nTéléphone: ${phone || 'Non fourni'}\n\nMessage:\n${message}`;
    const url = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    Linking.openURL(url).catch((err) => {
      console.error('Erreur email:', err);
      Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application email.');
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <LinearGradient
          colors={['#275471', '#f4a04b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <Text style={styles.heroIcon}>📞</Text>
          <Text style={styles.heroTitle}>Contactez-nous</Text>
          <Text style={styles.heroSubtitle}>
            Notre équipe est à votre disposition
          </Text>
        </LinearGradient>

        {/* FORMULAIRE */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Envoyez-nous un message</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom complet *</Text>
            <TextInput
              style={styles.input}
              placeholder="Votre nom"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="votre.email@exemple.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Téléphone *</Text>
            <TextInput
              style={styles.input}
              placeholder="6XXXXXXXX"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Message *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Décrivez votre besoin..."
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholderTextColor="#999"
            />
          </View>

          {/* BOUTONS */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleWhatsAppContact}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#25D366', '#128C7E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitGradient}
            >
              <Text style={styles.submitIcon}>💬</Text>
              <Text style={styles.submitText}>Envoyer via WhatsApp</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.emailButton}
            onPress={handleEmailContact}
            activeOpacity={0.8}
          >
            <Text style={styles.emailIcon}>📧</Text>
            <Text style={styles.emailText}>Envoyer par Email</Text>
          </TouchableOpacity>
        </View>

        {/* CONTACT DIRECT */}
        <View style={styles.directContact}>
          <Text style={styles.sectionTitle}>Nous joindre directement</Text>

          <View style={styles.contactCard}>
            <Text style={styles.contactIcon}>📱</Text>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Téléphone</Text>
              <Text style={styles.contactValue}>+237 X XX XX XX XX</Text>
            </View>
          </View>

          <View style={styles.contactCard}>
            <Text style={styles.contactIcon}>📧</Text>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>contact@bdlstudio.com</Text>
            </View>
          </View>

          <View style={styles.contactCard}>
            <Text style={styles.contactIcon}>📍</Text>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Adresse</Text>
              <Text style={styles.contactValue}>Douala, Cameroun</Text>
            </View>
          </View>
        </View>

        <View style={{ height: Math.max(insets.bottom + 20, 80) }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },

  // HERO
  hero: {
    padding: 32,
    paddingTop: 48,
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  heroIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
  },

  // FORM
  formSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 16,
  },

  // BUTTONS
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitIcon: {
    fontSize: 20,
  },
  submitText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  emailButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#275471',
  },
  emailIcon: {
    fontSize: 20,
  },
  emailText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#275471',
  },

  // DIRECT CONTACT
  directContact: {
    padding: 20,
    paddingTop: 0,
  },
  contactCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  contactIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
});
