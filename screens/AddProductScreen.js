// screens/AddProductScreen.js - ✅ AVEC 5 PHOTOS + IMGBB
import * as ImagePicker from 'expo-image-picker';
import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../config/firebase';
import { uploadImage } from '../utils/imageUpload';
import subscriptionService from '../utils/subscriptionService';

export default function AddProductScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { startupId } = route.params;
  
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [productImages, setProductImages] = useState([]); // ✅ Tableau de 5 images
  const [uploading, setUploading] = useState(false);
  const [startupCategory, setStartupCategory] = useState('');
  const [loading, setLoading] = useState(true);

  const MAX_IMAGES = 5;

  useEffect(() => {
    loadStartupInfo();
    requestPermissions();
  }, []);

  const loadStartupInfo = async () => {
    try {
      const startupDoc = await getDoc(doc(db, 'startups', startupId));
      if (startupDoc.exists()) {
        const data = startupDoc.data();
        setStartupCategory(data.category || 'Autre');
      }
    } catch (error) {
      console.error('Erreur chargement startup:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        'Permissions requises',
        'Nous avons besoin des permissions pour accéder à vos photos'
      );
    }
  };

  const pickImageFromGallery = async () => {
    if (productImages.length >= MAX_IMAGES) {
      Alert.alert('Limite atteinte', `Vous pouvez ajouter maximum ${MAX_IMAGES} photos`);
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProductImages([...productImages, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Erreur sélection image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const takePhoto = async () => {
    if (productImages.length >= MAX_IMAGES) {
      Alert.alert('Limite atteinte', `Vous pouvez ajouter maximum ${MAX_IMAGES} photos`);
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProductImages([...productImages, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Erreur caméra:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  const selectImageSource = () => {
    if (productImages.length >= MAX_IMAGES) {
      Alert.alert('Limite atteinte', `Vous pouvez ajouter maximum ${MAX_IMAGES} photos`);
      return;
    }

    Alert.alert(
      'Choisir une image',
      'Sélectionnez la source de l\'image du produit',
      [
        { text: 'Galerie', onPress: pickImageFromGallery },
        { text: 'Caméra', onPress: takePhoto },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const removeImage = (index) => {
    Alert.alert(
      'Supprimer la photo',
      'Voulez-vous vraiment supprimer cette photo ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            const newImages = productImages.filter((_, i) => i !== index);
            setProductImages(newImages);
          },
        },
      ]
    );
  };

  const handleAddProduct = async () => {
    // Vérifier limite abonnement
    const canAdd = await subscriptionService.canAddProduct(startupId);
    
    if (!canAdd.allowed) {
      Alert.alert(
        '⚠️ Limite atteinte',
        `${canAdd.reason}\n\nVous avez utilisé ${canAdd.current}/${canAdd.max} produits.\n\n💡 Passez à un plan supérieur pour ajouter plus de produits.`,
        [
          { text: 'Plus tard', style: 'cancel' },
          {
            text: '⬆️ Améliorer mon plan',
            onPress: () => navigation.navigate('ManageSubscription', { startupId }),
          },
        ]
      );
      return;
    }

    // Validations
    if (!productName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom de produit');
      return;
    }

    if (productImages.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins une image du produit');
      return;
    }

    if (!price || isNaN(parseFloat(price))) {
      Alert.alert('Erreur', 'Veuillez entrer un prix valide');
      return;
    }

    if (!stock || isNaN(parseInt(stock))) {
      Alert.alert('Erreur', 'Veuillez entrer un stock valide');
      return;
    }

    setUploading(true);

    try {
      // ✅ Upload toutes les images avec ImgBB
      const uploadedImageUrls = [];
      
      for (let i = 0; i < productImages.length; i++) {
        const imageUri = productImages[i];
        
        if (imageUri && !imageUri.startsWith('http')) {
          try {
            console.log(`📤 Upload image ${i + 1}/${productImages.length}...`);
            const uploadedUrl = await uploadImage(imageUri, 'products', `product_${Date.now()}_${i}`);
            uploadedImageUrls.push(uploadedUrl);
            console.log(`✅ Image ${i + 1} uploadée:`, uploadedUrl);
          } catch (uploadError) {
            console.error(`❌ Erreur upload image ${i + 1}:`, uploadError);
            Alert.alert('Erreur', `Impossible d'uploader l'image ${i + 1}`);
            setUploading(false);
            return;
          }
        } else if (imageUri) {
          uploadedImageUrls.push(imageUri);
        }
      }

      const productData = {
        name: productName.trim(),
        description: description.trim(),
        price: parseFloat(price),
        stock: parseInt(stock),
        images: uploadedImageUrls, // ✅ Tableau d'images
        image: uploadedImageUrls[0], // ✅ Image principale (pour compatibilité)
        category: startupCategory,
        startupId: startupId,
        available: true,
        createdAt: new Date(),
        createdBy: auth.currentUser.uid,
      };

      await addDoc(collection(db, 'products'), productData);

      Alert.alert(
        '✅ Succès',
        'Produit ajouté avec succès !',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Erreur ajout produit:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le produit');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ajouter un produit</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryInfoIcon}>📂</Text>
            <View style={styles.categoryInfoText}>
              <Text style={styles.categoryInfoLabel}>Catégorie</Text>
              <Text style={styles.categoryInfoValue}>{startupCategory}</Text>
            </View>
            <Text style={styles.categoryInfoBadge}>✓ Auto</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Photos du produit *</Text>
              <Text style={styles.photoCounter}>{productImages.length}/{MAX_IMAGES}</Text>
            </View>
            
            {/* ✅ Grille de photos */}
            <View style={styles.imagesGrid}>
              {productImages.map((uri, index) => (
                <View key={index} style={styles.imageItem}>
                  <Image
                    source={{ uri }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  {index === 0 && (
                    <View style={styles.mainImageBadge}>
                      <Text style={styles.mainImageText}>Principal</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Text style={styles.removeImageText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              
              {/* ✅ Bouton ajouter photo */}
              {productImages.length < MAX_IMAGES && (
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={selectImageSource}
                  disabled={uploading}
                >
                  <Text style={styles.addImageIcon}>📷</Text>
                  <Text style={styles.addImageText}>Ajouter</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <Text style={styles.photoHint}>
              💡 La première photo sera l'image principale du produit
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Nom du produit *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Savon naturel au karité"
              value={productName}
              onChangeText={setProductName}
              placeholderTextColor="#8E8E93"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Décrivez votre produit..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#8E8E93"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.section, styles.halfWidth]}>
              <Text style={styles.label}>Prix (FCFA) *</Text>
              <TextInput
                style={styles.input}
                placeholder="5000"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={[styles.section, styles.halfWidth]}>
              <Text style={styles.label}>Stock *</Text>
              <TextInput
                style={styles.input}
                placeholder="50"
                value={stock}
                onChangeText={setStock}
                keyboardType="numeric"
                placeholderTextColor="#8E8E93"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.addButton, uploading && styles.addButtonDisabled]}
            onPress={handleAddProduct}
            disabled={uploading}
          >
            {uploading ? (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator color="white" />
                <Text style={styles.uploadingText}>
                  Upload en cours ({productImages.length} photos)...
                </Text>
              </View>
            ) : (
              <Text style={styles.addButtonText}>Ajouter le produit</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  keyboardView: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  backButton: { fontSize: 28, color: '#007AFF' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  placeholder: { width: 40 },
  content: { flex: 1, padding: 20 },
  categoryInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD', borderRadius: 12, padding: 16, marginBottom: 20 },
  categoryInfoIcon: { fontSize: 32, marginRight: 12 },
  categoryInfoText: { flex: 1 },
  categoryInfoLabel: { fontSize: 12, color: '#1976D2', marginBottom: 2 },
  categoryInfoValue: { fontSize: 16, fontWeight: 'bold', color: '#0D47A1' },
  categoryInfoBadge: { backgroundColor: '#4CAF50', color: 'white', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, fontSize: 12, fontWeight: 'bold' },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  photoCounter: { fontSize: 14, fontWeight: '600', color: '#007AFF', backgroundColor: '#E3F2FD', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  
  // ✅ Grille de photos
  imagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  imageItem: { width: '30%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', position: 'relative', backgroundColor: '#F2F2F7' },
  imagePreview: { width: '100%', height: '100%' },
  mainImageBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#007AFF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  mainImageText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  removeImageButton: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255, 59, 48, 0.9)', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  removeImageText: { color: 'white', fontSize: 16, fontWeight: 'bold', lineHeight: 16 },
  addImageButton: { width: '30%', aspectRatio: 1, borderRadius: 12, backgroundColor: 'white', borderWidth: 2, borderColor: '#007AFF', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  addImageIcon: { fontSize: 32, marginBottom: 4 },
  addImageText: { fontSize: 12, fontWeight: '600', color: '#007AFF' },
  photoHint: { fontSize: 12, color: '#8E8E93', marginTop: 8, fontStyle: 'italic' },
  
  label: { fontSize: 14, fontWeight: '600', color: '#000', marginBottom: 8 },
  input: { backgroundColor: 'white', borderRadius: 12, padding: 16, fontSize: 15, color: '#000', borderWidth: 1, borderColor: '#E5E5EA' },
  textArea: { height: 100, paddingTop: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  halfWidth: { flex: 1 },
  addButton: { backgroundColor: '#007AFF', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 12, marginBottom: 40 },
  addButtonDisabled: { opacity: 0.5 },
  addButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  uploadingContainer: { flexDirection: 'row', alignItems: 'center' },
  uploadingText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 12 },
});