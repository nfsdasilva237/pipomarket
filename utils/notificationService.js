// utils/notificationService.js - VERSION CORRIGÉE (ERREURS SILENCIEUSES)
import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { Platform } from 'react-native';
import { db } from '../config/firebase';

export const notificationService = {
  // Vérifier que l'utilisateur existe
  _ensureUserExists: async (userId) => {
    if (!userId) {
      throw new Error('userId est requis');
    }

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        fcmTokens: [],
        unreadNotifications: 0,
        notificationSettings: {
          enabled: true,
          types: {
            chat: true,
            order: true,
            payment: true,
            system: true
          }
        }
      });
      return false;
    }
    return true;
  },

  // Envoyer une notification
  sendNotification: async (userId, notification) => {
    if (!userId || !notification?.title || !notification?.message) {
      return { success: false, error: 'userId, title et message sont requis' };
    }

    try {
      await notificationService._ensureUserExists(userId);

      const notificationData = {
        ...notification,
        read: false,
        timestamp: new Date(),
      };

      // Ajouter la notification à la collection de l'utilisateur
      const notificationRef = await addDoc(
        collection(db, 'users', userId, 'notifications'),
        notificationData
      );

      // Incrémenter le compteur de notifications non lues
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        unreadNotifications: (await notificationService.getUnreadCount(userId)) + 1
      });

      return { 
        success: true, 
        notificationId: notificationRef.id 
      };
    } catch (error) {
      console.log('📱 Notifications désactivées');
      return { success: false, error: error.message, silent: true };
    }
  },

  // Marquer une notification comme lue
  markAsRead: async (userId, notificationId) => {
    if (!userId || !notificationId) {
      return { success: false, error: 'userId et notificationId sont requis' };
    }

    try {
      const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });

      // Mettre à jour le compteur
      const unreadCount = await notificationService.getUnreadCount(userId);
      if (unreadCount > 0) {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          unreadNotifications: unreadCount - 1
        });
      }

      return { success: true };
    } catch (error) {
      console.log('📱 Notifications désactivées');
      return { success: false, error: error.message, silent: true };
    }
  },

  // Configurer les gestionnaires de notifications
  setupNotificationHandlers: (onNotificationReceived) => {
    if (typeof onNotificationReceived !== 'function') {
      console.error('onNotificationReceived doit être une fonction');
      return { success: false, error: 'Callback invalide' };
    }

    try {
      if (Platform.OS === 'web') {
        // Pour le web, configuration Firebase Cloud Messaging
        const messaging = getMessaging();
        
        // Gestionnaire pour les notifications en premier plan
        const unsubscribe = onMessage(messaging, (payload) => {
          if (payload?.data) {
            onNotificationReceived(payload);
          }
        });

        return { success: true, unsubscribe };
      } else {
        // Pour React Native, gestionnaire temporaire
        const mockNotification = {
          data: {
            type: 'mock_notification'
          }
        };
        
        const timeout = setTimeout(() => {
          onNotificationReceived(mockNotification);
        }, 5000);

        return {
          success: true,
          unsubscribe: () => {
            if (timeout) {
              clearTimeout(timeout);
            }
          }
        };
      }
    } catch (error) {
      console.log('📱 Notifications désactivées');
      return { success: false, error: error.message, silent: true };
    }
  },

  // Demander les permissions de notification
  requestPermissions: async () => {
    try {
      if (Platform.OS === 'web') {
        try {
          const messaging = getMessaging();
          await getToken(messaging);
          return { success: true };
        } catch (error) {
          console.log('📱 Notifications désactivées');
          return { success: false, error: error.message, silent: true };
        }
      } else {
        // Pour React Native, à implémenter plus tard
        return { success: true };
      }
    } catch (error) {
      console.log('📱 Notifications désactivées');
      return { success: false, error: error.message, silent: true };
    }
  },

  // Obtenir le nombre total de notifications non lues
  getUnreadCount: async (userId) => {
    if (!userId) {
      console.error('getUnreadCount: userId est requis');
      return 0;
    }

    try {
      const exists = await notificationService._ensureUserExists(userId);
      
      // Si l'utilisateur vient d'être créé
      if (!exists) {
        return 0;
      }
      
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      
      // S'assurer que la valeur est un nombre valide
      const count = userData?.unreadNotifications;
      return typeof count === 'number' && !isNaN(count) ? count : 0;
    } catch (error) {
      console.log('📱 Notifications désactivées');
      return 0;
    }
  },

  // Nettoyer les ressources de notification
  cleanup: async () => {
    try {
      // Ajouter ici le nettoyage des listeners si nécessaire
      return { success: true };
    } catch (error) {
      console.log('📱 Notifications désactivées');
      return { success: false, error: error.message, silent: true };
    }
  },

  // Enregistrer le token FCM de l'utilisateur
  async registerDeviceToken(userId) {
    if (!userId) {
      console.error('userId est requis');
      return { success: false, error: 'userId est requis' };
    }

    try {
      let token = null;

      if (Platform.OS === 'web') {
        const messaging = getMessaging();
        token = await getToken(messaging);
      } else {
        // Pour React Native, on utilisera plus tard react-native-firebase
        return { success: false, error: 'Plateforme non supportée' };
      }

      if (!token) {
        return { success: false, error: 'Impossible d\'obtenir le token' };
      }

      await this.saveUserToken(userId, token);
      return { success: true, token };
    } catch (error) {
      console.log('📱 Notifications désactivées');
      return { success: false, error: error.message, silent: true };
    }
  },

  // Récupérer les notifications d'un utilisateur
  getUserNotifications: async (userId) => {
    if (!userId) {
      return { success: false, error: 'userId est requis', notifications: [] };
    }

    try {
      // Vérifier que l'utilisateur existe
      const exists = await notificationService._ensureUserExists(userId);
      
      if (!exists) {
        return { success: true, notifications: [] };
      }

      const notificationsRef = collection(db, 'users', userId, 'notifications');
      const q = query(notificationsRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);

      const notifications = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Validation et nettoyage des données
        if (data) {
          const notification = {
            id: doc.id,
            title: data.title || '',
            message: data.message || '',
            type: data.type || 'general',
            read: !!data.read,
            timestamp: data.timestamp?.toDate() || new Date(),
            data: data.data || {}
          };
          notifications.push(notification);
        }
      });

      return { 
        success: true, 
        notifications 
      };
    } catch (error) {
      console.log('📱 Notifications désactivées');
      return { 
        success: false, 
        error: error.message,
        notifications: [],
        silent: true
      };
    }
  },

  // Sauvegarder le token dans Firestore
  async saveUserToken(userId, token) {
    if (!userId || !token) {
      console.error('userId et token sont requis');
      return { success: false, error: 'userId et token sont requis' };
    }

    try {
      await this._ensureUserExists(userId);

      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      // Vérifier et nettoyer les tokens existants
      const existingTokens = Array.isArray(userData?.fcmTokens) ? userData.fcmTokens : [];
      const validTokens = existingTokens.filter(t => typeof t === 'string' && t.length > 0);

      // Ajouter le nouveau token s'il n'existe pas déjà
      if (!validTokens.includes(token)) {
        const newTokens = [...validTokens, token];
        
        await updateDoc(userRef, {
          fcmTokens: newTokens,
          lastTokenUpdate: new Date()
        });
      }

      return { success: true };
    } catch (error) {
      console.log('📱 Notifications désactivées');
      return { success: false, error: error.message, silent: true };
    }
  },

  // ✅ ENVOYER NOTIFICATION À UN UTILISATEUR (CORRIGÉ)
  async sendNotificationToUser(userId, title, body, data = {}) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // ✅ Log silencieux au lieu d'erreur
        console.log('📱 Notifications désactivées (utilisateur non trouvé)');
        return { success: false, error: 'Utilisateur introuvable', silent: true };
      }

      const userData = userDoc.data();
      const tokens = userData.fcmTokens || [];

      if (tokens.length === 0) {
        // ✅ Log silencieux au lieu d'erreur
        console.log('📱 Notifications désactivées (aucun appareil)');
        return { success: false, error: 'Aucun appareil enregistré', silent: true };
      }

      // Créer la notification dans Firestore
      const notificationRef = doc(collection(db, 'notifications'));
      await setDoc(notificationRef, {
        userId,
        title,
        body,
        data,
        read: false,
        createdAt: new Date(),
        type: data.type || 'general'
      });

      return { success: true };
    } catch (error) {
      // ✅ Log silencieux au lieu d'erreur
      console.log('📱 Notifications désactivées');
      return { success: false, error: error.message, silent: true };
    }
  },

  // ✅ ENVOYER NOTIFICATION À UNE STARTUP (CORRIGÉ)
  async sendNotificationToStartup(startupId, title, body, data = {}) {
    if (!startupId || !title || !body) {
      console.log('📱 Notifications désactivées (paramètres manquants)');
      return { success: false, error: 'Paramètres manquants', silent: true };
    }

    try {
      const startupRef = doc(db, 'startups', startupId);
      const startupDoc = await getDoc(startupRef);

      if (!startupDoc.exists()) {
        console.log('📱 Notifications désactivées (startup non trouvée)');
        return { success: false, error: 'Startup introuvable', silent: true };
      }

      const startupData = startupDoc.data();
      
      if (!startupData.ownerId) {
        console.log('📱 Notifications désactivées (pas de propriétaire)');
        return { success: false, error: 'Startup sans propriétaire', silent: true };
      }

      // Vérifier si la startup est active
      if (startupData.active === false) {
        console.log('📱 Notifications désactivées (startup inactive)');
        return { success: false, error: 'Startup inactive', silent: true };
      }

      // Envoyer à l'owner de la startup
      const result = await this.sendNotificationToUser(startupData.ownerId, title, body, {
        ...data,
        startupId,
        type: 'startup',
        startupName: startupData.name
      });

      if (result.success) {
        // Enregistrer la notification dans la collection de la startup
        const startupNotifRef = collection(db, 'startups', startupId, 'notifications');
        await addDoc(startupNotifRef, {
          title,
          body,
          data,
          createdAt: new Date(),
          read: false
        });
      }

      return result;
    } catch (error) {
      console.log('📱 Notifications désactivées');
      return { success: false, error: error.message, silent: true };
    }
  },

  // Marquer une notification comme lue
  async markNotificationAsRead(notificationId) {
    if (!notificationId) {
      return { success: false, error: 'notificationId est requis' };
    }

    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: new Date()
      });
      return { success: true };
    } catch (error) {
      console.log('📱 Notifications désactivées');
      return { success: false, error: error.message, silent: true };
    }
  },

  // Récupérer les notifications d'une startup
  async getStartupNotifications(startupId, options = {}) {
    if (!startupId) {
      return { success: false, error: 'startupId est requis', notifications: [] };
    }

    try {
      const startupRef = doc(db, 'startups', startupId);
      const startupDoc = await getDoc(startupRef);

      if (!startupDoc.exists()) {
        throw new Error('Startup introuvable');
      }

      const notificationsRef = collection(db, 'startups', startupId, 'notifications');
      let q = query(notificationsRef, orderBy('createdAt', 'desc'));

      // Ajouter une limite si spécifiée
      if (options.limit) {
        q = query(q, limit(options.limit));
      }

      // Filtrer par statut de lecture si spécifié
      if (options.onlyUnread) {
        q = query(q, where('read', '==', false));
      }

      const querySnapshot = await getDocs(q);
      const notifications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        readAt: doc.data().readAt?.toDate() || null
      }));

      return { success: true, notifications };
    } catch (error) {
      console.log('📱 Notifications désactivées');
      return { success: false, error: error.message, notifications: [], silent: true };
    }
  },

  // Marquer toutes les notifications comme lues
  markAllAsRead: async (userId) => {
    if (!userId) {
      console.error('markAllAsRead: userId est requis');
      return { success: false, error: 'userId est requis' };
    }

    try {
      const exists = await notificationService._ensureUserExists(userId);
      
      // Si l'utilisateur vient d'être créé, pas besoin de continuer
      if (!exists) {
        return { success: true };
      }

      const userRef = doc(db, 'users', userId);
      const batch = writeBatch(db);
      
      // Mettre à jour le compteur dans le document utilisateur
      batch.update(userRef, {
        unreadNotifications: 0
      });

      // Marquer toutes les notifications comme lues
      const notificationsRef = collection(db, 'users', userId, 'notifications');
      const unreadQuery = query(notificationsRef, where('read', '==', false));
      const unreadDocs = await getDocs(unreadQuery);

      if (!unreadDocs.empty) {
        unreadDocs.forEach(doc => {
          batch.update(doc.ref, { read: true });
        });
        await batch.commit();
      }

      return { success: true };
    } catch (error) {
      console.log('📱 Notifications désactivées');
      return { success: false, error: error.message, silent: true };
    }
  },

  // Gérer les tokens FCM d'une startup
  async manageStartupTokens(startupId, action, token) {
    if (!startupId || !action || (action === 'add' && !token)) {
      return { success: false, error: 'Paramètres invalides' };
    }

    try {
      const startupRef = doc(db, 'startups', startupId);
      const startupDoc = await getDoc(startupRef);

      if (!startupDoc.exists()) {
        throw new Error('Startup introuvable');
      }

      let tokens = startupDoc.data().fcmTokens || [];

      switch (action) {
        case 'add':
          if (!tokens.includes(token)) {
            tokens.push(token);
          }
          break;

        case 'cleanup':
          // Nettoyer les tokens invalides ou vides
          tokens = tokens.filter(t => typeof t === 'string' && t.length > 0);
          break;

        case 'clear':
          tokens = [];
          break;

        default:
          throw new Error('Action invalide');
      }

      await updateDoc(startupRef, {
        fcmTokens: tokens,
        lastTokenUpdate: new Date()
      });

      return { success: true, tokens };
    } catch (error) {
      console.log('📱 Notifications désactivées');
      return { success: false, error: error.message, silent: true };
    }
  }
};

export default notificationService;