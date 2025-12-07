export interface EmailTemplateData {
  salonId?: string;
  customerName?: string;
  customerUserId?: string;
  appointmentId?: string;
  serviceId?: string;
  timeStr?: string;
  notes?: string;
  employeeId?: string;
}

// Шаблон для новой записи в расписании
export const appointmentCreatedTemplate = (data: EmailTemplateData) => ({
  subject: 'Новая запись в расписании',
  html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
      <div style="background: rgba(255,255,255,0.95); padding: 40px 30px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
            </svg>
          </div>
          <h1 style="color: #333; margin: 0; font-size: 24px; font-weight: 600;">Новая запись в расписании</h1>
        </div>
        
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <div style="width: 40px; height: 40px; background: #e3f2fd; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1976d2">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
              </svg>
            </div>
            <div>
              <p style="margin: 0; color: #666; font-size: 14px;">Время записи</p>
              <p style="margin: 0; color: #333; font-size: 16px; font-weight: 600;">${data.timeStr}</p>
            </div>
          </div>
          
          ${data.customerName ? `
          <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <div style="width: 40px; height: 40px; background: #f3e5f5; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#7b1fa2">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <div>
              <p style="margin: 0; color: #666; font-size: 14px;">Клиент</p>
              <p style="margin: 0; color: #333; font-size: 16px; font-weight: 600;">${data.customerName}</p>
            </div>
          </div>
          ` : ''}
          
          ${data.notes ? `
          <div style="display: flex; align-items: flex-start;">
            <div style="width: 40px; height: 40px; background: #fff3e0; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 15px; flex-shrink: 0;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#f57c00">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </div>
            <div>
              <p style="margin: 0; color: #666; font-size: 14px;">Заметки</p>
              <p style="margin: 0; color: #333; font-size: 16px; line-height: 1.5;">${data.notes}</p>
            </div>
          </div>
          ` : ''}
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="margin: 0; color: #666; font-size: 14px;">С уважением, команда салона красоты</p>
        </div>
      </div>
    </div>
  `,
  text: `Новая запись. Время: ${data.timeStr}`
});

// Шаблон для нового чата, созданного салоном
export const chatCreatedBySalonTemplate = (data: EmailTemplateData) => ({
  subject: 'Новый чат в салоне красоты',
  html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%); border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
      <div style="background: rgba(255,255,255,0.95); padding: 40px 30px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
          </div>
          <h1 style="color: #333; margin: 0; font-size: 24px; font-weight: 600;">Новый чат в салоне красоты</h1>
        </div>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <p style="margin: 0 0 20px 0; color: #666; font-size: 16px; line-height: 1.6;">Здравствуйте, <strong style="color: #ff6b6b;">${data.customerName}</strong>!</p>
          <p style="margin: 0 0 20px 0; color: #666; font-size: 16px; line-height: 1.6;">Для вас создан новый чат в салоне красоты.</p>
          <p style="margin: 0 0 30px 0; color: #666; font-size: 16px; line-height: 1.6;">Вы можете начать общение с сотрудниками салона прямо сейчас.</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%); border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 30px;">
          <div style="display: inline-flex; align-items: center; justify-content: center; background: white; border-radius: 6px; padding: 12px 24px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#ff6b6b" style="margin-right: 8px;">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
            <span style="color: #333; font-weight: 600; font-size: 16px;">Начать чат</span>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="margin: 0; color: #666; font-size: 14px;">С уважением, команда салона красоты</p>
        </div>
      </div>
    </div>
  `,
  text: `Здравствуйте, ${data.customerName}! Для вас создан новый чат в салоне красоты.`
});

// Шаблон для нового чата, созданного клиентом
export const chatCreatedByCustomerTemplate = (data: EmailTemplateData) => ({
  subject: 'Новый чат с клиентом',
  html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
      <div style="background: rgba(255,255,255,0.95); padding: 40px 30px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h1 style="color: #333; margin: 0; font-size: 24px; font-weight: 600;">Новый чат с клиентом</h1>
        </div>
        
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <div style="width: 40px; height: 40px; background: #e3f2fd; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1976d2">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <div>
              <p style="margin: 0; color: #666; font-size: 14px;">Клиент</p>
              <p style="margin: 0; color: #333; font-size: 16px; font-weight: 600;">${data.customerName}</p>
            </div>
          </div>
          
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin-top: 20px;">
            <div style="display: flex; align-items: center;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#ff9800" style="margin-right: 10px; flex-shrink: 0;">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
              </svg>
              <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">Клиент готов к общению. Пожалуйста, ответьте как можно скорее.</p>
            </div>
          </div>
        </div>
        
        ${(data.appointmentId || data.serviceId) ? `
        <div style="background: #f0f7ff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 0 0 15px 0; color: #666; font-size: 14px; font-weight: 600;">Детали записи:</p>
          ${data.appointmentId ? `<div style="display: flex; justify-content: space-between; margin-bottom: 10px;"><span style="color: #666; font-size: 14px;">ID записи:</span><span style="color: #333; font-weight: 600;">${data.appointmentId}</span></div>` : ''}
          ${data.serviceId ? `<div style="display: flex; justify-content: space-between;"><span style="color: #666; font-size: 14px;">ID услуги:</span><span style="color: #333; font-weight: 600;">${data.serviceId}</span></div>` : ''}
        </div>
        ` : ''}
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="margin: 0; color: #666; font-size: 14px;">С уважением, команда салона красоты</p>
        </div>
      </div>
    </div>
  `,
  text: `Новый чат создан клиентом ${data.customerName}. Пожалуйста, ответьте.`
});

// Универсальная функция для получения шаблона
export const getEmailTemplate = (type: 'appointment_created' | 'chat_created_by_salon' | 'chat_created_by_customer', data: EmailTemplateData) => {
  switch (type) {
    case 'appointment_created':
      return appointmentCreatedTemplate(data);
    case 'chat_created_by_salon':
      return chatCreatedBySalonTemplate(data);
    case 'chat_created_by_customer':
      return chatCreatedByCustomerTemplate(data);
    default:
      throw new Error(`Unknown email template type: ${type}`);
  }
};
