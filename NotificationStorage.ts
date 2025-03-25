// NotificationStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

// Type pour une notification enregistrée
export interface StoredNotification {
    id: string;
    title: string;
    body: string;
    timestamp: number;
    data?: any;
    read: boolean;
}

// Clé pour le stockage AsyncStorage
const NOTIFICATION_STORAGE_KEY = 'app_notifications';
const MAX_STORED_NOTIFICATIONS = 50; // Limite pour éviter de surcharger le stockage

// Convertir un message FCM en notification stockable
export const convertToStoredNotification = (
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
): StoredNotification => {
    return {
        id: remoteMessage.messageId || `notification-${Date.now()}`,
        title: remoteMessage.notification?.title || 'Notification',
        body: remoteMessage.notification?.body || '',
        timestamp: Date.now(),
        data: remoteMessage.data,
        read: false
    };
};

// Récupérer toutes les notifications stockées
export const getStoredNotifications = async (): Promise<StoredNotification[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
        return [];
    }
};

// Ajouter une nouvelle notification
export const addNotification = async (
    notification: StoredNotification
): Promise<StoredNotification[]> => {
    try {
        // Récupérer les notifications existantes
        const currentNotifications = await getStoredNotifications();

        // Vérifier si la notification existe déjà (éviter les doublons)
        const notificationExists = currentNotifications.some(
            (item) => item.id === notification.id
        );

        if (notificationExists) {
            return currentNotifications;
        }

        // Ajouter la nouvelle notification au début du tableau
        const updatedNotifications = [notification, ...currentNotifications];

        // Limiter le nombre de notifications stockées
        const trimmedNotifications = updatedNotifications.slice(0, MAX_STORED_NOTIFICATIONS);

        // Sauvegarder les notifications
        await AsyncStorage.setItem(
            NOTIFICATION_STORAGE_KEY,
            JSON.stringify(trimmedNotifications)
        );

        return trimmedNotifications;
    } catch (error) {
        console.error('Erreur lors de l\'ajout d\'une notification:', error);
        return await getStoredNotifications();
    }
};

// Marquer une notification comme lue
export const markNotificationAsRead = async (
    notificationId: string
): Promise<StoredNotification[]> => {
    try {
        const notifications = await getStoredNotifications();

        const updatedNotifications = notifications.map((notification) => {
            if (notification.id === notificationId) {
                return { ...notification, read: true };
            }
            return notification;
        });

        await AsyncStorage.setItem(
            NOTIFICATION_STORAGE_KEY,
            JSON.stringify(updatedNotifications)
        );

        return updatedNotifications;
    } catch (error) {
        console.error('Erreur lors du marquage de la notification comme lue:', error);
        return await getStoredNotifications();
    }
};

// Supprimer une notification
export const deleteNotification = async (
    notificationId: string
): Promise<StoredNotification[]> => {
    try {
        const notifications = await getStoredNotifications();

        const updatedNotifications = notifications.filter(
            (notification) => notification.id !== notificationId
        );

        await AsyncStorage.setItem(
            NOTIFICATION_STORAGE_KEY,
            JSON.stringify(updatedNotifications)
        );

        return updatedNotifications;
    } catch (error) {
        console.error('Erreur lors de la suppression de la notification:', error);
        return await getStoredNotifications();
    }
};

// Effacer toutes les notifications
export const clearAllNotifications = async (): Promise<void> => {
    try {
        await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify([]));
    } catch (error) {
        console.error('Erreur lors de la suppression de toutes les notifications:', error);
    }
};
