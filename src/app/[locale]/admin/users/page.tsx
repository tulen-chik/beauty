"use client"

import { 
  ArrowRight, Building2, Calendar, Eye, MapPin, Plus, Search, 
  Trash2, UserPlus, Users, X, Loader2, UploadCloud, Save, Settings, User as UserIcon
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Управление пользователями</h1>
              <p className="text-gray-600 mt-1 text-sm">Просмотр и управление всеми пользователями системы</p>
            </div>
            <button 
              onClick={() => setShowCreateUserModal(true)} 
              className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Добавить пользователя
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input 
              type="text" 
              placeholder="Поиск по имени или email..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" 
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Список пользователей</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Пользователь</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Роль</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-11 w-11">
                          {user.avatarUrl ? (
                            <img className="h-11 w-11 rounded-full object-cover ring-2 ring-gray-100" src={user.avatarUrl} alt={user.displayName} />
                          ) : (
                            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-red-100 text-red-800 ring-1 ring-red-200' 
                          : 'bg-gray-100 text-gray-800 ring-1 ring-gray-200'
                      }`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => { setSelectedUser(user); setShowUserModal(true); }} 
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Просмотр"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }} 
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
            <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-lg transform transition-all">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Информация о пользователе</h3>
                <button 
                  onClick={() => setShowUserModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-14 w-14">
                    {selectedUser.avatarUrl ? (
                      <img className="h-14 w-14 rounded-full object-cover ring-2 ring-gray-100" src={selectedUser.avatarUrl} alt={selectedUser.displayName} />
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900">{selectedUser.displayName}</h4>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-medium text-gray-900">Салоны пользователя</h5>
                    <button 
                      onClick={() => setShowCreateSalonModal(true)}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Добавить салон
                    </button>
                  </div>
                  
                  {loadingSalons ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm text-gray-500">Загрузка салонов...</span>
                    </div>
                  ) : userSalons.length > 0 ? (
                    <div className="space-y-2">
                      {userSalons.map((salon) => (
                        <div key={salon.id} className="bg-white p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors duration-200">
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <h6 className="font-medium text-gray-900 text-sm">{salon.name}</h6>
                              <p className="text-xs text-gray-500 flex items-center mt-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                {salon.address}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Link 
                                href={`/admin/salons/${salon.id}`}
                                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                title="Настройки салона"
                              >
                                <Settings className="h-4 w-4" />
                              </Link>
                              <button 
                                onClick={() => { setSalonForModal(salon); setShowSalonDetailsModal(true); }} 
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                title="Просмотр аватара"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 mb-3">У пользователя пока нет салонов</p>
                      <button 
                        onClick={() => setShowCreateSalonModal(true)}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-[60]">
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-lg transform transition-all">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Управление салоном: {salonForModal.name}</h3>
                <button 
                  onClick={handleCloseSalonDetailsModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Аватар салона</label>
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden">
                      <Image 
                        src={avatarPreviewUrl || salonForModal.avatarUrl || '/placeholder.png'} 
                        alt="Аватар" 
                        layout="fill" 
                        className="rounded-full object-cover" 
                      />
                      {isAvatarUploading && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                          <Loader2 className="animate-spin h-6 w-6 text-blue-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/png, image/jpeg, image/webp" 
                        className="hidden" 
                      />
                      {!avatarFile ? (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
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
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors duration-200"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Удалить
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <button 
                            onClick={handleAvatarUpload} 
                            disabled={isAvatarUploading} 
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
                          >
                            <Save className="w-4 h-4 mr-1" />
                            Сохранить
                          </button>
                          <button 
                            onClick={cancelAvatarChange} 
                            disabled={isAvatarUploading} 
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors duration-200"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Отмена
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">PNG, JPG, WEBP до 2МБ</p>
                      {avatarError && <p className="text-xs text-red-500 mt-1">{avatarError}</p>}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end p-6 pt-0">
                <button 
                  onClick={handleCloseSalonDetailsModal} 
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  Закрыть
                </button>
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