// screens/PrivacyPolicyScreen.js
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyPolicyScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Politique de confidentialité</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* DATE */}
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </Text>
        </View>

        {/* INTRODUCTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Introduction</Text>
          <Text style={styles.text}>
            Nous accordons une grande importance à la protection de vos données personnelles. 
            Cette politique de confidentialité explique comment nous collectons, utilisons et 
            protégeons vos informations lorsque vous utilisez notre application.
          </Text>
        </View>

        {/* DONNÉES COLLECTÉES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 Données collectées</Text>
          <Text style={styles.text}>
            Nous collectons les informations suivantes :
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Informations de compte (nom, email)</Text>
            <Text style={styles.listItem}>• Informations de commande</Text>
            <Text style={styles.listItem}>• Historique d'achats</Text>
            <Text style={styles.listItem}>• Préférences utilisateur</Text>
            <Text style={styles.listItem}>• Données de navigation</Text>
          </View>
        </View>

        {/* UTILISATION DES DONNÉES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Utilisation des données</Text>
          <Text style={styles.text}>
            Vos données sont utilisées pour :
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Gérer votre compte</Text>
            <Text style={styles.listItem}>• Traiter vos commandes</Text>
            <Text style={styles.listItem}>• Améliorer nos services</Text>
            <Text style={styles.listItem}>• Vous envoyer des notifications importantes</Text>
            <Text style={styles.listItem}>• Personnaliser votre expérience</Text>
          </View>
        </View>

        {/* PARTAGE DES DONNÉES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔐 Partage des données</Text>
          <Text style={styles.text}>
            Nous ne vendons jamais vos données personnelles. Vos informations peuvent être 
            partagées uniquement avec :
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Les startups pour le traitement de vos commandes</Text>
            <Text style={styles.listItem}>• Nos prestataires de services (paiement, livraison)</Text>
            <Text style={styles.listItem}>• Les autorités légales si requis par la loi</Text>
          </View>
        </View>

        {/* SÉCURITÉ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛡️ Sécurité</Text>
          <Text style={styles.text}>
            Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles 
            appropriées pour protéger vos données contre tout accès non autorisé, perte ou 
            divulgation.
          </Text>
        </View>

        {/* VOS DROITS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚖️ Vos droits</Text>
          <Text style={styles.text}>
            Conformément à la législation en vigueur, vous disposez des droits suivants :
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Droit d'accès à vos données</Text>
            <Text style={styles.listItem}>• Droit de rectification</Text>
            <Text style={styles.listItem}>• Droit à l'effacement</Text>
            <Text style={styles.listItem}>• Droit à la portabilité</Text>
            <Text style={styles.listItem}>• Droit d'opposition</Text>
          </View>
        </View>

        {/* COOKIES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🍪 Cookies et traceurs</Text>
          <Text style={styles.text}>
            Nous utilisons des cookies et des technologies similaires pour améliorer votre 
            expérience, analyser l'utilisation de l'application et personnaliser le contenu.
          </Text>
        </View>

        {/* MODIFICATIONS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Modifications</Text>
          <Text style={styles.text}>
            Nous nous réservons le droit de modifier cette politique de confidentialité à 
            tout moment. Les modifications entrent en vigueur dès leur publication. Nous vous 
            encourageons à consulter régulièrement cette page.
          </Text>
        </View>

        {/* CONTACT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📧 Nous contacter</Text>
          <Text style={styles.text}>
            Pour toute question concernant cette politique de confidentialité ou l'exercice 
            de vos droits, contactez-nous à :
          </Text>
          <View style={styles.contactBox}>
            <Text style={styles.contactText}>📧 privacy@startupmarket.cm</Text>
            <Text style={styles.contactText}>📱 +237 6XX XXX XXX</Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            En utilisant notre application, vous acceptez cette politique de confidentialité.
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
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  dateContainer: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    margin: 20,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 13,
    color: '#1976D2',
    textAlign: 'center',
    fontWeight: '600',
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
  text: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 8,
  },
  list: {
    marginTop: 8,
    paddingLeft: 8,
  },
  listItem: {
    fontSize: 14,
    color: '#555',
    lineHeight: 24,
    marginBottom: 4,
  },
  contactBox: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  contactText: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 8,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#FFF3CD',
    padding: 20,
    margin: 20,
    borderRadius: 12,
    marginBottom: 40,
  },
  footerText: {
    fontSize: 13,
    color: '#856404',
    textAlign: 'center',
    lineHeight: 20,
  },
});
