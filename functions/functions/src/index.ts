// Импорты для v2 API
import { setGlobalOptions } from "firebase-functions/v2";
// ИСПРАВЛЕНО: 'Change' импортируется из основного модуля, а не из 'v2/database'
import { Change } from "firebase-functions";
import { onValueWritten, DatabaseEvent } from "firebase-functions/v2/database";
import { onSchedule, ScheduledEvent } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import * as functions from "firebase-functions";
// Firebase Admin SDK и другие зависимости
import * as admin from "firebase-admin";
import { DataSnapshot } from "firebase-admin/database";
import axios from "axios";

// Инициализация
admin.initializeApp();
const db = admin.database();

// Глобальные опции для v2
setGlobalOptions({ maxInstances: 10 });

// --- Интерфейс для полезной нагрузки задачи в очереди ---
interface ReminderPayload {
    salonId: string;
    appointmentId: string;
    customerPhone: string;
    customerName?: string;
    startAt: string;
    notificationTime: number; // Время отправки в виде timestamp (ms)
}

// --- Вспомогательные функции (без изменений) ---
async function sendSms(phoneNumber: string, message: string): Promise<void> {
    // Используем getFunctions().config() в v2, но для простоты оставим старый способ, он все еще работает
    const smsbyConfig = functions.config().smsby;
    if (!smsbyConfig || !smsbyConfig.token) {
        logger.error("SMS.by token not configured. Please run `firebase functions:config:set smsby.token=\"...\"`");
        throw new Error("SMS.by token is missing.");
    }
    const apiUrl = "https://app.sms.by/api/v1/sendQuickSms";
    const params = new URLSearchParams({
        token: smsbyConfig.token,
        message: message,
        phone: phoneNumber,
    });
    try {
        const response = await axios.post(`${apiUrl}?${params.toString()}`);
        logger.log(`SMS.by response for ${phoneNumber}:`, response.data);
        if (response.data && response.data.sms_id) {
            logger.log(`Successfully queued SMS with ID: ${response.data.sms_id}`);
        } else {
            throw new Error(`SMS.by API error: ${JSON.stringify(response.data)}`);
        }
    } catch (error) {
        const errorMessage = (error instanceof Error) ? error.message : "Unknown error";
        logger.error(`Error sending SMS to ${phoneNumber}:`, errorMessage);
        if (axios.isAxiosError(error) && error.response) {
            logger.error("SMS.by response data:", error.response.data);
        }
        throw error;
    }
}
async function scheduleReminderInDB(salonId: string, appointmentId: string, appointmentData: any, scheduleTime: Date) {
    const reminderId = `${salonId}_${appointmentId}`;
    const payload: ReminderPayload = {
        salonId,
        appointmentId,
        customerPhone: appointmentData.customerPhone,
        customerName: appointmentData.customerName,
        startAt: appointmentData.startAt,
        notificationTime: scheduleTime.getTime(),
    };
    try {
        await db.ref(`reminderQueue/${reminderId}`).set(payload);
        logger.log(`Reminder for ${reminderId} scheduled in DB for ${scheduleTime.toISOString()}`);
    } catch (error) {
        logger.error(`Error scheduling reminder in DB for ${reminderId}:`, error);
        throw error;
    }
}
async function cancelReminderInDB(salonId: string, appointmentId: string) {
    const reminderId = `${salonId}_${appointmentId}`;
    try {
        await db.ref(`reminderQueue/${reminderId}`).remove();
        logger.log(`Reminder ${reminderId} cancelled in DB.`);
    } catch (error) {
        logger.error(`Error cancelling reminder ${reminderId} in DB:`, error);
        throw error;
    }
}


/**
 * Триггер v2 на создание/обновление/удаление записи в Realtime Database.
 */
