// components/BDLStudioSection.js - Bannière compacte BDL Studio sur HomeScreen
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BDLStudioSection({ navigation }) {

  const handlePress = () => {
    navigation.navigate('BDLStudioHome');
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={['#275471', '#f4a04b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <View style={styles.content}>
          <View style={styles.leftSection}>
            <Text style={styles.icon}>🎨</Text>
            <View style={styles.textSection}>
              <Text style={styles.title}>BDL STUDIO</Text>
              <Text style={styles.subtitle}>Design • Vidéo • Web • Photo • Drone</Text>
            </View>
          </View>
          <View style={styles.rightSection}>
            <Text style={styles.arrow}>→</Text>
          </View>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Voir nos services premium</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  banner: {
    padding: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 40,
    marginRight: 12,
  },
  textSection: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '500',
  },
  rightSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  badge: {
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
});
