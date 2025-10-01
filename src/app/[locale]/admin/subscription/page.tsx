"use client"

import {
  CheckCircle,
  Crown,
  Edit, 
  Eye, 
  Plus, 
  Search,
  Trash2, 
  X} from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

import { useSubscription } from "@/contexts/SubscriptionContext"

import type { SalonSubscriptionPlan } from '@/types/subscriptions'

const initialFormData = {
  name: "",
  description: "",
  price: 0,
  currency: "RUB",
  billingPeriod: "monthly" as 'monthly' | 'yearly' | 'quarterly',
  features: "",
  isActive: true,
  isPopular: false,
};

export default function AdminSubscriptionPlansPage() {
  const t = useTranslations('admin')
  const { 
    getAllSubscriptionPlans,
    createSubscriptionPlan,
    updateSubscriptionPlan,
    deleteSubscriptionPlan,
    loading, 
  } = useSubscription()

  const [plans, setPlans] = useState<SalonSubscriptionPlan[]>([]);
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPlan, setSelectedPlan] = useState<SalonSubscriptionPlan | null>(null)
  const [editingPlan, setEditingPlan] = useState<SalonSubscriptionPlan | null>(null)
  
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    const fetchPlans = async () => {
      const fetchedPlans = await getAllSubscriptionPlans();
      setPlans(fetchedPlans);
    };
    fetchPlans();
  }, [getAllSubscriptionPlans])

  const filteredPlans = plans.filter(plan => {
    const searchLower = searchTerm.toLowerCase();
    const matchesName = plan.name.toLowerCase().includes(searchLower);
    const matchesDescription = plan.description && plan.description.toLowerCase().includes(searchLower);
    const matchesFeatures = plan.features.some(feature => feature.toLowerCase().includes(searchLower));
    
    return matchesName || matchesDescription || matchesFeatures;
  });

  const resetForm = () => {
    setFormData(initialFormData);
  }

  const handleCreatePlan = async () => {
    if (!formData.name || formData.price < 0) return;
    try {
      const planId = `plan_${Date.now()}`;
      
      const planData = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        currency: formData.currency,
        billingPeriod: formData.billingPeriod,
        features: formData.features.split(',').map(f => f.trim()).filter(Boolean),
        isActive: formData.isActive,
        isPopular: formData.isPopular,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createSubscriptionPlan(planId, planData);
      
      setShowCreateModal(false);
      resetForm();
      const fetchedPlans = await getAllSubscriptionPlans();
      setPlans(fetchedPlans);
    } catch (err) {
      console.error('Error creating subscription plan:', err);
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
        billingPeriod: formData.billingPeriod,
        features: formData.features.split(',').map(f => f.trim()).filter(Boolean),
        isActive: formData.isActive,
      };
      
      await updateSubscriptionPlan(editingPlan.id, updatedData);
      
      setShowEditModal(false);
      setEditingPlan(null);
      resetForm();
      const fetchedPlans = await getAllSubscriptionPlans();
      setPlans(fetchedPlans);
    } catch (err) {
      console.error('Error updating subscription plan:', err);
    }
  }

  const handleDeletePlan = async () => {
    if (!selectedPlan) return;
    try {
      await deleteSubscriptionPlan(selectedPlan.id);
      
      setShowDeleteModal(false);
      setSelectedPlan(null);
      const fetchedPlans = await getAllSubscriptionPlans();
      setPlans(fetchedPlans);
    } catch (err) {
      console.error('Error deleting subscription plan:', err);
    }
  }

  const openEditModal = (plan: SalonSubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      ...plan,
      isPopular: plan.isPopular || false,
      features: plan.features.join(', '),
    });
    setShowEditModal(true);
  }

  const openDetailsModal = (plan: SalonSubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowDetailsModal(true);
  }

  const openDeleteModal = (plan: SalonSubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowDeleteModal(true);
  }

  if (loading && plans.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Crown className="h-8 w-8 text-rose-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Загрузка планов подписок...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Планы подписок</h1>
            <p className="text-gray-600 mt-1">Управление тарифными планами для салонов</p>
          </div>
          <button 
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 flex items-center shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Добавить план
          </button>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск планов..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>

              <select
                onChange={(e) => { /* Filter logic here */ }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                <option value="all">Все статусы</option>
                <option value="active">Активные</option>
                <option value="inactive">Неактивные</option>
              </select>

              <div className="flex items-center text-sm text-gray-500">
                Найдено: {filteredPlans.length} планов
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-lg shadow hover:shadow-md transition-all duration-200 overflow-hidden group">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    plan.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {plan.isActive ? 'Активен' : 'Неактивен'}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4 h-12 overflow-hidden">{plan.description}</p>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">
                      {plan.price} {plan.currency}
                    </p>
                    <p className="text-sm text-gray-500">/ {t(`billingPeriods.${plan.billingPeriod}`)}</p>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex space-x-3">
                  <button
                    onClick={() => openEditModal(plan)}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
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
            <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Планы не найдены</h3>
            <p className="text-gray-500">Попробуйте изменить параметры поиска или добавить новый план.</p>
          </div>
        )}
      </div>

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
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Цена <span className="text-red-500">*</span></label>
                    <input type="number" value={formData.price} min="0" onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Валюта <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })} maxLength={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Период оплаты <span className="text-red-500">*</span></label>
                  <select value={formData.billingPeriod} onChange={(e) => setFormData({ ...formData, billingPeriod: e.target.value as any })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500">
                    <option value="monthly">Ежемесячно</option>
                    <option value="quarterly">Ежеквартально</option>
                    <option value="yearly">Ежегодно</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Возможности (через запятую)</label>
                  <textarea value={formData.features} onChange={(e) => setFormData({ ...formData, features: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500" placeholder="Полный доступ, Приоритетная поддержка..."/>
                </div>
                <div className="flex items-center pt-2">
                    <input id="isActive" type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="h-4 w-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500" />
                    <label htmlFor="isActive" className="ml-3 block text-sm text-gray-900">План активен для выбора</label>
                </div>
                <div className="flex items-center pt-2">
                    <input id="isPopular" type="checkbox" checked={formData.isPopular} onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })} className="h-4 w-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500" />
                    <label htmlFor="isPopular" className="ml-3 block text-sm text-gray-900">Популярный план</label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8">
                <button onClick={() => { setShowCreateModal(false); setShowEditModal(false); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">Отмена</button>
                <button onClick={showEditModal ? handleUpdatePlan : handleCreatePlan} disabled={!formData.name || loading} className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:bg-gray-400 rounded-md">
                  {loading ? 'Сохранение...' : (showEditModal ? 'Сохранить' : 'Создать')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <p><strong>Период:</strong> {t(`billingPeriods.${selectedPlan.billingPeriod}`)}</p>
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
