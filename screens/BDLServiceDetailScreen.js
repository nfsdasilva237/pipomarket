// screens/BDLServiceDetailScreen.js - Détail d'un service BDL avec packages
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bdlBranding, bdlServices } from '../data/bdlServicesData';

export default function BDLServiceDetailScreen({ route, navigation }) {
  const { serviceId } = route.params;
  const [service, setService] = useState(null);

  useEffect(() => {
    // Trouver le service dans les données
    const foundService = bdlServices.find(s => s.id === serviceId);
    setService(foundService);
  }, [serviceId]);

  if (!service) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={bdlBranding.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={[styles.header, { backgroundColor: bdlBranding.colors.primary }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Retour</Text>
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.serviceIcon}>{service.icon}</Text>
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.serviceDescription}>{service.description}</Text>

            <View style={styles.bdlBadgeHeader}>
              <Text style={styles.bdlBadgeHeaderText}>{bdlBranding.name}</Text>
            </View>
          </View>

          {/* Wave effect */}
          <View style={styles.wave} />
        </View>

        {/* Packages */}
        <View style={styles.packagesSection}>
          <Text style={styles.sectionTitle}>Choisissez votre package</Text>
          <Text style={styles.sectionSubtitle}>
            Tous nos forfaits incluent un accompagnement personnalisé
          </Text>

          {service.packages.map((pkg, index) => (
            <View key={pkg.id} style={styles.packageContainer}>
              {pkg.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>⭐ POPULAIRE</Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.packageCard,
                  pkg.popular && styles.packageCardPopular
                ]}
                onPress={() => navigation.navigate('BDLOrderForm', {
                  serviceId: service.id,
                  serviceName: service.name,
                  packageId: pkg.id,
                  packageName: pkg.name,
                  packagePrice: pkg.price
                })}
                activeOpacity={0.9}
              >
                <View style={styles.packageHeader}>
                  <View>
                    <Text style={styles.packageName}>{pkg.name}</Text>
                    <Text style={styles.packagePrice}>
                      {pkg.price.toLocaleString()} XAF
                    </Text>
                  </View>
                  <Text style={styles.packageNumber}>#{index + 1}</Text>
                </View>

                <View style={styles.featuresList}>
                  {pkg.features.map((feature, idx) => (
                    <View key={idx} style={styles.featureItem}>
                      <Text style={styles.featureCheckmark}>✓</Text>
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <View style={[styles.orderButton, { backgroundColor: bdlBranding.colors.accent }]}>
                  <Text style={styles.orderButtonText}>Commander ce package →</Text>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={[styles.infoCard, { borderLeftColor: bdlBranding.colors.primary }]}>
            <Text style={styles.infoIcon}>📞</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Besoin d'aide ?</Text>
              <Text style={styles.infoText}>
                Notre équipe est disponible pour vous accompagner dans votre choix
              </Text>
            </View>
          </View>

          <View style={[styles.infoCard, { borderLeftColor: bdlBranding.colors.accent }]}>
            <Text style={styles.infoIcon}>⚡</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Livraison rapide</Text>
              <Text style={styles.infoText}>
                Délais garantis selon le package sélectionné
              </Text>
            </View>
          </View>

          <View style={[styles.infoCard, { borderLeftColor: bdlBranding.colors.primary }]}>
            <Text style={styles.infoIcon}>✨</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Qualité professionnelle</Text>
              <Text style={styles.infoText}>
                Travail réalisé par des experts certifiés
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },

  // Header
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    position: 'relative',
    overflow: 'hidden',
  },
  backButton: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerContent: {
    alignItems: 'center',
  },
  serviceIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  serviceName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  serviceDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  bdlBadgeHeader: {
    backgroundColor: '#f4a04b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bdlBadgeHeaderText: {
    color: '#275471',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },

  // Packages Section
  packagesSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },

  // Package Card
  packageContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#FF9500',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  popularBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  packageCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  packageCardPopular: {
    borderColor: '#FF9500',
    borderWidth: 3,
    shadowColor: '#FF9500',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  packageName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#275471',
    marginBottom: 8,
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f4a04b',
  },
  packageNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F0F0F0',
  },
  featuresList: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featureCheckmark: {
    fontSize: 16,
    color: '#34C759',
    marginRight: 12,
    fontWeight: 'bold',
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  orderButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#f4a04b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  orderButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#275471',
  },

  // Info Section
  infoSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});
