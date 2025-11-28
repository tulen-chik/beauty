import type { Firestore, Transaction } from '@google-cloud/firestore';

// --- Валидация и санитизация ---
export const validateId = (id: string, fieldName: string): void => {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new Error(`Неверный ${fieldName}: значение не может быть пустым`);
  }
  if (id.length > 128) {
    throw new Error(`Неверный ${fieldName}: значение слишком длинное`);
  }
  if (/[<>\\"'&]/.test(id)) {
    throw new Error(`Неверный ${fieldName}: содержит недопустимые символы`);
  }
};

export const validateString = (
  value: string | undefined,
  fieldName: string,
  maxLength = 500
): string | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') {
    throw new Error(`Неверный ${fieldName}: должно быть строкой`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new Error(`Неверный ${fieldName}: превышена максимальная длина (${maxLength} символов)`);
  }
  return trimmed;
};

export const validatePhone = (phone: string | undefined): string | undefined => {
  if (!phone) return undefined;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 10 || cleaned.length > 15) {
    throw new Error('Неверный формат телефона');
  }
  return phone.trim();
};

export const validateDate = (dateStr: string, fieldName: string, allowPast = false): Date => {
  if (!dateStr || typeof dateStr !== 'string') {
    throw new Error(`Неверный ${fieldName}: должна быть строкой ISO`);
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Неверный ${fieldName}: недопустимая дата`);
  }
  if (!allowPast && date < new Date()) {
    throw new Error(`Неверный ${fieldName}: дата не может быть в прошлом`);
  }
  return date;
};

export const validateDuration = (minutes: number): void => {
  if (typeof minutes !== 'number' || !Number.isInteger(minutes) || minutes <= 0) {
    throw new Error('Длительность должна быть положительным целым числом');
  }
  if (minutes > 1440) {
    throw new Error('Длительность не может превышать 24 часа');
  }
};

// --- Проверка существования сущностей ---
export const createAppointmentDbGuards = (getDb: () => Firestore) => {
  const checkSalonExists = async (salonId: string, tx?: Transaction): Promise<void> => {
    const salonRef = getDb().collection('salons').doc(salonId);
    const salonSnap = tx ? await tx.get(salonRef) : await salonRef.get();
    if (!salonSnap.exists) {
      throw new Error('Салон не найден');
    }
  };

  const checkServiceExists = async (salonId: string, serviceId: string, tx?: Transaction): Promise<void> => {
    const serviceRef = getDb().collection('salonServices').doc(serviceId);
    const serviceSnap = tx ? await tx.get(serviceRef) : await serviceRef.get();
    if (!serviceSnap.exists) {
      throw new Error('Услуга не найдена');
    }
    const service = serviceSnap.data() as { salonId?: string };
    if (service.salonId !== salonId) {
      throw new Error('Услуга не принадлежит указанному салону');
    }
  };

  const checkEmployeeExists = async (salonId: string, employeeId: string, tx?: Transaction): Promise<void> => {
    const salonRef = getDb().collection('salons').doc(salonId);
    const salonSnap = tx ? await tx.get(salonRef) : await salonRef.get();
    if (!salonSnap.exists) {
      throw new Error('Салон не найден');
    }
    const salon = salonSnap.data() as { members?: Array<{ userId: string }> };
    const isMember = salon.members?.some((m) => m.userId === employeeId);
    if (!isMember) {
      throw new Error('Сотрудник не найден в салоне');
    }
  };

  return { checkSalonExists, checkServiceExists, checkEmployeeExists };
};

// --- Безопасная обработка ошибок ---
export const handleError = (error: unknown, defaultMessage: string): Error => {
  if (error instanceof Error) {
    if (error.message.includes('permission') || error.message.includes('PERMISSION_DENIED')) {
      return new Error('Недостаточно прав для выполнения операции');
    }
    if (error.message.includes('not found') || error.message.includes('NOT_FOUND')) {
      return new Error('Запись не найдена');
    }
    if (error.message.includes('parse') || error.message.includes('validation')) {
      return error;
    }
    console.error('[appointmentGuards] Error:', error);
    return new Error(defaultMessage);
  }
  console.error('[appointmentGuards] Unknown error:', error);
  return new Error(defaultMessage);
};

