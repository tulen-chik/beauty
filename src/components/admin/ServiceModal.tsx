'use client'

import { AlignLeft,Clock, DollarSign, Tag, X } from 'lucide-react'
import { useEffect,useState } from 'react'

import type { SalonService } from '@/types/services'

interface ServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (service: SalonService) => void
  service: SalonService | null
  salonId: string
}

export default function ServiceModal({ isOpen, onClose, onSave, service, salonId }: ServiceModalProps) {
  const [formData, setFormData] = useState<Partial<SalonService>>({
    name: '',
    description: '',
    price: 0,
    durationMinutes: 30,
    isActive: true,
    isApp: true,
    salonId,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (service) {
      setFormData({
        ...service,
        salonId: service.salonId || salonId,
      })
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        durationMinutes: 30,
        isActive: true,
        isApp: true,
        salonId,
      })
    }
  }, [service, salonId])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Название обязательно'
    }
    
    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Укажите корректную цену'
    }
    
    if (!formData.durationMinutes || formData.durationMinutes <= 0) {
      newErrors.durationMinutes = 'Укажите корректную продолжительность'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return
    
    const serviceData: SalonService = {
      id: service?.id || crypto.randomUUID(),
      name: formData.name!,
      description: formData.description,
      price: formData.price!,
      durationMinutes: formData.durationMinutes!,
      isActive: formData.isActive!,
      isApp: formData.isApp!,
      salonId: formData.salonId!,
      categoryIds: formData.categoryIds || [],
      createdAt: service?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    onSave(serviceData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: checked,
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          onClick={onClose}
          aria-hidden="true"
        />

        <div 
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {service ? 'Редактировать услугу' : 'Добавить новую услугу'}
                  </h3>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Название услуги <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Tag className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={formData.name || ''}
                        onChange={handleChange}
                        className={`block w-full pl-10 pr-3 py-2 border ${errors.name ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                        placeholder="Например: Стрижка"
                      />
                    </div>
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Описание
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute top-2 left-0 pl-3 pointer-events-none">
                        <AlignLeft className="h-5 w-5 text-gray-400" />
                      </div>
                      <textarea
                        name="description"
                        id="description"
                        rows={3}
                        value={formData.description || ''}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Подробное описание услуги"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                        Цена, ₽ <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <DollarSign className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          name="price"
                          id="price"
                          min="0"
                          step="0.01"
                          value={formData.price || ''}
                          onChange={handleChange}
                          className={`block w-full pl-10 pr-3 py-2 border ${errors.price ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                          placeholder="0.00"
                        />
                      </div>
                      {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                    </div>

                    <div>
                      <label htmlFor="durationMinutes" className="block text-sm font-medium text-gray-700">
                        Продолжительность <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Clock className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          name="durationMinutes"
                          id="durationMinutes"
                          value={formData.durationMinutes || 30}
                          onChange={handleChange}
                          className={`block w-full pl-10 pr-3 py-2 border ${errors.durationMinutes ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                        >
                          <option value="15">15 минут</option>
                          <option value="30">30 минут</option>
                          <option value="45">45 минут</option>
                          <option value="60">1 час</option>
                          <option value="90">1 час 30 минут</option>
                          <option value="120">2 часа</option>
                          <option value="150">2 часа 30 минут</option>
                          <option value="180">3 часа</option>
                        </select>
                      </div>
                      {errors.durationMinutes && <p className="mt-1 text-sm text-red-600">{errors.durationMinutes}</p>}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <input
                        id="isActive"
                        name="isActive"
                        type="checkbox"
                        checked={!!formData.isActive}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                        Активна
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="isApp"
                        name="isApp"
                        type="checkbox"
                        checked={!!formData.isApp}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isApp" className="ml-2 block text-sm text-gray-700">
                        Доступна для онлайн-записи
                      </label>
                    </div>
                  </div>

                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                    >
                      {service ? 'Сохранить изменения' : 'Добавить услугу'}
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                      onClick={onClose}
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
