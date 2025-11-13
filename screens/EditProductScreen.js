// screens/EditProductScreen.js - ✅ COMPLET: MODIFIER + INDISPONIBLE + SUPPRIMER
import * as ImagePicker from 'expo-image-picker';
import { deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
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

export default function EditProductScreen({ navigation, route }) {
  const { productId } = route.params;
  
  const [product, setProduct] = useState(null);
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [productImage, setProductImage] = useState(null);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProduct();
    requestPermissions();
  }, []);

  const loadProduct = async () => {
    try {
      const productDoc = await getDoc(doc(db, 'products', productId));
      
      if (productDoc.exists()) {
        const data = productDoc.data();
        setProduct({ id: productDoc.id, ...data });
        setProductName(data.name || '');
        setDescription(data.description || '');
        setPrice(data.price?.toString() || '');
        setStock(data.stock?.toString() || '');
        setProductImage(data.image || null);
        setAvailable(data.available !== false);
      } else {
        Alert.alert('Erreur', 'Produit introuvable');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Erreur chargement produit:', error);
      Alert.alert('Erreur', 'Impossible de charger le produit');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async () => {
    await ImagePicker.requestCameraPermissionsAsync();
    await ImagePicker.requestMediaLibraryPermissionsAsync();
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

  // ✅ SAUVEGARDER MODIFICATIONS
  const handleSaveProduct = async () => {
    if (!productName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom de produit');
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

    setSaving(true);

    try {
      const productData = {
        name: productName.trim(),
        description: description.trim(),
        price: parseFloat(price),
        stock: parseInt(stock),
        image: productImage,
        available: available,
        updatedAt: new Date(),
      };

      await updateDoc(doc(db, 'products', productId), productData);

      Alert.alert(
        '✅ Succès',
        'Produit mis à jour avec succès !',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Erreur mise à jour produit:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le produit');
    } finally {
      setSaving(false);
    }
  };

  // ✅ MARQUER DISPONIBLE/INDISPONIBLE
  const handleToggleAvailability = async () => {
    const newStatus = !available;
    
    Alert.alert(
      newStatus ? '✅ Rendre disponible' : '❌ Marquer indisponible',
      `Voulez-vous ${newStatus ? 'rendre ce produit disponible' : 'marquer ce produit comme indisponible'} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'products', productId), {
                available: newStatus,
                updatedAt: new Date(),
              });

              setAvailable(newStatus);
              
              Alert.alert(
                'Succès',
                `Produit ${newStatus ? 'disponible' : 'indisponible'}`
              );
            } catch (error) {
              console.error('Erreur changement disponibilité:', error);
              Alert.alert('Erreur', 'Impossible de changer la disponibilité');
            }
          },
        },
      ]
    );
  };

  // ✅ SUPPRIMER PRODUIT
  const handleDeleteProduct = () => {
    Alert.alert(
      '🗑️ Supprimer le produit',
      'Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'products', productId));
              
              Alert.alert(
                '✅ Produit supprimé',
                'Le produit a été supprimé avec succès',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              console.error('Erreur suppression produit:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le produit');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
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
          <Text style={styles.headerTitle}>Modifier le produit</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* IMAGE DU PRODUIT */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Image du produit</Text>
            
            <TouchableOpacity
              style={styles.imagePickerContainer}
              onPress={selectImageSource}
              disabled={saving}
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

          {/* ✅ DISPONIBILITÉ */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.availabilityCard,
                { backgroundColor: available ? '#E8F5E9' : '#FFEBEE' }
              ]}
              onPress={handleToggleAvailability}
            >
              <View style={styles.availabilityLeft}>
                <Text style={styles.availabilityIcon}>
                  {available ? '✅' : '❌'}
                </Text>
                <View>
                  <Text style={styles.availabilityTitle}>
                    {available ? 'Produit disponible' : 'Produit indisponible'}
                  </Text>
                  <Text style={styles.availabilitySubtitle}>
                    {available 
                      ? 'Les clients peuvent commander' 
                      : 'Masqué pour les clients'}
                  </Text>
                </View>
              </View>
              <Text style={styles.availabilityAction}>
                {available ? 'Rendre indisponible' : 'Rendre disponible'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ✅ BOUTON SAUVEGARDER */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSaveProduct}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>💾 Sauvegarder les modifications</Text>
            )}
          </TouchableOpacity>

          {/* ✅ BOUTON SUPPRIMER */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteProduct}
          >
            <Text style={styles.deleteButtonIcon}>🗑️</Text>
            <Text style={styles.deleteButtonText}>Supprimer le produit</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#8E8E93',
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
  // ✅ CARTE DISPONIBILITÉ
  availabilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  availabilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  availabilityIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  availabilityTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  availabilitySubtitle: {
    fontSize: 13,
    color: '#666',
  },
  availabilityAction: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
  // ✅ BOUTON SAUVEGARDER
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // ✅ BOUTON SUPPRIMER
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  deleteButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});