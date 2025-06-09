import { useEffect, useState } from 'react';
import { messaging, getToken, onMessage } from '@/config/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

const VAPID_KEY = '<BIR-XpzTwTbCmcBHzleN-y2268sMH_Sl0KOya2JV7VjbOeh0Fgm1JEXbrPhlzxZLJ6cLoSkE4WH9DVLlcelocTw>'; // Replace with your FCM Web Push certificate key

export function useNotifications(currentUserId?: string) {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState(Notification.permission);
  const [message, setMessage] = useState<any>(null);

  useEffect(() => {
    if (!currentUserId) return;
    if (permission === 'granted') {
      getToken(messaging, { vapidKey: VAPID_KEY })
        .then(async (currentToken) => {
          if (currentToken) {
            setToken(currentToken);
            // Запиши токена във Firestore за този потребител
            await setDoc(doc(db, 'users', currentUserId), { fcmToken: currentToken }, { merge: true });
          }
        })
        .catch((err) => {
          console.error('An error occurred while retrieving token. ', err);
        });
    }
  }, [permission, currentUserId]);

  useEffect(() => {
    if (permission !== 'granted') return;
    const unsubscribe = onMessage(messaging, (payload) => {
      setMessage(payload);
    });
    return unsubscribe;
  }, [permission]);

  const requestPermission = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  return { token, permission, requestPermission, message };
}
