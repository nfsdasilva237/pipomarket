// screens/ProductDetailScreen.js
import { doc, getDoc } from 'firebase/firestore';
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
import RecommendationsSection from '../components/RecommendationsSection';
import { db } from '../config/firebase';


export default function ProductDetailScreen({ route, navigation, cart, addToCart }) {
  const { productId } = route.params;
  
  const [product, setProduct] = useState(null);
  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadProduct();
  }, []);

  const loadProduct = async () => {
    try {
      // Charger le produit
      const productDoc = await getDoc(doc(db, 'products', productId));
      
      if (!productDoc.exists()) {
        Alert.alert('Erreur', 'Produit introuvable');
        navigation.goBack();
        return;
      }

      const productData = { id: productDoc.id, ...productDoc.data() };
      setProduct(productData);

      // Charger la startup
      if (productData.startupId) {
        const startupDoc = await getDoc(doc(db, 'startups', productData.startupId));
        if (startupDoc.exists()) {
          setStartup({ id: startupDoc.id, ...startupDoc.data() });
        }
      }
    } catch (error) {
      console.error('Erreur chargement produit:', error);
      Alert.alert('Erreur', 'Impossible de charger le produit');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
  if (!product.available) {
    Alert.alert('Indisponible', 'Ce produit n\'est plus disponible');
    return;
  }

  if (product.stock < quantity) {
    Alert.alert('Stock insuffisant', `Seulement ${product.stock} en stock`);
    return;
  }

  // ✅ AJOUTER startupName au produit
  const productWithStartup = {
    ...product,
    startupName: startup?.name || 'PipoMarket',
  };

  // Ajouter quantity fois
  for (let i = 0; i < quantity; i++) {
    addToCart(productWithStartup);
  }

  Alert.alert(
    'Produit ajouté',
    `${quantity}x ${product.name} ajouté${quantity > 1 ? 's' : ''} au panier`,
    [
      { text: 'Continuer', style: 'cancel' },
      { 
        text: 'Voir le panier', 
        onPress: () => navigation.navigate('Home', { screen: 'CartTab' })
      }
    ]
  );
};

  const increaseQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    } else {
      Alert.alert('Stock limité', `Maximum ${product.stock} disponibles`);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
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

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Produit introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Vérifier si c'est une image uploadée ou un emoji
  const isImageUrl = product.image && (
    product.image.startsWith('file://') || 
    product.image.startsWith('http://') || 
    product.image.startsWith('https://')
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {product.name}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('CartTab')}>
          <Text style={styles.cartButton}>🛒</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* IMAGE DU PRODUIT */}
        <View style={styles.imageContainer}>
          {isImageUrl ? (
            // ✅ Image uploadée
            <Image
              source={{ uri: product.image }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            // ❌ Fallback emoji
            <View style={styles.emojiContainer}>
              <Text style={styles.productEmoji}>{product.image || '📦'}</Text>
            </View>
          )}
        </View>

        {/* INFOS PRODUIT */}
        <View style={styles.infoSection}>
          <View style={styles.nameRow}>
            <Text style={styles.productName}>{product.name}</Text>
            {!product.available && (
              <View style={styles.unavailableBadge}>
                <Text style={styles.unavailableText}>Indisponible</Text>
              </View>
            )}
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>
              {product.price?.toLocaleString()} FCFA
            </Text>
            {product.stock < 5 && product.stock > 0 && (
              <Text style={styles.lowStock}>
                Plus que {product.stock} en stock !
              </Text>
            )}
          </View>

          <View style={styles.categoryRow}>
            <Text style={styles.categoryIcon}>📂</Text>
            <Text style={styles.categoryText}>{product.category}</Text>
          </View>
        </View>

        <RecommendationsSection
  type="similar"
  productId={product.id}
  productCategory={product.category}
  onProductPress={(product) => navigation.navigate('ProductDetail', { product })}
/>

        {/* DESCRIPTION */}
        {product.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>
        )}

        {/* STARTUP INFO */}
        {startup && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vendu par</Text>
            <TouchableOpacity
              style={styles.startupCard}
              onPress={() =>
                navigation.navigate('StartupDetail', {
                  startupId: startup.id,
                  startupName: startup.name,
                })
              }
            >
              <View style={styles.startupLogo}>
                <Text style={styles.startupLogoText}>{startup.logo || '🏪'}</Text>
              </View>
              <View style={styles.startupInfo}>
                <Text style={styles.startupName}>{startup.name}</Text>
                <Text style={styles.startupCategory}>{startup.category}</Text>
              </View>
              <Text style={styles.startupArrow}>→</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* QUANTITÉ */}
        {product.available && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quantité</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={decreaseQuantity}
              >
                <Text style={styles.quantityButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={increaseQuantity}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* BOUTON AJOUTER AU PANIER */}
      {product.available && (
        <View style={styles.footer}>
          <View style={styles.footerInfo}>
            <Text style={styles.footerLabel}>Total</Text>
            <Text style={styles.footerTotal}>
              {(product.price * quantity).toLocaleString()} FCFA
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddToCart}
          >
            <Text style={styles.addButtonText}>Ajouter au panier</Text>
          </TouchableOpacity>
        </View>
      )}
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  cartButton: {
    fontSize: 24,
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
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#F2F2F7',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  emojiContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productEmoji: {
    fontSize: 120,
  },
  infoSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productName: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 12,
  },
  unavailableBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unavailableText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  lowStock: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '600',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
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
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  startupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
  },
  startupLogo: {
    width: 48,
    height: 48,
    backgroundColor: 'white',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  startupLogoText: {
    fontSize: 24,
  },
  startupInfo: {
    flex: 1,
  },
  startupName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  startupCategory: {
    fontSize: 13,
    color: '#666',
  },
  startupArrow: {
    fontSize: 20,
    color: '#C7C7CC',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  quantityButton: {
    width: 40,
    height: 40,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  quantityText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginHorizontal: 24,
    minWidth: 40,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  footerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  footerLabel: {
    fontSize: 14,
    color: '#666',
  },
  footerTotal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});