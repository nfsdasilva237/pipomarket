// utils/imageUpload.js - ✅ WRAPPER COMPATIBILITÉ
import imageService from './imageService';

/**
 * Upload image vers ImgBB
 */
export const uploadImage = async (uri, folder = 'products', resourceId = null) => {
  try {
    console.log(`📤 Upload (${folder})...`);
    
    const result = await imageService.uploadImage(uri);
    
    if (!result.success) {
      throw new Error(result.error || 'Échec upload');
    }

    console.log('✅ URL:', result.url);
    return result.url;

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
};

export const uploadStartupLogo = async (uri, startupId) => {
  return await uploadImage(uri, 'startups', startupId);
};

export const uploadProductImage = async (uri, productId) => {
  return await uploadImage(uri, 'products', productId);
};

export const uploadUserAvatar = async (uri, userId) => {
  return await uploadImage(uri, 'avatars', userId);
};

export const uploadToCloudinary = async (uri, folder = 'pipomarket') => {
  const result = await imageService.uploadImage(uri);
  if (!result.success) {
    throw new Error(result.error);
  }
  return { url: result.url };
};