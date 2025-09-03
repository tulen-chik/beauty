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
   AppointmentProvider,
   ChatProvider,
   SalonRatingProvider,
   AdminProvider,
   BlogAdminProvider
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
                      <ChatProvider>
                        <SalonRatingProvider>
                          <AdminProvider>
                            <BlogAdminProvider>
                              {children}
                            </BlogAdminProvider>
                          </AdminProvider>
                        </SalonRatingProvider>
                      </ChatProvider>
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