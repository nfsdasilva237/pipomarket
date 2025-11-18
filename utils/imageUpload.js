// utils/imageUpload.js
import { uploadToCloudinary, uploadProductImage, uploadStartupLogo, uploadUserAvatar } from './cloudinaryService';

/**
 * Upload une image vers Cloudinary
 * @param {string} uri - URI locale de l'image
 * @param {string} folder - Dossier de destination (ex: 'products', 'logos', 'avatars')
 * @param {string} resourceId - ID de la ressource (optionnel)
 * @returns {Promise<string>} URL publique de l'image
 */
export const uploadImage = async (uri, folder = 'products', resourceId = null) => {
  try {
    // Utiliser les fonctions spécialisées selon le dossier
    switch (folder) {
      case 'products':
        return await uploadProductImage(uri, resourceId || 'unknown');

      case 'logos':
      case 'startups':
        return await uploadStartupLogo(uri, resourceId || 'unknown');

      case 'avatars':
      case 'users':
        return await uploadUserAvatar(uri, resourceId || 'unknown');

      default:
        // Upload générique
        const result = await uploadToCloudinary(uri, `pipomarket/${folder}`);
        return result.url;
    }
  } catch (error) {
    console.error('Erreur upload image:', error);
    throw error;
  }
};