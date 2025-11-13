// screens/TermsScreen.js
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TermsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conditions d'utilisation</Text>
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
            Bienvenue sur notre plateforme de marketplace dédiée aux startups camerounaises. 
            En utilisant cette application, vous acceptez de vous conformer aux présentes 
            conditions d'utilisation.
          </Text>
        </View>

        {/* ACCEPTATION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ Acceptation des conditions</Text>
          <Text style={styles.text}>
            En accédant et en utilisant cette application, vous acceptez d'être lié par ces 
            conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas 
            utiliser l'application.
          </Text>
        </View>

        {/* COMPTE UTILISATEUR */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Compte utilisateur</Text>
          <Text style={styles.text}>
            Pour utiliser certaines fonctionnalités, vous devez créer un compte :
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Vous devez avoir au moins 18 ans</Text>
            <Text style={styles.listItem}>• Vous devez fournir des informations exactes</Text>
            <Text style={styles.listItem}>• Vous êtes responsable de la sécurité de votre compte</Text>
            <Text style={styles.listItem}>• Un compte ne peut pas être partagé</Text>
          </View>
        </View>

        {/* UTILISATION DU SERVICE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛍️ Utilisation du service</Text>
          <Text style={styles.text}>
            Vous vous engagez à :
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Utiliser l'application de manière légale</Text>
            <Text style={styles.listItem}>• Respecter les droits des autres utilisateurs</Text>
            <Text style={styles.listItem}>• Ne pas publier de contenu offensant</Text>
            <Text style={styles.listItem}>• Ne pas tenter de pirater ou d'endommager le service</Text>
            <Text style={styles.listItem}>• Respecter les politiques des startups partenaires</Text>
          </View>
        </View>

        {/* COMMANDES ET PAIEMENTS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 Commandes et paiements</Text>
          <Text style={styles.text}>
            Conditions relatives aux achats :
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Les prix sont affichés en FCFA</Text>
            <Text style={styles.listItem}>• Les commandes sont confirmées par email</Text>
            <Text style={styles.listItem}>• Le paiement doit être effectué au moment de la commande</Text>
            <Text style={styles.listItem}>• Les frais de livraison sont indiqués avant validation</Text>
          </View>
        </View>

        {/* LIVRAISON */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚚 Livraison</Text>
          <Text style={styles.text}>
            Les délais de livraison varient selon les startups et les produits. Nous nous 
            efforçons de respecter les délais annoncés, mais ne pouvons garantir une livraison 
            à une date précise.
          </Text>
        </View>

        {/* RETOURS ET REMBOURSEMENTS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>↩️ Retours et remboursements</Text>
          <Text style={styles.text}>
            Politique de retour :
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Délai de 14 jours pour retourner un produit</Text>
            <Text style={styles.listItem}>• Produit non utilisé et dans son emballage d'origine</Text>
            <Text style={styles.listItem}>• Certains produits ne sont pas éligibles au retour</Text>
            <Text style={styles.listItem}>• Remboursement sous 7-14 jours après réception du retour</Text>
          </View>
        </View>

        {/* PROPRIÉTÉ INTELLECTUELLE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>©️ Propriété intellectuelle</Text>
          <Text style={styles.text}>
            Tous les contenus de l'application (textes, images, logos, etc.) sont protégés par 
            les droits de propriété intellectuelle. Toute reproduction sans autorisation est 
            interdite.
          </Text>
        </View>

        {/* RESPONSABILITÉ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Limitation de responsabilité</Text>
          <Text style={styles.text}>
            Nous nous efforçons de maintenir l'application disponible et sécurisée, mais ne 
            pouvons garantir :
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• L'absence d'interruptions du service</Text>
            <Text style={styles.listItem}>• L'exactitude de toutes les informations</Text>
            <Text style={styles.listItem}>• La qualité des produits des startups tierces</Text>
          </View>
        </View>

        {/* RÉSILIATION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚫 Résiliation</Text>
          <Text style={styles.text}>
            Nous nous réservons le droit de suspendre ou résilier votre compte en cas de 
            violation de ces conditions d'utilisation, sans préavis ni remboursement.
          </Text>
        </View>

        {/* MODIFICATIONS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Modifications</Text>
          <Text style={styles.text}>
            Nous pouvons modifier ces conditions à tout moment. Les modifications prennent 
            effet dès leur publication. Votre utilisation continue de l'application après 
            modification constitue votre acceptation des nouvelles conditions.
          </Text>
        </View>

        {/* LOI APPLICABLE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚖️ Loi applicable</Text>
          <Text style={styles.text}>
            Ces conditions sont régies par les lois de la République du Cameroun. Tout litige 
            sera soumis à la juridiction exclusive des tribunaux camerounais.
          </Text>
        </View>

        {/* CONTACT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📧 Contact</Text>
          <Text style={styles.text}>
            Pour toute question concernant ces conditions :
          </Text>
          <View style={styles.contactBox}>
            <Text style={styles.contactText}>📧 legal@startupmarket.cm</Text>
            <Text style={styles.contactText}>📱 +237 6XX XXX XXX</Text>
            <Text style={styles.contactText}>📍 Yaoundé, Cameroun</Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            En utilisant notre application, vous reconnaissez avoir lu et accepté ces conditions 
            d'utilisation.
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
