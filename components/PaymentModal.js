// components/PaymentModal.js - VERSION AMÉLIORÉE AVEC TRACKING
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import paymentService from '../utils/paymentService';

export default function PaymentModal({ 
  visible, 
  onClose, 
  orderData, 
  onPaymentConfirmed 
}) {
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 minutes
  const [paymentConfirmed, setPaymentConfirmed] = useState(false); // ✅ NOUVEAU

  useEffect(() => {
    if (visible && orderData) {
      initializePayment();
    }
  }, [visible, orderData]);

  useEffect(() => {
    if (!visible || paymentConfirmed) return; // ✅ Stop si déjà confirmé

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleExpiration();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, paymentConfirmed]);

  const initializePayment = async () => {
    setLoading(true);
    setPaymentConfirmed(false); // ✅ Reset
    try {
      const result = await paymentService.createPayment({
        orderId: orderData.orderId,
        startupId: orderData.startupId,
        userId: orderData.userId,
        total: orderData.total,
        startupPhone: orderData.startupPhone,
        startupName: orderData.startupName,
        operator: orderData.operator || 'mtn',
      });

      if (result.success) {
        setPayment(result);
        setTimeRemaining(900);
      } else {
        Alert.alert('Erreur', 'Impossible de créer le paiement');
        onClose();
      }
    } catch (error) {
      console.error('Erreur initialisation paiement:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleExpiration = () => {
    Alert.alert(
      'Temps écoulé',
      'Le temps de paiement est expiré. Veuillez recommencer.',
      [{ text: 'OK', onPress: onClose }]
    );
  };

  const handleCopyCode = () => {
    if (payment?.mobileMoneyCode) {
      Clipboard.setString(payment.mobileMoneyCode);
      Alert.alert('Copié !', 'Le code a été copié dans le presse-papier');
    }
  };

  const handleConfirmPayment = async () => {
    Alert.alert(
      'Confirmation',
      'Avez-vous effectué le paiement ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, j\'ai payé',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await paymentService.clientConfirmPayment(
                payment.paymentId,
                orderData.orderId
              );

              if (result.success) {
                setPaymentConfirmed(true); // ✅ Marquer comme confirmé
                setLoading(false);
                // ✅ NE PAS FERMER LE MODAL, juste changer l'état
              } else {
                Alert.alert('Erreur', 'Impossible de confirmer le paiement');
                setLoading(false);
              }
            } catch (error) {
              console.error('Erreur confirmation:', error);
              Alert.alert('Erreur', 'Une erreur est survenue');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Annuler le paiement ?',
      'Êtes-vous sûr de vouloir annuler ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            if (payment) {
              await paymentService.cancelPayment(payment.paymentId, orderData.orderId);
            }
            onClose();
          }
        }
      ]
    );
  };

  // ✅ NOUVEAU : Fermer après confirmation
  const handleCloseAfterConfirmation = () => {
    onPaymentConfirmed?.();
    onClose();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading && !payment) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Préparation du paiement...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {paymentConfirmed ? '✅ Paiement enregistré' : '💰 Finaliser la Commande'}
            </Text>
            <TouchableOpacity 
              onPress={paymentConfirmed ? handleCloseAfterConfirmation : handleCancel} 
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ✅ SI PAIEMENT CONFIRMÉ */}
          {paymentConfirmed ? (
            <View style={styles.confirmedContainer}>
              <View style={styles.confirmedIcon}>
                <Text style={styles.confirmedIconText}>✅</Text>
              </View>
              
              <Text style={styles.confirmedTitle}>Paiement enregistré !</Text>
              
              <Text style={styles.confirmedText}>
                Votre paiement de <Text style={styles.confirmedAmount}>{orderData?.total?.toLocaleString('fr-FR')} FCFA</Text> a été enregistré avec succès.
              </Text>

              <View style={styles.confirmedInfoCard}>
                <Text style={styles.confirmedInfoIcon}>⏳</Text>
                <View style={styles.confirmedInfoText}>
                  <Text style={styles.confirmedInfoTitle}>En attente de confirmation</Text>
                  <Text style={styles.confirmedInfoSubtitle}>
                    La startup <Text style={styles.confirmedStartupName}>{orderData?.startupName}</Text> va vérifier et confirmer la réception du paiement.
                  </Text>
                </View>
              </View>

              <View style={styles.confirmedSteps}>
                <Text style={styles.confirmedStepsTitle}>Prochaines étapes :</Text>
                <Text style={styles.confirmedStep}>✅ 1. Votre paiement est enregistré</Text>
                <Text style={styles.confirmedStep}>⏳ 2. La startup va confirmer la réception</Text>
                <Text style={styles.confirmedStep}>📦 3. Votre commande sera traitée</Text>
                <Text style={styles.confirmedStep}>🚀 4. Vous serez notifié de l&apos;expédition</Text>
              </View>

              <TouchableOpacity
                style={styles.confirmedButton}
                onPress={handleCloseAfterConfirmation}
              >
                <Text style={styles.confirmedButtonText}>Fermer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmedSecondaryButton}
                onPress={() => {
                  handleCloseAfterConfirmation();
                  // Navigation vers commandes (à adapter selon tes routes)
                }}
              >
                <Text style={styles.confirmedSecondaryButtonText}>Voir mes commandes</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ❌ FORMULAIRE PAIEMENT NORMAL */
            <>
              {/* INFO STARTUP */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🏢 Informations de la startup</Text>
                <Text style={styles.startupName}>{orderData?.startupName}</Text>
                <Text style={styles.startupPhone}>☎️  {orderData?.startupPhone}</Text>
              </View>

              {/* MONTANT */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💵 Montant à payer</Text>
                <Text style={styles.amount}>{orderData?.total?.toLocaleString('fr-FR')} FCFA</Text>
              </View>

              {/* COMPTE À REBOURS */}
              <View style={styles.timerSection}>
                <Text style={styles.timerLabel}>⏱️  Temps restant</Text>
                <Text style={[
                  styles.timerValue,
                  timeRemaining < 60 && styles.timerUrgent
                ]}>
                  {formatTime(timeRemaining)}
                </Text>
              </View>

              {/* CODE MOBILE MONEY */}
              <View style={styles.codeSection}>
                <Text style={styles.sectionTitle}>📱 Code Mobile Money</Text>
                <View style={styles.codeContainer}>
                  <Text style={styles.codeText} selectable>
                    {payment?.mobileMoneyCode}
                  </Text>
                  <TouchableOpacity onPress={handleCopyCode} style={styles.copyIcon}>
                    <Text style={styles.copyIconText}>📋</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
                  <Text style={styles.copyButtonText}>📋 Copier le code</Text>
                </TouchableOpacity>
              </View>

              {/* INSTRUCTIONS */}
              <View style={styles.instructionsSection}>
                <Text style={styles.sectionTitle}>📝 Instructions</Text>
                <Text style={styles.instruction}>1. Copier le code ci-dessus</Text>
                <Text style={styles.instruction}>2. Composer le code sur votre téléphone</Text>
                <Text style={styles.instruction}>3. Valider le paiement</Text>
                <Text style={styles.instruction}>4. Revenir et cliquer &quot;J&apos;ai payé&quot;</Text>
              </View>

              {/* BOUTONS */}
              <View style={styles.buttons}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]} 
                  onPress={handleCancel}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>❌ Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.button, styles.confirmButton]} 
                  onPress={handleConfirmPayment}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.confirmButtonText}>✅ J&apos;ai payé</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { width: '100%', maxWidth: 500, backgroundColor: 'white', borderRadius: 20, overflow: 'hidden', maxHeight: '90%' },
  loadingContainer: { backgroundColor: 'white', borderRadius: 20, padding: 40, alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 15, color: '#8E8E93' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#007AFF', padding: 20 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', flex: 1 },
  closeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  closeButtonText: { fontSize: 20, color: 'white', fontWeight: 'bold' },
  
  section: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#8E8E93', marginBottom: 8 },
  
  startupName: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  startupPhone: { fontSize: 15, color: '#007AFF' },
  
  amount: { fontSize: 32, fontWeight: 'bold', color: '#34C759' },
  
  timerSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#F2F2F7' },
  timerLabel: { fontSize: 15, fontWeight: '600', color: '#000' },
  timerValue: { fontSize: 24, fontWeight: 'bold', color: '#007AFF' },
  timerUrgent: { color: '#FF3B30' },
  
  codeSection: { padding: 20, backgroundColor: '#FFF9E6', borderLeftWidth: 4, borderLeftColor: '#FFB900' },
  codeContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: '#FFB900' },
  codeText: { flex: 1, fontSize: 18, fontWeight: 'bold', color: '#000', fontFamily: 'monospace' },
  copyIcon: { marginLeft: 8 },
  copyIconText: { fontSize: 24 },
  copyButton: { backgroundColor: '#FFB900', borderRadius: 12, padding: 14, alignItems: 'center' },
  copyButtonText: { fontSize: 15, fontWeight: 'bold', color: 'white' },
  
  instructionsSection: { padding: 20 },
  instruction: { fontSize: 14, color: '#000', marginBottom: 6, lineHeight: 20 },
  
  buttons: { flexDirection: 'row', padding: 20, gap: 12 },
  button: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
  cancelButton: { backgroundColor: '#F2F2F7' },
  cancelButtonText: { fontSize: 15, fontWeight: 'bold', color: '#FF3B30' },
  confirmButton: { backgroundColor: '#34C759' },
  confirmButtonText: { fontSize: 15, fontWeight: 'bold', color: 'white' },

  // ✅ STYLES CONFIRMATION
  confirmedContainer: { padding: 24, alignItems: 'center' },
  confirmedIcon: { width: 80, height: 80, backgroundColor: '#E8F5E9', borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  confirmedIconText: { fontSize: 48 },
  confirmedTitle: { fontSize: 24, fontWeight: 'bold', color: '#000', marginBottom: 12, textAlign: 'center' },
  confirmedText: { fontSize: 15, color: '#8E8E93', textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  confirmedAmount: { fontWeight: 'bold', color: '#34C759' },
  
  confirmedInfoCard: { flexDirection: 'row', backgroundColor: '#FFF3CD', borderRadius: 12, padding: 16, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#FF9500', width: '100%' },
  confirmedInfoIcon: { fontSize: 32, marginRight: 12 },
  confirmedInfoText: { flex: 1 },
  confirmedInfoTitle: { fontSize: 15, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  confirmedInfoSubtitle: { fontSize: 13, color: '#8E8E93', lineHeight: 18 },
  confirmedStartupName: { fontWeight: 'bold', color: '#007AFF' },
  
  confirmedSteps: { backgroundColor: '#F2F2F7', borderRadius: 12, padding: 16, marginBottom: 20, width: '100%' },
  confirmedStepsTitle: { fontSize: 15, fontWeight: 'bold', color: '#000', marginBottom: 12 },
  confirmedStep: { fontSize: 14, color: '#000', marginBottom: 8, lineHeight: 20 },
  
  confirmedButton: { backgroundColor: '#007AFF', borderRadius: 12, padding: 16, width: '100%', alignItems: 'center', marginBottom: 12 },
  confirmedButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  confirmedSecondaryButton: { backgroundColor: '#F2F2F7', borderRadius: 12, padding: 16, width: '100%', alignItems: 'center' },
  confirmedSecondaryButtonText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
});