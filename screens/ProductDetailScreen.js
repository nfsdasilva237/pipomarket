// screens/ProductDetailScreen.js - ✅ AVEC CARROUSEL MULTI-IMAGES
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RecommendationsSection from '../components/RecommendationsSection';
import { db } from '../config/firebase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductDetailScreen({ route, navigation, cart, addToCart }) {
  const { productId } = route.params;

  const [product, setProduct] = useState(null);
  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  const scrollViewRef = useRef(null);
  const modalScrollViewRef = useRef(null);

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

  // ✅ Gérer le scroll du carrousel
  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    setCurrentImageIndex(index);
  };

  // ✅ Gérer le scroll dans le modal
  const handleModalScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    setModalImageIndex(index);
  };

  // ✅ Ouvrir l'image en plein écran
  const openImageModal = (index) => {
    setModalImageIndex(index);
    setModalVisible(true);
    // Attendre que le modal soit visible avant de scroller
    setTimeout(() => {
      modalScrollViewRef.current?.scrollTo({
        x: index * SCREEN_WIDTH,
        animated: false,
      });
    }, 100);
  };

  // ✅ Fermer le modal
  const closeImageModal = () => {
    setModalVisible(false);
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

  // ✅ Obtenir toutes les images (nouveau format ou ancien)
  const productImages = product.images && Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : product.image
    ? [product.image]
    : [];

  const hasMultipleImages = productImages.length > 1;

  // Vérifier si c'est une image uploadée ou un emoji
  const isImageUrl = (img) => img && (
    img.startsWith('file://') ||
    img.startsWith('http://') ||
    img.startsWith('https://')
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
        {/* ✅ CARROUSEL D'IMAGES */}
        <View style={styles.imageContainer}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {productImages.map((image, index) => (
              <TouchableOpacity
                key={index}
                style={styles.imageSlide}
                activeOpacity={0.9}
                onPress={() => openImageModal(index)}
              >
                {isImageUrl(image) ? (
                  <Image
                    source={{ uri: image }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.emojiContainer}>
                    <Text style={styles.productEmoji}>{image || '📦'}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ✅ Indicateurs de pagination */}
          {hasMultipleImages && (
            <View style={styles.paginationContainer}>
              {productImages.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    currentImageIndex === index && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* ✅ Compteur d'images */}
          {hasMultipleImages && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {currentImageIndex + 1}/{productImages.length}
              </Text>
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

      {/* ✅ MODAL ZOOM IMAGE */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <View style={styles.modalContainer}>
          {/* Fond semi-transparent cliquable pour fermer */}
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeImageModal}
          />

          {/* Bouton fermer */}
          <TouchableOpacity style={styles.modalCloseButton} onPress={closeImageModal}>
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>

          {/* Compteur d'images */}
          {productImages.length > 1 && (
            <View style={styles.modalImageCounter}>
              <Text style={styles.modalImageCounterText}>
                {modalImageIndex + 1}/{productImages.length}
              </Text>
            </View>
          )}

          {/* Carrousel d'images en plein écran */}
          <ScrollView
            ref={modalScrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleModalScroll}
            scrollEventThrottle={16}
            style={styles.modalScrollView}
          >
            {productImages.map((image, index) => (
              <View key={index} style={styles.modalImageSlide}>
                {isImageUrl(image) ? (
                  <Image
                    source={{ uri: image }}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.modalEmojiContainer}>
                    <Text style={styles.modalEmoji}>{image || '📦'}</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Indicateurs de pagination */}
          {productImages.length > 1 && (
            <View style={styles.modalPaginationContainer}>
              {productImages.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.modalPaginationDot,
                    modalImageIndex === index && styles.modalPaginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      </Modal>
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

  // ✅ CARROUSEL
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#F2F2F7',
    position: 'relative',
  },
  imageSlide: {
    width: SCREEN_WIDTH,
    height: 300,
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

  // ✅ Pagination
  paginationContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#007AFF',
    width: 24,
  },

  // ✅ Compteur
  imageCounter: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  imageCounterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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

  // ✅ MODAL ZOOM
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalCloseText: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
  },
  modalImageCounter: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    zIndex: 10,
  },
  modalImageCounterText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalScrollView: {
    flex: 1,
  },
  modalImageSlide: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  modalEmojiContainer: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalEmoji: {
    fontSize: 200,
  },
  modalPaginationContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPaginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 5,
  },
  modalPaginationDotActive: {
    backgroundColor: 'white',
    width: 30,
  },
});