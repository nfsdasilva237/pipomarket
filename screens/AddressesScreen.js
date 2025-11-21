// screens/AddressesScreen.js - VERSION COMPLÈTE

import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';

import { useEffect, useState } from 'react';

import {
  ActivityIndicator,

  Alert,

  Modal,

  ScrollView,

  StyleSheet,

  Text,

  TextInput,

  TouchableOpacity,

  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../config/firebase';

 

export default function AddressesScreen({ navigation, route }) {
    const insets = useSafeAreaInsets(); // ← Ajouté pour SafeAreaInsets

  const [addresses, setAddresses] = useState([]);

  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);

  const [editingAddress, setEditingAddress] = useState(null);

 

  // Form states

  const [name, setName] = useState('');

  const [street, setStreet] = useState('');

  const [city, setCity] = useState('');

  const [phone, setPhone] = useState('');

  const [saving, setSaving] = useState(false);

 

  const { selectMode, onAddressSelected } = route.params || {};

 

  useEffect(() => {

    loadAddresses();

  }, []);

 

  const loadAddresses = async () => {

    try {

      const userId = auth.currentUser?.uid;

      if (!userId) {

        setLoading(false);

        return;

      }

 

      const q = query(

        collection(db, 'addresses'),

        where('userId', '==', userId)

      );

      const snapshot = await getDocs(q);

 

      const addressList = snapshot.docs.map(doc => ({

        id: doc.id,

        ...doc.data(),

      }));

 

      setAddresses(addressList);

    } catch (error) {

      console.error('Erreur chargement adresses:', error);

      Alert.alert('Erreur', 'Impossible de charger les adresses');

    } finally {

      setLoading(false);

    }

  };

 

  const openAddModal = () => {

    setEditingAddress(null);

    setName('');

    setStreet('');

    setCity('');

    setPhone('');

    setModalVisible(true);

  };

 

  const openEditModal = (address) => {

    setEditingAddress(address);

    setName(address.name || '');

    setStreet(address.street || '');

    setCity(address.city || '');

    setPhone(address.phone || '');

    setModalVisible(true);

  };

 

  const handleSave = async () => {

    if (!name.trim() || !street.trim() || !city.trim() || !phone.trim()) {

      Alert.alert('Erreur', 'Veuillez remplir tous les champs');

      return;

    }

 

    setSaving(true);

 

    try {

      const userId = auth.currentUser?.uid;

      if (!userId) {

        Alert.alert('Erreur', 'Vous devez être connecté');

        return;

      }

 

      const addressData = {

        userId,

        name: name.trim(),

        street: street.trim(),

        city: city.trim(),

        phone: phone.trim(),

        isDefault: addresses.length === 0, // Première adresse = par défaut

        updatedAt: new Date(),

      };

 

      if (editingAddress) {

        // Mise à jour

        await updateDoc(doc(db, 'addresses', editingAddress.id), addressData);

        Alert.alert('Succès', 'Adresse mise à jour');

      } else {

        // Création

        addressData.createdAt = new Date();

        await addDoc(collection(db, 'addresses'), addressData);

        Alert.alert('Succès', 'Adresse ajoutée');

      }

 

      setModalVisible(false);

      loadAddresses();

    } catch (error) {

      console.error('Erreur sauvegarde adresse:', error);

      Alert.alert('Erreur', 'Impossible de sauvegarder l\'adresse');

    } finally {

      setSaving(false);

    }

  };

 

  const handleDelete = (address) => {

    Alert.alert(

      'Supprimer',

      'Voulez-vous vraiment supprimer cette adresse ?',

      [

        { text: 'Annuler', style: 'cancel' },

        {

          text: 'Supprimer',

          style: 'destructive',

          onPress: async () => {

            try {

              await deleteDoc(doc(db, 'addresses', address.id));

              Alert.alert('Succès', 'Adresse supprimée');

              loadAddresses();

            } catch (error) {

              console.error('Erreur suppression:', error);

              Alert.alert('Erreur', 'Impossible de supprimer l\'adresse');

            }

          },

        },

      ]

    );

  };

 

  const handleSetDefault = async (address) => {

    try {

      const userId = auth.currentUser?.uid;

      if (!userId) return;

 

      // Retirer le statut par défaut des autres adresses

      const updatePromises = addresses.map(addr => {

        if (addr.id === address.id) {

          return updateDoc(doc(db, 'addresses', addr.id), { isDefault: true });

        } else if (addr.isDefault) {

          return updateDoc(doc(db, 'addresses', addr.id), { isDefault: false });

        }

        return Promise.resolve();

      });

 

      await Promise.all(updatePromises);

      Alert.alert('Succès', 'Adresse par défaut mise à jour');

      loadAddresses();

    } catch (error) {

      console.error('Erreur mise à jour par défaut:', error);

      Alert.alert('Erreur', 'Impossible de définir l\'adresse par défaut');

    }

  };

 

  const handleSelectAddress = (address) => {

    if (selectMode && onAddressSelected) {

      onAddressSelected(address);

      navigation.goBack();

    }

  };

 

  if (loading) {

    return (

      <SafeAreaView style={styles.container}>

        <View style={styles.header}>

          <TouchableOpacity onPress={() => navigation.goBack()}>

            <Text style={styles.backButton}>←</Text>

          </TouchableOpacity>

          <Text style={styles.headerTitle}>Mes Adresses</Text>

          <View style={styles.placeholder} />

        </View>

        <View style={styles.loadingContainer}>

          <ActivityIndicator size="large" color="#007AFF" />

        </View>

      </SafeAreaView>

    );

  }

 

  return (

    <SafeAreaView style={styles.container}>

      {/* HEADER */}

      <View style={styles.header}>

        <TouchableOpacity onPress={() => navigation.goBack()}>

          <Text style={styles.backButton}>←</Text>

        </TouchableOpacity>

        <Text style={styles.headerTitle}>Mes Adresses</Text>

        <TouchableOpacity onPress={openAddModal}>

          <Text style={styles.addHeaderButton}>+</Text>

        </TouchableOpacity>

      </View>

 

      <ScrollView style={styles.content}>

        {addresses.length === 0 ? (

          /* ÉTAT VIDE */

          <>

            <View style={styles.emptyState}>

              <Text style={styles.emptyIcon}>📍</Text>

              <Text style={styles.emptyTitle}>Aucune adresse enregistrée</Text>

              <Text style={styles.emptyText}>

                Ajoutez une adresse de livraison{'\n'}pour faciliter vos commandes

              </Text>

              <TouchableOpacity style={styles.addButton} onPress={openAddModal}>

                <Text style={styles.addButtonText}>+ Ajouter une adresse</Text>

              </TouchableOpacity>

            </View>

 

            <View style={styles.infoCard}>

              <Text style={styles.infoIcon}>💡</Text>

              <Text style={styles.infoText}>

                Enregistrez plusieurs adresses et sélectionnez-en une lors de chaque commande

              </Text>

            </View>

          </>

        ) : (

          /* LISTE DES ADRESSES */

          <>

            {selectMode && (

              <View style={styles.selectModeCard}>

                <Text style={styles.selectModeText}>

                  Sélectionnez une adresse de livraison

                </Text>

              </View>

            )}

 

            {addresses.map((address) => (

              <TouchableOpacity

                key={address.id}

                style={[

                  styles.addressCard,

                  address.isDefault && styles.addressCardDefault,

                ]}

                onPress={() => selectMode ? handleSelectAddress(address) : null}

                activeOpacity={selectMode ? 0.7 : 1}

              >

                <View style={styles.addressCardHeader}>

                  <Text style={styles.addressName}>{address.name}</Text>

                  {address.isDefault && (

                    <View style={styles.defaultBadge}>

                      <Text style={styles.defaultBadgeText}>Par défaut</Text>

                    </View>

                  )}

                </View>

 

                <Text style={styles.addressStreet}>{address.street}</Text>

                <Text style={styles.addressCity}>{address.city}</Text>

                <Text style={styles.addressPhone}>📞 {address.phone}</Text>

 

                {!selectMode && (

                  <View style={styles.addressActions}>

                    {!address.isDefault && (

                      <TouchableOpacity

                        style={styles.actionButton}

                        onPress={() => handleSetDefault(address)}

                      >

                        <Text style={styles.actionButtonText}>

                          ⭐ Définir par défaut

                        </Text>

                      </TouchableOpacity>

                    )}

 

                    <TouchableOpacity

                      style={styles.actionButton}

                      onPress={() => openEditModal(address)}

                    >

                      <Text style={styles.actionButtonText}>✏️ Modifier</Text>

                    </TouchableOpacity>

 

                    <TouchableOpacity

                      style={[styles.actionButton, styles.deleteButton]}

                      onPress={() => handleDelete(address)}

                    >

                      <Text style={styles.deleteButtonText}>🗑️ Supprimer</Text>

                    </TouchableOpacity>

                  </View>

                )}

 

                {selectMode && (

                  <View style={styles.selectIndicator}>

                    <Text style={styles.selectIndicatorText}>

                      Appuyer pour sélectionner →

                    </Text>

                  </View>

                )}

              </TouchableOpacity>

            ))}

 

            {!selectMode && (

              <TouchableOpacity

                style={styles.addAnotherButton}

                onPress={openAddModal}

              >

                <Text style={styles.addAnotherButtonText}>

                  + Ajouter une autre adresse

                </Text>

              </TouchableOpacity>

            )}

          </>

        )}

      </ScrollView>

 

      {/* MODAL AJOUT/MODIFICATION */}

      <Modal

        visible={modalVisible}

        animationType="slide"

        transparent={true}

        onRequestClose={() => setModalVisible(false)}

      >

        <View style={styles.modalOverlay}>

          <View style={styles.modalContainer}>

            <View style={styles.modalHeader}>

              <Text style={styles.modalTitle}>

                {editingAddress ? 'Modifier l\'adresse' : 'Nouvelle adresse'}

              </Text>

              <TouchableOpacity

                onPress={() => setModalVisible(false)}

                style={styles.modalCloseButton}

              >

                <Text style={styles.modalCloseText}>✕</Text>

              </TouchableOpacity>

            </View>

 

            <ScrollView style={styles.modalContent}>

              <Text style={styles.label}>Nom / Label</Text>

              <TextInput

                style={styles.input}

                placeholder="Ex: Maison, Bureau, etc."

                value={name}

                onChangeText={setName}

                placeholderTextColor="#8E8E93"

              />

 

              <Text style={styles.label}>Rue / Adresse</Text>

              <TextInput

                style={[styles.input, styles.textArea]}

                placeholder="Ex: Rue 123, Quartier XYZ"

                value={street}

                onChangeText={setStreet}

                multiline

                numberOfLines={3}

                textAlignVertical="top"

                placeholderTextColor="#8E8E93"

              />

 

              <Text style={styles.label}>Ville</Text>

              <TextInput

                style={styles.input}

                placeholder="Ex: Douala, Yaoundé"

                value={city}

                onChangeText={setCity}

                placeholderTextColor="#8E8E93"

              />

 

              <Text style={styles.label}>Téléphone</Text>

              <TextInput

                style={styles.input}

                placeholder="Ex: 6XXXXXXXX"

                value={phone}

                onChangeText={setPhone}

                keyboardType="phone-pad"

                placeholderTextColor="#8E8E93"

              />

 

              <TouchableOpacity

                style={[styles.saveButton, saving && styles.saveButtonDisabled]}

                onPress={handleSave}

                disabled={saving}

              >

                {saving ? (

                  <ActivityIndicator color="white" />

                ) : (

                  <Text style={styles.saveButtonText}>

                    {editingAddress ? 'Mettre à jour' : 'Ajouter'}

                  </Text>

                )}

              </TouchableOpacity>

 

              <TouchableOpacity

                style={styles.cancelButton}

                onPress={() => setModalVisible(false)}

              >

                <Text style={styles.cancelButtonText}>Annuler</Text>

              </TouchableOpacity>

            </ScrollView>

          </View>

        </View>

      </Modal>

    </SafeAreaView>

  );

}

 

