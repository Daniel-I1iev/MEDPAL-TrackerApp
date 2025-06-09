"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyDoctorMessage = exports.notifyLabResultsReady = exports.notifyNewMedication = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
// Ново лекарство
exports.notifyNewMedication = (0, firestore_1.onDocumentCreated)("medications/{medicationId}", async (event) => {
    var _a;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!data)
        return;
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
exports.notifyLabResultsReady = (0, firestore_1.onDocumentWritten)("lab-results/{resultId}", async (event) => {
    var _a, _b;
    const beforeData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const afterData = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
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
        }
        catch (error) {
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
    }
    catch (error) {
        console.error("Error creating in-app notification for ready lab results for patient:", patientId, error);
    }
});
// Ново съобщение от лекар
exports.notifyDoctorMessage = (0, firestore_1.onDocumentCreated)("chats/{chatId}/messages/{messageId}", async (event) => {
    var _a;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!data || data.from !== "doctor")
        return;
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
//# sourceMappingURL=index.js.map