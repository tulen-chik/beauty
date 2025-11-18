"use client"

const AppointmentCardSkeleton = () => (
  <div className="border border-gray-200 rounded-lg p-4 animate-pulse">
    <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
      <div className="space-y-4 flex-1">
        <div className="h-5 w-1/2 bg-gray-200 rounded"></div>
        <div className="h-5 w-3/4 bg-gray-200 rounded"></div>
        <div className="h-5 w-1/2 bg-gray-200 rounded"></div>
        <div className="h-5 w-5/6 bg-gray-200 rounded"></div>
      </div>
      <div className="flex-shrink-0 mt-4 sm:mt-0">
        <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
    <div className="mt-6 pt-4 border-t border-gray-100">
      <div className="flex items-center gap-3">
        <div className="h-10 w-36 bg-gray-200 rounded-lg"></div>
        <div className="h-10 w-36 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  </div>
);

export const AppointmentListSkeleton = () => (
  <div className="p-3 sm:p-4 space-y-4">
    <AppointmentCardSkeleton />
  </div>
);

export const ProfilePageSkeleton = () => (
  <div className="min-h-screen bg-gray-50 animate-pulse">
    <div className="max-w-4xl mx-auto p-3 sm:p-4">
      <div className="mb-4 sm:mb-6">
        <div className="h-8 w-1/3 bg-gray-300 rounded-lg"></div>
        <div className="h-5 w-1/2 bg-gray-200 rounded-md mt-2"></div>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl mb-4 sm:mb-6">
        <div className="p-3 sm:p-4 border-b border-gray-200">
          <div className="h-6 w-1/4 bg-gray-300 rounded-lg"></div>
        </div>
        <div className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl">
                <div className="p-2 bg-gray-200 rounded-lg w-12 h-12"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl mb-4 sm:mb-6">
        <div className="p-3 sm:p-4 border-b border-gray-200">
          <div className="h-6 w-1/4 bg-gray-300 rounded-lg"></div>
        </div>
        <div className="p-3 sm:p-4 space-y-4">
          <div className="h-5 w-24 bg-gray-200 rounded-md mb-2"></div>
          <div className="h-10 w-full max-w-sm bg-gray-200 rounded-lg"></div>
          <div className="pt-2">
            <div className="h-10 w-36 bg-gray-300 rounded-lg"></div>
          </div>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl">
        <div className="p-3 sm:p-4 border-b border-gray-200">
          <div className="h-6 w-1/4 bg-gray-300 rounded-lg"></div>
        </div>
        <AppointmentListSkeleton />
      </div>
    </div>
  </div>
);