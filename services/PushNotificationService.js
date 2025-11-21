// services/PushNotificationService.js - Push Notifications avec Expo
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { Platform } from 'react-native';
import { auth, db } from '../config/firebase';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class PushNotificationService {
  static expoPushToken = null;
  static notificationListener = null;
  static responseListener = null;

  /**
   * Initialiser les notifications push
   */
  static async initialize() {
    try {
      // Vérifier si c'est un appareil physique
      if (!Device.isDevice) {
        console.log('Push notifications require a physical device');
        return { success: false, error: 'Simulator not supported' };
      }

      // Demander les permissions
      const permissionResult = await this.requestPermissions();
      if (!permissionResult.success) {
        return permissionResult;
      }

      // Obtenir le token Expo Push
      const tokenResult = await this.getExpoPushToken();
      if (!tokenResult.success) {
        return tokenResult;
      }

      this.expoPushToken = tokenResult.token;

      // Enregistrer le token dans Firebase
      if (auth.currentUser) {
        await this.saveTokenToFirebase(auth.currentUser.uid, this.expoPushToken);
      }

      // Configuration Android
      if (Platform.OS === 'android') {
        await this.setupAndroidChannel();
      }

      // Configurer les listeners
      this.setupListeners();

      console.log('Push Notifications initialized:', this.expoPushToken);
      return { success: true, token: this.expoPushToken };
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Demander les permissions de notification
   */
  static async requestPermissions() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return {
          success: false,
          error: 'Permission not granted',
          status: finalStatus
        };
      }

      return { success: true, status: finalStatus };
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir le token Expo Push
   */
  static async getExpoPushToken() {
    try {
      // Obtenir le projectId depuis les constantes Expo
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ||
                       Constants.easConfig?.projectId;

      if (!projectId) {
        console.warn('No projectId found, using default method');
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      return { success: true, token: tokenData.data };
    } catch (error) {
      console.error('Error getting Expo Push Token:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Configurer le channel Android
   */
  static async setupAndroidChannel() {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'PipoMarket',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#275471',
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
    });

    // Channel pour les commandes
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Commandes',
      description: 'Notifications de commandes',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });

    // Channel pour les messages
    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      description: 'Nouveaux messages',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });

    // Channel pour les promotions
    await Notifications.setNotificationChannelAsync('promotions', {
      name: 'Promotions',
      description: 'Offres et promotions',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  /**
   * Configurer les listeners de notifications
   */
  static setupListeners() {
    // Listener pour les notifications reçues en foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(
      notification => {
        console.log('Notification received:', notification);
        this.handleNotificationReceived(notification);
      }
    );

    // Listener pour les interactions avec les notifications
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      response => {
        console.log('Notification response:', response);
        this.handleNotificationResponse(response);
      }
    );
  }

  /**
   * Gérer une notification reçue
   */
  static handleNotificationReceived(notification) {
    const { data } = notification.request.content;

    // Enregistrer dans l'historique local
    this.logNotificationReceived(data);
  }

  /**
   * Gérer l'interaction avec une notification
   */
  static handleNotificationResponse(response) {
    const { data } = response.notification.request.content;

    // Navigation basée sur le type de notification
    if (data?.screen) {
      // Navigation sera gérée par le composant parent
      console.log('Navigate to:', data.screen, data.params);
    }
  }

  /**
   * Enregistrer le token dans Firebase
   */
  static async saveTokenToFirebase(userId, token) {
    try {
      if (!userId || !token) {
        return { success: false, error: 'Missing userId or token' };
      }

      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const existingTokens = userData.expoPushTokens || [];

        // Ajouter le token s'il n'existe pas
        if (!existingTokens.includes(token)) {
          await updateDoc(userRef, {
            expoPushTokens: [...existingTokens, token],
            lastPushTokenUpdate: serverTimestamp(),
            platform: Platform.OS,
            deviceName: Device.deviceName,
          });
        }
      } else {
        await setDoc(userRef, {
          expoPushTokens: [token],
          lastPushTokenUpdate: serverTimestamp(),
          platform: Platform.OS,
          deviceName: Device.deviceName,
        }, { merge: true });
      }

      return { success: true };
    } catch (error) {
      console.error('Error saving token to Firebase:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envoyer une notification locale (pour test)
   */
  static async sendLocalNotification(title, body, data = {}) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          badge: 1,
        },
        trigger: null, // Immédiat
      });

      return { success: true, notificationId };
    } catch (error) {
      console.error('Error sending local notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envoyer une notification push via Expo Push Service
   * IMPORTANT: En production, ceci doit être fait côté serveur
   */
  static async sendPushNotification(expoPushToken, title, body, data = {}) {
    if (!expoPushToken) {
      return { success: false, error: 'No push token' };
    }

    const message = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
      channelId: data.channelId || 'default',
    };

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();

      if (result.data?.status === 'ok') {
        return { success: true, ticket: result.data };
      } else {
        return { success: false, error: result.data?.message || 'Unknown error' };
      }
    } catch (error) {
      console.error('Error sending push notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envoyer une notification à un utilisateur
   */
  static async sendToUser(userId, title, body, data = {}) {
    try {
      if (!userId) {
        return { success: false, error: 'userId required' };
      }

      // Récupérer les tokens de l'utilisateur
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return { success: false, error: 'User not found' };
      }

      const userData = userDoc.data();
      const tokens = userData.expoPushTokens || [];

      if (tokens.length === 0) {
        // Sauvegarder quand même dans Firestore
        await this.saveNotificationToFirestore(userId, title, body, data);
        return { success: false, error: 'No push tokens registered' };
      }

      // Envoyer à tous les appareils
      const results = await Promise.all(
        tokens.map(token => this.sendPushNotification(token, title, body, data))
      );

      // Sauvegarder dans Firestore
      await this.saveNotificationToFirestore(userId, title, body, data);

      const successCount = results.filter(r => r.success).length;
      return {
        success: successCount > 0,
        sent: successCount,
        total: tokens.length
      };
    } catch (error) {
      console.error('Error sending notification to user:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envoyer une notification à tous les utilisateurs (broadcast)
   */
  static async sendBroadcast(title, body, data = {}) {
    try {
      // Créer une entrée de broadcast dans Firestore
      const broadcastRef = await addDoc(collection(db, 'broadcasts'), {
        title,
        body,
        data,
        createdAt: serverTimestamp(),
        type: data.type || 'announcement',
      });

      // Note: En production, utiliser Cloud Functions pour envoyer massivement
      console.log('Broadcast created:', broadcastRef.id);

      return { success: true, broadcastId: broadcastRef.id };
    } catch (error) {
      console.error('Error creating broadcast:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sauvegarder notification dans Firestore
   */
  static async saveNotificationToFirestore(userId, title, body, data = {}) {
    try {
      const notificationRef = await addDoc(collection(db, 'notifications'), {
        userId,
        title,
        body,
        data,
        read: false,
        createdAt: serverTimestamp(),
        type: data.type || 'general',
      });

      // Mettre à jour le compteur de l'utilisateur
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const currentCount = userDoc.data().unreadNotifications || 0;
        await updateDoc(userRef, {
          unreadNotifications: currentCount + 1,
        });
      }

      return { success: true, notificationId: notificationRef.id };
    } catch (error) {
      console.error('Error saving notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Logger notification reçue
   */
  static async logNotificationReceived(data) {
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, 'notificationLogs'), {
        userId: auth.currentUser.uid,
        data,
        receivedAt: serverTimestamp(),
        platform: Platform.OS,
      });
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  /**
   * Obtenir le badge count actuel
   */
  static async getBadgeCount() {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  /**
   * Définir le badge count
   */
  static async setBadgeCount(count) {
    try {
      await Notifications.setBadgeCountAsync(count);
      return { success: true };
    } catch (error) {
      console.error('Error setting badge count:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Réinitialiser le badge
   */
  static async clearBadge() {
    return this.setBadgeCount(0);
  }

  /**
   * Nettoyer les listeners
   */
  static cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }
  }

  /**
   * Supprimer le token de l'utilisateur (logout)
   */
  static async removeToken(userId) {
    try {
      if (!userId || !this.expoPushToken) {
        return { success: false };
      }

      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const tokens = userData.expoPushTokens || [];
        const updatedTokens = tokens.filter(t => t !== this.expoPushToken);

        await updateDoc(userRef, {
          expoPushTokens: updatedTokens,
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error removing token:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notifications prédéfinies pour PipoMarket
   */
  static async notifyNewOrder(userId, orderDetails) {
    return this.sendToUser(
      userId,
      'Nouvelle commande !',
      `Votre commande #${orderDetails.orderId} a été reçue. Total: ${orderDetails.total} XAF`,
      {
        type: 'order',
        screen: 'OrderDetail',
        params: { orderId: orderDetails.orderId },
        channelId: 'orders',
      }
    );
  }

  static async notifyOrderStatusUpdate(userId, orderId, status) {
    const statusMessages = {
      'processing': 'Votre commande est en cours de préparation',
      'shipped': 'Votre commande a été expédiée',
      'delivered': 'Votre commande a été livrée',
      'cancelled': 'Votre commande a été annulée',
    };

    return this.sendToUser(
      userId,
      'Mise à jour commande',
      statusMessages[status] || `Statut: ${status}`,
      {
        type: 'order_update',
        screen: 'OrderDetail',
        params: { orderId },
        channelId: 'orders',
      }
    );
  }

  static async notifyNewMessage(userId, senderName, preview) {
    return this.sendToUser(
      userId,
      `Message de ${senderName}`,
      preview.substring(0, 100),
      {
        type: 'message',
        screen: 'Chat',
        channelId: 'messages',
      }
    );
  }

  static async notifyPromotion(userId, promoDetails) {
    return this.sendToUser(
      userId,
      promoDetails.title || 'Offre spéciale !',
      promoDetails.description,
      {
        type: 'promotion',
        channelId: 'promotions',
      }
    );
  }

  static async notifyBDLServiceUpdate(userId, serviceDetails) {
    return this.sendToUser(
      userId,
      'Mise à jour service BDL',
      `Votre service "${serviceDetails.serviceName}" a été mis à jour: ${serviceDetails.status}`,
      {
        type: 'bdl_service',
        screen: 'BDLOrderDetail',
        params: { orderId: serviceDetails.orderId },
      }
    );
  }
}

export default PushNotificationService;