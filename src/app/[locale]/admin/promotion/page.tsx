"use client"

import {
  CheckCircle,
  Edit, 
  Eye, 
  Plus, 
  Search, 
  Star,
  Trash2, 
  X,
  Zap} from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

import { usePromotion } from "@/contexts/PromotionContext" // Используем наш новый контекст

import type { ServicePromotionPlan } from '@/types/database'

// Начальное состояние для формы создания/редактирования плана
const initialFormData = {
  name: "",
  description: "",
  price: 0,
  currency: "USD",
  durationDays: 30,
  searchPriority: 1,
  features: "", // Храним как строку, разделенную запятыми, для удобства в <textarea>
  isActive: true,
};

export default function AdminPromotionPlansPage() {
  const t = useTranslations('admin')
  const { 
    getAllServicePromotionPlans,
    createServicePromotionPlan, 
    updateServicePromotionPlan,
    deleteServicePromotionPlan,
    loading, 
    error 
  } = usePromotion()

  const [plans, setPlans] = useState<ServicePromotionPlan[]>([]);
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPlan, setSelectedPlan] = useState<ServicePromotionPlan | null>(null)
  const [editingPlan, setEditingPlan] = useState<ServicePromotionPlan | null>(null)
  
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const [formData, setFormData] = useState(initialFormData);

  // Загрузка планов при монтировании компонента
  useEffect(() => {
    const fetchPlans = async () => {
      const fetchedPlans = await getAllServicePromotionPlans();
      setPlans(fetchedPlans);
    };
    fetchPlans();
  }, [getAllServicePromotionPlans])

  const filteredPlans = plans.filter(plan => {
    const searchLower = searchTerm.toLowerCase();
    const matchesName = plan.name.toLowerCase().includes(searchLower);
    const matchesDescription = plan.description && plan.description.toLowerCase().includes(searchLower);
    const matchesFeatures = plan.features.some(feature => feature.toLowerCase().includes(searchLower));
    
    return matchesName || matchesDescription || matchesFeatures;
  });

  // Mock service images for demonstration
  const getServiceImage = (index: number) => {
    const images = [
      '/images/cat.jpg',
      '/images/logo.png',
      '/images/log.png'
    ];
    return images[index % images.length];
  }

  const resetForm = () => {
    setFormData(initialFormData);
  }

  const handleCreatePlan = async () => {
    if (!formData.name || formData.price < 0 || formData.durationDays <= 0) return;
    try {
      // Генерируем уникальный ID для нового плана
      const planId = `plan_${Date.now()}`;
      
      const planData = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        currency: formData.currency,
        durationDays: parseInt(String(formData.durationDays), 10),
        searchPriority: parseInt(String(formData.searchPriority), 10),
        features: formData.features.split(',').map(f => f.trim()).filter(Boolean),
        isActive: formData.isActive,
        createdAt: new Date().toISOString(),
      };

      await createServicePromotionPlan(planId, planData); // Вызов метода из контекста
      
      setShowCreateModal(false);
      resetForm();
      // Перезагружаем планы, чтобы увидеть новый
      const fetchedPlans = await getAllServicePromotionPlans();
      setPlans(fetchedPlans);
    } catch (err) {
      console.error('Error creating promotion plan:', err);
      // Здесь можно добавить логику отображения ошибки пользователю
    }
  }

  const handleUpdatePlan = async () => {
    if (!editingPlan) return;
    try {
      const updatedData = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        currency: formData.currency,
        durationDays: parseInt(String(formData.durationDays), 10),
        searchPriority: parseInt(String(formData.searchPriority), 10),
        features: formData.features.split(',').map(f => f.trim()).filter(Boolean),
        isActive: formData.isActive,
      };
      
      await updateServicePromotionPlan(editingPlan.id, updatedData); // Вызов метода из контекста
      
      setShowEditModal(false);
      setEditingPlan(null);
      resetForm();
      // Перезагружаем планы, чтобы увидеть изменения
      const fetchedPlans = await getAllServicePromotionPlans();
      setPlans(fetchedPlans);
    } catch (err) {
      console.error('Error updating promotion plan:', err);
    }
  }

  const handleDeletePlan = async () => {
    if (!selectedPlan) return;
    try {
      await deleteServicePromotionPlan(selectedPlan.id); // Вызов метода из контекста
      
      setShowDeleteModal(false);
      setSelectedPlan(null);
      // Перезагружаем планы, чтобы удалить элемент из списка
      const fetchedPlans = await getAllServicePromotionPlans();
      setPlans(fetchedPlans);
    } catch (err) {
      console.error('Error deleting promotion plan:', err);
    }
  }

  const openEditModal = (plan: ServicePromotionPlan) => {
    setEditingPlan(plan);
    setFormData({
      ...plan,
      features: plan.features.join(', '), // Преобразуем массив в строку для редактирования
    });
    setShowEditModal(true);
  }

  const openDetailsModal = (plan: ServicePromotionPlan) => {
    setSelectedPlan(plan);
    setShowDetailsModal(true);
  }

  const openDeleteModal = (plan: ServicePromotionPlan) => {
    setSelectedPlan(plan);
    setShowDeleteModal(true);
  }

  if (loading && plans.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Zap className="h-8 w-8 text-blue-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Загрузка планов продвижения...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Планы продвижения</h1>
            <p className="text-gray-600 mt-1">Управление тарифными планами для продвижения услуг</p>
          </div>
          <button 
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Добавить план
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
                  placeholder="Поиск планов..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={formData.isActive ? "active" : "inactive"}
                onChange={(e) => setFormData({...formData, isActive: e.target.value === "active"})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Все статусы</option>
                <option value="active">Активные</option>
                <option value="inactive">Неактивные</option>
              </select>

              {/* Results count */}
              <div className="flex items-center text-sm text-gray-500">
                Найдено: {filteredPlans.length} планов
              </div>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlans.map((plan, index) => (
            <div key={plan.id} className="bg-white rounded-lg shadow hover:shadow-md transition-all duration-200 overflow-hidden group">
              {/* Service Image */}
              <div className="h-40 bg-gray-100 overflow-hidden relative">
                <img 
                  src={getServiceImage(index)} 
                  alt={plan.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    plan.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {plan.isActive ? 'Активен' : 'Неактивен'}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                {/* Price and Duration */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">
                      {plan.price} {plan.currency}
                    </p>
                    <p className="text-sm text-gray-500">за {plan.durationDays} дней</p>
                  </div>
                  <div className="flex items-center text-amber-500">
                    <Star className="h-5 w-5 fill-current" />
                    <span className="ml-1 font-medium">Приоритет: {plan.searchPriority}</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => openEditModal(plan)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Изменить
                  </button>
                  <button
                    onClick={() => openDetailsModal(plan)}
                    className="p-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                    title="Подробнее"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openDeleteModal(plan)}
                    className="p-2.5 border border-red-100 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPlans.length === 0 && !loading && (
          <div className="text-center py-16">
            <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Планы не найдены</h3>
            <p className="text-gray-500">Попробуйте изменить параметры поиска или добавить новый план.</p>
          </div>
        )}
      </div>

      {/* Create or Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {showEditModal ? 'Редактировать план' : 'Создать новый план'}
                </h3>
                <button
                  onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Название <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Цена <span className="text-red-500">*</span></label>
                    <input type="number" value={formData.price} min="0" onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Валюта <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })} maxLength={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Длительность (дней) <span className="text-red-500">*</span></label>
                        <input type="number" value={formData.durationDays} min="1" onChange={(e) => setFormData({ ...formData, durationDays: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Приоритет поиска <span className="text-red-500">*</span></label>
                        <input type="number" value={formData.searchPriority} min="1" onChange={(e) => setFormData({ ...formData, searchPriority: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Возможности (через запятую)</label>
                  <textarea value={formData.features} onChange={(e) => setFormData({ ...formData, features: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="Приоритетный показ, Выделение цветом..."/>
                </div>
                <div className="flex items-center pt-2">
                    <input id="isActive" type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <label htmlFor="isActive" className="ml-3 block text-sm text-gray-900">План активен для выбора</label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8">
                <button onClick={() => { setShowCreateModal(false); setShowEditModal(false); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">Отмена</button>
                <button onClick={showEditModal ? handleUpdatePlan : handleCreatePlan} disabled={!formData.name || loading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md">
                  {loading ? 'Сохранение...' : (showEditModal ? 'Сохранить' : 'Создать')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedPlan && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Информация о плане</h3>
                <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
              </div>
              <div className="space-y-3 text-sm">
                <p><strong>Название:</strong> {selectedPlan.name}</p>
                <p><strong>Описание:</strong> {selectedPlan.description || "Нет"}</p>
                <p><strong>Цена:</strong> {selectedPlan.price} {selectedPlan.currency}</p>
                <p><strong>Длительность:</strong> {selectedPlan.durationDays} дней</p>
                <p><strong>Приоритет:</strong> {selectedPlan.searchPriority}</p>
                <p><strong>Статус:</strong> {selectedPlan.isActive ? "Активен" : "Неактивен"}</p>
                <div>
                    <strong>Возможности:</strong>
                    {selectedPlan.features.length > 0 ? (
                        <ul className="list-disc list-inside pl-4 mt-1">
                            {selectedPlan.features.map(f => <li key={f}>{f}</li>)}
                        </ul>
                    ) : <p className="pl-4 mt-1 italic">Нет</p>}
                </div>
                <p className="text-xs text-gray-500 pt-2"><strong>ID:</strong> {selectedPlan.id}</p>
              </div>
              <div className="flex justify-end mt-8">
                <button onClick={() => setShowDetailsModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">Закрыть</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPlan && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 border w-full max-w-sm shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">Удалить план</h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Вы уверены, что хотите удалить план <strong>{selectedPlan.name}</strong>? Это действие нельзя отменить.
              </p>
              <div className="flex justify-center space-x-3">
                <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md w-full">Отмена</button>
                <button onClick={handleDeletePlan} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md w-full">
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