import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

if (!isExpoGo) {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
        }),
    });
}

export async function registerForPushNotificationsAsync() {
    let token;

    if (isExpoGo) {
        console.log('Push notifications disabled in Expo Go. Use a development build.');
        return undefined;
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return undefined;
        }

        try {
            const projectId = 'b406e22c-aef6-4d1e-bd18-9fc3eceb0b8c'; // Fallback or retrieve from expo config if using EAS
            // For bare Expo Go without EAS or valid Expo Account, passing empty projectId or relying on defaults might be needed, 
            // but recent Expo requires projectId if eas.json exists. Assuming it works without if not on EAS.
            token = (await Notifications.getExpoPushTokenAsync({
                projectId,
            })).data;
        } catch (error) {
            console.log('Error fetching push token', error);
        }
    } else {
        console.log('Must use physical device for Push Notifications');
    }

    return token;
}
