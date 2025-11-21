// components/ChatComponent.js - ✅ AVEC APERÇU PHOTO
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ImageView from 'react-native-image-viewing';
import { SafeAreaView } from 'react-native-safe-area-context';
import chatService from '../utils/chatService';
import imageService from '../utils/imageService';

export default function ChatComponent({
  conversation,
  currentUserId,
  isStartup = false,
  targetUser,
}) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const flatListRef = useRef(null);

  // ✅ État pour l'aperçu d'image
  const [imageViewVisible, setImageViewVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [viewableImages, setViewableImages] = useState([]);

  useEffect(() => {
    if (!conversation?.id) return;

    // Marquer messages comme lus
    chatService.markMessagesAsRead(conversation.id, currentUserId, isStartup);

    // S'abonner aux messages
    const unsubscribe = chatService.subscribeToConversation(
      conversation.id,
      (newMessages) => {
        setMessages(newMessages);
        // Scroll vers le bas quand nouveaux messages
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => unsubscribe();
  }, [conversation?.id, currentUserId, isStartup]);

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const result = await chatService.sendMessage(
        conversation.id,
        currentUserId,
        messageText,
        'text'
      );

      if (!result.success) {
        Alert.alert('Erreur', 'Impossible d\'envoyer le message');
        setInputText(messageText);
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
      setInputText(messageText);
    } finally {
      setSending(false);
    }
  };

  // ✅ Envoyer une image
  const handleImagePick = async () => {
    try {
      console.log('📸 Sélection image...');
      
      const pickResult = await imageService.showImagePicker();
      
      if (!pickResult.success || pickResult.cancelled) {
        return;
      }

      console.log('✅ Image sélectionnée:', pickResult.uri);
      setUploading(true);

      const result = await chatService.sendMessage(
        conversation.id,
        currentUserId,
        '',
        'image',
        pickResult.uri
      );

      if (!result.success) {
        Alert.alert('Erreur', result.error || 'Impossible d\'envoyer l\'image');
      } else {
        console.log('✅ Image envoyée');
      }

      setUploading(false);

    } catch (error) {
      console.error('❌ Erreur envoi image:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer l\'image');
      setUploading(false);
    }
  };

  // ✅ Ouvrir aperçu image
  const handleImagePress = (imageUrl) => {
    // Récupérer toutes les images du chat
    const allImages = messages
      .filter(msg => msg.type === 'image' && msg.content)
      .map(msg => ({ uri: msg.content }));

    // Trouver l'index de l'image cliquée
    const index = allImages.findIndex(img => img.uri === imageUrl);

    setViewableImages(allImages);
    setCurrentImageIndex(index >= 0 ? index : 0);
    setImageViewVisible(true);
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.senderId === currentUserId;
    const messageTime = item.timestamp
      ? new Date(item.timestamp).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer,
        ]}
      >
        {/* Message texte */}
        {item.type === 'text' && (
          <View
            style={[
              styles.messageBubble,
              isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isMyMessage ? styles.myMessageText : styles.theirMessageText,
              ]}
            >
              {item.content}
            </Text>
            <Text
              style={[
                styles.messageTime,
                isMyMessage ? styles.myMessageTime : styles.theirMessageTime,
              ]}
            >
              {messageTime}
            </Text>
          </View>
        )}

        {/* Message image */}
        {item.type === 'image' && (
          <TouchableOpacity
            onPress={() => handleImagePress(item.content)}
            activeOpacity={0.9}
          >
            <View
              style={[
                styles.imageBubble,
                isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
              ]}
            >
              <Image
                source={{ uri: item.content }}
                style={styles.messageImage}
                resizeMode="cover"
              />
              <View style={styles.imageTimeOverlay}>
                <Text style={styles.imageTimeText}>{messageTime}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Liste des messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          showsVerticalScrollIndicator={false}
        />

        {/* Loader upload */}
        {uploading && (
          <View style={styles.uploadingOverlay}>
            <View style={styles.uploadingBox}>
              <ActivityIndicator size="large" color="#667eea" />
              <Text style={styles.uploadingText}>Envoi en cours...</Text>
            </View>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          {/* Bouton image */}
          <TouchableOpacity
            style={styles.attachButton}
            onPress={handleImagePick}
            disabled={uploading || sending}
          >
            <Text style={styles.attachIcon}>📷</Text>
          </TouchableOpacity>

          {/* Input texte */}
          <TextInput
            style={styles.input}
            placeholder="Votre message..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!sending && !uploading}
          />

          {/* Bouton envoyer */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending || uploading}
          >
            {sending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.sendIcon}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ✅ Aperçu image en plein écran */}
      <ImageView
        images={viewableImages}
        imageIndex={currentImageIndex}
        visible={imageViewVisible}
        onRequestClose={() => setImageViewVisible(false)}
        swipeToCloseEnabled={true}
        doubleTapToZoomEnabled={true}
        FooterComponent={({ imageIndex }) => (
          <View style={styles.imageViewFooter}>
            <Text style={styles.imageViewCounter}>
              {imageIndex + 1} / {viewableImages.length}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '75%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  theirMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  myMessageBubble: {
    backgroundColor: '#667eea',
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  myMessageText: {
    color: 'white',
  },
  theirMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  theirMessageTime: {
    color: '#999',
    textAlign: 'left',
  },

  // ✅ Styles pour les images
  imageBubble: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  messageImage: {
    width: 220,
    height: 220,
    borderRadius: 16,
  },
  imageTimeOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  imageTimeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  attachIcon: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  sendIcon: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },

  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  uploadingBox: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  uploadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },

  // ✅ Styles pour l'aperçu image
  imageViewFooter: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 16,
    alignItems: 'center',
  },
  imageViewCounter: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});