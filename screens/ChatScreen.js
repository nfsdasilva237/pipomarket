import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChatComponent from '../components/ChatComponent';
import { auth } from '../config/firebase';
import chatService from '../utils/chatService';

export default function ChatScreen({ route, navigation }) {
  const { startupId, startupName, clientId, clientName } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState(null);
  const [error, setError] = useState(null);
  
  const currentUser = auth.currentUser;
  const isStartup = clientId !== undefined; // Si clientId existe, c'est une startup qui répond

  const targetId = isStartup ? clientId : startupId;
  const targetName = isStartup ? clientName : startupName;

  useEffect(() => {
    // Configurer la navigation
    navigation.setOptions({
      title: targetName,
      headerTitleStyle: {
        fontSize: 17,
        fontWeight: '600',
      },
      headerStyle: {
        backgroundColor: 'white',
      },
      headerShadowVisible: false,
    });

    // Initialiser ou récupérer la conversation
    const initializeChat = async () => {
      try {
        const result = await chatService.getOrCreateConversation(
          currentUser.uid,
          targetId
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

    initializeChat();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement de la conversation...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ChatComponent
        conversation={conversation}
        currentUserId={currentUser.uid}
        isStartup={isStartup}
        targetUser={{
          id: targetId,
          name: targetName,
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    fontSize: 16,
  },
});