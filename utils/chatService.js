// utils/chatService.js - ✅ AVEC IMGBB
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import imageService from './imageService';
import { notificationService } from './notificationService';

export const chatService = {
  // Créer ou récupérer une conversation
  getOrCreateConversation: async (userId, startupId) => {
    try {
      const q = query(
        collection(db, 'conversations'),
        where('participants', '==', [userId, startupId].sort())
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const conversationDoc = querySnapshot.docs[0];
        return { 
          success: true, 
          conversation: { id: conversationDoc.id, ...conversationDoc.data() }
        };
      }

      const [userDoc, startupDoc] = await Promise.all([
        getDoc(doc(db, 'users', userId)),
        getDoc(doc(db, 'startups', startupId))
      ]);

      const userData = userDoc.data();
      const startupData = startupDoc.data();

      const userInfo = {
        id: userId,
        name: userData?.fullName || 'Utilisateur',
        type: 'user'
      };
      if (userData?.avatar) {
        userInfo.avatar = userData.avatar;
      }

      const startupInfo = {
        id: startupId,
        name: startupData?.name || 'Startup',
        type: 'startup'
      };
      if (startupData?.logo) {
        startupInfo.avatar = startupData.logo;
      }

      const conversationData = {
        participants: [userId, startupId].sort(),
        participantsInfo: {
          [userId]: userInfo,
          [startupId]: startupInfo
        },
        userId: userId,
        startupId: startupId,
        startupName: startupData?.name || 'Startup',
        lastMessage: null,
        lastMessageTime: new Date(),
        unreadStartup: 0,
        unreadUser: 0,
        updatedAt: new Date(),
        createdAt: new Date()
      };

      const conversationRef = await addDoc(collection(db, 'conversations'), conversationData);
      
      return { 
        success: true, 
        conversation: { id: conversationRef.id, ...conversationData }
      };
    } catch (error) {
      console.error('Erreur création/récupération conversation:', error);
      return { success: false, error: error.message };
    }
  },

  // Envoyer un message
  sendMessage: async (conversationId, senderId, message, type = 'text', imageUri = null) => {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);

      if (!conversationDoc.exists()) {
        throw new Error('Conversation introuvable');
      }

      const conversationData = conversationDoc.data();
      const recipient = conversationData.participants.find(id => id !== senderId);

      // ✅ Upload avec ImgBB
      let imageUrl = null;
      if (type === 'image' && imageUri) {
        try {
          console.log('📤 Upload image chat...');

          const uploadResult = await imageService.uploadImage(imageUri);

          if (!uploadResult.success) {
            throw new Error(uploadResult.error || 'Échec upload');
          }

          imageUrl = uploadResult.url;
          console.log('✅ Image uploadée:', imageUrl);

        } catch (uploadError) {
          console.error('❌ Erreur upload:', uploadError);
          throw new Error(`Échec upload: ${uploadError.message}`);
        }
      }

      const messageData = {
        senderId,
        type,
        content: type === 'text' ? message : imageUrl,
        timestamp: new Date(),
        read: false,
        delivered: false
      };

      await addDoc(collection(db, 'conversations', conversationId, 'messages'), messageData);

      const recipientInfo = conversationData.participantsInfo[recipient];
      const isRecipientStartup = recipientInfo?.type === 'startup';

      const updateData = {
        lastMessage: type === 'text' ? message : '📷 Photo',
        lastMessageTime: new Date(),
        updatedAt: new Date(),
        [`unreadCount.${recipient}`]: (conversationData.unreadCount?.[recipient] || 0) + 1
      };

      if (isRecipientStartup) {
        updateData.unreadStartup = (conversationData.unreadStartup || 0) + 1;
      } else {
        updateData.unreadUser = (conversationData.unreadUser || 0) + 1;
      }

      await updateDoc(conversationRef, updateData);

      const senderInfo = conversationData.participantsInfo[senderId];

      if (isRecipientStartup) {
        await notificationService.sendNotificationToStartup(
          recipient,
          '💬 Nouveau message',
          `${senderInfo.name}: ${type === 'text' ? message : '📷 Photo'}`,
          { type: 'new_message', conversationId, senderId, messageType: type }
        );
      } else {
        await notificationService.sendNotificationToUser(
          recipient,
          '💬 Nouveau message',
          `${senderInfo.name}: ${type === 'text' ? message : '📷 Photo'}`,
          { type: 'new_message', conversationId, senderId, messageType: type }
        );
      }

      return { success: true, message: messageData };
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      return { success: false, error: error.message };
    }
  },

  markMessagesAsRead: async (conversationId, userId, isStartup = false) => {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);

      const updateData = {
        [`unreadCount.${userId}`]: 0
      };

      if (isStartup) {
        updateData.unreadStartup = 0;
      } else {
        updateData.unreadUser = 0;
      }

      await updateDoc(conversationRef, updateData);

      const q = query(
        collection(db, 'conversations', conversationId, 'messages'),
        where('read', '==', false)
      );

      const unreadMessages = await getDocs(q);

      const updatePromises = unreadMessages.docs.map(doc =>
        updateDoc(doc.ref, { read: true, readAt: new Date() })
      );

      await Promise.all(updatePromises);

      return { success: true };
    } catch (error) {
      console.error('Erreur marquage messages lus:', error);
      return { success: false, error: error.message };
    }
  },

  subscribeToConversation: (conversationId, callback) => {
    const messagesQuery = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
      callback(messages);
    });

    return unsubscribe;
  },

  subscribeToConversationUpdates: (conversationId, callback) => {
    const unsubscribe = onSnapshot(doc(db, 'conversations', conversationId), (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      }
    });

    return unsubscribe;
  },

  getUserConversations: async (userId) => {
    try {
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const conversations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        updatedAt: doc.data().updatedAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate()
      }));

      return { success: true, conversations };
    } catch (error) {
      console.error('Erreur récupération conversations:', error);
      return { success: false, error: error.message };
    }
  },

  subscribeToUserConversations: (userId, callback) => {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const conversations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        updatedAt: doc.data().updatedAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      callback(conversations);
    });

    return unsubscribe;
  }
};

export default chatService;