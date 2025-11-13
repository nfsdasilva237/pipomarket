// screens/ProfileScreen.js (AVEC ACCÈS FIDÉLITÉ)
import { doc, getDoc, signOut } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../config/firebase';
import { getUserLevel } from '../config/loyaltyConfig';

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [userPoints, setUserPoints] = useState(0);
  const [userLevel, setUserLevel] = useState({ name: 'Bronze', icon: '🥉' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadUserData = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        navigation.replace('Login');
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', userId));
      const data = userDoc.data();
      setUserData(data);

      const points = data?.loyaltyPoints || 0;
      setUserPoints(points);
      setUserLevel(getUserLevel(points));
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await signOut(auth);
          navigation.replace('Login');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>👤 Mon Profil</Text>
        </View>

        {/* PROFIL INFO */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {userData?.firstName?.[0]?.toUpperCase() || '👤'}
            </Text>
          </View>
          <Text style={styles.profileName}>
            {userData?.firstName} {userData?.lastName}
          </Text>
          <Text style={styles.profileEmail}>{userData?.email}</Text>
        </View>

        {/* CARTE FIDÉLITÉ */}
        <TouchableOpacity
          style={[styles.loyaltyCard, { backgroundColor: userLevel.color || '#007AFF' }]}
          onPress={() => navigation.navigate('Loyalty')}
          activeOpacity={0.8}
        >
          <View style={styles.loyaltyCardHeader}>
            <View style={styles.loyaltyCardLeft}>
              <Text style={styles.loyaltyCardIcon}>{userLevel.icon}</Text>
              <View>
                <Text style={styles.loyaltyCardTitle}>Programme de Fidélité</Text>
                <Text style={styles.loyaltyCardLevel}>Niveau {userLevel.name}</Text>
              </View>
            </View>
            <View style={styles.loyaltyCardRight}>
              <Text style={styles.loyaltyCardPoints}>{userPoints}</Text>
              <Text style={styles.loyaltyCardPointsLabel}>points</Text>
            </View>
          </View>
          <View style={styles.loyaltyCardFooter}>
            <Text style={styles.loyaltyCardAction}>Voir mes récompenses →</Text>
          </View>
        </TouchableOpacity>

        {/* COMMANDES EN COURS */}
        <TouchableOpacity
          style={[styles.ordersCard, { backgroundColor: '#FF9500' }]}
          onPress={() => navigation.navigate('Orders')}
          activeOpacity={0.8}
        >
          <View style={styles.ordersCardHeader}>
            <View style={styles.ordersCardLeft}>
              <Text style={styles.ordersCardIcon}>📦</Text>
              <View>
                <Text style={styles.ordersCardTitle}>Mes Commandes</Text>
                <Text style={styles.ordersCardSubtitle}>Voir mes commandes en cours et passées</Text>
              </View>
            </View>
            <Text style={styles.menuItemArrow}>→</Text>
          </View>
        </TouchableOpacity>

        {/* MENU OPTIONS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mon Compte</Text>

          <TouchableOpacity
    style={styles.menuItem}
    onPress={() => navigation.navigate('Favorites')}
  >
    <View style={styles.menuItemLeft}>
      <Text style={styles.menuItemIcon}>❤️</Text>
      <Text style={styles.menuItemText}>Mes favoris</Text>
    </View>
    <Text style={styles.menuItemArrow}>→</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.menuItem}
    onPress={() => navigation.navigate('Addresses')}
  >
    <View style={styles.menuItemLeft}>
      <Text style={styles.menuItemIcon}>📍</Text>
      <Text style={styles.menuItemText}>Mes adresses</Text>
    </View>
    <Text style={styles.menuItemArrow}>→</Text>
  </TouchableOpacity>
</View>

<View style={styles.section}>
  <Text style={styles.sectionTitle}>Préférences</Text>
  
  <TouchableOpacity
    style={styles.menuItem}
    onPress={() => navigation.navigate('Settings')}
  >
    <View style={styles.menuItemLeft}>
      <Text style={styles.menuItemIcon}>⚙️</Text>
      <Text style={styles.menuItemText}>Paramètres du compte</Text>
    </View>
    <Text style={styles.menuItemArrow}>→</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.menuItem}
    onPress={() => navigation.navigate('Notifications')}
  >
    <View style={styles.menuItemLeft}>
      <Text style={styles.menuItemIcon}>🔔</Text>
      <Text style={styles.menuItemText}>Notifications</Text>
    </View>
    <Text style={styles.menuItemArrow}>→</Text>
  </TouchableOpacity>
</View>

<View style={styles.section}>
  <Text style={styles.sectionTitle}>Support</Text>
  
  <TouchableOpacity
    style={styles.menuItem}
    onPress={() => navigation.navigate('Help')}
  >
    <View style={styles.menuItemLeft}>
      <Text style={styles.menuItemIcon}>❓</Text>
      <Text style={styles.menuItemText}>Aide & Support</Text>
    </View>
    <Text style={styles.menuItemArrow}>→</Text>
  </TouchableOpacity>
</View>

        {/* PARAMÈTRES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuItemIcon}>⚙️</Text>
              <Text style={styles.menuItemText}>Paramètres du compte</Text>
            </View>
            <Text style={styles.menuItemArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuItemIcon}>🔔</Text>
              <Text style={styles.menuItemText}>Notifications</Text>
            </View>
            <Text style={styles.menuItemArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuItemIcon}>❓</Text>
              <Text style={styles.menuItemText}>Aide & Support</Text>
            </View>
            <Text style={styles.menuItemArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* DÉCONNEXION */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>🚪 Déconnexion</Text>
          </TouchableOpacity>
        </View>

        {/* VERSION */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
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
  scrollView: {
    flex: 1,
  },
  ordersCard: {
    backgroundColor: '#FF9500',
    borderRadius: 15,
    margin: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ordersCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ordersCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ordersCardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  ordersCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  ordersCardSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  profileCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    backgroundColor: '#007AFF',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#8E8E93',
  },
  loyaltyCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  loyaltyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  loyaltyCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  loyaltyCardIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  loyaltyCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  loyaltyCardLevel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  loyaltyCardRight: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  loyaltyCardPoints: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  loyaltyCardPointsLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    marginTop: -4,
  },
  loyaltyCardFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 12,
  },
  loyaltyCardAction: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  menuItemArrow: {
    fontSize: 18,
    color: '#8E8E93',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#8E8E93',
  },
});
