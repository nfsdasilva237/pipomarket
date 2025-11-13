// utils/imageUpload.js
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Upload une image vers Firebase Storage
 * @param {string} uri - URI locale de l'image
 * @param {string} folder - Dossier de destination (ex: 'products')
 * @returns {Promise<string>} URL publique de l'image
 */
export const uploadImage = async (uri, folder = 'products') => {
  try {
    // Convertir URI en Blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Créer un nom unique
    const filename = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    
    // Référence Storage
    const storageRef = ref(storage, filename);

    // Upload
    await uploadBytes(storageRef, blob);

    // Récupérer URL publique
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } catch (error) {
    console.error('Erreur upload image:', error);
    throw error;
  }
};