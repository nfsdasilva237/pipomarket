// screens/SettingsScreen.js (VERSION CORRIGÉE - NAVIGATION FONCTIONNELLE)
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen({ navigation }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [promoNotifications, setPromoNotifications] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Section Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🔔</Text>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>Notifications push</Text>
                <Text style={styles.settingDescription}>
                  Recevoir des notifications sur vos commandes
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              thumbColor="white"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>📧</Text>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>Notifications email</Text>
                <Text style={styles.settingDescription}>
                  Recevoir des emails de confirmation
                </Text>
              </View>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              thumbColor="white"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🎁</Text>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>Promotions</Text>
                <Text style={styles.settingDescription}>
                  Recevoir les offres et nouveautés
                </Text>
              </View>
            </View>
            <Switch
              value={promoNotifications}
              onValueChange={setPromoNotifications}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              thumbColor="white"
            />
          </View>
        </View>

        {/* Section Compte */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte</Text>
          
          {/* ✅ MODIFIER LE PROFIL */}
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuItemIcon}>👤</Text>
              <Text style={styles.menuItemText}>Modifier le profil</Text>
            </View>
            <Text style={styles.menuItemArrow}>→</Text>
          </TouchableOpacity>

          {/* ✅ CHANGER MOT DE PASSE */}
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuItemIcon}>🔒</Text>
              <Text style={styles.menuItemText}>Changer le mot de passe</Text>
            </View>
            <Text style={styles.menuItemArrow}>→</Text>
          </TouchableOpacity>

          {/* ✅ LANGUE */}
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('Language')}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuItemIcon}>🌍</Text>
              <Text style={styles.menuItemText}>Langue</Text>
            </View>
            <View style={styles.menuItemRight}>
              <Text style={styles.menuItemValue}>Français</Text>
              <Text style={styles.menuItemArrow}>→</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Section Sécurité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sécurité & Confidentialité</Text>
          
          {/* ✅ POLITIQUE DE CONFIDENTIALITÉ */}
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuItemIcon}>🛡️</Text>
              <Text style={styles.menuItemText}>Politique de confidentialité</Text>
            </View>
            <Text style={styles.menuItemArrow}>→</Text>
          </TouchableOpacity>

          {/* ✅ CONDITIONS D'UTILISATION */}
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('Terms')}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuItemIcon}>📜</Text>
              <Text style={styles.menuItemText}>Conditions d'utilisation</Text>
            </View>
            <Text style={styles.menuItemArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Section Danger */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={() => {
              Alert.alert(
                'Supprimer le compte',
                'Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.',
                [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Supprimer', style: 'destructive' },
                ]
              );
            }}
          >
            <Text style={styles.dangerButtonText}>🗑️ Supprimer mon compte</Text>
          </TouchableOpacity>
        </View>

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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    backgroundColor: 'white',
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingText: {
    fontSize: 15,
    color: '#000',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#8E8E93',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 15,
    color: '#000',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemValue: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 8,
  },
  menuItemArrow: {
    fontSize: 18,
    color: '#C7C7CC',
  },
  dangerButton: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  dangerButtonText: {
    fontSize: 15,
    color: '#FF3B30',
    fontWeight: '600',
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