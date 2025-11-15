// screens/BDLOrderSuccessScreen.js - Confirmation de commande BDL Studio
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BDLOrderSuccessScreen({ route, navigation }) {
  const { orderId, order } = route.params;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* SUCCESS ANIMATION */}
        <View style={styles.successSection}>
          <View style={styles.checkCircle}>
            <LinearGradient
              colors={['#4CAF50', '#45a049']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.checkGradient}
            >
              <Text style={styles.checkIcon}>✓</Text>
            </LinearGradient>
          </View>

          <Text style={styles.successTitle}>Commande confirmée !</Text>
          <Text style={styles.successSubtitle}>
            Votre commande a été enregistrée avec succès
          </Text>

          <View style={styles.orderIdCard}>
            <Text style={styles.orderIdLabel}>Numéro de commande</Text>
            <Text style={styles.orderIdValue}>#{orderId.slice(-8).toUpperCase()}</Text>
          </View>
        </View>

        {/* RÉSUMÉ */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>📋 Résumé</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{order.serviceIcon} Service</Text>
              <Text style={styles.summaryValue}>{order.serviceName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Package</Text>
              <Text style={styles.summaryValue}>{order.packageName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Montant</Text>
              <Text style={styles.summaryValueBold}>
                {order.totalAmount.toLocaleString('fr-FR')} XAF
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Paiement</Text>
              <Text style={styles.summaryValue}>
                {order.paymentMethod === 'mobile_money' ? '📱 Mobile Money' : '💵 À la livraison'}
              </Text>
            </View>
          </View>
        </View>

        {/* PROCHAINES ÉTAPES */}
        <View style={styles.stepsSection}>
          <Text style={styles.sectionTitle}>📌 Prochaines étapes</Text>

          <View style={styles.stepCard}>
            <Text style={styles.stepNumber}>1</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Confirmation de l'équipe</Text>
              <Text style={styles.stepText}>
                Notre équipe va vérifier votre commande et vous contacter sous 24h
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <Text style={styles.stepNumber}>2</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Paiement</Text>
              <Text style={styles.stepText}>
                {order.paymentMethod === 'mobile_money'
                  ? 'Vous recevrez une notification de paiement sur votre numéro Mobile Money'
                  : 'Le paiement sera effectué lors de la livraison du projet'}
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <Text style={styles.stepNumber}>3</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Réalisation du projet</Text>
              <Text style={styles.stepText}>
                Notre équipe commencera à travailler sur votre projet
              </Text>
            </View>
          </View>
        </View>

        {/* CONTACT */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>💬 Besoin d'aide ?</Text>
          <Text style={styles.contactText}>
            Notre équipe est disponible pour répondre à toutes vos questions
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => navigation.navigate('Contact')}
          >
            <Text style={styles.contactButtonText}>Contacter BDL Studio</Text>
          </TouchableOpacity>
        </View>

        {/* BOUTONS ACTIONS */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('BDLMyOrders')}
          >
            <LinearGradient
              colors={['#275471', '#f4a04b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryGradient}
            >
              <Text style={styles.primaryButtonText}>Voir mes commandes</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.secondaryButtonText}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: Math.max(insets.bottom + 20, 80) }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 20,
  },

  // SUCCESS
  successSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  checkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  checkGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    fontSize: 64,
    color: 'white',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  orderIdCard: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  orderIdLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  orderIdValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
  },

  // SUMMARY
  summarySection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  summaryValueBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#275471',
  },

  // STEPS
  stepsSection: {
    marginBottom: 32,
  },
  stepCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#275471',
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 32,
    marginRight: 12,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },

  // CONTACT
  contactSection: {
    backgroundColor: '#FFF9E6',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f4a04b',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  contactButton: {
    backgroundColor: '#f4a04b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  contactButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },

  // ACTIONS
  actionsSection: {
    gap: 12,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#275471',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});
