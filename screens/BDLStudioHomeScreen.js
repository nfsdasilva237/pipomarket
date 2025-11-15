// screens/BDLStudioHomeScreen.js - Page dédiée BDL Studio avec tous les services
import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bdlStudioServices } from '../data/bdlStudioServices';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

export default function BDLStudioHomeScreen({ navigation }) {

  const handleServicePress = (service) => {
    navigation.navigate('BDLServiceDetail', { service });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HERO SECTION */}
        <LinearGradient
          colors={['#275471', '#f4a04b']}
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

          <Text style={styles.heroIcon}>🎨</Text>
          <Text style={styles.heroTitle}>BDL STUDIO</Text>
          <Text style={styles.heroTagline}>Créativité & Excellence</Text>
          <Text style={styles.heroDescription}>
            Votre partenaire créatif pour tous vos projets digitaux et visuels
          </Text>
        </LinearGradient>

        {/* STATISTIQUES */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>7</Text>
            <Text style={styles.statLabel}>Services</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>500+</Text>
            <Text style={styles.statLabel}>Projets</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>100%</Text>
            <Text style={styles.statLabel}>Satisfaits</Text>
          </View>
        </View>

        {/* SERVICES */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>📌 Nos Services Premium</Text>
          <Text style={styles.sectionSubtitle}>
            Choisissez le service qui correspond à vos besoins
          </Text>

          <View style={styles.servicesGrid}>
            {bdlStudioServices.map((service) => (
              <TouchableOpacity
                key={service.id}
                onPress={() => handleServicePress(service)}
                style={[
                  styles.serviceCard,
                  service.id === 'community-management' && styles.serviceCardFull
                ]}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#275471', '#3a6a8a']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.serviceGradient}
                >
                  <Text style={styles.serviceIcon}>{service.icon}</Text>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <View style={styles.servicePriceContainer}>
                    <Text style={styles.servicePriceLabel}>À partir de</Text>
                    <Text style={styles.servicePrice}>
                      {(service.startingPrice / 1000).toFixed(service.startingPrice % 1000 === 0 ? 0 : 1)}K XAF
                    </Text>
                  </View>

                  {service.packages.some(pkg => pkg.popular) && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>⭐ POPULAIRE</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* POURQUOI BDL STUDIO */}
        <View style={styles.whySection}>
          <Text style={styles.sectionTitle}>💎 Pourquoi BDL Studio ?</Text>
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
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Des questions ?</Text>
          <Text style={styles.ctaText}>Notre équipe est à votre disposition</Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => navigation.navigate('Contact')}
          >
            <LinearGradient
              colors={['#275471', '#f4a04b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaButtonText}>📞 Contactez-nous</Text>
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
    paddingTop: 48,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroTagline: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },

  // STATS SECTION
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: -20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#275471',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },

  // SERVICES SECTION
  servicesSection: {
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
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceCard: {
    width: cardWidth,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  serviceCardFull: {
    width: '100%',
  },
  serviceGradient: {
    padding: 20,
    minHeight: 160,
    justifyContent: 'space-between',
    position: 'relative',
  },
  serviceIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  servicePriceContainer: {
    backgroundColor: 'rgba(244, 160, 75, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  servicePriceLabel: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
    marginBottom: 2,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#f4a04b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
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

  // CTA SECTION
  ctaSection: {
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  ctaText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  ctaButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  ctaGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});
