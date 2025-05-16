import { Expo } from "expo-server-sdk";

const expo = new Expo();

async function sendPushNotification(
  expoPushToken,
  message,
  title = "Ride Update"
) {
  if (!Expo.isExpoPushToken(expoPushToken)) {
    console.error("Invalid Expo push token:", expoPushToken);
    return;
  }
  const messages = [
    {
      to: expoPushToken,
      sound: "default",
      title,
      body: message,
    },
  ];
  const chunks = expo.chunkPushNotifications(messages);
  for (let chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (err) {
      console.error("Error sending push notification:", err);
    }
  }
}

module.exports = { sendPushNotification };
