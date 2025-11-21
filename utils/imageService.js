// utils/imageService.js - ✅ VERSION FINALE SANS FILESYSTEM
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import { supabase } from '../config/supabase';

export const imageService = {
  /**
   * Upload image vers Supabase Storage
   */
  uploadImage: async (uri, folder = 'chat') => {
    try {
      console.log('📤 Upload Supabase:', uri);

      // ✅ Générer nom unique
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const ext = uri.split('.').pop() || 'jpg';
      const filename = `${folder}/${timestamp}_${random}.${ext}`;

      // ✅ Créer FormData avec le fichier
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: `photo.${ext}`,
        type: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
      });

      console.log('📤 Envoi vers Supabase...');

      // ✅ Upload avec fetch vers Supabase Storage API
      const { data: { session } } = await supabase.auth.getSession();
      
      const uploadUrl = `${supabase.storageUrl}/object/pipomarket/${filename}`;
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Erreur upload:', error);
        throw new Error(error);
      }

      // ✅ Construire URL publique
      const publicUrl = `${supabase.storageUrl}/object/public/pipomarket/${filename}`;

      console.log('✅ Upload réussi:', publicUrl);

      return {
        success: true,
        url: publicUrl,
        path: filename,
      };

    } catch (error) {
      console.error('❌ Erreur upload:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Upload multiple images
   */
  uploadMultipleImages: async (uris, folder = 'products') => {
    try {
      const results = [];
      
      for (const uri of uris) {
        const result = await imageService.uploadImage(uri, folder);
        results.push(result);
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      return {
        success: true,
        uploaded: successful,
        failed: failed,
        total: results.length,
      };

    } catch (error) {
      console.error('Erreur upload multiple:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Galerie
   */
  pickImageFromGallery: async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'Nous avons besoin d\'accéder à vos photos.'
        );
        return { success: false, error: 'Permission refusée' };
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) {
        return { success: false, cancelled: true };
      }

      return {
        success: true,
        uri: result.assets[0].uri,
      };

    } catch (error) {
      console.error('Erreur sélection:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
      return { success: false, error: error.message };
    }
  },

  /**
   * Caméra
   */
  takePhoto: async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'Nous avons besoin d\'accéder à votre caméra.'
        );
        return { success: false, error: 'Permission refusée' };
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) {
        return { success: false, cancelled: true };
      }

      return {
        success: true,
        uri: result.assets[0].uri,
      };

    } catch (error) {
      console.error('Erreur caméra:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
      return { success: false, error: error.message };
    }
  },

  /**
   * Menu sélection
   */
  showImagePicker: () => {
    return new Promise((resolve) => {
      Alert.alert(
        'Choisir une image',
        'D\'où voulez-vous sélectionner l\'image ?',
        [
          {
            text: 'Annuler',
            style: 'cancel',
            onPress: () => resolve({ success: false, cancelled: true }),
          },
          {
            text: '📷 Caméra',
            onPress: async () => {
              const result = await imageService.takePhoto();
              resolve(result);
            },
          },
          {
            text: '🖼️ Galerie',
            onPress: async () => {
              const result = await imageService.pickImageFromGallery();
              resolve(result);
            },
          },
        ]
      );
    });
  },
};

export default imageService;