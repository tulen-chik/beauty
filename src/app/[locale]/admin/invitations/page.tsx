"use client"

import { 
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  Mail,
  Search,
  Trash2,
  UserPlus, 
  X,
  XCircle} from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

import { useAdmin } from "@/contexts/AdminContext"
import { useUser } from "@/contexts/UserContext"

export default function AdminInvitationsPage() {
  const t = useTranslations('admin')
  const { currentUser } = useUser()
  const { 
    invitations, 
    loadInvitations, 
    updateInvitation, 
    deleteInvitation, 
    loading, 
    error 
  } = useAdmin()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedInvitation, setSelectedInvitation] = useState<any>(null)
  const [showInvitationModal, setShowInvitationModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    loadInvitations()
  }, [loadInvitations])



  const filteredInvitations = invitations.filter(invitation => {
    const matchesSearch = invitation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (invitation.salonId && invitation.salonId.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || invitation.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleUpdateInvitationStatus = async (invitationId: string, status: string) => {
    try {
      await updateInvitation(invitationId, { status: status as "pending" | "accepted" | "declined" | "expired" })
    } catch (error) {
      console.error('Error updating invitation:', error)
    }
  }

  const handleDeleteInvitation = async (invitationId: string) => {
    try {
      await deleteInvitation(invitationId)
      setShowDeleteModal(false)
      setSelectedInvitation(null)
    } catch (error) {
      console.error('Error deleting invitation:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'declined':
        return 'bg-red-100 text-red-800'
      case 'expired':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Ожидает'
      case 'accepted':
        return 'Принято'
      case 'declined':
        return 'Отклонено'
      case 'expired':
        return 'Истекло'
      default:
        return status
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Владелец'
      case 'admin':
        return 'Администратор'
      case 'staff':
        return 'Сотрудник'
      default:
        return role
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <UserPlus className="h-8 w-8 text-blue-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Загрузка приглашений...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Управление приглашениями</h1>
          <p className="text-gray-600 mt-1">Просмотр и управление приглашениями в салоны</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-500 text-white">
                <UserPlus className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Всего приглашений</p>
                <p className="text-2xl font-bold text-gray-900">{invitations.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-500 text-white">
                <Clock className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ожидают</p>
                <p className="text-2xl font-bold text-gray-900">
                  {invitations.filter(i => i.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-500 text-white">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Принято</p>
                <p className="text-2xl font-bold text-gray-900">
                  {invitations.filter(i => i.status === 'accepted').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-500 text-white">
                <XCircle className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Отклонено</p>
                <p className="text-2xl font-bold text-gray-900">
                  {invitations.filter(i => i.status === 'declined').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск приглашений..."
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
                <option value="pending">Ожидают</option>
                <option value="accepted">Принято</option>
                <option value="declined">Отклонено</option>
                <option value="expired">Истекло</option>
              </select>

              {/* Results count */}
              <div className="flex items-center text-sm text-gray-500">
                Найдено: {filteredInvitations.length} приглашений
              </div>
            </div>
          </div>
        </div>

        {/* Invitations Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Салон
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Роль
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата отправки
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvitations.map((invitation) => (
                  <tr key={invitation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <Mail className="h-5 w-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {invitation.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {invitation.salonId}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getRoleLabel(invitation.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                        {getStatusLabel(invitation.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(invitation.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedInvitation(invitation)
                            setShowInvitationModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {invitation.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateInvitationStatus(invitation.id, 'accepted')}
                              className="text-green-600 hover:text-green-900"
                              title="Принять"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleUpdateInvitationStatus(invitation.id, 'declined')}
                              className="text-red-600 hover:text-red-900"
                              title="Отклонить"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setSelectedInvitation(invitation)
                            setShowDeleteModal(true)
                          }}
                          className="text-red-600 hover:text-red-900"
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

          {filteredInvitations.length === 0 && (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Приглашения не найдены</h3>
              <p className="text-gray-500">Попробуйте изменить параметры поиска</p>
            </div>
          )}
        </div>
      </div>

      {/* Invitation Details Modal */}
      {showInvitationModal && selectedInvitation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Информация о приглашении</h3>
                <button
                  onClick={() => setShowInvitationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">{selectedInvitation.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Салон ID</label>
                  <p className="text-sm text-gray-900">{selectedInvitation.salonId}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Роль</label>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getRoleLabel(selectedInvitation.role)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Статус</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedInvitation.status)}`}>
                      {getStatusLabel(selectedInvitation.status)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Дата отправки</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedInvitation.createdAt)}</p>
                </div>

                {selectedInvitation.expiresAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Истекает</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedInvitation.expiresAt)}</p>
                  </div>
                )}

                {selectedInvitation.message && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Сообщение</label>
                    <p className="text-sm text-gray-900">{selectedInvitation.message}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowInvitationModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Закрыть
                </button>
                {selectedInvitation.status === 'pending' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        handleUpdateInvitationStatus(selectedInvitation.id, 'accepted')
                        setShowInvitationModal(false)
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
                    >
                      Принять
                    </button>
                    <button
                      onClick={() => {
                        handleUpdateInvitationStatus(selectedInvitation.id, 'declined')
                        setShowInvitationModal(false)
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                    >
                      Отклонить
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedInvitation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Удалить приглашение
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Вы уверены, что хотите удалить приглашение для <strong>{selectedInvitation.email}</strong>? 
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
                  onClick={() => handleDeleteInvitation(selectedInvitation.id)}
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
