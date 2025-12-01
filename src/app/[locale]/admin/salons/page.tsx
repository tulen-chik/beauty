"use client"

import { 
  Building2, Calendar, Eye, Mail, MapPin, MoreVertical, Phone, Search, 
  Settings, Trash2, X, XCircle, UploadCloud, Save, Loader2 
} from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useEffect, useState, useCallback, useRef } from "react"
import Image from "next/image"

import { useSalon } from "@/contexts/SalonContext"
import { useUser } from "@/contexts/UserContext"
import type { Salon } from "@/types/database"

export default function AdminSalonsPage() {
  const t = useTranslations('admin')
  const { currentUser } = useUser()
  
  const { 
    fetchUserSalons,
    fetchSalon,
    deleteSalon,
    updateAvatar, // Достаем метод для обновления аватара
    removeAvatar, // Достаем метод для удаления аватара
    loading, 
    error 
  } = useSalon()

  const [adminSalons, setAdminSalons] = useState<Salon[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null)
  const [showSalonModal, setShowSalonModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Состояния для управления аватаром в модальном окне
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAdminSalons = useCallback(async () => {
    if (!currentUser?.userId) return;
    try {
      const userSalonsData = await fetchUserSalons(currentUser.userId);
      if (userSalonsData?.salons) {
        const salonPromises = userSalonsData.salons.map(s => fetchSalon(s.salonId));
        const fetchedSalons = (await Promise.all(salonPromises)).filter((s): s is Salon => s !== null);
        setAdminSalons(fetchedSalons);
      }
    } catch (err) {
      console.error("Failed to load admin salons:", err);
    }
  }, [currentUser, fetchUserSalons, fetchSalon]);

  useEffect(() => {
    loadAdminSalons()
  }, [loadAdminSalons])

  const filteredSalons = adminSalons.filter(salon => {
    const matchesSearch = salon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         salon.address.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleDeleteSalon = async (salonId: string) => {
    try {
      await deleteSalon(salonId);
      setAdminSalons(prev => prev.filter(s => s.id !== salonId));
      setShowDeleteModal(false);
      setSelectedSalon(null);
    } catch (error) {
      console.error('Error deleting salon:', error);
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ru-RU', { year: 'numeric', month: 'short', day: 'numeric' });

  // --- ФУНКЦИИ УПРАВЛЕНИЯ АВАТАРОМ ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarError(null);
      if (file.size > 2 * 1024 * 1024) { setAvatarError("Файл слишком большой (макс. 2МБ)"); return; }
      setAvatarFile(file);
      setAvatarPreviewUrl(URL.createObjectURL(file));
    }
  };

  const cancelAvatarChange = () => {
    setAvatarFile(null);
    setAvatarPreviewUrl(null);
    setAvatarError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile || !selectedSalon) return;
    setIsAvatarUploading(true);
    setAvatarError(null);
    try {
      const updatedSalon = await updateAvatar(selectedSalon.id, avatarFile);
      // Обновляем и в списке, и в модальном окне
      setAdminSalons(prev => prev.map(s => s.id === updatedSalon.id ? updatedSalon : s));
      setSelectedSalon(updatedSalon);
      cancelAvatarChange();
    } catch (err) {
      setAvatarError("Ошибка загрузки аватара.");
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!selectedSalon || !window.confirm("Вы уверены, что хотите удалить аватар?")) return;
    setIsAvatarUploading(true);
    setAvatarError(null);
    try {
      await removeAvatar(selectedSalon.id);
      const updatedSalon = { ...selectedSalon, avatarUrl: '', avatarStoragePath: '' };
      setAdminSalons(prev => prev.map(s => s.id === selectedSalon.id ? updatedSalon : s));
      setSelectedSalon(updatedSalon);
    } catch (err) {
      setAvatarError("Ошибка удаления аватара.");
    } finally {
      setIsAvatarUploading(false);
    }
  };

  // Сброс состояния аватара при закрытии модального окна
  const handleCloseSalonModal = () => {
    setShowSalonModal(false);
    cancelAvatarChange();
  };

  if (loading && adminSalons.length === 0) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>Загрузка салонов...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Управление салонами</h1>
          <p className="text-gray-600 mt-1">Просмотр и управление всеми салонами в системе</p>
        </div>

        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Поиск салонов..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSalons.map((salon) => (
            <div key={salon.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{salon.name}</h3>
                    <div className="flex items-center text-sm text-gray-500 mb-2"><MapPin className="h-4 w-4 mr-1" /><span className="truncate">{salon.address}</span></div>
                  </div>
                  <button onClick={() => { setSelectedSalon(salon); setShowDeleteModal(true); }} className="text-gray-400 hover:text-red-600 p-1"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="space-y-2 mb-4">
                  {salon.phone && <div className="flex items-center text-sm text-gray-600"><Phone className="h-4 w-4 mr-2" /><span>{salon.phone}</span></div>}
                  {salon.settings?.business?.email && <div className="flex items-center text-sm text-gray-600"><Mail className="h-4 w-4 mr-2" /><span className="truncate">{salon.settings.business.email}</span></div>}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button onClick={() => { setSelectedSalon(salon); setShowSalonModal(true); }} className="text-blue-600 hover:text-blue-900 text-sm font-medium"><Eye className="h-4 w-4 inline mr-1" />Подробнее</button>
                    <Link href={`/admin/salons/${salon.id}`} className="text-gray-600 hover:text-gray-900 text-sm font-medium"><Settings className="h-4 w-4 inline mr-1" />Настройки</Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Salon Details Modal with Avatar Management */}
      {showSalonModal && selectedSalon && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Информация о салоне</h3>
                <button onClick={handleCloseSalonModal} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
              </div>
              
              {/* --- БЛОК УПРАВЛЕНИЯ АВАТАРОМ --- */}
              <div className="p-4 border-b border-gray-200 mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">Аватар</label>
                <div className="flex items-center gap-5">
                  <div className="relative w-20 h-20 rounded-full bg-gray-100 flex-shrink-0">
                    <Image src={avatarPreviewUrl || selectedSalon.avatarUrl || '/placeholder.png'} alt="Аватар" layout="fill" className="rounded-full object-cover" />
                    {isAvatarUploading && <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-full"><Loader2 className="animate-spin" /></div>}
                  </div>
                  <div className="flex-1">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" className="hidden" />
                    {!avatarFile ? (
                      <div className="flex items-center gap-3">
                        <button onClick={() => fileInputRef.current?.click()} disabled={isAvatarUploading} className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"><UploadCloud className="w-4 h-4" /> Изменить</button>
                        {selectedSalon.avatarUrl && <button onClick={handleAvatarRemove} disabled={isAvatarUploading} className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 flex items-center gap-1"><Trash2 className="w-4 h-4" /> Удалить</button>}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button onClick={handleAvatarUpload} disabled={isAvatarUploading} className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"><Save className="w-4 h-4" /> Сохранить</button>
                        <button onClick={cancelAvatarChange} disabled={isAvatarUploading} className="px-3 py-1.5 text-sm font-medium bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center gap-1"><X className="w-4 h-4" /> Отмена</button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">PNG, JPG, WEBP до 2МБ.</p>
                    {avatarError && <p className="text-xs text-red-500 mt-1">{avatarError}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-4 px-4">
                <div><label className="block text-sm font-medium text-gray-700">Название</label><p className="text-sm text-gray-900">{selectedSalon.name}</p></div>
                <div><label className="block text-sm font-medium text-gray-700">Адрес</label><p className="text-sm text-gray-900">{selectedSalon.address}</p></div>
                {selectedSalon.phone && <div><label className="block text-sm font-medium text-gray-700">Телефон</label><p className="text-sm text-gray-900">{selectedSalon.phone}</p></div>}
                {selectedSalon.settings?.business?.email && <div><label className="block text-sm font-medium text-gray-700">Email</label><p className="text-sm text-gray-900">{selectedSalon.settings.business.email}</p></div>}
              </div>

              <div className="flex justify-end space-x-3 mt-6 px-4 pb-4">
                <button onClick={handleCloseSalonModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">Закрыть</button>
                <Link href={`/admin/salons/${selectedSalon.id}`} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">Управление</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSalon && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100"><Trash2 className="h-6 w-6 text-red-600" /></div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Удалить салон</h3>
              <div className="mt-2 px-7 py-3"><p className="text-sm text-gray-500">Вы уверены, что хотите удалить салон <strong>{selectedSalon.name}</strong>? Это действие нельзя отменить.</p></div>
              <div className="items-center px-4 py-3 gap-3 flex justify-center">
                <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm">Отмена</button>
                <button onClick={() => handleDeleteSalon(selectedSalon.id)} className="px-4 py-2 bg-red-600 text-white text-sm rounded-md">{loading ? 'Удаление...' : 'Удалить'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}