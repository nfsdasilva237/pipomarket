// screens/AdminLoyaltyFundScreen.js - ✅ NOUVEAU

import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import loyaltyPaymentService from '../utils/loyaltyPaymentService';

export default function AdminLoyaltyFundScreen() {
  const [loading, setLoading] = useState(true);
  const [fundBalance, setFundBalance] = useState(0);

  useEffect(() => {
    loadFund();
  }, []);

  const loadFund = async () => {
    const result = await loyaltyPaymentService.getLoyaltyFundBalance();
    if (result.success) {
      setFundBalance(result.balance);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.card}>
          <Text style={styles.title}>💰 Fond de Fidélité PipoMarket</Text>
          <Text style={styles.balance}>{fundBalance.toLocaleString()} FCFA</Text>
          <Text style={styles.subtitle}>
            Utilisé pour financer les récompenses clients
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Comment ça marche ?</Text>
          <Text style={styles.infoText}>
            • 40% des commissions vont au fond{'\n'}
            • Commission: 5% (standard) ou 3% (premium){'\n'}
            • Le fond paie les récompenses fidélité{'\n'}
            • Les startups reçoivent 100% du prix produit
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  card: {
    backgroundColor: 'white',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  balance: { fontSize: 48, fontWeight: 'bold', color: '#34C759', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center' },
  infoCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
  },
  infoTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  infoText: { fontSize: 14, color: '#666', lineHeight: 22 },
});
