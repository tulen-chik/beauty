"use client"

import { 
  AlertTriangle,
  Bell,
  CheckCircle, 
  Globe,
  Mail,
  Save,
  Settings, 
  Shield} from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { useUser } from "@/contexts/UserContext"

interface SystemSettings {
  general: {
    siteName: string
    siteDescription: string
    defaultLanguage: string
    timezone: string
    currency: string
    maintenanceMode: boolean
  }
  email: {
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPassword: string
    fromEmail: string
    fromName: string
  }
  security: {
    sessionTimeout: number
    passwordMinLength: number
    requireEmailVerification: boolean
    twoFactorAuth: boolean
    maxLoginAttempts: number
  }
  notifications: {
    emailNotifications: boolean
    pushNotifications: boolean
    smsNotifications: boolean
    adminNotifications: boolean
  }
  features: {
    userRegistration: boolean
    salonRegistration: boolean
    blogEnabled: boolean
    chatEnabled: boolean
    ratingsEnabled: boolean
    paymentsEnabled: boolean
  }
}

export default function AdminSettingsPage() {
  const t = useTranslations('admin')
  const { currentUser } = useUser()

  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      siteName: "Beauty Platform",
      siteDescription: "Платформа для салонов красоты",
      defaultLanguage: "ru",
      timezone: "Europe/Moscow",
      currency: "RUB",
      maintenanceMode: false
    },
    email: {
      smtpHost: "smtp.gmail.com",
      smtpPort: 587,
      smtpUser: "",
      smtpPassword: "",
      fromEmail: "noreply@beautyplatform.com",
      fromName: "Beauty Platform"
    },
    security: {
      sessionTimeout: 24,
      passwordMinLength: 8,
      requireEmailVerification: true,
      twoFactorAuth: false,
      maxLoginAttempts: 5
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      adminNotifications: true
    },
    features: {
      userRegistration: true,
      salonRegistration: true,
      blogEnabled: true,
      chatEnabled: true,
      ratingsEnabled: true,
      paymentsEnabled: false
    }
  })

  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')



  const tabs = [
    { id: 'general', name: 'Общие', icon: Globe },
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'security', name: 'Безопасность', icon: Shield },
    { id: 'notifications', name: 'Уведомления', icon: Bell },
    { id: 'features', name: 'Функции', icon: Settings }
  ]

  const handleSave = async () => {
    setSaving(true)
    setSaveStatus('idle')
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // In a real app, this would save to the database
      console.log('Saving settings:', settings)
      
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (section: keyof SystemSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }))
  }

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Название сайта
        </label>
        <input
          type="text"
          value={settings.general.siteName}
          onChange={(e) => updateSetting('general', 'siteName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Описание сайта
        </label>
        <textarea
          value={settings.general.siteDescription}
          onChange={(e) => updateSetting('general', 'siteDescription', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Язык по умолчанию
          </label>
          <select
            value={settings.general.defaultLanguage}
            onChange={(e) => updateSetting('general', 'defaultLanguage', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Часовой пояс
          </label>
          <select
            value={settings.general.timezone}
            onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Europe/Moscow">Москва (UTC+3)</option>
            <option value="Europe/London">Лондон (UTC+0)</option>
            <option value="America/New_York">Нью-Йорк (UTC-5)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Валюта
          </label>
          <select
            value={settings.general.currency}
            onChange={(e) => updateSetting('general', 'currency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="RUB">Рубль (₽)</option>
            <option value="USD">Доллар ($)</option>
            <option value="EUR">Евро (€)</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="maintenanceMode"
            checked={settings.general.maintenanceMode}
            onChange={(e) => updateSetting('general', 'maintenanceMode', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-900">
            Режим обслуживания
          </label>
        </div>
      </div>
    </div>
  )

  const renderEmailSettings = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Внимание
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Изменение настроек email может повлиять на отправку уведомлений пользователям.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SMTP хост
          </label>
          <input
            type="text"
            value={settings.email.smtpHost}
            onChange={(e) => updateSetting('email', 'smtpHost', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SMTP порт
          </label>
          <input
            type="number"
            value={settings.email.smtpPort}
            onChange={(e) => updateSetting('email', 'smtpPort', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SMTP пользователь
          </label>
          <input
            type="text"
            value={settings.email.smtpUser}
            onChange={(e) => updateSetting('email', 'smtpUser', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SMTP пароль
          </label>
          <input
            type="password"
            value={settings.email.smtpPassword}
            onChange={(e) => updateSetting('email', 'smtpPassword', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email отправителя
          </label>
          <input
            type="email"
            value={settings.email.fromEmail}
            onChange={(e) => updateSetting('email', 'fromEmail', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Имя отправителя
          </label>
          <input
            type="text"
            value={settings.email.fromName}
            onChange={(e) => updateSetting('email', 'fromName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  )

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Таймаут сессии (часы)
          </label>
          <input
            type="number"
            value={settings.security.sessionTimeout}
            onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Минимальная длина пароля
          </label>
          <input
            type="number"
            value={settings.security.passwordMinLength}
            onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Максимальное количество попыток входа
          </label>
          <input
            type="number"
            value={settings.security.maxLoginAttempts}
            onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="requireEmailVerification"
            checked={settings.security.requireEmailVerification}
            onChange={(e) => updateSetting('security', 'requireEmailVerification', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="requireEmailVerification" className="ml-2 block text-sm text-gray-900">
            Требовать подтверждение email при регистрации
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="twoFactorAuth"
            checked={settings.security.twoFactorAuth}
            onChange={(e) => updateSetting('security', 'twoFactorAuth', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="twoFactorAuth" className="ml-2 block text-sm text-gray-900">
            Включить двухфакторную аутентификацию
          </label>
        </div>
      </div>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="emailNotifications"
            checked={settings.notifications.emailNotifications}
            onChange={(e) => updateSetting('notifications', 'emailNotifications', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-900">
            Email уведомления
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="pushNotifications"
            checked={settings.notifications.pushNotifications}
            onChange={(e) => updateSetting('notifications', 'pushNotifications', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="pushNotifications" className="ml-2 block text-sm text-gray-900">
            Push уведомления
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="smsNotifications"
            checked={settings.notifications.smsNotifications}
            onChange={(e) => updateSetting('notifications', 'smsNotifications', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="smsNotifications" className="ml-2 block text-sm text-gray-900">
            SMS уведомления
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="adminNotifications"
            checked={settings.notifications.adminNotifications}
            onChange={(e) => updateSetting('notifications', 'adminNotifications', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="adminNotifications" className="ml-2 block text-sm text-gray-900">
            Уведомления администратора
          </label>
        </div>
      </div>
    </div>
  )

  const renderFeatureSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="userRegistration"
            checked={settings.features.userRegistration}
            onChange={(e) => updateSetting('features', 'userRegistration', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="userRegistration" className="ml-2 block text-sm text-gray-900">
            Регистрация пользователей
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="salonRegistration"
            checked={settings.features.salonRegistration}
            onChange={(e) => updateSetting('features', 'salonRegistration', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="salonRegistration" className="ml-2 block text-sm text-gray-900">
            Регистрация салонов
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="blogEnabled"
            checked={settings.features.blogEnabled}
            onChange={(e) => updateSetting('features', 'blogEnabled', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="blogEnabled" className="ml-2 block text-sm text-gray-900">
            Блог
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="chatEnabled"
            checked={settings.features.chatEnabled}
            onChange={(e) => updateSetting('features', 'chatEnabled', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="chatEnabled" className="ml-2 block text-sm text-gray-900">
            Чат
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="ratingsEnabled"
            checked={settings.features.ratingsEnabled}
            onChange={(e) => updateSetting('features', 'ratingsEnabled', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="ratingsEnabled" className="ml-2 block text-sm text-gray-900">
            Рейтинги и отзывы
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="paymentsEnabled"
            checked={settings.features.paymentsEnabled}
            onChange={(e) => updateSetting('features', 'paymentsEnabled', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="paymentsEnabled" className="ml-2 block text-sm text-gray-900">
            Платежи
          </label>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings()
      case 'email':
        return renderEmailSettings()
      case 'security':
        return renderSecuritySettings()
      case 'notifications':
        return renderNotificationSettings()
      case 'features':
        return renderFeatureSettings()
      default:
        return renderGeneralSettings()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Системные настройки</h1>
          <p className="text-gray-600 mt-1">Управление настройками системы и платформы</p>
        </div>

        <div className="bg-white rounded-lg shadow">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {renderTabContent()}
          </div>

          {/* Save Button */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {saveStatus === 'success' && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span className="text-sm">Настройки сохранены</span>
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="flex items-center text-red-600">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    <span className="text-sm">Ошибка при сохранении</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Сохранить настройки
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
