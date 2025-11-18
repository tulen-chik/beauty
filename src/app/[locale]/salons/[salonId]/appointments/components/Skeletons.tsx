"use client";

export const AppointmentCardSkeleton = () => (
  <div className="p-4 border-b border-slate-100 animate-pulse">
    <div className="flex flex-col lg:flex-row gap-4 justify-between">
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-6 w-1/3 bg-slate-200 rounded"></div>
          <div className="h-6 w-24 bg-slate-200 rounded-full"></div>
        </div>
        <div className="flex gap-4">
          <div className="h-4 w-24 bg-slate-200 rounded"></div>
          <div className="h-4 w-24 bg-slate-200 rounded"></div>
          <div className="h-4 w-16 bg-slate-200 rounded"></div>
        </div>
        <div className="h-4 w-1/2 bg-slate-200 rounded"></div>
      </div>
      <div className="flex gap-2 lg:flex-col w-full lg:w-32">
        <div className="h-9 w-full bg-slate-200 rounded-lg"></div>
        <div className="h-9 w-full bg-slate-200 rounded-lg"></div>
      </div>
    </div>
  </div>
);

export const AppointmentsPageSkeleton = () => (
  <div className="space-y-6">
    <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
    <div className="h-16 w-full bg-slate-200 rounded-xl animate-pulse"></div>
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {[...Array(5)].map((_, i) => (
        <AppointmentCardSkeleton key={i} />
      ))}
    </div>
  </div>
);