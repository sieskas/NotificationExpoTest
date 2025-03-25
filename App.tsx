import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { getFCMToken, setupNotificationListeners, setupNotifications } from './NotificationService';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import {
    StoredNotification,
    convertToStoredNotification,
    getStoredNotifications,
    addNotification,
    markNotificationAsRead,
    deleteNotification,
    clearAllNotifications
} from './NotificationStorage';

const App = () => {
    const [fcmToken, setFcmToken] = useState<string>('');
    const [notifications, setNotifications] = useState<StoredNotification[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // Charger les notifications sauvegardées
    const loadStoredNotifications = async () => {
        setLoading(true);
        const storedNotifications = await getStoredNotifications();
        setNotifications(storedNotifications);
        setLoading(false);
    };

    // Ajouter une notification à la liste
    const handleNewNotification = async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        const storedNotification = convertToStoredNotification(remoteMessage);
        const updatedNotifications = await addNotification(storedNotification);
        setNotifications(updatedNotifications);

        // Afficher une alerte pour les notifications reçues au premier plan
        Alert.alert(
            storedNotification.title,
            storedNotification.body,
        );
    };

    // Marquer une notification comme lue
    const handleNotificationPress = async (notificationId: string) => {
        const updatedNotifications = await markNotificationAsRead(notificationId);
        setNotifications(updatedNotifications);
    };

    // Supprimer une notification
    const handleNotificationDelete = async (notificationId: string) => {
        const updatedNotifications = await deleteNotification(notificationId);
        setNotifications(updatedNotifications);
    };

    // Effacer toutes les notifications
    const handleClearAll = async () => {
        await clearAllNotifications();
        setNotifications([]);
    };

    useEffect(() => {
        // Initialiser le canal de notification
        setupNotifications();

        // Charger les notifications existantes
        loadStoredNotifications();

        // Obtenir le token FCM
        const getToken = async () => {
            const token = await getFCMToken();
            if (token) setFcmToken(token);
        };
        getToken();

        // Configurer les écouteurs de notification
        const unsubscribe = setupNotificationListeners((remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
            // Traiter la notification reçue au premier plan
            handleNewNotification(remoteMessage);
        });

        // Écouteur pour les notifications qui ont ouvert l'app
        const checkInitialNotification = async () => {
            const remoteMessage = await messaging().getInitialNotification();
            if (remoteMessage) {
                console.log('App ouverte par une notification:', remoteMessage);
                handleNewNotification(remoteMessage);
            }
        };

        checkInitialNotification();

        // Écouteur pour quand l'app est ouverte depuis une notification en arrière-plan
        const unsubscribeOpenedApp = messaging().onNotificationOpenedApp(remoteMessage => {
            console.log('App ouverte depuis arrière-plan:', remoteMessage);
            handleNewNotification(remoteMessage);
        });

        // Nettoyer les écouteurs lors du démontage
        return () => {
            unsubscribe();
            unsubscribeOpenedApp();
        };
    }, []);

    // Formatage de la date/heure pour affichage
    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString() + ' ' + date.toLocaleDateString();
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Test Notifications Firebase</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Token FCM:</Text>
                <ScrollView style={styles.tokenContainer}>
                    <Text style={styles.tokenText} selectable={true}>
                        {fcmToken || 'Chargement...'}
                    </Text>
                </ScrollView>
            </View>

            <View style={styles.logSection}>
                <View style={styles.headerRow}>
                    <Text style={styles.sectionTitle}>Notifications:</Text>
                    {notifications.length > 0 && (
                        <TouchableOpacity onPress={handleClearAll}>
                            <Text style={styles.clearButton}>Effacer tout</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <ScrollView style={styles.logContainer}>
                    {loading ? (
                        <Text style={styles.emptyLog}>Chargement des notifications...</Text>
                    ) : notifications.length === 0 ? (
                        <Text style={styles.emptyLog}>
                            Aucune notification reçue pour l'instant
                        </Text>
                    ) : (
                        notifications.map((notification) => (
                            <TouchableOpacity
                                key={notification.id}
                                style={[
                                    styles.notificationItem,
                                    notification.read ? styles.readNotification : styles.unreadNotification
                                ]}
                                onPress={() => handleNotificationPress(notification.id)}
                            >
                                <View style={styles.notificationContent}>
                                    <Text style={styles.notificationTitle}>
                                        {notification.title}
                                    </Text>
                                    <Text style={styles.notificationBody}>
                                        {notification.body}
                                    </Text>
                                    <Text style={styles.notificationTime}>
                                        {formatTimestamp(notification.timestamp)}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => handleNotificationDelete(notification.id)}
                                >
                                    <Text style={styles.deleteButtonText}>×</Text>
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            </View>

            <Text style={styles.instruction}>
                Utilisez le token ci-dessus pour envoyer une notification
                depuis votre backend ou la console Firebase.
            </Text>
        </SafeAreaView>
    );
};

// Définition des styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        marginTop: 40,
        textAlign: 'center',
    },
    section: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    tokenContainer: {
        maxHeight: 80,
    },
    tokenText: {
        fontSize: 12,
        fontFamily: 'monospace',
        padding: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 4,
    },
    logSection: {
        flex: 1,
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    clearButton: {
        color: '#ff6347',
        fontSize: 14,
        fontWeight: '500',
    },
    logContainer: {
        flex: 1,
    },
    emptyLog: {
        fontStyle: 'italic',
        color: '#888',
        textAlign: 'center',
        marginTop: 20,
    },
    notificationItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 6,
        marginBottom: 8,
        borderLeftWidth: 4,
    },
    unreadNotification: {
        backgroundColor: '#e6f7ff',
        borderLeftColor: '#1890ff',
    },
    readNotification: {
        backgroundColor: '#f9f9f9',
        borderLeftColor: '#d9d9d9',
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    notificationBody: {
        fontSize: 14,
        marginBottom: 4,
    },
    notificationTime: {
        fontSize: 12,
        color: '#888',
    },
    deleteButton: {
        height: 24,
        width: 24,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    deleteButtonText: {
        fontSize: 16,
        color: '#888',
        fontWeight: 'bold',
    },
    instruction: {
        fontSize: 14,
        color: '#555',
        textAlign: 'center',
        marginBottom: 16,
    },
});

export default App;
