// screens/ChatScreen.js - ✅ VERSION AVEC IMGBB
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChatComponent from '../components/ChatComponent';
import { auth } from '../config/firebase';
import chatService from '../utils/chatService';

export default function ChatScreen({ route, navigation }) {
  const { startupId, startupName, clientId, clientName, startupLogo } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState(null);
  const [error, setError] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  
  const currentUser = auth.currentUser;
  const isStartup = clientId !== undefined;
  
  const myId = isStartup ? startupId : currentUser.uid;
  const targetId = isStartup ? clientId : startupId;
  const targetName = isStartup ? clientName : startupName;

  useEffect(() => {
    initializeChat();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const initializeChat = async () => {
    try {
      const clientUserId = isStartup ? clientId : currentUser.uid;
      const startupUserId = isStartup ? startupId : startupId;
      
      const result = await chatService.getOrCreateConversation(
        clientUserId,
        startupUserId
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      setConversation(result.conversation);
    } catch (error) {
      console.error('Erreur initialisation chat:', error);
      setError('Impossible de charger la conversation');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Chargement de la conversation...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>😕</Text>
        <Text style={styles.errorTitle}>Oups !</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setLoading(true);
            initializeChat();
          }}
        >
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>

            <View style={styles.headerInfo}>
              <View style={styles.headerAvatar}>
                {startupLogo && typeof startupLogo === 'string' && startupLogo.startsWith('http') ? (
                  <Image source={{ uri: startupLogo }} style={styles.headerAvatarImage} />
                ) : (
                  <Text style={styles.headerAvatarText}>{startupLogo || '🏪'}</Text>
                )}
                <View style={styles.onlineIndicator} />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerName} numberOfLines={1}>{targetName}</Text>
                <Text style={styles.headerStatus}>En ligne</Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerActionButton}>
                <Text style={styles.headerActionIcon}>ℹ️</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <Animated.View style={[styles.chatContainer, { opacity: fadeAnim }]}>
        <ChatComponent
          conversation={conversation}
          currentUserId={myId}
          isStartup={isStartup}
          targetUser={{
            id: targetId,
            name: targetName,
            logo: startupLogo,
          }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  chatContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F0F2F5',
  },
  errorIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  headerAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  headerAvatarText: {
    fontSize: 24,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: 'white',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  headerStatus: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActionIcon: {
    fontSize: 18,
    color: 'white',
  },
});