// screens/AdminCreateStartupScreen.js - ✅ AVEC IMGBB
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
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

import { db } from '../config/firebase';
import { uploadImage } from '../utils/imageUpload';

export default function AdminCreateStartupScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [startupName, setStartupName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [description, setDescription] = useState('');

  const [logoImage, setLogoImage] = useState(null);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const [generatedCode, setGeneratedCode] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const catsSnap = await getDocs(collection(db, 'categories'));
      const catsData = catsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(catsData);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
    }
  };

  const generateAccessCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'STARTUP-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const pickLogo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Nous avons besoin de la permission pour accéder à vos photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setLogoImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur sélection image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const handleCreateStartup = async () => {
    if (!startupName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le nom de la startup');
      return;
    }

    if (!ownerName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le nom du propriétaire');
      return;
    }

    if (!ownerEmail.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer l\'email du propriétaire');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Erreur', 'Veuillez sélectionner une catégorie');
      return;
    }

    setLoading(true);

    try {
      const startupId = `startup_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const accessCode = generateAccessCode();
      setGeneratedCode(accessCode);

      // ✅ Upload logo avec ImgBB
      let logoURL = '';
      if (logoImage) {
        setUploadingLogo(true);
        try {
          logoURL = await uploadImage(logoImage, 'startups', startupId);
          console.log('✅ Logo uploadé:', logoURL);
        } catch (uploadError) {
          console.error('Erreur upload logo:', uploadError);
        }
        setUploadingLogo(false);
      }

      const startupData = {
        name: startupName.trim(),
        ownerName: ownerName.trim(),
        ownerEmail: ownerEmail.trim(),
        ownerPhone: ownerPhone.trim() || '',
        description: description.trim() || '',
        category: selectedCategory,
        logo: logoURL,
        accessCode: accessCode,
        createdAt: new Date(),
        createdBy: 'admin',
        active: true,
        verified: true,
        products: 0,
        rating: 5.0,
        totalSales: 0,
        revenue: 0,
      };

      await setDoc(doc(db, 'startups', startupId), startupData);

      Alert.alert(
        '🎉 Startup créée !',
        `La startup "${startupName}" a été créée avec succès.\n\n` +
        `📧 Email: ${ownerEmail}\n` +
        `📂 Catégorie: ${selectedCategory}\n\n` +
        `🔑 CODE D'ACCÈS:\n${accessCode}\n\n` +
        `Envoyez ce code au propriétaire pour qu'il puisse accéder à son tableau de bord.`,
        [
          {
            text: 'Copier le code',
            onPress: () => {
              Alert.alert('Code', accessCode);
            }
          },
          {
            text: 'Retour',
            onPress: () => navigation.goBack(),
            style: 'cancel'
          }
        ]
      );

    } catch (error) {
      console.error('Erreur création startup:', error);
      Alert.alert('Erreur', 'Impossible de créer la startup. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#10d98c', '#0fd483', '#0bc977']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerIcon}>➕</Text>
            <Text style={styles.headerTitle}>Créer Startup</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

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
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>📋 Informations de la Startup</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>🏢 Nom de la startup *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: TechSolutions Cameroun"
                placeholderTextColor="#999"
                value={startupName}
                onChangeText={setStartupName}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>👤 Nom du propriétaire *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Jean Dupont"
                placeholderTextColor="#999"
                value={ownerName}
                onChangeText={setOwnerName}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>📧 Email du propriétaire *</Text>
              <TextInput
                style={styles.input}
                placeholder="proprietaire@email.com"
                placeholderTextColor="#999"
                value={ownerEmail}
                onChangeText={setOwnerEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>📞 Téléphone (optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="+237 6XX XXX XXX"
                placeholderTextColor="#999"
                value={ownerPhone}
                onChangeText={setOwnerPhone}
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>📝 Description (optionnel)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Décrivez brièvement l'activité de la startup..."
                placeholderTextColor="#999"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>📂 Catégorie *</Text>
              <TouchableOpacity
                style={[
                  styles.categorySelector,
                  selectedCategory && styles.categorySelectorSelected,
                ]}
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                disabled={loading}
              >
                <Text style={[
                  styles.categorySelectorText,
                  !selectedCategory && styles.categorySelectorPlaceholder,
                ]}>
                  {selectedCategory || 'Sélectionner une catégorie'}
                </Text>
                <Text style={styles.categorySelectorIcon}>
                  {showCategoryPicker ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>

              {showCategoryPicker && (
                <View style={styles.categoryList}>
                  <ScrollView style={styles.categoryScroll} nestedScrollEnabled>
                    {categories.length === 0 ? (
                      <Text style={styles.noCategoriesText}>
                        Aucune catégorie disponible
                      </Text>
                    ) : (
                      categories.map((cat) => (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            styles.categoryItem,
                            selectedCategory === (cat.name || cat.id) && styles.categoryItemSelected,
                          ]}
                          onPress={() => {
                            setSelectedCategory(cat.name || cat.id);
                            setShowCategoryPicker(false);
                          }}
                        >
                          <Text style={styles.categoryItemEmoji}>
                            {cat.emoji || '📦'}
                          </Text>
                          <Text style={[
                            styles.categoryItemText,
                            selectedCategory === (cat.name || cat.id) && styles.categoryItemTextSelected,
                          ]}>
                            {cat.name || cat.id}
                          </Text>
                          {selectedCategory === (cat.name || cat.id) && (
                            <Text style={styles.categoryItemCheck}>✓</Text>
                          )}
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>🖼️ Logo (optionnel)</Text>
              <TouchableOpacity
                style={styles.logoPickerButton}
                onPress={pickLogo}
                disabled={loading}
              >
                {logoImage ? (
                  <View style={styles.logoPreviewContainer}>
                    <Image
                      source={{ uri: logoImage }}
                      style={styles.logoPreview}
                    />
                    <View style={styles.logoOverlay}>
                      <Text style={styles.logoOverlayText}>Changer</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Text style={styles.logoPlaceholderIcon}>📷</Text>
                    <Text style={styles.logoPlaceholderText}>
                      Ajouter un logo
                    </Text>
                    <Text style={styles.logoPlaceholderHint}>
                      Format carré recommandé
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              {logoImage && (
                <TouchableOpacity
                  style={styles.removeLogo}
                  onPress={() => setLogoImage(null)}
                >
                  <Text style={styles.removeLogoText}>✕ Supprimer le logo</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>💡</Text>
              <Text style={styles.infoText}>
                Un code d'accès unique sera généré automatiquement. Vous pourrez l'envoyer au propriétaire pour qu'il accède à son tableau de bord.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.createButton, (loading || uploadingLogo) && styles.createButtonDisabled]}
              onPress={handleCreateStartup}
              disabled={loading || uploadingLogo}
            >
              {loading || uploadingLogo ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="white" />
                  <Text style={styles.loadingText}>
                    {uploadingLogo ? 'Upload du logo...' : 'Création...'}
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.createButtonText}>Créer la startup</Text>
                  <Text style={styles.createButtonIcon}>✓</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  header: { paddingHorizontal: 20, paddingVertical: 20, shadowColor: '#10d98c', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backButtonText: { fontSize: 24, color: 'white', fontWeight: 'bold' },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  headerIcon: { fontSize: 28, marginRight: 12 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  formCard: { backgroundColor: 'white', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 6 },
  formTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 24 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: { backgroundColor: '#F8F9FA', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, borderWidth: 1, borderColor: '#E5E5EA' },
  textArea: { minHeight: 100, paddingTop: 14 },
  categorySelector: { backgroundColor: '#F8F9FA', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#E5E5EA', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categorySelectorSelected: { borderColor: '#10d98c', backgroundColor: '#F0FFF4' },
  categorySelectorText: { fontSize: 15, color: '#333' },
  categorySelectorPlaceholder: { color: '#999' },
  categorySelectorIcon: { fontSize: 12, color: '#666' },
  categoryList: { backgroundColor: 'white', borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: '#E5E5EA', maxHeight: 200, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  categoryScroll: { maxHeight: 200 },
  noCategoriesText: { padding: 16, textAlign: 'center', color: '#999', fontStyle: 'italic' },
  categoryItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  categoryItemSelected: { backgroundColor: '#F0FFF4' },
  categoryItemEmoji: { fontSize: 20, marginRight: 12 },
  categoryItemText: { flex: 1, fontSize: 15, color: '#333' },
  categoryItemTextSelected: { color: '#10d98c', fontWeight: '600' },
  categoryItemCheck: { fontSize: 16, color: '#10d98c', fontWeight: 'bold' },
  logoPickerButton: { borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#E5E5EA', borderStyle: 'dashed' },
  logoPreviewContainer: { position: 'relative' },
  logoPreview: { width: '100%', height: 150, borderRadius: 14 },
  logoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, alignItems: 'center' },
  logoOverlayText: { color: 'white', fontWeight: '600', fontSize: 14 },
  logoPlaceholder: { padding: 30, alignItems: 'center', backgroundColor: '#F8F9FA' },
  logoPlaceholderIcon: { fontSize: 40, marginBottom: 10 },
  logoPlaceholderText: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  logoPlaceholderHint: { fontSize: 12, color: '#8E8E93' },
  removeLogo: { marginTop: 8, alignItems: 'center' },
  removeLogoText: { color: '#FF3B30', fontSize: 14, fontWeight: '600' },
  infoBox: { flexDirection: 'row', backgroundColor: '#F0F8FF', borderRadius: 12, padding: 16, marginBottom: 24, alignItems: 'flex-start', borderWidth: 1, borderColor: '#E0F0FF' },
  infoIcon: { fontSize: 24, marginRight: 12 },
  infoText: { flex: 1, fontSize: 14, color: '#007AFF', lineHeight: 20 },
  createButton: { backgroundColor: '#10d98c', borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#10d98c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  createButtonDisabled: { backgroundColor: '#C7C7CC', shadowOpacity: 0 },
  createButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginRight: 8 },
  createButtonIcon: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center' },
  loadingText: { color: 'white', fontSize: 15, fontWeight: '600', marginLeft: 10 },
});