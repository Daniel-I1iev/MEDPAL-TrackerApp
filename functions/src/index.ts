import { onDocumentCreated, onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
admin.initializeApp();

// Ново лекарство
export const notifyNewMedication = onDocumentCreated("medications/{medicationId}", async (event) => {
  const data = event.data?.data();
  if (!data) return;
  const patientId = data.patientId;
  const userDoc = await admin.firestore().doc(`users/${patientId}`).get();
  const fcmToken = userDoc.get("fcmToken");
  if (fcmToken) {
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: "Ново лекарство",
        body: "Добавено е ново лекарство за прием.",
      },
    });
  }
  await admin.firestore().collection(`patients/${patientId}/notifications`).add({
    type: "newMedication",
    title: "Ново лекарство",
    body: "Добавено е ново лекарство за прием.",
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    read: false,
  });
});

// Готови лабораторни изследвания
export const notifyLabResultsReady = onDocumentWritten("lab-results/{resultId}", async (event) => {
  const beforeData = event.data?.before.data();
  const afterData = event.data?.after.data();

  // Ако документът е изтрит или статусът не е "готово" в новите данни, не прави нищо
  if (!afterData || afterData.status !== "готово") {
    console.log("Lab result not ready or document deleted for resultId:", event.params.resultId);
    return;
  }

  // Ако статусът вече е бил "готово" преди тази промяна, не прави нищо (за да се избегне повторно известяване)
  if (beforeData && beforeData.status === "готово") {
    console.log("Lab result was already ready for resultId:", event.params.resultId);
    return;
  }

  const patientId = afterData.patientId;
  if (!patientId) {
    console.error("Patient ID missing in lab result data for resultId:", event.params.resultId, afterData);
    return;
  }

  const userDoc = await admin.firestore().doc(`users/${patientId}`).get();
  const fcmToken = userDoc.get("fcmToken");

  const notificationPayload = {
    title: "Готови изследвания",
    body: "Вашите лабораторни изследвания са готови.",
  };

  if (fcmToken) {
    try {
      await admin.messaging().send({
        token: fcmToken,
        notification: notificationPayload,
      });
      console.log("Push notification sent for ready lab results to:", fcmToken, "for patient:", patientId);
    } catch (error) {
      console.error("Error sending push notification for ready lab results to patient:", patientId, error);
    }
  }

  try {
    await admin.firestore().collection(`patients/${patientId}/notifications`).add({
      type: "labResultsReady",
      title: notificationPayload.title,
      body: notificationPayload.body,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
    });
    console.log("In-app notification created for ready lab results for patient:", patientId);
  } catch (error) {
    console.error("Error creating in-app notification for ready lab results for patient:", patientId, error);
  }
});

// Ново съобщение от лекар
export const notifyDoctorMessage = onDocumentCreated("chats/{chatId}/messages/{messageId}", async (event) => {
  const data = event.data?.data();
  if (!data || data.from !== "doctor") return;
  const patientId = data.patientId;
  const userDoc = await admin.firestore().doc(`users/${patientId}`).get();
  const fcmToken = userDoc.get("fcmToken");
  if (fcmToken) {
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: "Съобщение от лекар",
        body: data.text || "Имате ново съобщение от вашия лекар.",
      },
    });
  }
  await admin.firestore().collection(`patients/${patientId}/notifications`).add({
    type: "doctorMessage",
    title: "Съобщение от лекар",
    body: data.text || "Имате ново съобщение от вашия лекар.",
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    read: false,
  });
});