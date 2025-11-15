// screens/BDLServiceDetailScreen.js - Détails d'un service BDL Studio avec ses packages
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BDLServiceDetailScreen({ route, navigation }) {
  const { service } = route.params;

  const handlePackageOrder = (packageData) => {
    navigation.navigate('BDLPackageOrder', {
      service,
      package: packageData
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HERO SECTION */}
        <LinearGradient
          colors={service.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <Text style={styles.heroIcon}>{service.icon}</Text>
          <Text style={styles.heroTitle}>{service.name}</Text>
          <Text style={styles.heroDescription}>{service.description}</Text>
        </LinearGradient>

        {/* PACKAGES */}
        <View style={styles.packagesSection}>
          <Text style={styles.sectionTitle}>📦 Nos Packages</Text>
          <Text style={styles.sectionSubtitle}>
            Choisissez le package qui correspond à vos besoins
          </Text>

          {service.packages.map((pkg, index) => (
            <View
              key={pkg.id}
              style={[
                styles.packageCard,
                pkg.popular && styles.packageCardPopular
              ]}
            >
              {/* Badge Popular */}
              {pkg.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>⭐ POPULAIRE</Text>
                </View>
              )}

              {/* Header Package */}
              <View style={styles.packageHeader}>
                <View>
                  <Text style={styles.packageName}>{pkg.name}</Text>
                  <View style={styles.packagePriceContainer}>
                    <Text style={styles.packagePrice}>
                      {pkg.price.toLocaleString('fr-FR')} XAF
                    </Text>
                    {pkg.name.toLowerCase().includes('pack') &&
                      pkg.name.toLowerCase().includes('mois') !== -1 && (
                      <Text style={styles.packagePriceLabel}>/mois</Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Features */}
              <View style={styles.packageFeatures}>
                {pkg.features.map((feature, idx) => (
                  <View key={idx} style={styles.featureRow}>
                    <Text style={styles.featureCheck}>✓</Text>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {/* CTA Button */}
              <TouchableOpacity
                style={[
                  styles.orderButton,
                  pkg.popular && styles.orderButtonPopular
                ]}
                onPress={() => handlePackageOrder(pkg)}
              >
                <LinearGradient
                  colors={pkg.popular ? service.gradient : ['#667eea', '#764ba2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.orderButtonGradient}
                >
                  <Text style={styles.orderButtonText}>Commander</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* COUVERTURE ÉVÉNEMENTIELLE (uniquement pour Montage Vidéo) */}
        {service.eventCoverage?.available && (
          <View style={styles.eventSection}>
            <Text style={styles.sectionTitle}>🎉 {service.eventCoverage.title}</Text>
            <Text style={styles.sectionSubtitle}>Nos spécialités événementielles</Text>

            <View style={styles.specialtiesGrid}>
              {service.eventCoverage.specialties.map((specialty, index) => (
                <View key={index} style={styles.specialtyCard}>
                  <Text style={styles.specialtyIcon}>{specialty.icon}</Text>
                  <Text style={styles.specialtyName}>{specialty.name}</Text>
                  <Text style={styles.specialtyDescription}>{specialty.description}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => navigation.navigate('Contact')}
            >
              <Text style={styles.contactButtonText}>
                📞 Contactez-nous pour un devis événementiel
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* POURQUOI CHOISIR BDL STUDIO */}
        <View style={styles.whySection}>
          <Text style={styles.sectionTitle}>💎 Pourquoi choisir BDL Studio ?</Text>
          <View style={styles.whyGrid}>
            <View style={styles.whyCard}>
              <Text style={styles.whyIcon}>⚡</Text>
              <Text style={styles.whyTitle}>Livraison rapide</Text>
              <Text style={styles.whyText}>Respect des délais garantis</Text>
            </View>
            <View style={styles.whyCard}>
              <Text style={styles.whyIcon}>👨‍💻</Text>
              <Text style={styles.whyTitle}>Équipe expérimentée</Text>
              <Text style={styles.whyText}>Experts passionnés</Text>
            </View>
            <View style={styles.whyCard}>
              <Text style={styles.whyIcon}>🎯</Text>
              <Text style={styles.whyTitle}>Qualité premium</Text>
              <Text style={styles.whyText}>Excellence garantie</Text>
            </View>
            <View style={styles.whyCard}>
              <Text style={styles.whyIcon}>💬</Text>
              <Text style={styles.whyTitle}>Support réactif</Text>
              <Text style={styles.whyText}>À votre écoute 24/7</Text>
            </View>
          </View>
        </View>

        {/* CTA FINAL */}
        <View style={styles.finalCTA}>
          <Text style={styles.finalCTATitle}>Des questions ?</Text>
          <Text style={styles.finalCTAText}>Notre équipe est à votre disposition</Text>
          <TouchableOpacity
            style={styles.finalCTAButton}
            onPress={() => navigation.navigate('Contact')}
          >
            <LinearGradient
              colors={service.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.finalCTAGradient}
            >
              <Text style={styles.finalCTAButtonText}>Contactez-nous</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },

  // HERO SECTION
  heroSection: {
    padding: 32,
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  heroIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },

  // PACKAGES SECTION
  packagesSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  packageCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  packageCardPopular: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333',
  },
  packageHeader: {
    marginBottom: 16,
  },
  packageName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  packagePriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
  },
  packagePriceLabel: {
    fontSize: 14,
    color: '#999',
    marginLeft: 4,
  },
  packageFeatures: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  featureCheck: {
    fontSize: 16,
    color: '#4CAF50',
    marginRight: 12,
    fontWeight: 'bold',
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  orderButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  orderButtonPopular: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  orderButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  orderButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },

  // EVENT SECTION
  eventSection: {
    padding: 16,
    marginTop: 8,
  },
  specialtiesGrid: {
    marginTop: 16,
  },
  specialtyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  specialtyIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  specialtyName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  specialtyDescription: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  contactButton: {
    marginTop: 16,
    backgroundColor: '#667eea',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },

  // WHY SECTION
  whySection: {
    padding: 16,
    marginTop: 8,
  },
  whyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  whyCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  whyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  whyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  whyText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },

  // FINAL CTA
  finalCTA: {
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  finalCTATitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  finalCTAText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  finalCTAButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  finalCTAGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  finalCTAButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});
