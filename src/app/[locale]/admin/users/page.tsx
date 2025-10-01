"use client"

import { 
  ArrowRight,
  Building2,
  Calendar, 
  Eye,
  MapPin,
  Plus,
  Search, 
  Trash2,
  UserPlus,
  Users,
  X} from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useCallback,useEffect, useState } from "react"

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
  const { 
    users, 
    loadUsers, 
    updateUser, 
    deleteUser, 
    loading, 
    error 
  } = useAdmin()

  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCreateSalonModal, setShowCreateSalonModal] = useState(false)
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const [userSalons, setUserSalons] = useState<Salon[]>([])
  const [loadingSalons, setLoadingSalons] = useState(false)
  const { fetchUserSalons, fetchSalon } = useSalon()

  useEffect(() => {
    loadUsers()
  }, [loadUsers])



  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" 
    
    return matchesSearch && matchesRole && matchesStatus
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
    try {
      setLoadingSalons(true)
      const userSalonsData = await fetchUserSalons(userId)
      if (userSalonsData?.salons?.length) {
        // Fetch full salon details and add the ID to each object
        const salons = await Promise.all(
          userSalonsData.salons.map(async (salonRef) => {
            const salonData = await fetchSalon(salonRef.salonId);
            if (salonData) {
              // Here is the fix: combine the data with the ID
              return { ...salonData, id: salonRef.salonId };
            }
            return null;
          })
        );
        // The filter for `Boolean` now correctly removes any nulls
        setUserSalons(salons.filter(Boolean) as Salon[]);
      } else {
        setUserSalons([])
      }
    } catch (error) {
      console.error('Error loading user salons:', error)
      setUserSalons([])
    } finally {
      setLoadingSalons(false)
    }
  }, [fetchUserSalons, fetchSalon])

  useEffect(() => {
    if (showUserModal && selectedUser) {
      loadUserSalons(selectedUser.id)
    } else {
      setUserSalons([])
    }
  }, [showUserModal, selectedUser, loadUserSalons])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'salon_owner':
        return 'bg-blue-100 text-blue-800'
      case 'salon_staff':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Администратор'
      case 'salon_owner':
        return 'Владелец салона'
      case 'salon_staff':
        return 'Сотрудник салона'
      default:
        return 'Пользователь'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="h-8 w-8 text-blue-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Загрузка пользователей...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Управление пользователями</h1>
            <p className="text-gray-600 mt-1">Просмотр и управление всеми пользователями системы</p>
          </div>
          <button
            onClick={() => setShowCreateUserModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Добавить пользователя
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
                  placeholder="Поиск пользователей..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Все роли</option>
                <option value="admin">Администраторы</option>
                <option value="salon_owner">Владельцы салонов</option>
                <option value="salon_staff">Сотрудники салонов</option>
                <option value="user">Пользователи</option>
              </select>

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
                Найдено: {filteredUsers.length} пользователей
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Пользователь
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Роль
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата регистрации
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Последний вход
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.avatarUrl ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={user.avatarUrl}
                              alt={user.displayName}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <Users className="h-5 w-5 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.displayName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Просмотр"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowCreateSalonModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Добавить салон"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
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

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Пользователи не найдены</h3>
              <p className="text-gray-500">Попробуйте изменить параметры поиска</p>
            </div>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Информация о пользователе</h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-12 w-12">
                    {selectedUser.avatarUrl ? (
                      <img
                        className="h-12 w-12 rounded-full"
                        src={selectedUser.avatarUrl}
                        alt={selectedUser.displayName}
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                        <Users className="h-6 w-6 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-lg font-medium text-gray-900">
                      {selectedUser.displayName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedUser.email}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Роль</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(selectedUser.role)}`}>
                      {getRoleLabel(selectedUser.role)}
                    </span>
                  </div>
                  
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Дата регистрации</label>
                  <p className="text-sm text-gray-900 flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                    {formatDate(selectedUser.createdAt)}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Салоны пользователя</h4>
                  {loadingSalons ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                    </div>
                  ) : userSalons.length > 0 ? (
                    <div className="space-y-3">
                      {userSalons.map((salon) => (
                        <Link 
                          key={salon.id} 
                          href={`/admin/salons/${salon.id}/services`}
                          className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-medium text-gray-900">{salon.name}</h5>
                              <p className="text-sm text-gray-500 flex items-center mt-1">
                                <MapPin className="h-3.5 w-3.5 mr-1" />
                                {salon.address}
                              </p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-gray-50 rounded-lg">
                      <Building2 className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">У пользователя пока нет салонов</p>
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserModal(false)
                          setShowCreateSalonModal(true)
                        }}
                        className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Добавить салон
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowUserModal(false)}
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
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Удалить пользователя
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Вы уверены, что хотите удалить пользователя <strong>{selectedUser.displayName}</strong>? 
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
                  onClick={() => handleDeleteUser(selectedUser.id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Salon Modal */}
      {showCreateSalonModal && selectedUser && (
        <CreateSalonModal
          isOpen={showCreateSalonModal}
          onClose={() => {
            setShowCreateSalonModal(false);
            setSelectedUser(null);
          }}
          userId={selectedUser.id}
          userName={selectedUser.displayName}
        />
      )}

      {/* Create User Modal */}
      <CreateUserModal 
        isOpen={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
      />
    </div>
  )
}
