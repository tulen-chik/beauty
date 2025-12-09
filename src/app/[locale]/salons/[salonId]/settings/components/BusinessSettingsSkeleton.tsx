"use client"

import { Building2 } from "lucide-react"

export default function BusinessSettingsSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-gray-300" />
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
      <div className="p-4 sm:p-6 space-y-8">
        {/* Avatar Skeleton */}
        <div>
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-3"></div>
          <div className="flex items-center gap-5">
            <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-gray-200 animate-pulse"></div>
            <div className="flex flex-col gap-2">
              <div className="h-9 w-32 bg-gray-100 rounded-lg animate-pulse"></div>
              <div className="h-9 w-28 bg-gray-100 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Form Fields Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          <div>
            <div className="h-5 w-20 bg-gray-200 rounded animate-pulse mb-1.5"></div>
            <div className="h-11 w-full bg-gray-100 rounded-lg animate-pulse"></div>
          </div>
          <div>
            <div className="h-5 w-16 bg-gray-200 rounded animate-pulse mb-1.5"></div>
            <div className="h-11 w-full bg-gray-100 rounded-lg animate-pulse"></div>
          </div>
          <div className="sm:col-span-2">
            <div className="h-5 w-16 bg-gray-200 rounded animate-pulse mb-1.5"></div>
            <div className="h-11 w-full bg-gray-100 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Address Field Skeleton */}
        <div className="space-y-3">
          <div className="h-5 w-20 bg-gray-200 rounded animate-pulse mb-1.5"></div>
          <div className="h-11 w-full bg-gray-100 rounded-lg animate-pulse"></div>
        </div>

        {/* Save Button Skeleton */}
        <div className="flex justify-end pt-4 border-t border-gray-100">
          <div className="h-11 w-32 bg-gray-100 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}
