"use client"

import { User } from "lucide-react"

type BookingFormProps = {
  employeeId: string
  customerName: string
  customerPhone: string
  notes: string
  employees: any[]
  employeeNames: Record<string, string>
  currentUser: any
  formErrors: Record<string, string>
  t: any
  onEmployeeChange: (value: string) => void
  onCustomerNameChange: (value: string) => void
  onCustomerPhoneChange: (value: string) => void
  onNotesChange: (value: string) => void
  onClearError: (field: string) => void
}

export default function BookingForm({
  employeeId,
  customerName,
  customerPhone,
  notes,
  employees,
  employeeNames,
  currentUser,
  formErrors,
  t,
  onEmployeeChange,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onNotesChange,
  onClearError
}: BookingFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('fields.staffLabel')}</label>
          <div className="relative">
            <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={employeeId}
              onChange={(e) => onEmployeeChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-rose-500 focus:border-rose-500"
            >
              <option value="">{t('fields.staffAny')}</option>
              {employees.map((m: { userId: string }) => (
                <option key={m.userId} value={m.userId}>
                  {employeeNames[m.userId] || m.userId}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('fields.customerNameLabel')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => {
              onCustomerNameChange(e.target.value);
              if (formErrors.customerName) {
                onClearError('customerName');
              }
            }}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-rose-500 focus:border-rose-500 ${formErrors.customerName ? 'border-red-500' : 'border-gray-300'}`}
            placeholder={t('fields.customerNamePlaceholder')}
            required
          />
          {formErrors.customerName ? (
            <p className="mt-1 text-xs text-red-600">{formErrors.customerName}</p>
          ) : currentUser ? (
            <p className="mt-1 text-xs text-green-600">{t('fields.autofillMessage')}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {"+375 (29) 123-45-67"} <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={customerPhone}
            onChange={(e) => {
              onCustomerPhoneChange(e.target.value);
              if (formErrors.customerPhone) {
                onClearError('customerPhone');
              }
            }}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-rose-500 focus:border-rose-500 ${formErrors.customerPhone ? 'border-red-500' : 'border-gray-300'}`}
            placeholder={t('fields.customerPhonePlaceholder')}
            required
          />
          {formErrors.customerPhone && <p className="mt-1 text-xs text-red-600">{formErrors.customerPhone}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('fields.notesLabel')}</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-rose-500 focus:border-rose-500"
            placeholder={t('fields.notesPlaceholder')}
          />
        </div>
      </div>
    </div>
  )
}
