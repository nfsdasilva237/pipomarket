// components/BDLStudioSection.js - Section premium BDL Studio sur HomeScreen
import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { bdlStudioServices } from '../data/bdlStudioServices';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 colonnes avec marges

export default function BDLStudioSection({ navigation }) {

  const handleServicePress = (service) => {
    navigation.navigate('BDLServiceDetail', { service });
  };

  return (
    <View style={styles.container}>
      {/* HERO SECTION */}
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroSection}
      >
        <Text style={styles.heroIcon}>🎨</Text>
        <Text style={styles.heroTitle}>BDL STUDIO</Text>
        <Text style={styles.heroTagline}>Créativité & Excellence</Text>
        <Text style={styles.heroDescription}>
          Design • Vidéo • Web • Photo • Drone • Community Management
        </Text>
      </LinearGradient>

      {/* TITRE SECTION */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📌 Nos Services Premium</Text>
        <Text style={styles.sectionSubtitle}>
          Choisissez le service qui correspond à vos besoins
        </Text>
      </View>

      {/* GRID DES SERVICES */}
      <View style={styles.servicesGrid}>
        {bdlStudioServices.map((service, index) => (
          <TouchableOpacity
            key={service.id}
            onPress={() => handleServicePress(service)}
            style={[
              styles.serviceCard,
              // Community Management prend toute la largeur
              service.id === 'community-management' && styles.serviceCardFull
            ]}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={service.gradient}
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

              {/* Badge si le service a des packages populaires */}
              {service.packages.some(pkg => pkg.popular) && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>⭐ POPULAIRE</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {/* CTA SECTION */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaText}>
          💡 Besoin d'un service personnalisé ?
        </Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('Contact')}
        >
          <Text style={styles.ctaButtonText}>Contactez-nous</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },

  // HERO SECTION
  heroSection: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  heroIcon: {
    fontSize: 48,
    marginBottom: 8,
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
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 20,
  },

  // SECTION HEADER
  sectionHeader: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
  },

  // GRID DES SERVICES
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
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
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
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
    backgroundColor: 'rgba(255, 215, 0, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },

  // CTA SECTION
  ctaSection: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 12,
    fontWeight: '600',
  },
  ctaButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  ctaButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
