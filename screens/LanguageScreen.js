// screens/LanguageScreen.js
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LanguageScreen({ navigation }) {
  const [selectedLanguage, setSelectedLanguage] = useState('fr');

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷', native: 'Français' },
    { code: 'en', name: 'Anglais', flag: '🇬🇧', native: 'English' },
    { code: 'de', name: 'Allemand', flag: '🇩🇪', native: 'Deutsch' },
    { code: 'es', name: 'Espagnol', flag: '🇪🇸', native: 'Español' },
  ];

  const handleSelectLanguage = (code) => {
    setSelectedLanguage(code);
    
    // TODO: Implémenter la sauvegarde de la langue
    // Pour l'instant, juste une alerte
    const language = languages.find(l => l.code === code);
    
    Alert.alert(
      'Langue changée',
      `Langue définie sur ${language.name}`,
      [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Langue</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* INFO */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🌍</Text>
          <Text style={styles.infoText}>
            Sélectionnez votre langue préférée. L'application sera traduite dans la langue choisie.
          </Text>
        </View>

        {/* LISTE DES LANGUES */}
        <View style={styles.languageList}>
          {languages.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageItem,
                selectedLanguage === language.code && styles.languageItemSelected,
              ]}
              onPress={() => handleSelectLanguage(language.code)}
            >
              <View style={styles.languageLeft}>
                <Text style={styles.languageFlag}>{language.flag}</Text>
                <View style={styles.languageTextContainer}>
                  <Text style={styles.languageName}>{language.name}</Text>
                  <Text style={styles.languageNative}>{language.native}</Text>
                </View>
              </View>
              {selectedLanguage === language.code && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkIcon}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* NOTE */}
        <View style={styles.noteCard}>
          <Text style={styles.noteIcon}>💡</Text>
          <Text style={styles.noteText}>
            Note : Le changement de langue s'appliquera immédiatement à toute l'application.
          </Text>
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
  infoCard: {
    backgroundColor: 'white',
    margin: 20,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  languageList: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  languageItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageFlag: {
    fontSize: 32,
    marginRight: 16,
  },
  languageTextContainer: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  languageNative: {
    fontSize: 13,
    color: '#8E8E93',
  },
  checkmark: {
    width: 28,
    height: 28,
    backgroundColor: '#007AFF',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkIcon: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3CD',
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  noteIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
});
