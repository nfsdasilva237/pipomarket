// components/OrderConfirmationModal.js - ✅ CORRIGÉ AVEC orderIdFull
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import paymentService from '../utils/paymentService';

export default function OrderConfirmationModal({
  visible,
  onClose,
  orderId,          // ✅ ID COURT pour affichage
  orderIdFull,      // ✅ ID COMPLET pour Firestore
  total,
  paymentMethod,
  mobileMoneyProvider,
  startupPayments,
  onViewOrders,
  userId,
}) {
  const [copiedCode, setCopiedCode] = useState(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  const handleCopyCode = (code, index) => {
    Clipboard.setString(code);
    setCopiedCode(index);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleConfirmPayment = async () => {
    Alert.alert(
      'Confirmation de paiement',
      'Avez-vous effectué le paiement Mobile Money ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Oui, j\'ai payé',
          onPress: async () => {
            setConfirmingPayment(true);
            try {
              // ✅ UTILISER orderIdFull pour les opérations Firestore
              const fullId = orderIdFull || orderId;
              
              console.log('🔍 Confirmation paiement avec:', {
                orderIdShort: orderId,
                orderIdFull: fullId
              });

              // Créer les paiements pour chaque startup
              const paymentPromises = startupPayments.map(async (startup) => {
                const phoneNumber =
                  mobileMoneyProvider === 'mtn'
                    ? startup.mtnPhone
                    : startup.orangePhone;

                if (!phoneNumber) {
                  console.warn(`Pas de numéro ${mobileMoneyProvider} pour ${startup.name}`);
                  return null;
                }

                // Créer le paiement
                const result = await paymentService.createPayment({
                  orderId: fullId,  // ✅ ID COMPLET
                  startupId: startup.id,
                  userId: userId,
                  total: startup.total,
                  startupPhone: phoneNumber,
                  startupName: startup.name,
                  operator: mobileMoneyProvider,
                });

                if (result.success) {
                  console.log('✅ Paiement créé:', result.paymentId);
                  
                  // Confirmer que le client a payé
                  await paymentService.clientConfirmPayment(
                    result.paymentId,
                    fullId  // ✅ ID COMPLET
                  );
                  
                  console.log('✅ Paiement confirmé par le client');
                }

                return result;
              });

              await Promise.all(paymentPromises);

              setPaymentConfirmed(true);
              Alert.alert(
                'Paiement enregistré',
                'Votre paiement a été enregistré. La startup va vérifier et confirmer la réception.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('❌ Erreur confirmation paiement:', error);
              Alert.alert(
                'Erreur',
                'Impossible d\'enregistrer le paiement. Veuillez réessayer.'
              );
            } finally {
              setConfirmingPayment(false);
            }
          },
        },
      ]
    );
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.successIcon}>
              <Text style={styles.successIconText}>✅</Text>
            </View>
            <Text style={styles.headerTitle}>Commande confirmée !</Text>
            <Text style={styles.headerSubtitle}>
              Votre commande a été enregistrée avec succès
            </Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* NUMÉRO DE COMMANDE - Affiche l'ID COURT */}
            <View style={styles.orderIdCard}>
              <Text style={styles.orderIdLabel}>Numéro de commande</Text>
              <Text style={styles.orderIdValue}>#{orderId}</Text>
            </View>

            {/* TOTAL */}
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Montant total</Text>
              <Text style={styles.totalValue}>
                {total.toLocaleString('fr-FR')} FCFA
              </Text>
            </View>

            {/* INSTRUCTIONS PAIEMENT */}
            {paymentMethod === 'cash_on_delivery' && (
              <View style={styles.paymentCard}>
                <View style={styles.paymentHeader}>
                  <Text style={styles.paymentIcon}>💵</Text>
                  <Text style={styles.paymentTitle}>
                    Paiement à la livraison
                  </Text>
                </View>
                <Text style={styles.paymentDescription}>
                  Vous paierez en espèces lors de la réception de votre commande.
                </Text>
                <View style={styles.infoBox}>
                  <Text style={styles.infoBoxIcon}>💡</Text>
                  <Text style={styles.infoBoxText}>
                    Préparez le montant exact pour faciliter la transaction
                  </Text>
                </View>
              </View>
            )}

            {paymentMethod === 'mobile_money' && mobileMoneyProvider && (
              <View style={styles.paymentCard}>
                <View style={styles.paymentHeader}>
                  <Text style={styles.paymentIcon}>
                    {mobileMoneyProvider === 'mtn' ? '💛' : '🧡'}
                  </Text>
                  <Text style={styles.paymentTitle}>
                    {mobileMoneyProvider === 'mtn'
                      ? 'MTN Mobile Money'
                      : 'Orange Money'}
                  </Text>
                </View>

                <Text style={styles.instructionsTitle}>
                  📝 Instructions de paiement
                </Text>

                {startupPayments && startupPayments.length > 0 ? (
                  <>
                    <Text style={styles.instructionsText}>
                      Composez les codes USSD suivants pour effectuer vos paiements:
                    </Text>

                    {startupPayments.map((sp, index) => {
                      const phoneNumber =
                        mobileMoneyProvider === 'mtn'
                          ? sp.mtnPhone
                          : sp.orangePhone;
                      const ussdCode =
                        mobileMoneyProvider === 'mtn'
                          ? `*126*1*1*${phoneNumber || '[NON_CONFIGURÉ]'}*${sp.total}#`
                          : `#150*1*1*${phoneNumber || '[NON_CONFIGURÉ]'}*${sp.total}#`;

                      return (
                        <View key={index} style={styles.startupCodeCard}>
                          <View style={styles.startupCodeHeader}>
                            <Text style={styles.startupCodeIcon}>🏢</Text>
                            <View style={styles.startupCodeInfo}>
                              <Text style={styles.startupCodeName}>
                                {sp.name}
                              </Text>
                              <Text style={styles.startupCodeAmount}>
                                {sp.total.toLocaleString('fr-FR')} FCFA
                              </Text>
                            </View>
                          </View>

                          {phoneNumber ? (
                            <>
                              <View style={styles.codeContainer}>
                                <Text style={styles.codeText} selectable>
                                  {ussdCode}
                                </Text>
                              </View>

                              <TouchableOpacity
                                style={[
                                  styles.copyButton,
                                  copiedCode === index && styles.copyButtonCopied,
                                ]}
                                onPress={() => handleCopyCode(ussdCode, index)}
                              >
                                <Text style={styles.copyButtonText}>
                                  {copiedCode === index
                                    ? '✓ Copié !'
                                    : '📋 Copier le code'}
                                </Text>
                              </TouchableOpacity>
                            </>
                          ) : (
                            <View style={styles.warningBox}>
                              <Text style={styles.warningIcon}>⚠️</Text>
                              <Text style={styles.warningText}>
                                Numéro{' '}
                                {mobileMoneyProvider === 'mtn' ? 'MTN' : 'Orange'}{' '}
                                non configuré. Contactez la startup.
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    })}

                    <View style={styles.stepsCard}>
                      <Text style={styles.stepsTitle}>
                        Comment payer par Mobile Money:
                      </Text>
                      <Text style={styles.stepText}>1. Copiez le code USSD</Text>
                      <Text style={styles.stepText}>
                        2. Composez-le sur votre téléphone
                      </Text>
                      <Text style={styles.stepText}>
                        3. Suivez les instructions à l'écran
                      </Text>
                      <Text style={styles.stepText}>
                        4. Confirmez le paiement avec votre code PIN
                      </Text>
                      <Text style={styles.stepText}>
                        5. Revenez ici et cliquez "J'ai payé"
                      </Text>
                    </View>

                    {/* BOUTON J'AI PAYÉ */}
                    {!paymentConfirmed && (
                      <TouchableOpacity
                        style={[
                          styles.confirmPaymentButton,
                          confirmingPayment && styles.confirmPaymentButtonDisabled,
                        ]}
                        onPress={handleConfirmPayment}
                        disabled={confirmingPayment}
                      >
                        {confirmingPayment ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <>
                            <Text style={styles.confirmPaymentButtonIcon}>✓</Text>
                            <Text style={styles.confirmPaymentButtonText}>
                              J'ai payé
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}

                    {paymentConfirmed && (
                      <View style={styles.paymentConfirmedBanner}>
                        <Text style={styles.paymentConfirmedIcon}>✅</Text>
                        <View style={styles.paymentConfirmedContent}>
                          <Text style={styles.paymentConfirmedTitle}>
                            Paiement enregistré
                          </Text>
                          <Text style={styles.paymentConfirmedText}>
                            La startup va vérifier et confirmer la réception
                          </Text>
                        </View>
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={styles.noStartupsText}>
                    Aucune information de paiement disponible
                  </Text>
                )}
              </View>
            )}

            {/* PROCHAINES ÉTAPES */}
            <View style={styles.nextStepsCard}>
              <Text style={styles.nextStepsTitle}>📦 Prochaines étapes</Text>
              <View style={styles.nextStepItem}>
                <Text style={styles.nextStepIcon}>✅</Text>
                <Text style={styles.nextStepText}>
                  Commande enregistrée avec succès
                </Text>
              </View>
              {paymentMethod === 'mobile_money' && (
                <>
                  <View style={styles.nextStepItem}>
                    <Text style={styles.nextStepIcon}>
                      {paymentConfirmed ? '✅' : '💳'}
                    </Text>
                    <Text style={styles.nextStepText}>
                      {paymentConfirmed
                        ? 'Paiement Mobile Money effectué'
                        : 'Effectuez le paiement Mobile Money'}
                    </Text>
                  </View>
                  {paymentConfirmed && (
                    <View style={styles.nextStepItem}>
                      <Text style={styles.nextStepIcon}>⏳</Text>
                      <Text style={styles.nextStepText}>
                        En attente de confirmation par la startup
                      </Text>
                    </View>
                  )}
                </>
              )}
              <View style={styles.nextStepItem}>
                <Text style={styles.nextStepIcon}>📦</Text>
                <Text style={styles.nextStepText}>
                  La startup prépare votre commande
                </Text>
              </View>
              <View style={styles.nextStepItem}>
                <Text style={styles.nextStepIcon}>🚚</Text>
                <Text style={styles.nextStepText}>
                  Livraison à l'adresse indiquée
                </Text>
              </View>
              <View style={styles.nextStepItem}>
                <Text style={styles.nextStepIcon}>⭐</Text>
                <Text style={styles.nextStepText}>
                  N'oubliez pas de laisser un avis !
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* BOUTONS */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.ordersButton}
              onPress={() => {
                handleClose();
                onViewOrders?.();
              }}
            >
              <Text style={styles.ordersButtonText}>Voir mes commandes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 24,
    overflow: 'hidden',
  },

  // Header
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F0F8FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successIconText: {
    fontSize: 48,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },

  // Content
  content: {
    maxHeight: 450,
    padding: 20,
  },

  // Order ID Card
  orderIdCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  orderIdLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  orderIdValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    fontFamily: 'monospace',
  },

  // Total Card
  totalCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 14,
    color: '#2E7D32',
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1B5E20',
  },

  // Payment Card
  paymentCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  paymentDescription: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  infoBoxIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 18,
  },

  // Instructions
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },

  // Startup Code Card
  startupCodeCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB900',
  },
  startupCodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  startupCodeIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  startupCodeInfo: {
    flex: 1,
  },
  startupCodeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  startupCodeAmount: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
  },

  // Code Container
  codeContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFB900',
  },
  codeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'monospace',
    textAlign: 'center',
  },

  // Copy Button
  copyButton: {
    backgroundColor: '#FFB900',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  copyButtonCopied: {
    backgroundColor: '#34C759',
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },

  // Warning Box
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },

  // Steps Card
  stepsCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  stepText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
    lineHeight: 18,
  },

  noStartupsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },

  // Next Steps Card
  nextStepsCard: {
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  nextStepIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  nextStepText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  // Footer
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  ordersButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  ordersButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
  },

  // Bouton J'ai payé
  confirmPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    borderRadius: 12,
    padding: 18,
    marginTop: 16,
    gap: 8,
  },
  confirmPaymentButtonDisabled: {
    opacity: 0.6,
  },
  confirmPaymentButtonIcon: {
    fontSize: 24,
    color: 'white',
  },
  confirmPaymentButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },

  // Banner confirmation paiement
  paymentConfirmedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
    gap: 12,
  },
  paymentConfirmedIcon: {
    fontSize: 32,
  },
  paymentConfirmedContent: {
    flex: 1,
  },
  paymentConfirmedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 4,
  },
  paymentConfirmedText: {
    fontSize: 13,
    color: '#2E7D32',
    lineHeight: 18,
  },
});