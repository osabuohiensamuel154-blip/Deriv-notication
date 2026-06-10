import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) return false;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('price-alerts', {
        name: 'Price Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
        sound: 'default',
      });
    }

    return finalStatus === 'granted';
  },

  async sendPriceAlert(
    instrumentName: string,
    condition: 'above' | 'below',
    targetPrice: number,
    currentPrice: number
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Price Alert: ${instrumentName}`,
        body: `${instrumentName} is now ${condition === 'above' ? 'above' : 'below'} ${targetPrice.toFixed(5)} — Current: ${currentPrice.toFixed(5)}`,
        sound: 'default',
        data: { instrumentName, condition, targetPrice, currentPrice },
        ...(Platform.OS === 'android' && { channelId: 'price-alerts' }),
      },
      trigger: null,
    });
  },
};
