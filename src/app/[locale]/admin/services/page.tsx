"use client"

import { 
  Building2,
  CheckCircle,
  Clock,
  DollarSign, 
  Eye, 
  MoreVertical,
  Plus, 
  Scissors, 
  Search,
  Trash2, 
  X,
  XCircle} from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

import { useAdmin } from "@/contexts/AdminContext"
import { useUser } from "@/contexts/UserContext"

export default function AdminServicesPage() {
  const t = useTranslations('admin')
  const { currentUser } = useUser()
  const { 
    services, 
    loadServices, 
    updateService, 
    deleteService, 
    loading, 
    error 
  } = useAdmin()

  const [searchTerm, setSearchTerm] = useState("")
  const [salonFilter, setSalonFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedService, setSelectedService] = useState<any>(null)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    loadServices()
  }, [loadServices])



  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesSalon = salonFilter === "all" || service.salonId === salonFilter
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && service.isActive) ||
                         (statusFilter === "inactive" && !service.isActive)
    
    return matchesSearch && matchesSalon && matchesStatus
  })

  const handleToggleServiceStatus = async (serviceId: string, isActive: boolean) => {
    try {
      await updateService(serviceId, { isActive: !isActive })
    } catch (error) {
      console.error('Error updating service:', error)
    }
  }

  const handleDeleteService = async (serviceId: string) => {
    try {
      await deleteService(serviceId)
      setShowDeleteModal(false)
      setSelectedService(null)
    } catch (error) {
      console.error('Error deleting service:', error)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(price)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}ч ${mins}м`
    }
    return `${mins}м`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Scissors className="h-8 w-8 text-blue-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Загрузка услуг...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Управление услугами</h1>
            <p className="text-gray-600 mt-1">Просмотр и управление всеми услугами в системе</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Добавить услугу
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск услуг..."
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
                Найдено: {filteredServices.length} услуг
              </div>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div key={service.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {service.name}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <Building2 className="h-4 w-4 mr-1" />
                      <span className="truncate">Салон ID: {service.salonId}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      service.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {service.isActive ? 'Активна' : 'Неактивна'}
                    </span>
                    <div className="relative">
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {service.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {service.description}
                  </p>
                )}

                {/* Service Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span>Цена</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {formatPrice(service.price)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>Длительность</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {formatDuration(service.durationMinutes)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedService(service)
                        setShowServiceModal(true)
                      }}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      <Eye className="h-4 w-4 inline mr-1" />
                      Подробнее
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleToggleServiceStatus(service.id, service.isActive)}
                      className={`p-1 rounded ${
                        service.isActive 
                          ? 'text-red-600 hover:bg-red-50' 
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={service.isActive ? 'Деактивировать' : 'Активировать'}
                    >
                      {service.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedService(service)
                        setShowDeleteModal(true)
                      }}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Удалить"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Услуги не найдены</h3>
            <p className="text-gray-500">Попробуйте изменить параметры поиска</p>
          </div>
        )}
      </div>

      {/* Service Details Modal */}
      {showServiceModal && selectedService && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Информация об услуге</h3>
                <button
                  onClick={() => setShowServiceModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Название</label>
                  <p className="text-sm text-gray-900">{selectedService.name}</p>
                </div>

                {selectedService.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Описание</label>
                    <p className="text-sm text-gray-900">{selectedService.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Цена</label>
                    <p className="text-sm text-gray-900">{formatPrice(selectedService.price)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Длительность</label>
                    <p className="text-sm text-gray-900">{formatDuration(selectedService.durationMinutes)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Салон ID</label>
                    <p className="text-sm text-gray-900">{selectedService.salonId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Статус</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedService.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedService.isActive ? 'Активна' : 'Неактивна'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowServiceModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedService && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Удалить услугу
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Вы уверены, что хотите удалить услугу <strong>{selectedService.name}</strong>? 
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
                  onClick={() => handleDeleteService(selectedService.id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
