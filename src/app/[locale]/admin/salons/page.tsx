"use client"

import { 
  Building2, 
  Calendar,
  Eye, 
  Mail, 
  MapPin, 
  MoreVertical,
  Phone, 
  Search, 
  Settings,
  Trash2,
  X,
  XCircle} from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useEffect, useState, useCallback } from "react"

// --- Измененные импорты ---
import { useSalon } from "@/contexts/SalonContext"
import { useUser } from "@/contexts/UserContext"

import type { Salon } from "@/types/database"

export default function AdminSalonsPage() {
  const t = useTranslations('admin')
  const { currentUser } = useUser()
  
  // --- Использование нового контекста ---
  const { 
    fetchUserSalons,
    fetchSalon,
    deleteSalon, 
    loading, 
    error 
  } = useSalon()

  // --- Локальное состояние для хранения салонов ---
  const [adminSalons, setAdminSalons] = useState<Salon[]>([])

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null)
  const [showSalonModal, setShowSalonModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [suspendReason, setSuspendReason] = useState("")

  // --- Новая логика загрузки салонов ---
  const loadAdminSalons = useCallback(async () => {
    if (!currentUser?.userId) return;

    try {
      const userSalonsData = await fetchUserSalons(currentUser.userId);
      if (userSalonsData && userSalonsData.salons) {
        const salonPromises = userSalonsData.salons.map(s => fetchSalon(s.salonId));
        const fetchedSalons = await Promise.all(salonPromises);
        // Фильтруем null значения на случай, если салон был удален, но ссылка осталась
        setAdminSalons(fetchedSalons.filter((s): s is Salon => s !== null));
      }
    } catch (err) {
      console.error("Failed to load admin salons:", err);
      // Можно добавить обработку ошибок, например, показать уведомление
    }
  }, [currentUser, fetchUserSalons, fetchSalon]);

  useEffect(() => {
    loadAdminSalons()
  }, [loadAdminSalons])

  // --- Фильтрация по локальному состоянию adminSalons ---
  const filteredSalons = adminSalons.filter(salon => {
    const matchesSearch = salon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         salon.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (salon.settings?.business?.phone && salon.settings.business.phone.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // Логика для статуса может быть добавлена позже, если у салона появится поле status
    const matchesStatus = statusFilter === "all" 
    
    return matchesSearch && matchesStatus
  })

  // --- Обновленная функция удаления ---
  const handleDeleteSalon = async (salonId: string) => {
    try {
      await deleteSalon(salonId)
      // Обновляем локальное состояние для мгновенного отражения изменений
      setAdminSalons(prevSalons => prevSalons.filter(s => s.id !== salonId));
      setShowDeleteModal(false)
      setSelectedSalon(null)
    } catch (error) {
      console.error('Error deleting salon:', error)
      // Можно добавить обработку ошибок
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading && adminSalons.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-8 w-8 text-blue-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Загрузка салонов...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Управление салонами</h1>
          <p className="text-gray-600 mt-1">Просмотр и управление всеми салонами в системе</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск салонов..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Все статусы</option>
                <option value="active">Активные</option>
                <option value="inactive">Неактивные</option>
              </select>

              {/* Results count */}
              <div className="flex items-center text-sm text-gray-500">
                Найдено: {filteredSalons.length} салонов
              </div>
            </div>
          </div>
        </div>

        {/* Salons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSalons.map((salon) => (
            <div key={salon.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {salon.name}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="truncate">{salon.address}</span>
                    </div>
                  </div>
                  <div className="relative">
                    <button 
                      onClick={() => {
                        setSelectedSalon(salon);
                        setShowDeleteModal(true);
                      }}
                      className="text-gray-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  {salon.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{salon.phone}</span>
                    </div>
                  )}
                  {salon.settings?.business?.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      <span className="truncate">{salon.settings.business.email}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {salon.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {salon.description}
                  </p>
                )}

                {/* Created Date */}
                <div className="flex items-center text-xs text-gray-500 mb-4">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>Создан: {formatDate(salon.createdAt)}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedSalon(salon as Salon)
                        setShowSalonModal(true)
                      }}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      <Eye className="h-4 w-4 inline mr-1" />
                      Подробнее
                    </button>
                    <Link
                      href={`/admin/salons/${salon.id}`}
                      className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                    >
                      <Settings className="h-4 w-4 inline mr-1" />
                      Настройки
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredSalons.length === 0 && !loading && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Салоны не найдены</h3>
            <p className="text-gray-500">Попробуйте изменить параметры поиска или добавить новый салон.</p>
          </div>
        )}
      </div>

      {/* Salon Details Modal */}
      {showSalonModal && selectedSalon && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Информация о салоне</h3>
                <button
                  onClick={() => setShowSalonModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Название</label>
                  <p className="text-sm text-gray-900">{selectedSalon.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Адрес</label>
                  <p className="text-sm text-gray-900">{selectedSalon.address}</p>
                </div>

                {selectedSalon.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Телефон</label>
                    <p className="text-sm text-gray-900">{selectedSalon.phone}</p>
                  </div>
                )}

                {selectedSalon.settings?.business?.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900">{selectedSalon.settings.business.email}</p>
                  </div>
                )}

                {selectedSalon.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Описание</label>
                    <p className="text-sm text-gray-900">{selectedSalon.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Дата создания</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedSalon.createdAt)}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowSalonModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Закрыть
                </button>
                <Link
                  href={`/admin/salons/${selectedSalon.id}`}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Управление
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal (логика не реализована, но оставил для примера) */}
      {showSuspendModal && selectedSalon && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full mb-4">
                <XCircle className="h-6 w-6 text-yellow-600" />
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Приостановить салон
              </h3>
              <p className="text-sm text-gray-500 text-center mb-4">
                Вы уверены, что хотите приостановить работу салона <strong>{selectedSalon.name}</strong>?
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Причина приостановки
                </label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Укажите причину приостановки..."
                />
              </div>

              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => {
                    setShowSuspendModal(false)
                    setSuspendReason("")
                    setSelectedSalon(null)
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Отмена
                </button>
                
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSalon && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Удалить салон
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Вы уверены, что хотите удалить салон <strong>{selectedSalon.name}</strong>? 
                Это действие нельзя отменить.
              </p>

              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Отмена
                </button>
                <button
                  onClick={() => handleDeleteSalon(selectedSalon.id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                >
                  {loading ? 'Удаление...' : 'Удалить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}