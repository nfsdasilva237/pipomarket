// screens/AdminManageCategoriesScreen.js - ✅ GESTION COMPLÈTE CATÉGORIES
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../config/firebase';
import adminService from '../utils/adminService';

export default function AdminManageCategoriesScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  
  // Form
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('📦');

  const iconOptions = [
    // Alimentation & Boissons
    '🍔', '🍕', '🍰', '🧁', '🍪', '🍩', '🥐', '🥖', '🥪', '🌮', '🌯', '🥗', '🍝', '🍜', '🍲', '🍱', '🍛', '🍣', '🍤', '🥘',
    '☕', '🧃', '🧋', '🍹', '🍺', '🍷', '🥤',
    // Mode & Beauté
    '👗', '👔', '👕', '👖', '👘', '👙', '👚', '👛', '👜', '👝', '🎒', '👞', '👟', '👠', '👡', '👢', '👑', '💄', '💅', '💍', '💎',
    '🕶️', '👓', '🧣', '🧤', '🧥', '🧦',
    // Technologie & Électronique
    '💻', '🖥️', '⌨️', '🖱️', '📱', '📞', '☎️', '📟', '📠', '📺', '📻', '🎥', '📷', '📸', '📹', '🎬', '💿', '📀', '💾', '💽',
    '🔌', '🔋', '💡', '🔦',
    // Sport & Fitness
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥊', '🥋', '⛳', '⛸️',
    '🎿', '🛷', '🥌', '🎯', '🪀', '🪁', '🏋️', '🤸',
    // Maison & Jardin
    '🏠', '🏡', '🏘️', '🛋️', '🛏️', '🚪', '🪟', '🚿', '🛁', '🚽', '🧻', '🧼', '🧽', '🧴', '🧹', '🧺', '🧯', '🔨', '🔧', '⚒️',
    '🪛', '🪚', '🔩', '⚙️', '🌱', '🌿', '🌵', '🌴', '🌳', '🌲', '🌾', '🌻', '🌺', '🌹', '🌷', '🌸',
    // Arts & Loisirs
    '🎨', '🖌️', '🖍️', '✏️', '🖊️', '🖋️', '✒️', '📝', '📐', '📏', '📌', '📍', '🎭', '🎪', '🎡', '🎢', '🎠', '🎰', '🎲', '🧩',
    '🧸', '🪅', '🪆', '🎺', '🎸', '🎹', '🎼', '🎵', '🎶', '🎤', '🎧', '📯', '🥁', '🪘', '🎻', '🪕',
    // Éducation & Bureau
    '📚', '📖', '📕', '📗', '📘', '📙', '📓', '📔', '📒', '📃', '📜', '📄', '📰', '🗞️', '🔖', '🏷️', '📦', '📫', '📪', '📬',
    // Santé & Bien-être
    '💊', '💉', '🩹', '🩺', '🌡️', '🧘', '💆', '💇', '🧖', '🧑‍⚕️',
    // Véhicules & Transport
    '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🏍️', '🛺', '🚲', '🛴', '🛹',
    '✈️', '🚁', '🚂', '🚊', '🚇', '⛴️', '🛥️', '⛵',
    // Commerce & Services
    '💼', '💰', '💳', '💸', '🏦', '🏪', '🏬', '🛒', '🛍️', '🎁', '🎀', '🪙', '💲',
    // Animaux & Nature
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅',
    '🌍', '🌎', '🌏', '⭐', '✨', '⚡', '🔥', '💧', '🌈', '☀️', '🌙',
    // Autre
    '🎉', '🎊', '🎈', '🎆', '🎇', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '❤️', '💙', '💚', '💛', '🧡', '💜'
  ];

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    try {
      const isAdmin = await adminService.isAdmin(auth.currentUser?.uid);
      if (!isAdmin) {
        Alert.alert('Accès refusé', 'Vous n\'êtes pas administrateur', [
          { text: 'OK', onPress: () => navigation.replace('Home') }
        ]);
        return;
      }
      loadCategories();
    } catch (error) {
      console.error('Erreur vérification admin:', error);
      navigation.replace('Home');
    }
  };

  const loadCategories = async () => {
    try {
      // Charger catégories depuis Firestore
      const categoriesSnap = await getDocs(collection(db, 'categories'));
      const categoriesData = [];

      for (const docSnap of categoriesSnap.docs) {
        const catData = docSnap.data();
        
        // Compter produits
        const productsQ = query(
          collection(db, 'products'),
          where('category', '==', catData.name)
        );
        const productsSnap = await getDocs(productsQ);
        
        categoriesData.push({
          id: docSnap.id,
          ...catData,
          productCount: productsSnap.size,
        });
      }

      // Trier par nombre de produits
      categoriesData.sort((a, b) => b.productCount - a.productCount);
      
      setCategories(categoriesData);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
      Alert.alert('Erreur', 'Impossible de charger les catégories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      // Mode édition
      setEditMode(true);
      setCurrentCategory(category);
      setCategoryName(category.name);
      setCategoryDescription(category.description || '');
      setCategoryIcon(category.icon || '📦');
    } else {
      // Mode création
      setEditMode(false);
      setCurrentCategory(null);
      setCategoryName('');
      setCategoryDescription('');
      setCategoryIcon('📦');
    }
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditMode(false);
    setCurrentCategory(null);
    setCategoryName('');
    setCategoryDescription('');
    setCategoryIcon('📦');
  };

  const handleSave = async () => {
    // Validation
    if (!categoryName.trim()) {
      Alert.alert('Erreur', 'Le nom de la catégorie est obligatoire');
      return;
    }

    if (categoryName.trim().length < 3) {
      Alert.alert('Erreur', 'Le nom doit contenir au moins 3 caractères');
      return;
    }

    setLoading(true);

    try {
      const categoryData = {
        name: categoryName.trim(),
        description: categoryDescription.trim(),
        icon: categoryIcon,
        updatedAt: new Date(),
      };

      if (editMode && currentCategory) {
        // Mise à jour
        await updateDoc(doc(db, 'categories', currentCategory.id), categoryData);
        
        // Mettre à jour tous les produits si le nom a changé
        if (categoryName.trim() !== currentCategory.name) {
          const productsQ = query(
            collection(db, 'products'),
            where('category', '==', currentCategory.name)
          );
          const productsSnap = await getDocs(productsQ);
          
          const updatePromises = productsSnap.docs.map(productDoc =>
            updateDoc(doc(db, 'products', productDoc.id), {
              category: categoryName.trim(),
            })
          );
          
          await Promise.all(updatePromises);
        }
        
        Alert.alert('Succès', 'Catégorie mise à jour');
      } else {
        // Création
        categoryData.createdAt = new Date();
        await addDoc(collection(db, 'categories'), categoryData);
        Alert.alert('Succès', 'Catégorie créée');
      }

      handleCloseModal();
      loadCategories();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder la catégorie');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (category) => {
    if (category.productCount > 0) {
      Alert.alert(
        'Impossible de supprimer',
        `Cette catégorie contient ${category.productCount} produit${category.productCount > 1 ? 's' : ''}.\n\nDéplacez d'abord les produits vers une autre catégorie.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Supprimer la catégorie',
      `Supprimer la catégorie "${category.name}" ?\n\nCette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'categories', category.id));
              Alert.alert('Succès', 'Catégorie supprimée');
              loadCategories();
            } catch (error) {
              console.error('Erreur suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la catégorie');
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCategories();
  };

  const renderCategory = ({ item }) => (
    <View style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryHeaderLeft}>
          <Text style={styles.categoryIcon}>{item.icon || '📦'}</Text>
          <View>
            <Text style={styles.categoryName}>{item.name}</Text>
            <Text style={styles.categoryCount}>
              {item.productCount} produit{item.productCount > 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>

      {item.description && (
        <Text style={styles.categoryDescription}>{item.description}</Text>
      )}

      <View style={styles.categoryActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#007AFF' }]}
          onPress={() => handleOpenModal(item)}
        >
          <Text style={styles.actionButtonText}>✏️ Modifier</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: item.productCount > 0 ? '#C7C7CC' : '#FF3B30' }
          ]}
          onPress={() => handleDelete(item)}
          disabled={item.productCount > 0}
        >
          <Text style={styles.actionButtonText}>🗑️ Supprimer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des catégories...</Text>
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Catégories</Text>
          <Text style={styles.headerSubtitle}>{categories.length} catégorie{categories.length > 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleOpenModal()}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* LISTE */}
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyTitle}>Aucune catégorie</Text>
            <Text style={styles.emptyText}>Créez votre première catégorie</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => handleOpenModal()}
            >
              <Text style={styles.emptyButtonText}>+ Créer une catégorie</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* MODAL AJOUT/ÉDITION */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editMode ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* ICÔNE */}
              <Text style={styles.label}>Icône</Text>
              <View style={styles.iconGrid}>
                {iconOptions.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      categoryIcon === icon && styles.iconOptionSelected,
                    ]}
                    onPress={() => setCategoryIcon(icon)}
                  >
                    <Text style={styles.iconOptionText}>{icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* NOM */}
              <Text style={styles.label}>Nom *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Technologie"
                value={categoryName}
                onChangeText={setCategoryName}
                autoCapitalize="words"
              />

              {/* DESCRIPTION */}
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description de la catégorie..."
                value={categoryDescription}
                onChangeText={setCategoryDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCloseModal}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>
                  {editMode ? 'Mettre à jour' : 'Créer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => handleOpenModal()}
      >
        <Text style={styles.fabButtonText}>+ Ajouter</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 15, color: '#8E8E93' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  backButton: { fontSize: 28, color: '#007AFF' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  headerSubtitle: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  addButton: { width: 40, height: 40, backgroundColor: '#007AFF', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  addButtonText: { fontSize: 24, color: 'white', fontWeight: 'bold' },

  list: { padding: 16 },

  categoryCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  categoryHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  categoryIcon: { fontSize: 32, marginRight: 12 },
  categoryName: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 2 },
  categoryCount: { fontSize: 12, color: '#8E8E93' },
  categoryDescription: { fontSize: 13, color: '#666', marginBottom: 12, lineHeight: 18 },
  categoryActions: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  actionButtonText: { fontSize: 13, fontWeight: '600', color: 'white' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#8E8E93', marginBottom: 24 },
  emptyButton: { backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyButtonText: { color: 'white', fontSize: 15, fontWeight: 'bold' },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  modalClose: { fontSize: 28, color: '#8E8E93' },
  modalBody: { padding: 20 },
  label: { fontSize: 15, fontWeight: 'bold', color: '#000', marginBottom: 8, marginTop: 12 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  iconOption: { width: 50, height: 50, backgroundColor: '#F2F2F7', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#E5E5EA' },
  iconOptionSelected: { borderColor: '#007AFF', backgroundColor: '#E3F2FD' },
  iconOptionText: { fontSize: 28 },
  input: { backgroundColor: '#F2F2F7', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 12, borderWidth: 1, borderColor: '#E5E5EA' },
  textArea: { height: 80, textAlignVertical: 'top' },
  modalFooter: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: '#E5E5EA' },
  cancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#F2F2F7' },
  cancelButtonText: { fontSize: 16, fontWeight: 'bold', color: '#8E8E93' },
  saveButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#007AFF' },
  saveButtonText: { fontSize: 16, fontWeight: 'bold', color: 'white' },

  fabButton: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  fabButtonText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
});
