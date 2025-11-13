// screens/EditProfileScreen.js (AVEC UPLOAD PHOTO)
import * as ImagePicker from 'expo-image-picker';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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

export default function EditProfileScreen({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUserData();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Nous avons besoin de votre permission pour accéder à vos photos'
        );
      }
    }
  };

  const loadUserData = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const userDoc = await getDoc(doc(db, 'users', userId));
      const data = userDoc.data();

      setFirstName(data?.firstName || '');
      setLastName(data?.lastName || '');
      setPhone(data?.phone || '');
      setPhotoUri(data?.photoURL || null);
    } catch (error) {
      console.error('Erreur chargement profil:', error);
      Alert.alert('Erreur', 'Impossible de charger vos informations');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur sélection image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Nous avons besoin de votre permission pour accéder à la caméra'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur prise de photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre une photo');
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Photo de profil',
      'Choisissez une option',
      [
        {
          text: 'Prendre une photo',
          onPress: takePhoto,
        },
        {
          text: 'Choisir de la galerie',
          onPress: pickImage,
        },
        {
          text: 'Supprimer la photo',
          onPress: () => setPhotoUri(null),
          style: 'destructive',
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  };

  const handleSave = async () => {
    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Erreur', 'Le prénom et le nom sont obligatoires');
      return;
    }

    setSaving(true);

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const updateData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        updatedAt: new Date(),
      };

      // Ajouter la photo si elle existe
      if (photoUri) {
        updateData.photoURL = photoUri;
      }

      await updateDoc(doc(db, 'users', userId), updateData);

      Alert.alert('Succès', 'Profil mis à jour avec succès !', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier le profil</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* AVATAR */}
        <View style={styles.avatarSection}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={showPhotoOptions}
          >
            {photoUri ? (
              <Image 
                source={{ uri: photoUri }} 
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {firstName?.[0]?.toUpperCase() || '👤'}
                </Text>
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Text style={styles.cameraIconText}>📷</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.changePhotoButton}
            onPress={showPhotoOptions}
          >
            <Text style={styles.changePhotoText}>Changer la photo</Text>
          </TouchableOpacity>
        </View>

        {/* FORMULAIRE */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prénom *</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Entrez votre prénom"
              placeholderTextColor="#8E8E93"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom *</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Entrez votre nom"
              placeholderTextColor="#8E8E93"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputDisabled}>
              <Text style={styles.inputDisabledText}>
                {auth.currentUser?.email}
              </Text>
            </View>
            <Text style={styles.inputHint}>
              L'email ne peut pas être modifié
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Téléphone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+237 6XX XXX XXX"
              placeholderTextColor="#8E8E93"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* BOUTON SAUVEGARDER */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>💾 Enregistrer</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    backgroundColor: '#007AFF',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    backgroundColor: '#34C759',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  cameraIconText: {
    fontSize: 20,
  },
  changePhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changePhotoText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '600',
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
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  inputDisabled: {
    backgroundColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  inputDisabledText: {
    fontSize: 15,
    color: '#8E8E93',
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
    backgroundColor: '#34C759',
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