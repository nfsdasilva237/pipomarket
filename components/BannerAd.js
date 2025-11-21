import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    getActiveAds,
    trackClick,
    trackImpression,
} from '../utils/advertisingService';

/**
 * Composant Bannière Publicitaire
 *
 * @param {string} placement - Type d'emplacement (home_banner, category_banner, etc.)
 * @param {string} category - Catégorie (pour category_banner)
 * @param {object} style - Styles personnalisés
 */
const BannerAd = ({ placement, category = null, style }) => {
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [impressionTracked, setImpressionTracked] = useState(false);

  useEffect(() => {
    loadAd();
  }, [placement, category]);

  useEffect(() => {
    // Tracker l'impression une fois que la pub est chargée et affichée
    if (ad && !impressionTracked) {
      trackImpressionAsync();
    }
  }, [ad, impressionTracked]);

  const loadAd = async () => {
    try {
      setLoading(true);
      const ads = await getActiveAds(placement, category);

      if (ads && ads.length > 0) {
        // Prendre la première publicité (rotation aléatoire déjà faite dans le service)
        setAd(ads[0]);
      } else {
        setAd(null);
      }
    } catch (error) {
      console.error('❌ Erreur chargement publicité:', error);
      setAd(null);
    } finally {
      setLoading(false);
    }
  };

  const trackImpressionAsync = async () => {
    try {
      await trackImpression(ad.id);
      setImpressionTracked(true);
      console.log('✅ Impression trackée:', ad.id);
    } catch (error) {
      console.error('❌ Erreur tracking impression:', error);
    }
  };

  const handleAdClick = async () => {
    try {
      // Tracker le clic
      await trackClick(ad.id);
      console.log('✅ Clic tracké:', ad.id);

      // Ouvrir le lien
      if (ad.linkUrl) {
        const supported = await Linking.canOpenURL(ad.linkUrl);
        if (supported) {
          await Linking.openURL(ad.linkUrl);
        } else {
          console.error('❌ URL non supportée:', ad.linkUrl);
        }
      }
    } catch (error) {
      console.error('❌ Erreur clic publicité:', error);
    }
  };

  // Pas de publicité disponible
  if (!loading && !ad) {
    return null;
  }

  // Chargement
  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="small" color="#999" />
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handleAdClick}
      activeOpacity={0.8}
    >
      {/* Label "Sponsorisé" */}
      <View style={styles.sponsoredLabel}>
        <Text style={styles.sponsoredText}>Sponsorisé</Text>
      </View>

      {/* Image de la publicité */}
      {ad.imageUrl && (
        <Image
          source={{ uri: ad.imageUrl }}
          style={styles.adImage}
          resizeMode="cover"
        />
      )}

      {/* Contenu textuel */}
      <View style={styles.adContent}>
        <Text style={styles.adTitle} numberOfLines={1}>
          {ad.title}
        </Text>
        {ad.description && (
          <Text style={styles.adDescription} numberOfLines={2}>
            {ad.description}
          </Text>
        )}
        <View style={styles.advertiserInfo}>
          <Text style={styles.advertiserName}>{ad.advertiserName}</Text>
        </View>
      </View>

      {/* CTA Button */}
      <View style={styles.ctaButton}>
        <Text style={styles.ctaText}>En savoir plus →</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sponsoredLabel: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 10,
  },
  sponsoredText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  adImage: {
    width: '100%',
      height: 180,

    backgroundColor: '#f0f0f0',

    resizeMode: 'contain',
  },
  adContent: {
    padding: 12,
  },
  adTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  adDescription: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 8,
    lineHeight: 18,
  },
  advertiserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  advertiserName: {
    fontSize: 11,
    color: '#95a5a6',
    fontWeight: '600',
  },
  ctaButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default BannerAd;