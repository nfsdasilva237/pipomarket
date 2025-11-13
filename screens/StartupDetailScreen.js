// screens/StartupDetailScreen.js - VERSION AVEC BADGE CORRIGÉ
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../config/firebase';

export default function StartupDetailScreen({ route, navigation }) {
  const { startupId } = route.params;
  
  const [startup, setStartup] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStartupDetails();
  }, []);

  const loadStartupDetails = async () => {
    try {
      // Charger startup
      const startupDoc = await getDoc(doc(db, 'startups', startupId));
      if (startupDoc.exists()) {
        setStartup({ id: startupDoc.id, ...startupDoc.data() });
      }

      // Charger produits de la startup
      const q = query(
        collection(db, 'products'),
        where('startupId', '==', startupId)
      );
      const querySnapshot = await getDocs(q);
      const productsData = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data && data.name) {
          productsData.push({
            id: doc.id,
            ...data,
            image: data.image || '📦',
            price: typeof data.price === 'number' ? data.price : 0,
          });
        }
      });

      setProducts(productsData);
    } catch (error) {
      console.error('Erreur chargement détails startup:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleContact = () => {
    if (!auth.currentUser) {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour contacter une startup',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }

    navigation.navigate('Chat', {
      startupId: startupId,
      startupName: startup.name,
    });
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

  if (!startup) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Startup introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {startup.name}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* INFOS STARTUP */}
        <View style={styles.startupCard}>
          <View style={styles.startupHeader}>
            <View style={styles.startupLogo}>
              {startup.logoType === 'image' && startup.logo ? (
                <Image source={{ uri: startup.logo }} style={styles.startupLogoImage} />
              ) : (
                <Text style={styles.startupLogoText}>{startup.logo || '🏪'}</Text>
              )}
            </View>
            <View style={styles.startupInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.startupName}>{startup.name}</Text>
                {/* ✅ BADGE ABONNEMENT */}
                {startup.subscriptionBadge && (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{startup.subscriptionBadge}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.startupCategory}>{startup.category}</Text>
              <View style={styles.startupStats}>
                <Text style={styles.stat}>⭐ {startup.rating || '5.0'}</Text>
                <Text style={styles.stat}>📦 {products.length} produits</Text>
              </View>
            </View>
          </View>

          {startup.description && (
            <Text style={styles.startupDescription}>{startup.description}</Text>
          )}

          {/* BOUTON CONTACTER */}
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleContact}
          >
            <Text style={styles.contactButtonIcon}>💬</Text>
            <Text style={styles.contactButtonText}>Contacter la startup</Text>
          </TouchableOpacity>
        </View>

        {/* LISTE DES PRODUITS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Produits ({products.length})
          </Text>

          {products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>Aucun produit disponible</Text>
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {products.map((product) => {
                const isImageUrl = product.image && 
                  typeof product.image === 'string' && (
                    product.image.indexOf('file://') === 0 || 
                    product.image.indexOf('http://') === 0 || 
                    product.image.indexOf('https://') === 0
                  );

                return (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.productCard}
                    onPress={() =>
                      navigation.navigate('ProductDetail', {
                        productId: product.id,
                        startupName: startup.name
                      })
                    }
                  >
                    <View style={styles.productImageContainer}>
                      {isImageUrl ? (
                        <Image
                          source={{ uri: product.image }}
                          style={styles.productImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.productEmoji}>
                          {product.image || '📦'}
                        </Text>
                      )}
                    </View>

                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={2}>
                        {product.name}
                      </Text>
                      <Text style={styles.productPrice}>
                        {product.price?.toLocaleString() || '0'} FCFA
                      </Text>
                      {product.stock < 5 && product.stock > 0 && (
                        <Text style={styles.productStock}>
                          Plus que {product.stock} !
                        </Text>
                      )}
                      {!product.available && (
                        <Text style={styles.unavailable}>Indisponible</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
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
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  startupCard: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
  },
  startupHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  startupLogo: {
    width: 80,
    height: 80,
    backgroundColor: '#F2F2F7',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  startupLogoText: {
    fontSize: 40,
  },
  startupLogoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  startupInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  // ✅ NOUVEAU : Row pour nom + badge
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  startupName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 8,
  },
  // ✅ STYLES BADGE
  badgeContainer: {
    backgroundColor: '#AF52DE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'white',
  },
  startupCategory: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
  },
  startupStats: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    fontSize: 13,
    color: '#666',
  },
  startupDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 4,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  contactButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginHorizontal: -6,
  },
  productCard: {
    width: '47%',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 6,
    marginBottom: 12,
  },
  productImageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productEmoji: {
    fontSize: 60,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
    minHeight: 36,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  productStock: {
    fontSize: 11,
    color: '#FF3B30',
    fontWeight: '600',
  },
  unavailable: {
    fontSize: 11,
    color: '#FF3B30',
    fontWeight: '600',
  },
});