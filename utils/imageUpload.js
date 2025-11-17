// utils/imageUpload.js
import { getDownloadURL, ref, uploadBytes, uploadBytesResumable } from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Crée un Blob à partir d'une URI de manière compatible React Native
 * @param {string} uri - URI locale de l'image
 * @returns {Promise<Blob>} Blob de l'image
 */
const createBlobFromUri = async (uri) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = function() {
      resolve(xhr.response);
    };

    xhr.onerror = function(e) {
      console.error('❌ Erreur XHR:', e);
      reject(new Error('Échec de la création du blob'));
    };

    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
};

/**
 * Upload une image vers Firebase Storage (méthode standard)
 * @param {string} uri - URI locale de l'image
 * @param {string} folder - Dossier de destination (ex: 'products')
 * @returns {Promise<string>} URL publique de l'image
 */
export const uploadImage = async (uri, folder = 'products') => {
  try {
    console.log('📤 Upload image vers:', folder);

    // Méthode 1: Fetch (standard)
    let blob;
    try {
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      blob = await response.blob();
      console.log('✅ Blob créé via fetch:', blob.size, 'bytes');
    } catch (fetchError) {
      console.warn('⚠️ Fetch échoué, tentative avec XMLHttpRequest...');
      // Méthode 2: XMLHttpRequest (fallback React Native)
      blob = await createBlobFromUri(uri);
      console.log('✅ Blob créé via XHR:', blob.size, 'bytes');
    }

    // Créer un nom unique
    const filename = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    console.log('📁 Fichier:', filename);

    // Référence Storage
    const storageRef = ref(storage, filename);

    // Upload
    await uploadBytes(storageRef, blob);
    console.log('✅ Upload terminé');

    // Récupérer URL publique
    const downloadURL = await getDownloadURL(storageRef);
    console.log('✅ URL obtenue:', downloadURL);

    return downloadURL;
  } catch (error) {
    console.error('❌ Erreur upload image:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Upload une image avec progression (pour React Native)
 * @param {string} uri - URI locale de l'image
 * @param {string} folder - Dossier de destination
 * @param {Function} onProgress - Callback de progression (progress) => {}
 * @returns {Promise<string>} URL publique de l'image
 */
export const uploadImageWithProgress = async (uri, folder = 'products', onProgress = null) => {
  try {
    console.log('📤 Upload avec progression vers:', folder);

    // Créer le blob avec XMLHttpRequest (plus compatible React Native)
    const blob = await createBlobFromUri(uri);
    console.log('✅ Blob créé:', blob.size, 'bytes, type:', blob.type);

    // Créer un nom unique
    const filename = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const storageRef = ref(storage, filename);

    // Upload avec suivi de progression
    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, blob);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`📊 Progression: ${progress.toFixed(1)}%`);

          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error('❌ Erreur upload avec progression:', {
            message: error.message,
            code: error.code,
            name: error.name
          });
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('✅ Upload terminé avec succès:', downloadURL);
            resolve(downloadURL);
          } catch (error) {
            console.error('❌ Erreur récupération URL:', error);
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('❌ Erreur upload image avec progression:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Upload une image pour le chat
 * @param {string} uri - URI locale de l'image
 * @param {string} conversationId - ID de la conversation
 * @returns {Promise<string>} URL publique de l'image
 */
export const uploadChatImage = async (uri, conversationId) => {
  const folder = `chat/${conversationId}`;
  return uploadImage(uri, folder);
};

/**
 * Upload un logo de startup
 * @param {string} uri - URI locale du logo
 * @param {string} userId - ID de l'utilisateur/startup
 * @returns {Promise<string>} URL publique du logo
 */
export const uploadStartupLogo = async (uri, userId) => {
  const folder = `startups/${userId}`;
  return uploadImageWithProgress(uri, folder);
};

/**
 * Upload un avatar utilisateur
 * @param {string} uri - URI locale de l'avatar
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<string>} URL publique de l'avatar
 */
export const uploadUserAvatar = async (uri, userId) => {
  const folder = `avatars/${userId}`;
  return uploadImage(uri, folder);
};