// screens/HelpScreen.js
import { useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HelpScreen({ navigation }) {
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const faqs = [
    {
      id: '1',
      question: 'Comment passer une commande ?',
      answer: 'Parcourez nos startups, ajoutez des produits à votre panier, puis cliquez sur "Commander" pour finaliser votre achat.',
    },
    {
      id: '2',
      question: 'Comment fonctionne le programme de fidélité ?',
      answer: 'Gagnez 1 point pour chaque 100 FCFA dépensés. Échangez vos points contre des réductions et avantages exclusifs.',
    },
    {
      id: '3',
      question: 'Quels sont les modes de paiement acceptés ?',
      answer: 'Nous acceptons le paiement à la livraison, Mobile Money (MTN, Orange) et les cartes bancaires.',
    },
    {
      id: '4',
      question: 'Quels sont les délais de livraison ?',
      answer: 'Les délais varient selon votre localisation. Généralement 2-5 jours ouvrables pour Yaoundé et Douala.',
    },
    {
      id: '5',
      question: 'Puis-je annuler ma commande ?',
      answer: 'Oui, vous pouvez annuler votre commande avant qu\'elle ne soit confirmée par la startup.',
    },
  ];

  const contactMethods = [
    {
      id: '1',
      icon: '📧',
      title: 'Email',
      subtitle: 'support@pipomarket.cm',
      action: () => Linking.openURL('mailto:bdlstudio03@gmail.com'),
    },
    {
      id: '2',
      icon: '📱',
      title: 'WhatsApp',
      subtitle: '+237 620 70 29 01',
      action: () => Linking.openURL('https://wa.me/237620702901'),
    },
    {
      id: '3',
      icon: '📞',
      title: 'Téléphone',
      subtitle: '+237 620 70 29 01',
      action: () => Linking.openURL('tel:+237620702901'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Aide & Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Section Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nous contacter</Text>
          {contactMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={styles.contactCard}
              onPress={method.action}
            >
              <View style={styles.contactIcon}>
                <Text style={styles.contactIconText}>{method.icon}</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>{method.title}</Text>
                <Text style={styles.contactSubtitle}>{method.subtitle}</Text>
              </View>
              <Text style={styles.contactArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section FAQ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Questions fréquentes</Text>
          {faqs.map((faq) => (
            <View key={faq.id} style={styles.faqCard}>
              <TouchableOpacity
                style={styles.faqQuestion}
                onPress={() =>
                  setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)
                }
              >
                <Text style={styles.faqQuestionText}>{faq.question}</Text>
                <Text style={styles.faqToggle}>
                  {expandedFAQ === faq.id ? '−' : '+'}
                </Text>
              </TouchableOpacity>
              {expandedFAQ === faq.id && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Section Formulaire */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Envoyer un message</Text>
          <View style={styles.formCard}>
            <TextInput
              style={styles.input}
              placeholder="Sujet"
              placeholderTextColor="#8E8E93"
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Votre message..."
              placeholderTextColor="#8E8E93"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={() => Alert.alert('Succès', 'Message envoyé !')}
            >
              <Text style={styles.sendButtonText}>Envoyer</Text>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  contactIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#F2F2F7',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactIconText: {
    fontSize: 24,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
  },
  contactArrow: {
    fontSize: 20,
    color: '#C7C7CC',
  },
  faqCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginRight: 12,
  },
  faqToggle: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 8,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#000',
    marginBottom: 12,
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  linkCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  linkText: {
    fontSize: 15,
    color: '#000',
  },
  linkArrow: {
    fontSize: 18,
    color: '#C7C7CC',
  },
});
