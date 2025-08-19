'use client';

import { ReactNode } from 'react';

import {
   DatabaseProvider,
   UserProvider,
   SalonProvider,
   SalonInvitationProvider,
   ServiceCategoryProvider,
   SalonServiceProvider,
   SalonScheduleProvider,
   AppointmentProvider
   } from '@/contexts';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <DatabaseProvider>
      <UserProvider>
        <SalonProvider>
          <SalonInvitationProvider>
            <ServiceCategoryProvider>
              <SalonServiceProvider>
                <SalonScheduleProvider>
                  <AppointmentProvider>
                     {children}
                  </AppointmentProvider>
                </SalonScheduleProvider>
              </SalonServiceProvider>
            </ServiceCategoryProvider>
          </SalonInvitationProvider>
        </SalonProvider>
      </UserProvider>
    </DatabaseProvider>
  );
} 