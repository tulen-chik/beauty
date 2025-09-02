"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { 
  Users, 
  Building2, 
  Scissors, 
  Tag, 
  UserPlus, 
  TrendingUp, 
  Activity,
  Calendar,
  MessageCircle,
  Star,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import { useAdmin } from "@/contexts/AdminContext"
import { useUser } from "@/contexts/UserContext"
import Link from "next/link"

export default function AdminDashboard() {
  const t = useTranslations('admin')
  const { currentUser } = useUser()
  const { 
    stats, 
    refreshStats, 
    loading, 
    error 
  } = useAdmin()

  useEffect(() => {
    refreshStats()
  }, [refreshStats])



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ошибка</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: "Пользователи",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "blue",
      href: "/admin/users"
    },
    {
      title: "Салоны",
      value: stats?.totalSalons || 0,
      icon: Building2,
      color: "green",
      href: "/admin/salons"
    },
    {
      title: "Услуги",
      value: stats?.totalServices || 0,
      icon: Scissors,
      color: "purple",
      href: "/admin/services"
    },
    {
      title: "Категории",
      value: stats?.totalCategories || 0,
      icon: Tag,
      color: "orange",
      href: "/admin/categories"
    },
    {
      title: "Приглашения",
      value: stats?.totalInvitations || 0,
      icon: UserPlus,
      color: "pink",
      href: "/admin/invitations"
    },
    {
      title: "Активные салоны",
      value: stats?.activeSalons || 0,
      icon: CheckCircle,
      color: "emerald",
      href: "/admin/salons?filter=active"
    }
  ]

  const colorClasses = {
    blue: "bg-blue-500 text-white",
    green: "bg-green-500 text-white",
    purple: "bg-purple-500 text-white",
    orange: "bg-orange-500 text-white",
    pink: "bg-pink-500 text-white",
    emerald: "bg-emerald-500 text-white"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Админ панель</h1>
              <p className="text-gray-600 mt-1">Управление системой Beauty Platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Добро пожаловать, {currentUser?.displayName}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Link
              key={index}
              href={stat.href}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 p-6"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Users */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Последние пользователи</h3>
            </div>
            <div className="p-6">
              {stats?.recentUsers && stats.recentUsers.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentUsers.map((user, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-gray-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.displayName}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {user.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Нет данных</p>
              )}
            </div>
          </div>

          {/* Recent Salons */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Последние салоны</h3>
            </div>
            <div className="p-6">
              {stats?.recentSalons && stats.recentSalons.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentSalons.map((salon, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-gray-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {salon.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {salon.address}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Нет данных</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Быстрые действия</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/admin/users"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <Users className="h-5 w-5 text-blue-500 mr-3" />
                <span className="text-sm font-medium text-gray-900">Управление пользователями</span>
              </Link>
              <Link
                href="/admin/salons"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <Building2 className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-sm font-medium text-gray-900">Управление салонами</span>
              </Link>
              <Link
                href="/admin/content"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <MessageCircle className="h-5 w-5 text-purple-500 mr-3" />
                <span className="text-sm font-medium text-gray-900">Управление контентом</span>
              </Link>
              <Link
                href="/admin/settings"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <Activity className="h-5 w-5 text-orange-500 mr-3" />
                <span className="text-sm font-medium text-gray-900">Системные настройки</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
