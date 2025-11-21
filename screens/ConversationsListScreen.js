import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../config/firebase';

export default function ConversationsListScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUser = auth.currentUser;

  // Écouter les conversations en temps réel
  useEffect(() => {
    if (!currentUser) return;

    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('userId', '==', currentUser.uid),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const conversationsData = [];
      snapshot.forEach((doc) => {
        conversationsData.push({ id: doc.id, ...doc.data() });
      });
      setConversations(conversationsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const renderConversation = ({ item }) => {
    const hasUnread = item.unreadClient > 0;

    return (
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() =>
          navigation.navigate('Chat', {
            startupId: item.startupId,
            startupName: item.startupName,
          })
        }
      >
        {/* Logo */}
        <View style={styles.conversationLogo}>
          <Text style={styles.conversationLogoText}>🏪</Text>
        </View>

        {/* Infos */}
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName}>{item.startupName}</Text>
            {item.lastMessageTime && (
              <Text style={styles.conversationTime}>
                {formatTime(item.lastMessageTime.toDate())}
              </Text>
            )}
          </View>
          <Text
            style={[
              styles.conversationLastMessage,
              hasUnread && styles.conversationLastMessageUnread,
            ]}
            numberOfLines={1}
          >
            {item.lastMessage || 'Aucun message'}
          </Text>
        </View>

        {/* Badge non-lus */}
        {hasUnread && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadClient}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const formatTime = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💬 Messages</Text>
      </View>

      {/* LISTE */}
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>💬</Text>
            <Text style={styles.emptyStateTitle}>Aucune conversation</Text>
            <Text style={styles.emptyStateText}>
              Contactez une startup pour démarrer une discussion
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.emptyButtonText}>Explorer les startups</Text>
            </TouchableOpacity>
          </View>
        }
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
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  listContainer: {
    flexGrow: 1,
  },
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    alignItems: 'center',
  },
  conversationLogo: {
    width: 56,
    height: 56,
    backgroundColor: '#F2F2F7',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationLogoText: {
    fontSize: 28,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  conversationTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  conversationLastMessage: {
    fontSize: 14,
    color: '#8E8E93',
  },
  conversationLastMessageUnread: {
    fontWeight: '600',
    color: '#000',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
