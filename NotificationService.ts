// NotificationService.ts
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { EventType } from '@notifee/react-native';
import { Platform, PermissionsAndroid } from 'react-native';

// Type pour la fonction de callback
type NotificationCallback = (message: FirebaseMessagingTypes.RemoteMessage) => void;

// Configurer le gestionnaire d'événements en arrière-plan pour Notifee
notifee.onBackgroundEvent(async ({ type, detail }) => {
    console.log('Notifee background event:', type, detail);

    if (type === EventType.PRESS) {
        console.log('Notification pressed in background:', detail.notification);
    }
});

// Configurer le canal Notifee
export async function setupNotifications() {
    await notifee.createChannel({
        id: 'default_channel',
        name: 'Notifications par défaut',
        importance: 4  // HIGH importance
    });
}

// Demander les permissions de notification
export async function requestUserPermission(): Promise<boolean> {
    // Pour Android 13+ (API level 33), il faut des permissions explicites
    if (Platform.OS === 'android' && Platform.Version >= 33) {
        try {
            const permissions = await PermissionsAndroid.requestMultiple([
                'android.permission.POST_NOTIFICATIONS',
            ]);

            if (permissions['android.permission.POST_NOTIFICATIONS'] !== PermissionsAndroid.RESULTS.GRANTED) {
                console.log('Notification permission denied on Android 13+');
                return false;
            }
        } catch (error) {
            console.error('Error requesting notification permissions:', error);
        }
    }

    const authStatus = await messaging().requestPermission();
    const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
        console.log('Authorization status:', authStatus);
        return true;
    }
    console.log('Permission refusée');
    return false;
}

// Obtenir et stocker le token FCM
export async function getFCMToken(): Promise<string | null> {
    try {
        // Vérifier si les permissions sont accordées
        const permissionGranted = await requestUserPermission();
        if (!permissionGranted) return null;

        // Obtenir le token FCM
        await messaging().registerDeviceForRemoteMessages();
        const token = await messaging().getToken();

        if (token) {
            console.log('FCM Token:', token);
            await AsyncStorage.setItem('fcmToken', token);
        }

        return token;
    } catch (error) {
        console.error('Error getting FCM token:', error);
        return null;
    }
}

// Afficher une notification
export async function displayNotification(title: string, body: string, data?: any) {
    try {
        const channelId = await notifee.createChannel({
            id: 'default_channel',
            name: 'Notifications par défaut',
            importance: 4
        });

        await notifee.displayNotification({
            title,
            body,
            data,
            android: {
                channelId,
                smallIcon: 'ic_launcher',
                importance: 4,
                pressAction: {
                    id: 'default',
                },
                sound: 'default',
                vibrationPattern: [300, 500],
            },
        });

        console.log('Notification displayed successfully');
    } catch (error) {
        console.error('Error displaying notification:', error);
    }
}

// Configurer les gestionnaires d'événements de notification
export function setupNotificationListeners(onNotificationReceived?: NotificationCallback): () => void {
    // Gestionnaire pour les messages en arrière-plan
    messaging().setBackgroundMessageHandler(async remoteMessage => {
        console.log('Message reçu en arrière-plan!', remoteMessage);

        // Afficher manuellement la notification seulement en arrière-plan
        if (remoteMessage.notification) {
            await displayNotification(
                remoteMessage.notification.title || "Notification",
                remoteMessage.notification.body || "",
                remoteMessage.data
            );
        }
    });

    // Gestionnaire pour les messages au premier plan
    const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
        console.log('Message reçu au premier plan!', remoteMessage);

        // Ne pas afficher de notification visuelle, juste traiter l'événement
        // (supprimez l'appel à displayNotification ici)

        if (onNotificationReceived) {
            onNotificationReceived(remoteMessage);
        }
    });

    // Gestionnaire pour quand l'app est ouverte depuis une notification
    messaging()
        .getInitialNotification()
        .then(remoteMessage => {
            if (remoteMessage) {
                console.log(
                    'Application ouverte depuis une notification (fermée):',
                    remoteMessage,
                );
            }
        });

    // Gestionnaire pour quand l'app est ramenée au premier plan depuis une notification
    const unsubscribeOnNotificationOpenedApp = messaging().onNotificationOpenedApp(
        remoteMessage => {
            console.log(
                'Application ouverte depuis une notification (arrière-plan):',
                remoteMessage,
            );
        },
    );

    // Fonction pour nettoyer les écouteurs
    return () => {
        unsubscribeOnMessage();
        unsubscribeOnNotificationOpenedApp();
    };
}
