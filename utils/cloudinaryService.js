// utils/cloudinaryService.js
import Constants from 'expo-constants';

/**
 * Configuration Cloudinary
 * Pour configurer, ajoutez ces variables dans app.json sous "extra":
 * {
 *   "extra": {
 *     "cloudinaryCloudName": "votre_cloud_name",
 *     "cloudinaryUploadPreset": "votre_upload_preset"
 *   }
 * }
 */
const getCloudinaryConfig = () => {
  return {
    cloudName: Constants.expoConfig?.extra?.cloudinaryCloudName || 'demo',
    uploadPreset: Constants.expoConfig?.extra?.cloudinaryUploadPreset || 'demo_preset'
  };
};

/**
 * Upload une image vers Cloudinary
 * @param {string} uri - URI locale de l'image
 * @param {string} folder - Dossier de destination (ex: 'products', 'chat', 'logos')
 * @param {Object} options - Options supplémentaires
 * @returns {Promise<Object>} Données de l'image uploadée
 */
export const uploadToCloudinary = async (uri, folder = 'pipomarket', options = {}) => {
  try {
    const config = getCloudinaryConfig();

    // Créer le FormData
    const formData = new FormData();

    // Récupérer l'extension du fichier
    const fileExtension = uri.split('.').pop().toLowerCase();
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    };

    const mimeType = mimeTypes[fileExtension] || 'image/jpeg';

    // Ajouter le fichier
    formData.append('file', {
      uri,
      type: mimeType,
      name: `upload.${fileExtension}`
    });

    formData.append('upload_preset', config.uploadPreset);
    formData.append('folder', folder);

    // Options supplémentaires
    if (options.tags) {
      formData.append('tags', options.tags.join(','));
    }

    if (options.context) {
      const contextString = Object.entries(options.context)
        .map(([key, value]) => `${key}=${value}`)
        .join('|');
      formData.append('context', contextString);
    }

    // Upload vers Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Erreur lors de l\'upload');
    }

    const data = await response.json();

    return {
      success: true,
      url: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
      format: data.format,
      resourceType: data.resource_type,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Erreur upload Cloudinary:', error);
    throw error;
  }
};

/**
 * Upload une image pour le chat
 * @param {string} uri - URI de l'image
 * @param {string} conversationId - ID de la conversation
 * @returns {Promise<string>} URL de l'image
 */
export const uploadChatImage = async (uri, conversationId) => {
  try {
    const result = await uploadToCloudinary(uri, `pipomarket/chat/${conversationId}`, {
      tags: ['chat', 'message']
    });
    return result.url;
  } catch (error) {
    console.error('Erreur upload image chat:', error);
    throw error;
  }
};

/**
 * Upload un logo de startup
 * @param {string} uri - URI de l'image
 * @param {string} startupId - ID de la startup
 * @returns {Promise<string>} URL du logo
 */
export const uploadStartupLogo = async (uri, startupId) => {
  try {
    const result = await uploadToCloudinary(uri, 'pipomarket/logos', {
      tags: ['logo', 'startup'],
      context: { startup_id: startupId }
    });
    return result.url;
  } catch (error) {
    console.error('Erreur upload logo startup:', error);
    throw error;
  }
};

/**
 * Upload une image de produit
 * @param {string} uri - URI de l'image
 * @param {string} productId - ID du produit
 * @returns {Promise<string>} URL de l'image
 */
export const uploadProductImage = async (uri, productId) => {
  try {
    const result = await uploadToCloudinary(uri, 'pipomarket/products', {
      tags: ['product'],
      context: { product_id: productId }
    });
    return result.url;
  } catch (error) {
    console.error('Erreur upload image produit:', error);
    throw error;
  }
};

/**
 * Upload un avatar utilisateur
 * @param {string} uri - URI de l'image
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<string>} URL de l'avatar
 */
export const uploadUserAvatar = async (uri, userId) => {
  try {
    const result = await uploadToCloudinary(uri, 'pipomarket/avatars', {
      tags: ['avatar', 'user'],
      context: { user_id: userId }
    });
    return result.url;
  } catch (error) {
    console.error('Erreur upload avatar utilisateur:', error);
    throw error;
  }
};

export default {
  uploadToCloudinary,
  uploadChatImage,
  uploadStartupLogo,
  uploadProductImage,
  uploadUserAvatar
};