const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: '#F2F2F7' },

  header: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    padding: 20,

    backgroundColor: 'white',

    borderBottomWidth: 1,

    borderBottomColor: '#E5E5EA',

  },

  backButton: { fontSize: 28, color: '#007AFF' },

  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },

  addHeaderButton: { fontSize: 32, color: '#007AFF', fontWeight: 'bold' },

  placeholder: { width: 40 },

 

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

 

  content: { flex: 1, padding: 20 },

 

  // État vide

  emptyState: {

    backgroundColor: 'white',

    borderRadius: 16,

    padding: 40,

    alignItems: 'center',

    marginBottom: 20,

  },

  emptyIcon: { fontSize: 64, marginBottom: 16 },

  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 8 },

  emptyText: {

    fontSize: 14,

    color: '#8E8E93',

    textAlign: 'center',

    marginBottom: 24,

    lineHeight: 20,

  },

  addButton: {

    backgroundColor: '#007AFF',

    borderRadius: 12,

    paddingHorizontal: 24,

    paddingVertical: 12,

  },

  addButtonText: { color: 'white', fontSize: 15, fontWeight: 'bold' },

 

  infoCard: {

    flexDirection: 'row',

    backgroundColor: '#E3F2FD',

    borderRadius: 12,

    padding: 16,

    alignItems: 'center',

  },

  infoIcon: { fontSize: 24, marginRight: 12 },

  infoText: { flex: 1, fontSize: 13, color: '#1976D2', lineHeight: 18 },

 

  // Mode sélection

  selectModeCard: {

    backgroundColor: '#FFF3CD',

    borderRadius: 12,

    padding: 16,

    marginBottom: 16,

    borderLeftWidth: 4,

    borderLeftColor: '#FF9500',

  },

  selectModeText: {

    fontSize: 14,

    fontWeight: '600',

    color: '#000',

    textAlign: 'center',

  },

 

  // Carte adresse

  addressCard: {

    backgroundColor: 'white',

    borderRadius: 16,

    padding: 20,

    marginBottom: 16,

    borderWidth: 2,

    borderColor: '#E5E5EA',

  },

  addressCardDefault: {

    borderColor: '#007AFF',

    backgroundColor: '#F0F8FF',

  },

  addressCardHeader: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    marginBottom: 12,

  },

  addressName: { fontSize: 18, fontWeight: 'bold', color: '#000', flex: 1 },

  defaultBadge: {

    backgroundColor: '#007AFF',

    borderRadius: 12,

    paddingHorizontal: 12,

    paddingVertical: 4,

  },

  defaultBadgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },

 

  addressStreet: { fontSize: 15, color: '#000', marginBottom: 4 },

  addressCity: { fontSize: 15, color: '#666', marginBottom: 4 },

  addressPhone: { fontSize: 14, color: '#007AFF', marginBottom: 12 },

 

  addressActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },

  actionButton: {

    backgroundColor: '#F2F2F7',

    borderRadius: 8,

    paddingHorizontal: 12,

    paddingVertical: 8,

  },

  actionButtonText: { fontSize: 13, color: '#007AFF', fontWeight: '600' },

  deleteButton: { backgroundColor: '#FFEBEE' },

  deleteButtonText: { fontSize: 13, color: '#FF3B30', fontWeight: '600' },

 

  selectIndicator: {

    marginTop: 12,

    paddingTop: 12,

    borderTopWidth: 1,

    borderTopColor: '#E5E5EA',

  },

  selectIndicatorText: {

    fontSize: 13,

    color: '#007AFF',

    fontWeight: '600',

    textAlign: 'center',

  },

 

  addAnotherButton: {

    backgroundColor: 'white',

    borderRadius: 12,

    padding: 20,

    alignItems: 'center',

    borderWidth: 2,

    borderColor: '#007AFF',

    borderStyle: 'dashed',

    marginBottom: 20,

  },

  addAnotherButtonText: {

    fontSize: 15,

    fontWeight: 'bold',

    color: '#007AFF',

  },

 

  // Modal

  modalOverlay: {

    flex: 1,

    backgroundColor: 'rgba(0,0,0,0.5)',

    justifyContent: 'flex-end',

  },

  modalContainer: {

    backgroundColor: 'white',

    borderTopLeftRadius: 20,

    borderTopRightRadius: 20,

    maxHeight: '90%',

  },

  modalHeader: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    padding: 20,

    borderBottomWidth: 1,

    borderBottomColor: '#E5E5EA',

  },

  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', flex: 1 },

  modalCloseButton: {

    width: 32,

    height: 32,

    borderRadius: 16,

    backgroundColor: '#F2F2F7',

    justifyContent: 'center',

    alignItems: 'center',

  },

  modalCloseText: { fontSize: 20, color: '#8E8E93', fontWeight: 'bold' },

 

  modalContent: { padding: 20 },

 

  label: {

    fontSize: 14,

    fontWeight: '600',

    color: '#000',

    marginBottom: 8,

    marginTop: 12,

  },

  input: {

    backgroundColor: '#F2F2F7',

    borderRadius: 12,

    padding: 16,

    fontSize: 15,

    color: '#000',

    borderWidth: 1,

    borderColor: '#E5E5EA',

  },

  textArea: { height: 80, paddingTop: 16, textAlignVertical: 'top' },

 

  saveButton: {

    backgroundColor: '#007AFF',

    borderRadius: 12,

    padding: 16,

    alignItems: 'center',

    marginTop: 24,

  },

  saveButtonDisabled: { opacity: 0.5 },

  saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

 

  cancelButton: {

    backgroundColor: '#F2F2F7',

    borderRadius: 12,

    padding: 16,

    alignItems: 'center',

    marginTop: 12,

    marginBottom: 20,

  },

  cancelButtonText: { color: '#8E8E93', fontSize: 16, fontWeight: '600' },

});