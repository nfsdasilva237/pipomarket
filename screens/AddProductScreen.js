// screens/AddProductScreen.js - ✅ PHASE 1: AVEC LIMITES ABONNEMENT
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../config/firebase';
import subscriptionService from '../utils/subscriptionService';

export default function AddProductScreen({ navigation, route }) {
  const { startupId } = route.params;
  
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [productImage, setProductImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [startupCategory, setStartupCategory] = useState('');
  const [loading, setLoading] = useState(true);

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
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProductImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur sélection image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProductImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur caméra:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  const selectImageSource = () => {
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

  // ✅ PHASE 1: AJOUTER PRODUIT AVEC VÉRIFICATION LIMITE
  const handleAddProduct = async () => {
    // ✅ 1. VÉRIFIER LIMITE ABONNEMENT
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

    // 2. Validations normales
    if (!productName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom de produit');
      return;
    }

    if (!productImage) {
      Alert.alert('Erreur', 'Veuillez ajouter une image du produit');
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
      const productData = {
        name: productName.trim(),
        description: description.trim(),
        price: parseFloat(price),
        stock: parseInt(stock),
        image: productImage,
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ajouter un produit</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* CATÉGORIE AUTOMATIQUE */}
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryInfoIcon}>📂</Text>
            <View style={styles.categoryInfoText}>
              <Text style={styles.categoryInfoLabel}>Catégorie</Text>
              <Text style={styles.categoryInfoValue}>{startupCategory}</Text>
            </View>
            <Text style={styles.categoryInfoBadge}>✓ Auto</Text>
          </View>

          {/* IMAGE DU PRODUIT */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Image du produit *</Text>
            
            <TouchableOpacity
              style={styles.imagePickerContainer}
              onPress={selectImageSource}
              disabled={uploading}
            >
              {productImage ? (
                <>
                  <Image
                    source={{ uri: productImage }}
                    style={styles.productImagePreview}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.changeImageButton}
                    onPress={selectImageSource}
                  >
                    <Text style={styles.changeImageText}>Changer</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <Text style={styles.imagePickerIcon}>📷</Text>
                  <Text style={styles.imagePickerText}>Ajouter une photo</Text>
                  <Text style={styles.imagePickerHint}>
                    Galerie ou Caméra
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* NOM DU PRODUIT */}
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

          {/* DESCRIPTION */}
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

          {/* PRIX ET STOCK */}
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

          {/* BOUTON AJOUTER */}
          <TouchableOpacity
            style={[styles.addButton, uploading && styles.addButtonDisabled]}
            onPress={handleAddProduct}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="white" />
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
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  keyboardView: {
    flex: 1,
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
    padding: 20,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  categoryInfoIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  categoryInfoText: {
    flex: 1,
  },
  categoryInfoLabel: {
    fontSize: 12,
    color: '#1976D2',
    marginBottom: 2,
  },
  categoryInfoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0D47A1',
  },
  categoryInfoBadge: {
    backgroundColor: '#4CAF50',
    color: 'white',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  imagePickerContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePickerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  imagePickerIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  imagePickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  imagePickerHint: {
    fontSize: 13,
    color: '#8E8E93',
  },
  productImagePreview: {
    width: '100%',
    height: '100%',
  },
  changeImageButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  changeImageText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  textArea: {
    height: 100,
    paddingTop: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 40,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});