export const onappointmentwrite = onValueWritten(    {
    ref: "appointments/{salonId}/{appointmentId}",
    region: "asia-southeast1", 
}, async (event: DatabaseEvent<Change<DataSnapshot>>) => {
    const { salonId, appointmentId } = event.params;
    const appointmentAfter = event.data.after.val();

    if (!appointmentAfter) {
        logger.log(`Appointment ${salonId}/${appointmentId} deleted. Cancelling reminder.`);
        await cancelReminderInDB(salonId, appointmentId);
        return;
    }

    const ineligibleStatus = ["cancelled", "completed", "no_show"];
    if (ineligibleStatus.includes(appointmentAfter.status)) {
        logger.log(`Appointment ${salonId}/${appointmentId} status is ${appointmentAfter.status}. Cancelling reminder.`);
        await cancelReminderInDB(salonId, appointmentId);
        return;
    }

    const appointmentStart = new Date(appointmentAfter.startAt);
    const notificationTime = new Date(appointmentStart.getTime() - (60 * 1000))//(2 * 60 * 60 * 1000));  За 2 часа

    if (notificationTime < new Date() || !appointmentAfter.customerPhone) {
        logger.log(`Notification time for ${salonId}/${appointmentId} is in the past or phone is missing. Cancelling any existing reminder.`);
        await cancelReminderInDB(salonId, appointmentId);
        return;
    }

    logger.log(`Scheduling reminder for ${salonId}/${appointmentId} at ${notificationTime.toISOString()}`);
    await scheduleReminderInDB(salonId, appointmentId, appointmentAfter, notificationTime);
});

/**
 * Функция v2, запускаемая по расписанию.
 */
export const checkreminders = onSchedule("every 1 minutes", async (event: ScheduledEvent) => {
    logger.log("Running reminder check cron job...");

    const now = Date.now();
    const queueRef = db.ref("reminderQueue");

    try {
        const snapshot = await queueRef.orderByChild("notificationTime").endAt(now).once("value");

        if (!snapshot.exists()) {
            logger.log("No pending reminders to send.");
            return;
        }

        const remindersToSend: { [key: string]: ReminderPayload } = snapshot.val();
        const processingPromises: Promise<any>[] = [];

        for (const reminderId in remindersToSend) {
            const payload = remindersToSend[reminderId];
            const promise = processReminder(reminderId, payload);
            processingPromises.push(promise);
        }

        await Promise.all(processingPromises);
        logger.log("Finished processing reminders batch.");

    } catch (error) {
        logger.error("Error checking reminder queue:", error);
    }
});

/**
 * Обрабатывает одно напоминание.
 */
async function processReminder(reminderId: string, payload: ReminderPayload) {
    const { salonId, appointmentId, customerPhone, customerName } = payload;

    try {
        const snapshot = await db.ref(`appointments/${salonId}/${appointmentId}`).once("value");
        const currentAppointment = snapshot.val();

        if (!currentAppointment || ["cancelled", "completed", "no_show"].includes(currentAppointment.status)) {
            logger.log(`Appointment ${salonId}/${appointmentId} is no longer eligible. Removing from queue.`);
            // Просто удаляем из очереди, если запись неактуальна
            await db.ref(`reminderQueue/${reminderId}`).remove();
            return;
        }

        // --- КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: СНАЧАЛА УДАЛЯЕМ, ПОТОМ ОТПРАВЛЯЕМ ---
        
        // 1. Удаляем напоминание из очереди, чтобы предотвратить повторную обработку.
        await db.ref(`reminderQueue/${reminderId}`).remove();
        logger.log(`Reminder ${reminderId} removed from queue before sending SMS.`);

        // 2. Отправляем SMS.
        const startTime = new Date(currentAppointment.startAt);
        const formattedTime = startTime.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Minsk" });
        const formattedDate = startTime.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", timeZone: "Europe/Minsk" });
        const message = `Здравствуйте, ${customerName || "клиент"}! Напоминаем о вашей записи ${formattedDate} в ${formattedTime}.`;

        await sendSms(customerPhone, message);
        logger.log(`SMS reminder sent successfully for ${reminderId}!`);

    } catch (error) {
        // Если ошибка произошла после удаления, но до/во время отправки SMS,
        // мы логируем ее, но не пытаемся повторить, так как напоминание уже удалено.
        logger.error(`Failed to process reminder for ${reminderId}:`, error);
    }
}