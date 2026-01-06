"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Building2, Calendar, Clock, Edit, Globe, Mail, MapPin, Phone, Scissors, X } from 'lucide-react';

import { useSalonEditDialog } from '@/hooks/useSalonEditDialog';
import { useAdmin } from '@/contexts/AdminContext';

export default function SalonDetailsPage() {
  const { salonId } = useParams() as { salonId: string };
  const router = useRouter();
  
  const { 
    fetchSalon, 
    updateSalon, 
    loading, 
    error 
  } = useAdmin();
  
  const [salon, setSalon] = useState<any>(null);
  
  const {
    isOpen: isEditDialogOpen,
    currentSalon,
    openDialog: openEditDialog,
    closeDialog: closeEditDialog
  } = useSalonEditDialog();

  // Load salon data
  useEffect(() => {
    const loadSalon = async () => {
      try {
        const salonData = await fetchSalon(salonId);
        if (salonData) {
          setSalon(salonData);
        } else {
          // Handle case when salon is not found
          console.error('Salon not found:', salonId);
          router.push('/admin/salons');
        }
      } catch (err) {
        console.error('Error loading salon:', err);
      }
    };

    if (salonId) {
      loadSalon();
    }
  }, [salonId, fetchSalon, router]);

  const handleSaveSalon = async (updatedSalon: any) => {
    try {
      await updateSalon(salonId, updatedSalon);
      setSalon(updatedSalon);
      closeEditDialog();
    } catch (err) {
      console.error('Error updating salon:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка информации о салоне...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <X className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Ошибка загрузки</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!salon) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">{salon.name}</h1>
              <div className="flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                <span className="text-sm">{salon.address}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button 
                onClick={() => openEditDialog(salon)}
                className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                <Edit className="h-4 w-4 mr-2" />
                Редактировать
              </button>
              <button 
                onClick={() => router.push(`/admin/salons/${salonId}/services`)}
                className="inline-flex items-center px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                <Scissors className="h-4 w-4 mr-2" />
                Сервисы
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                Контактная информация
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start">
                <Phone className="h-5 w-5 mr-3 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Телефон</p>
                  <p className="text-sm text-gray-900">{salon.phone || 'Не указан'}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Mail className="h-5 w-5 mr-3 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <p className="text-sm text-gray-900">{salon.email || 'Не указан'}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Globe className="h-5 w-5 mr-3 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Веб-сайт</p>
                  {salon.website ? (
                    <a 
                      href={salon.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {salon.website}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-900">Не указан</p>
                  )}
                </div>
              </div>
              <div className="flex items-start">
                <Calendar className="h-5 w-5 mr-3 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Статус</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    salon.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {salon.isActive ? 'Активен' : 'Неактивен'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                Время работы
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {Object.entries(salon.workingHours || {}).map(([day, hours]: [string, any]) => (
                  <div key={day} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-3 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {day === 'monday' ? 'Понедельник' :
                         day === 'tuesday' ? 'Вторник' :
                         day === 'wednesday' ? 'Среда' :
                         day === 'thursday' ? 'Четверг' :
                         day === 'friday' ? 'Пятница' :
                         day === 'saturday' ? 'Суббота' :
                         day === 'sunday' ? 'Воскресенье' : day}
                      </span>
                    </div>
                    <div className="text-sm text-gray-900">
                      {hours.isClosed !== false ? (
                        <span className="text-gray-500">Выходной</span>
                      ) : (
                        <span className="font-medium">{hours.open} - {hours.close}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {salon.description && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Описание</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{salon.description}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
