"use client"

import { Clock } from "lucide-react"
import Image from "next/image"

type Service = {
  id: string
  salonId: string
  name: string
  description?: string
  price: number
  durationMinutes: number
}

type BookingHeaderProps = {
  service: Service | null
  salon: any
  previewUrl: string
  t: any
}

export default function BookingHeader({ service, salon, previewUrl, t }: BookingHeaderProps) {
  return (
    <div className="p-4 border-b border-gray-200 flex items-center gap-4">
      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
        <Image src={previewUrl || "/placeholder.svg"} alt={service?.name || "service"} fill className="object-cover" />
      </div>
      <div className="flex-1">
        <div className="text-lg font-bold text-gray-900">{service?.name}</div>
        {salon && (
          <div className="text-sm text-gray-600">{salon.name}{salon.address ? ` • ${salon.address}` : ""}</div>
        )}
        {service?.durationMinutes && (
          <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{service.durationMinutes} {t('header.minutes')}</span>
          </div>
        )}
      </div>
      {service?.price !== undefined && (
        <div className="text-rose-600 font-bold">{service.price} {"Br"}</div>
      )}
    </div>
  )
}
