// screens/AdminCreateBanner.js
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
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
import * as advertisingService from '../utils/advertisingService';

export default function AdminCreateBanner({ navigation }) {
  const [advertiserName, setAdvertiserName] = useState('');
  const [advertiserEmail, setAdvertiserEmail] = useState('');
  const [placement, setPlacement] = useState('home_banner');
  const [imageUrl, setImageUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [price, setPrice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const placements = [
    { id: 'home_banner', label: '🏠 Bannière Accueil', price: '5000' },
    { id: 'category_banner', label: '📂 Bannière Catégorie', price: '3000' },
    { id: 'sponsored_story', label: '📰 Story Sponsorisée', price: '4000' },
    { id: 'search_banner', label: '🔍 Bannière Recherche', price: '3500' },
  ];

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de la permission pour accéder à vos photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUrl(result.assets[0].uri);
    }
  };

  const handleCreateCampaign = async () => {
    if (!advertiserName.trim()) {
      Alert.alert('Erreur', 'Le nom de l\'annonceur est requis');
      return;
    }
    if (!advertiserEmail.trim()) {
      Alert.alert('Erreur', 'L\'email de l\'annonceur est requis');
      return;
    }
    if (!imageUrl) {
      Alert.alert('Erreur', 'L\'image de la bannière est requise');
      return;
    }
    if (!targetUrl.trim()) {
      Alert.alert('Erreur', 'L\'URL de redirection est requise');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      Alert.alert('Erreur', 'Le prix doit être supérieur à 0');
      return;
    }

    setLoading(true);

    try {
      const campaignData = {
        advertiserName: advertiserName.trim(),
        advertiserEmail: advertiserEmail.trim(),
        placement,
        imageUrl,
        targetUrl: targetUrl.trim(),
        price: parseFloat(price),
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      const result = await advertisingService.createCampaign(campaignData);

      if (result.success) {
        Alert.alert(
          'Succès',
          'Campagne publicitaire créée avec succès!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de créer la campagne');
      }
    } catch (error) {
      console.error('Erreur création campagne:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#FF6B9D', '#FF5E88']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📢 Créer Bannière Pub</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Informations Annonceur</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom de l'annonceur *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Orange Cameroun"
                value={advertiserName}
                onChangeText={setAdvertiserName}
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email de contact *</Text>
              <TextInput
                style={styles.input}
                placeholder="contact@orange.cm"
                value={advertiserEmail}
                onChangeText={setAdvertiserEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Placement & Prix</Text>

            <Text style={styles.label}>Type de placement *</Text>
            <View style={styles.placementsGrid}>
              {placements.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.placementCard,
                    placement === p.id && styles.placementCardActive,
                  ]}
                  onPress={() => {
                    setPlacement(p.id);
                    setPrice(p.price);
                  }}
                >
                  <Text style={[
                    styles.placementLabel,
                    placement === p.id && styles.placementLabelActive,
                  ]}>
                    {p.label}
                  </Text>
                  <Text style={[
                    styles.placementPrice,
                    placement === p.id && styles.placementPriceActive,
                  ]}>
                    {p.price} FCFA/jour
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Prix personnalisé (FCFA/jour) *</Text>
              <TextInput
                style={styles.input}
                placeholder="5000"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🖼️ Contenu Publicitaire</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Image de la bannière *</Text>
              <TouchableOpacity style={styles.imagePickerButton} onPress={handlePickImage}>
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderIcon}>🖼️</Text>
                    <Text style={styles.imagePlaceholderText}>Choisir une image</Text>
                    <Text style={styles.imagePlaceholderHint}>Ratio 16:9 recommandé</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>URL de redirection *</Text>
              <TextInput
                style={styles.input}
                placeholder="https://example.com"
                value={targetUrl}
                onChangeText={setTargetUrl}
                keyboardType="url"
                autoCapitalize="none"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Période de Diffusion</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date de début (optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD (défaut: aujourd'hui)"
                value={startDate}
                onChangeText={setStartDate}
                placeholderTextColor="#94a3b8"
              />
              <Text style={styles.hint}>Format: 2024-01-15</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date de fin (optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD (défaut: +30 jours)"
                value={endDate}
                onChangeText={setEndDate}
                placeholderTextColor="#94a3b8"
              />
              <Text style={styles.hint}>Format: 2024-02-15</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleCreateCampaign}
            disabled={loading}
          >
            <LinearGradient
              colors={['#FF6B9D', '#FF5E88']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitButtonGradient}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Création en cours...' : '✓ Créer la Campagne'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.3)', alignItems: 'center', justifyContent: 'center' },
  backButtonText: { fontSize: 24, color: 'white', fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  content: { flex: 1 },
  section: { backgroundColor: 'white', marginHorizontal: 20, marginTop: 20, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0' },
  hint: { fontSize: 12, color: '#94a3b8', marginTop: 6 },
  placementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  placementCard: { flex: 1, minWidth: '45%', backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, borderWidth: 2, borderColor: '#e2e8f0' },
  placementCardActive: { borderColor: '#FF6B9D', backgroundColor: '#FFF5F8' },
  placementLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 4 },
  placementLabelActive: { color: '#FF6B9D' },
  placementPrice: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  placementPriceActive: { color: '#FF6B9D', fontWeight: 'bold' },
  imagePickerButton: { borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed' },
  imagePreview: { width: '100%', height: 200, borderRadius: 12 },
  imagePlaceholder: { paddingVertical: 60, alignItems: 'center', backgroundColor: '#f8fafc' },
  imagePlaceholderIcon: { fontSize: 48, marginBottom: 12 },
  imagePlaceholderText: { fontSize: 15, fontWeight: '600', color: '#475569', marginBottom: 4 },
  imagePlaceholderHint: { fontSize: 12, color: '#94a3b8' },
  submitButton: { marginHorizontal: 20, marginTop: 20, borderRadius: 16, overflow: 'hidden', shadowColor: '#FF6B9D', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  submitButtonGradient: { paddingVertical: 18, alignItems: 'center' },
  submitButtonText: { fontSize: 17, fontWeight: 'bold', color: 'white' },
});