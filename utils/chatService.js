// utils/chatService.js
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
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { notificationService } from './notificationService';

export const chatService = {
  // Créer ou récupérer une conversation
  getOrCreateConversation: async (userId, startupId) => {
    try {
      // Vérifier si une conversation existe déjà
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

      // Si non, créer une nouvelle conversation
      const [userDoc, startupDoc] = await Promise.all([
        getDoc(doc(db, 'users', userId)),
        getDoc(doc(db, 'startups', startupId))
      ]);

      const userData = userDoc.data();
      const startupData = startupDoc.data();

      // Préparation des informations des participants
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
        // ✅ Champs explicites pour compatibilité avec StartupMessagesScreen
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

      // Si c'est une image, l'uploader d'abord
      let imageUrl = null;
      if (type === 'image' && imageUri) {
        try {
          console.log('📤 Début upload image:', imageUri);

          // Créer un blob compatible React Native avec fallback
          let blob;
          try {
            // Méthode 1: Fetch (standard)
            const response = await fetch(imageUri);
            if (!response.ok) {
              throw new Error(`Échec du fetch: ${response.status} ${response.statusText}`);
            }
            blob = await response.blob();
            console.log('✅ Blob créé via fetch:', blob.size, 'bytes, type:', blob.type);
          } catch (fetchError) {
            // Méthode 2: XMLHttpRequest (fallback React Native)
            console.warn('⚠️ Fetch échoué, tentative avec XMLHttpRequest...');
            blob = await new Promise((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.onload = function() {
                resolve(xhr.response);
              };
              xhr.onerror = function(e) {
                console.error('❌ Erreur XHR:', e);
                reject(new Error('Échec de la création du blob via XHR'));
              };
              xhr.responseType = 'blob';
              xhr.open('GET', imageUri, true);
              xhr.send(null);
            });
            console.log('✅ Blob créé via XHR:', blob.size, 'bytes, type:', blob.type);
          }

          // Générer un nom de fichier unique
          const imageName = `chat/${conversationId}/${Date.now()}.jpg`;
          const imageRef = ref(storage, imageName);

          console.log('📁 Référence storage:', imageName);

          // Upload avec gestion d'erreur détaillée
          await uploadBytes(imageRef, blob);
          console.log('✅ Upload terminé');

          // Récupérer l'URL de téléchargement
          imageUrl = await getDownloadURL(imageRef);
          console.log('✅ URL obtenue:', imageUrl);

        } catch (uploadError) {
          console.error('❌ Erreur détaillée upload image:', {
            message: uploadError.message,
            code: uploadError.code,
            name: uploadError.name,
            stack: uploadError.stack
          });
          throw new Error(`Échec upload image: ${uploadError.message}`);
        }
      }

      // Créer le message
      const messageData = {
        senderId,
        type,
        content: type === 'text' ? message : imageUrl,
        timestamp: new Date(),
        read: false,
        delivered: false
      };

      // Ajouter le message
      await addDoc(collection(db, 'conversations', conversationId, 'messages'), messageData);

      // Déterminer le type de destinataire pour incrémenter le bon compteur
      const recipientInfo = conversationData.participantsInfo[recipient];
      const isRecipientStartup = recipientInfo?.type === 'startup';

      // Mettre à jour la conversation
      const updateData = {
        lastMessage: type === 'text' ? message : '📷 Photo',
        lastMessageTime: new Date(),
        updatedAt: new Date(),
        [`unreadCount.${recipient}`]: (conversationData.unreadCount?.[recipient] || 0) + 1
      };

      // ✅ Mettre à jour les compteurs spécifiques pour compatibilité
      if (isRecipientStartup) {
        updateData.unreadStartup = (conversationData.unreadStartup || 0) + 1;
      } else {
        updateData.unreadUser = (conversationData.unreadUser || 0) + 1;
      }

      await updateDoc(conversationRef, updateData);

      // Envoyer notification
      const senderInfo = conversationData.participantsInfo[senderId];

      if (isRecipientStartup) {
        await notificationService.sendNotificationToStartup(
          recipient,
          '💬 Nouveau message',
          `${senderInfo.name}: ${type === 'text' ? message : '📷 Photo'}`,
          {
            type: 'new_message',
            conversationId,
            senderId,
            messageType: type
          }
        );
      } else {
        await notificationService.sendNotificationToUser(
          recipient,
          '💬 Nouveau message',
          `${senderInfo.name}: ${type === 'text' ? message : '📷 Photo'}`,
          {
            type: 'new_message',
            conversationId,
            senderId,
            messageType: type
          }
        );
      }

      return { success: true, message: messageData };
    } catch (error) {
      console.error('❌ Erreur envoi message:', {
        message: error.message,
        code: error.code,
        name: error.name,
        conversationId,
        type,
        stack: error.stack
      });
      return { success: false, error: error.message };
    }
  },

  // Marquer les messages comme lus
  markMessagesAsRead: async (conversationId, userId, isStartup = false) => {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);

      // Mettre à jour les compteurs de messages non lus
      const updateData = {
        [`unreadCount.${userId}`]: 0
      };

      // ✅ Réinitialiser aussi le compteur spécifique
      if (isStartup) {
        updateData.unreadStartup = 0;
      } else {
        updateData.unreadUser = 0;
      }

      await updateDoc(conversationRef, updateData);

      // Marquer tous les messages non lus comme lus
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

  // Observer une conversation en temps réel
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

  // Observer les mises à jour de la conversation
  subscribeToConversationUpdates: (conversationId, callback) => {
    const unsubscribe = onSnapshot(doc(db, 'conversations', conversationId), (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      }
    });

    return unsubscribe;
  },

  // Récupérer la liste des conversations d'un utilisateur
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

  // Observer les conversations d'un utilisateur en temps réel
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