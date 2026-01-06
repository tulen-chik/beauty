"use client"

import { 
  ArrowRight, Building2, Calendar, Eye, MapPin, Plus, Search, 
  Trash2, UserPlus, Users, X, Loader2, UploadCloud, Save, Settings
} from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useCallback, useEffect, useState, useRef } from "react"
import Image from "next/image"

import { useAdmin } from "@/contexts/AdminContext"
import { useSalon } from "@/contexts/SalonContext"
import { useUser } from "@/contexts/UserContext"

import { CreateSalonModal } from "./components/CreateSalonModal"
import { CreateUserModal } from "./components/CreateUserModal"

import { User } from "@/types/database"
import type { Salon } from "@/types/salon"

export default function AdminUsersPage() {
  const t = useTranslations('admin')
  const { currentUser } = useUser()
  const { users, loadUsers, deleteUser, loading } = useAdmin()

  // Достаем все необходимые методы из SalonContext
  const { 
    fetchUserSalons, 
    fetchSalon,
    updateAvatar,
    removeAvatar
  } = useSalon()

  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCreateSalonModal, setShowCreateSalonModal] = useState(false)
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  
  const [userSalons, setUserSalons] = useState<Salon[]>([])
  const [loadingSalons, setLoadingSalons] = useState(false)

  // Состояния для второго модального окна (детали салона)
  const [showSalonDetailsModal, setShowSalonDetailsModal] = useState(false);
  const [salonForModal, setSalonForModal] = useState<Salon | null>(null);

  // Состояния для управления аватаром в модальном окне салона
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId)
      setShowDeleteModal(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  const loadUserSalons = useCallback(async (userId: string) => {
    setLoadingSalons(true)
    try {
      const userSalonsData = await fetchUserSalons(userId)
      if (userSalonsData?.salons?.length) {
        const salons = await Promise.all(
          userSalonsData.salons.map(async (salonRef) => {
            const salonData = await fetchSalon(salonRef.salonId);
            return salonData ? { ...salonData, id: salonRef.salonId } : null;
          })
        );
        setUserSalons(salons.filter(Boolean) as Salon[]);
      } else {
        setUserSalons([])
      }
    } catch (error) {
      console.error('Error loading user salons:', error)
    } finally {
      setLoadingSalons(false)
    }
  }, [fetchUserSalons, fetchSalon])

  useEffect(() => {
    if (showUserModal && selectedUser) {
      loadUserSalons(selectedUser.id)
    }
  }, [showUserModal, selectedUser, loadUserSalons])

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
    if (!avatarFile || !salonForModal) return;
    setIsAvatarUploading(true);
    setAvatarError(null);
    try {
      const updatedSalon = await updateAvatar(salonForModal.id, avatarFile);
      setUserSalons(prev => prev.map(s => s.id === updatedSalon.id ? updatedSalon : s));
      setSalonForModal(updatedSalon);
      cancelAvatarChange();
    } catch (err) {
      setAvatarError("Ошибка загрузки аватара.");
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!salonForModal || !window.confirm("Вы уверены, что хотите удалить аватар?")) return;
    setIsAvatarUploading(true);
    setAvatarError(null);
    try {
      await removeAvatar(salonForModal.id);
      const updatedSalon = { ...salonForModal, avatarUrl: '', avatarStoragePath: '' };
      setUserSalons(prev => prev.map(s => s.id === salonForModal.id ? updatedSalon : s));
      setSalonForModal(updatedSalon);
    } catch (err) {
      setAvatarError("Ошибка удаления аватара.");
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const handleCloseSalonDetailsModal = () => {
    setShowSalonDetailsModal(false);
    setSalonForModal(null);
    cancelAvatarChange();
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ru-RU', { year: 'numeric', month: 'short', day: 'numeric' });
  const getRoleColor = (role: string) => role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800';
  const getRoleLabel = (role: string) => role === 'admin' ? 'Администратор' : 'Пользователь';

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Загрузка пользователей...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-light text-gray-900">Пользователи</h1>
            <p className="text-gray-500 mt-2 text-sm">Управление пользователями системы</p>
          </div>
          <button 
            onClick={() => setShowCreateUserModal(true)} 
            className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Добавить пользователя
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm mb-6">
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Поиск по имени или email..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 transition-all duration-200"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200/60">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Пользователь</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Роль</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-11 w-11">
                          {user.avatarUrl ? (
                            <img className="h-11 w-11 rounded-full object-cover ring-2 ring-gray-100" src={user.avatarUrl} alt="" />
                          ) : (
                            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 ring-2 ring-gray-100" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button 
                        onClick={() => { setSelectedUser(user); setShowUserModal(true); }} 
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-150 mr-2"
                        title="Просмотр"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }} 
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-150"
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg transform transition-all">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Информация о пользователе</h3>
                <button 
                  onClick={() => setShowUserModal(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-150"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-16 w-16">
                    {selectedUser.avatarUrl ? (
                      <img className="h-16 w-16 rounded-full object-cover ring-4 ring-gray-100" src={selectedUser.avatarUrl} alt="" />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 ring-4 ring-gray-100" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-xl font-semibold text-gray-900">{selectedUser.displayName}</div>
                    <div className="text-sm text-gray-500">{selectedUser.email}</div>
                  </div>
                </div>
                <div className="pt-6 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-semibold text-gray-900">Салоны пользователя</h4>
                    <button 
                      onClick={() => setShowCreateSalonModal(true)}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Добавить салон
                    </button>
                  </div>
                  {loadingSalons ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : userSalons.length > 0 ? (
                    <div className="space-y-3">
                      {userSalons.map((salon) => (
                        <div key={salon.id} className="p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all duration-200">
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 mb-1">{salon.name}</h5>
                              <p className="text-sm text-gray-500 flex items-center">
                                <MapPin className="h-4 w-4 mr-2" />
                                {salon.address}
                              </p>
                            </div>
                            <button 
                              onClick={() => { setSalonForModal(salon); setShowSalonDetailsModal(true); }} 
                              className="ml-4 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-150"
                              title="Настройки салона"
                            >
                              <Settings className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 mb-4">У пользователя пока нет салонов</p>
                      <button 
                        onClick={() => setShowCreateSalonModal(true)}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Создать первый салон
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Salon Details Modal (Nested) */}
      {showSalonDetailsModal && salonForModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm overflow-y-auto h-full w-full z-[60]">
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg transform transition-all">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Управление салоном: {salonForModal.name}</h3>
                <button 
                  onClick={handleCloseSalonDetailsModal}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-150"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Аватар салона</label>
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-20 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                        <Image 
                          src={avatarPreviewUrl || salonForModal.avatarUrl || '/placeholder.png'} 
                          alt="Аватар" 
                          layout="fill" 
                          className="object-cover" 
                        />
                        {isAvatarUploading && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <Loader2 className="animate-spin h-6 w-6 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-3">
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileChange} 
                          accept="image/png, image/jpeg, image/webp" 
                          className="hidden" 
                        />
                        {!avatarFile ? (
                          <div className="flex flex-wrap gap-2">
                            <button 
                              onClick={() => fileInputRef.current?.click()} 
                              disabled={isAvatarUploading} 
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
                            >
                              <UploadCloud className="w-4 h-4 mr-2" />
                              Изменить
                            </button>
                            {salonForModal.avatarUrl && (
                              <button 
                                onClick={handleAvatarRemove} 
                                disabled={isAvatarUploading} 
                                className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors duration-200"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Удалить
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <button 
                              onClick={handleAvatarUpload} 
                              disabled={isAvatarUploading} 
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors duration-200"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Сохранить
                            </button>
                            <button 
                              onClick={cancelAvatarChange} 
                              disabled={isAvatarUploading} 
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors duration-200"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Отмена
                            </button>
                          </div>
                        )}
                        <p className="text-xs text-gray-500">PNG, JPG, WEBP до 2МБ</p>
                        {avatarError && <p className="text-xs text-red-500">{avatarError}</p>}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button 
                    onClick={handleCloseSalonDetailsModal} 
                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other Modals */}
      {showDeleteModal && selectedUser && <div className="fixed inset-0 z-50 ...">{/* Delete User Modal JSX */}</div>}
      {showCreateSalonModal && selectedUser && <CreateSalonModal isOpen={showCreateSalonModal} onClose={() => setShowCreateSalonModal(false)} userId={selectedUser.id} userName={selectedUser.displayName} />}
      <CreateUserModal isOpen={showCreateUserModal} onClose={() => setShowCreateUserModal(false)} />
    </div>
  )
}