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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Управление пользователями</h1>
            <p className="text-gray-600 mt-1">Просмотр и управление всеми пользователями системы</p>
          </div>
          <button onClick={() => setShowCreateUserModal(true)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"><UserPlus className="h-5 w-5 mr-2" />Добавить</button>
        </div>

        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <input type="text" placeholder="Поиск пользователей..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Пользователь</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Роль</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">{user.avatarUrl ? <img className="h-10 w-10 rounded-full" src={user.avatarUrl} alt="" /> : <div className="h-10 w-10 rounded-full bg-gray-300" />}</div>
                      <div className="ml-4"><div className="text-sm font-medium text-gray-900">{user.displayName}</div><div className="text-sm text-gray-500">{user.email}</div></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(user.role)}`}>{getRoleLabel(user.role)}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => { setSelectedUser(user); setShowUserModal(true); }} className="text-blue-600 hover:text-blue-900 mr-3"><Eye /></button>
                    <button onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }} className="text-red-600 hover:text-red-900"><Trash2 /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-medium">Информация о пользователе</h3><button onClick={() => setShowUserModal(false)}><X /></button></div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 h-12 w-12">{selectedUser.avatarUrl ? <img className="h-12 w-12 rounded-full" src={selectedUser.avatarUrl} alt="" /> : <div className="h-12 w-12 rounded-full bg-gray-300" />}</div>
                <div><div className="text-lg font-medium">{selectedUser.displayName}</div><div className="text-sm text-gray-500">{selectedUser.email}</div></div>
              </div>
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Салоны пользователя</h4>
                {loadingSalons ? <p>Загрузка салонов...</p> : userSalons.length > 0 ? (
                  <div className="space-y-3">
                    {userSalons.map((salon) => (
                      <div key={salon.id} className="block p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex justify-between items-center">
                          <div>
                            <h5 className="font-medium">{salon.name}</h5>
                            <p className="text-sm text-gray-500 flex items-center mt-1"><MapPin className="h-3.5 w-3.5 mr-1" />{salon.address}</p>
                          </div>
                          <button onClick={() => { setSalonForModal(salon); setShowSalonDetailsModal(true); }} className="p-2 text-gray-500 hover:text-blue-600"><Settings className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-500">У пользователя нет салонов.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Salon Details Modal (Nested) */}
      {showSalonDetailsModal && salonForModal && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 overflow-y-auto h-full w-full z-[60]">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-medium">Управление салоном: {salonForModal.name}</h3><button onClick={handleCloseSalonDetailsModal}><X /></button></div>
            <div className="p-4 border-y border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">Аватар</label>
              <div className="flex items-center gap-5">
                <div className="relative w-20 h-20 rounded-full bg-gray-100 flex-shrink-0">
                  <Image src={avatarPreviewUrl || salonForModal.avatarUrl || '/placeholder.png'} alt="Аватар" layout="fill" className="rounded-full object-cover" />
                  {isAvatarUploading && <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-full"><Loader2 className="animate-spin" /></div>}
                </div>
                <div className="flex-1">
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" className="hidden" />
                  {!avatarFile ? (
                    <div className="flex items-center gap-3">
                      <button onClick={() => fileInputRef.current?.click()} disabled={isAvatarUploading} className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"><UploadCloud className="w-4 h-4" /> Изменить</button>
                      {salonForModal.avatarUrl && <button onClick={handleAvatarRemove} disabled={isAvatarUploading} className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 flex items-center gap-1"><Trash2 className="w-4 h-4" /> Удалить</button>}
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
            <div className="flex justify-end mt-4"><button onClick={handleCloseSalonDetailsModal} className="px-4 py-2 bg-gray-100 rounded-md">Закрыть</button></div>
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