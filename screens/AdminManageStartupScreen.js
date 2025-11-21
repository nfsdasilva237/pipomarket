// screens/AdminManageStartupScreen.js - GESTION DÉTAILLÉE STARTUP
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../config/firebase';
import adminService from '../utils/adminService';

export default function AdminManageStartupScreen({ route, navigation }) {
    const insets = useSafeAreaInsets(); // ← Ajouté pour SafeAreaInsets
  const { startupId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [startup, setStartup] = useState(null);
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(false);
  
  // Champs éditables
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    loadStartup();
  }, []);

  const loadStartup = async () => {
    try {
      // Charger startup
      const startupDoc = await getDoc(doc(db, 'startups', startupId));
      if (!startupDoc.exists()) {
        Alert.alert('Erreur', 'Startup introuvable');
        navigation.goBack();
        return;
      }

      const startupData = { id: startupDoc.id, ...startupDoc.data() };
      setStartup(startupData);
      setName(startupData.name || '');
      setDescription(startupData.description || '');
      setPhone(startupData.ownerPhone || '');
      setActive(startupData.active !== false);

      // Charger produits
      const q = query(collection(db, 'products'), where('startupId', '==', startupId));
      const productsSnap = await getDocs(q);
      const productsData = productsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);

    } catch (error) {
      console.error('Erreur chargement:', error);
      Alert.alert('Erreur', 'Impossible de charger la startup');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      await updateDoc(doc(db, 'startups', startupId), {
        name,
        description,
        ownerPhone: phone,
        active,
        updatedAt: new Date(),
      });

      Alert.alert('Succès', 'Startup mise à jour');
      setEditing(false);
      loadStartup();
      
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer startup',
      `Supprimer "${startup.name}" et tous ses produits ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const result = await adminService.deleteStartup(startupId);
            if (result.success) {
              Alert.alert('Succès', 'Startup supprimée', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } else {
              Alert.alert('Erreur', result.error);
            }
          },
        },
      ]
    );
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gérer Startup</Text>
        <TouchableOpacity onPress={() => setEditing(!editing)}>
          <Text style={styles.editButton}>{editing ? '✓' : '✏️'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* INFO PRINCIPALE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Informations</Text>
          
          <Text style={styles.label}>Nom de la startup</Text>
          <TextInput
            style={[styles.input, !editing && styles.inputDisabled]}
            value={name}
            onChangeText={setName}
            editable={editing}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea, !editing && styles.inputDisabled]}
            value={description}
            onChangeText={setDescription}
            editable={editing}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>Téléphone</Text>
          <TextInput
            style={[styles.input, !editing && styles.inputDisabled]}
            value={phone}
            onChangeText={setPhone}
            editable={editing}
            keyboardType="phone-pad"
          />

          <View style={styles.switchRow}>
            <Text style={styles.label}>Statut</Text>
            <TouchableOpacity
              style={[styles.switch, active && styles.switchActive]}
              onPress={() => editing && setActive(!active)}
              disabled={!editing}
            >
              <Text style={styles.switchText}>
                {active ? '✅ Active' : '❌ Inactive'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PROPRIÉTAIRE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Propriétaire</Text>
          <Text style={styles.info}>Nom: {startup.ownerName || 'N/A'}</Text>
          <Text style={styles.info}>Email: {startup.ownerEmail || 'N/A'}</Text>
          <Text style={styles.info}>ID: {startup.ownerId}</Text>
        </View>

        {/* STATISTIQUES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Statistiques</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{products.length}</Text>
              <Text style={styles.statLabel}>Produits</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {products.filter(p => p.available).length}
              </Text>
              <Text style={styles.statLabel}>Disponibles</Text>
            </View>
          </View>
        </View>

        {/* PRODUITS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📦 Produits ({products.length})</Text>
          {products.map(product => (
            <View key={product.id} style={styles.productCard}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productDetail}>
                {product.price?.toLocaleString('fr-FR')} FCFA
              </Text>
              <Text style={styles.productDetail}>Stock: {product.stock}</Text>
            </View>
          ))}
        </View>

        {/* ACTIONS */}
        {editing && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>💾 Sauvegarder</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>🗑️ Supprimer Startup</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: Math.max(insets.bottom + 20, 80) }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#FF3B30' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  backButton: { fontSize: 28, color: '#007AFF' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  editButton: { fontSize: 24 },
  
  content: { flex: 1 },
  section: { backgroundColor: 'white', padding: 16, marginTop: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 16 },
  
  label: { fontSize: 13, fontWeight: '600', color: '#000', marginBottom: 8, marginTop: 8 },
  input: { backgroundColor: '#F2F2F7', borderRadius: 8, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#E5E5EA' },
  inputDisabled: { backgroundColor: '#F8F8F8', color: '#8E8E93' },
  textArea: { height: 100, textAlignVertical: 'top' },
  
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  switch: { backgroundColor: '#FF3B30', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  switchActive: { backgroundColor: '#34C759' },
  switchText: { color: 'white', fontSize: 13, fontWeight: 'bold' },
  
  info: { fontSize: 14, color: '#000', marginBottom: 8 },
  
  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: '#F2F2F7', borderRadius: 12, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#007AFF', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#8E8E93' },
  
  productCard: { backgroundColor: '#F2F2F7', borderRadius: 8, padding: 12, marginBottom: 8 },
  productName: { fontSize: 14, fontWeight: '600', color: '#000', marginBottom: 4 },
  productDetail: { fontSize: 12, color: '#8E8E93' },
  
  saveButton: { backgroundColor: '#34C759', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  
  deleteButton: { backgroundColor: '#FF3B30', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  deleteButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
