// screens/AdminLoyaltyUsersScreen.js - ✅ GESTION UTILISATEURS FIDÉLITÉ

import { LinearGradient } from 'expo-linear-gradient';
import {
    collection,
    doc,
    getDocs,
    updateDoc
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../config/firebase';
import { getUserLevel } from '../config/loyaltyConfig';

export default function AdminLoyaltyUsersScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('points'); // points, name, level

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [searchQuery, sortBy, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = [];

      usersSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.loyaltyPoints !== undefined) {
          const level = getUserLevel(data.loyaltyPoints || 0);
          usersData.push({
            id: docSnap.id,
            name: data.fullName || 'Utilisateur',
            email: data.email || 'N/A',
            phone: data.phone || 'N/A',
            points: data.loyaltyPoints || 0,
            level: level.name,
            levelIcon: level.icon,
            levelColor: level.color,
            createdAt: data.createdAt,
          });
        }
      });

      setUsers(usersData);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      Alert.alert('Erreur', 'Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterAndSortUsers = () => {
    let filtered = [...users];

    // Filtrer par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.phone.includes(query)
      );
    }

    // Trier
    if (sortBy === 'points') {
      filtered.sort((a, b) => b.points - a.points);
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'level') {
      const levelOrder = ['Diamant', 'Platine', 'Or', 'Argent', 'Bronze'];
      filtered.sort((a, b) => {
        return levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level);
      });
    }

    setFilteredUsers(filtered);
  };

  const handleAdjustPoints = (user) => {
    Alert.prompt(
      `Ajuster les points - ${user.name}`,
      `Points actuels: ${user.points}\n\nEntrez le nombre de points à ajouter (négatif pour retirer) :`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Valider',
          onPress: async (input) => {
            try {
              const adjustment = parseInt(input);
              if (isNaN(adjustment)) {
                Alert.alert('Erreur', 'Nombre invalide');
                return;
              }

              const newPoints = Math.max(0, user.points + adjustment);

              await updateDoc(doc(db, 'users', user.id), {
                loyaltyPoints: newPoints,
              });

              Alert.alert(
                'Succès',
                `Points ajustés: ${user.points} → ${newPoints}`
              );
              loadUsers();
            } catch (error) {
              console.error('Erreur ajustement:', error);
              Alert.alert('Erreur', 'Impossible d\'ajuster les points');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const renderUser = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View
          style={[
            styles.levelBadge,
            { backgroundColor: item.levelColor || '#CD7F32' },
          ]}
        >
          <Text style={styles.levelIcon}>{item.levelIcon}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <Text style={styles.userPhone}>📞 {item.phone}</Text>
        </View>
        <View style={styles.userPoints}>
          <Text style={styles.pointsValue}>{item.points.toLocaleString()}</Text>
          <Text style={styles.pointsLabel}>points</Text>
        </View>
      </View>

      <View style={styles.levelInfo}>
        <Text style={styles.levelText}>
          {item.levelIcon} Niveau {item.level}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.adjustButton}
        onPress={() => handleAdjustPoints(item)}
      >
        <Text style={styles.adjustButtonText}>⚙️ Ajuster les points</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9333EA" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* HEADER */}
      <LinearGradient
        colors={['#9333EA', '#7E22CE', '#6B21A8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>👥 Utilisateurs</Text>
          <Text style={styles.headerSubtitle}>
            {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={() => loadUsers()} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* RECHERCHE ET FILTRES */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par nom, email, téléphone..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'points' && styles.sortButtonActive]}
            onPress={() => setSortBy('points')}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortBy === 'points' && styles.sortButtonTextActive,
              ]}
            >
              Points
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'level' && styles.sortButtonActive]}
            onPress={() => setSortBy('level')}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortBy === 'level' && styles.sortButtonTextActive,
              ]}
            >
              Niveau
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]}
            onPress={() => setSortBy('name')}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortBy === 'name' && styles.sortButtonTextActive,
              ]}
            >
              Nom
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* LISTE */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadUsers();
            }}
            tintColor="#9333EA"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>Aucun utilisateur</Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Aucun résultat pour cette recherche'
                : 'Aucun utilisateur avec des points'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: { fontSize: 28, color: 'white', fontWeight: 'bold' },
  headerCenter: { flex: 1, marginLeft: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: { fontSize: 24 },

  searchContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 12, color: '#000' },
  clearIcon: { fontSize: 18, color: '#999', padding: 4 },

  sortButtons: { flexDirection: 'row', gap: 8 },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  sortButtonActive: { backgroundColor: '#9333EA' },
  sortButtonText: { fontSize: 13, fontWeight: '600', color: '#666' },
  sortButtonTextActive: { color: 'white' },

  list: { padding: 20 },

  userCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  levelIcon: { fontSize: 28 },
  userInfo: { flex: 1 },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  userEmail: { fontSize: 13, color: '#666', marginBottom: 2 },
  userPhone: { fontSize: 12, color: '#999' },
  userPoints: { alignItems: 'flex-end' },
  pointsValue: { fontSize: 24, fontWeight: 'bold', color: '#9333EA' },
  pointsLabel: { fontSize: 11, color: '#666', marginTop: 2 },

  levelInfo: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  levelText: { fontSize: 14, fontWeight: '600', color: '#666' },

  adjustButton: {
    backgroundColor: '#9333EA',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  adjustButtonText: { color: 'white', fontSize: 14, fontWeight: 'bold' },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyText: { fontSize: 14, color: '#666', textAlign: 'center' },
});