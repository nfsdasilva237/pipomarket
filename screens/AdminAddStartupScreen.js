// screens/AdminAddStartupScreen.js - ✅ VERSION FINALE CORRIGÉE
import * as ImagePicker from 'expo-image-picker';
import { addDoc, collection } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../config/firebase';
import categoryService from '../utils/categoryService';

export default function AdminAddStartupScreen({ navigation }) {
    const insets = useSafeAreaInsets(); // ← Ajouté pour SafeAreaInsets
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  // Champs du formulaire
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(''); // ✅ Vide par défaut
  const [logo, setLogo] = useState('');
  const [logoType, setLogoType] = useState('emoji');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');

  // Catégories dynamiques depuis Firestore
  const [categories, setCategories] = useState([]);

  // Emojis pour logo
  const logoEmojis = [
    '🏪', '🏢', '🎨', '💄', '👗', '💻', '📱', '⚽', '🍔', '🧁',
    '☕', '🎮', '📚', '💊', '🚗', '🏠', '🌱', '🎵', '📷', '✈️'
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const firestoreCategories = await categoryService.getCategoriesWithFallback();
      setCategories(firestoreCategories);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
      Alert.alert('Erreur', 'Impossible de charger les catégories');
    } finally {
      setLoadingCategories(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Nous avons besoin d\'accéder à vos photos pour choisir un logo.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setLogo(result.assets[0].uri);
        setLogoType('image');
      }
    } catch (error) {
      console.error('Erreur sélection image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom de la startup est obligatoire');
      return;
    }

    if (name.trim().length < 3) {
      Alert.alert('Erreur', 'Le nom doit contenir au moins 3 caractères');
      return;
    }

    // ✅ Validation catégorie
    if (!category || category.trim() === '') {
      Alert.alert('Erreur', 'Veuillez sélectionner une catégorie');
      return;
    }

    if (!ownerEmail.trim()) {
      Alert.alert('Erreur', 'L\'email du propriétaire est obligatoire');
      return;
    }

    // Valider format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ownerEmail.trim())) {
      Alert.alert('Erreur', 'Format email invalide');
      return;
    }

    // Valider téléphone si fourni
    if (ownerPhone.trim() && ownerPhone.trim().length < 9) {
      Alert.alert('Erreur', 'Numéro de téléphone invalide');
      return;
    }

    setLoading(true);

    try {
      // Créer startup
      const startupData = {
        name: name.trim(),
        description: description.trim() || '',
        category: category,
        logo: logo || '🏪',
        logoType: logoType,
        ownerName: ownerName.trim() || 'N/A',
        ownerEmail: ownerEmail.trim().toLowerCase(),
        ownerPhone: ownerPhone.trim() || '',
        address: address.trim() || '',
        website: website.trim() || '',
        whatsapp: whatsapp.trim() || '',
        facebook: facebook.trim() || '',
        instagram: instagram.trim() || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        active: true,
        verified: false,
        featured: false,
        products: 0,
        orders: 0,
        totalSales: 0,
        rating: 5.0,
        reviewsCount: 0,
        ownerId: 'admin_created',
        createdByAdmin: true,
      };

      const docRef = await addDoc(collection(db, 'startups'), startupData);

      Alert.alert(
        '✅ Succès !',
        `La startup "${name}" a été créée avec succès.\n\nID: ${docRef.id}`,
        [
          {
            text: 'Voir',
            onPress: () => {
              navigation.replace('StartupDetail', {
                startupId: docRef.id,
                startupName: name,
              });
            },
          },
          {
            text: 'Retour',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Erreur création startup:', error);
      Alert.alert('Erreur', `Impossible de créer la startup: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Nouvelle Startup</Text>
          <Text style={styles.headerSubtitle}>Créer une startup</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* INFO */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Création startup</Text>
            <Text style={styles.infoText}>
              Remplissez les informations ci-dessous pour créer une nouvelle startup sur PipoMarket.
            </Text>
          </View>
        </View>

        {/* LOGO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 Logo de la startup</Text>
          
          <View style={styles.logoPreviewContainer}>
            <View style={styles.logoPreview}>
              {logoType === 'image' && logo ? (
                <Image source={{ uri: logo }} style={styles.logoImage} />
              ) : (
                <Text style={styles.logoEmoji}>{logo || '🏪'}</Text>
              )}
            </View>
            <View style={styles.logoActions}>
              <TouchableOpacity
                style={styles.logoButton}
                onPress={pickImage}
              >
                <Text style={styles.logoButtonText}>📷 Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.logoButton, styles.logoButtonSecondary]}
                onPress={() => {
                  setLogoType('emoji');
                  setLogo('🏪');
                }}
              >
                <Text style={styles.logoButtonText}>😀 Emoji</Text>
              </TouchableOpacity>
            </View>
          </View>

          {logoType === 'emoji' && (
            <>
              <Text style={styles.label}>Choisir un emoji</Text>
              <View style={styles.emojisGrid}>
                {logoEmojis.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiOption,
                      logo === emoji && styles.emojiOptionActive,
                    ]}
                    onPress={() => setLogo(emoji)}
                  >
                    <Text style={styles.emojiOptionText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        {/* INFORMATIONS DE BASE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Informations de base</Text>

          <Text style={styles.label}>Nom de la startup *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Sweet Dreams Bakery"
            value={name}
            onChangeText={setName}
            maxLength={50}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Décrivez l'activité de la startup..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={styles.charCount}>
            {description.length}/500 caractères
          </Text>

          <Text style={styles.label}>Catégorie *</Text>
          {loadingCategories ? (
            <View style={styles.loadingCategories}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Chargement catégories...</Text>
            </View>
          ) : (
            <>
              {!category && (
                <View style={styles.categoryPlaceholder}>
                  <Text style={styles.categoryPlaceholderText}>
                    👆 Sélectionnez une catégorie ci-dessous
                  </Text>
                </View>
              )}
              <View style={styles.categoriesGrid}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      category === cat.name && styles.categoryChipActive,
                    ]}
                    onPress={() => setCategory(cat.name)}
                  >
                    <Text style={styles.categoryChipIcon}>{cat.icon || '📦'}</Text>
                    <Text
                      style={[
                        styles.categoryChipText,
                        category === cat.name && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={styles.label}>Adresse</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Yaoundé, Bastos"
            value={address}
            onChangeText={setAddress}
            maxLength={100}
          />
        </View>

        {/* PROPRIÉTAIRE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Contact propriétaire</Text>

          <Text style={styles.label}>Nom du propriétaire</Text>
          <TextInput
            style={styles.input}
            placeholder="Nom complet"
            value={ownerName}
            onChangeText={setOwnerName}
            maxLength={50}
          />

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="email@example.com"
            value={ownerEmail}
            onChangeText={setOwnerEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            maxLength={100}
          />

          <Text style={styles.label}>Téléphone</Text>
          <TextInput
            style={styles.input}
            placeholder="+237 6XX XXX XXX"
            value={ownerPhone}
            onChangeText={setOwnerPhone}
            keyboardType="phone-pad"
            maxLength={20}
          />
        </View>

        {/* RÉSEAUX SOCIAUX */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌐 Réseaux sociaux (optionnel)</Text>

          <Text style={styles.label}>Site web</Text>
          <TextInput
            style={styles.input}
            placeholder="https://example.com"
            value={website}
            onChangeText={setWebsite}
            keyboardType="url"
            autoCapitalize="none"
            maxLength={100}
          />

          <Text style={styles.label}>WhatsApp</Text>
          <TextInput
            style={styles.input}
            placeholder="+237 6XX XXX XXX"
            value={whatsapp}
            onChangeText={setWhatsapp}
            keyboardType="phone-pad"
            maxLength={20}
          />

          <Text style={styles.label}>Facebook</Text>
          <TextInput
            style={styles.input}
            placeholder="@username ou URL"
            value={facebook}
            onChangeText={setFacebook}
            autoCapitalize="none"
            maxLength={100}
          />

          <Text style={styles.label}>Instagram</Text>
          <TextInput
            style={styles.input}
            placeholder="@username"
            value={instagram}
            onChangeText={setInstagram}
            autoCapitalize="none"
            maxLength={100}
          />
        </View>

        {/* NOTE */}
        <View style={styles.noteCard}>
          <Text style={styles.noteIcon}>⚠️</Text>
          <View style={styles.noteContent}>
            <Text style={styles.noteTitle}>Important</Text>
            <Text style={styles.noteText}>
              Cette startup sera créée sans compte utilisateur. Le propriétaire devra s'inscrire séparément pour gérer ses produits et commandes.
            </Text>
          </View>
        </View>

        {/* BOUTON */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Text style={styles.submitButtonIcon}>🏢</Text>
              <Text style={styles.submitButtonText}>Créer la Startup</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: Math.max(insets.bottom + 20, 80) }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  backButton: { fontSize: 28, color: '#007AFF' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  headerSubtitle: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  placeholder: { width: 28 },
  
  content: { flex: 1 },
  
  infoCard: { flexDirection: 'row', backgroundColor: '#E3F2FD', margin: 16, padding: 16, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#007AFF' },
  infoIcon: { fontSize: 32, marginRight: 12 },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 15, fontWeight: 'bold', color: '#1565C0', marginBottom: 4 },
  infoText: { fontSize: 13, color: '#1565C0', lineHeight: 18 },
  
  section: { backgroundColor: 'white', padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 16 },
  
  logoPreviewContainer: { alignItems: 'center', marginBottom: 20 },
  logoPreview: { width: 120, height: 120, backgroundColor: '#F2F2F7', borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 3, borderColor: '#E5E5EA' },
  logoImage: { width: '100%', height: '100%', borderRadius: 60 },
  logoEmoji: { fontSize: 56 },
  logoActions: { flexDirection: 'row', gap: 12 },
  logoButton: { backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  logoButtonSecondary: { backgroundColor: '#8E8E93' },
  logoButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  
  emojisGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  emojiOption: { width: 50, height: 50, backgroundColor: '#F2F2F7', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#E5E5EA' },
  emojiOptionActive: { borderColor: '#007AFF', backgroundColor: '#E3F2FD' },
  emojiOptionText: { fontSize: 28 },
  
  label: { fontSize: 13, fontWeight: '600', color: '#000', marginBottom: 8, marginTop: 8 },
  input: { backgroundColor: '#F2F2F7', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 16, borderWidth: 1, borderColor: '#E5E5EA' },
  textArea: { height: 100, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: '#8E8E93', marginTop: -12, marginBottom: 12, textAlign: 'right' },
  
  loadingCategories: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12 },
  loadingText: { fontSize: 13, color: '#8E8E93' },
  
  categoryPlaceholder: { backgroundColor: '#FFF9E6', padding: 12, borderRadius: 10, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#FF9500' },
  categoryPlaceholderText: { fontSize: 13, color: '#856404', fontWeight: '600', textAlign: 'center' },
  
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#E5E5EA', gap: 6 },
  categoryChipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  categoryChipIcon: { fontSize: 16 },
  categoryChipText: { fontSize: 13, fontWeight: '600', color: '#8E8E93' },
  categoryChipTextActive: { color: 'white' },
  
  noteCard: { flexDirection: 'row', backgroundColor: '#FFF3CD', margin: 16, padding: 16, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#FF9500' },
  noteIcon: { fontSize: 32, marginRight: 12 },
  noteContent: { flex: 1 },
  noteTitle: { fontSize: 15, fontWeight: 'bold', color: '#856404', marginBottom: 4 },
  noteText: { fontSize: 13, color: '#856404', lineHeight: 18 },
  
  submitButton: { flexDirection: 'row', backgroundColor: '#34C759', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#34C759', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  submitButtonDisabled: { backgroundColor: '#C7C7CC' },
  submitButtonIcon: { fontSize: 24, marginRight: 8 },
  submitButtonText: { color: 'white', fontSize: 17, fontWeight: 'bold' },
});