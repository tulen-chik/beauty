'use client';

import { ReactNode } from 'react';

import {
   AdminProvider,
   AppointmentProvider,
   BlogAdminProvider,
   ChatProvider,
   DatabaseProvider,
   GeolocationProvider,
   PromotionProvider,
   SalonInvitationProvider,
   SalonProvider,
   SalonRatingProvider,
   SalonScheduleProvider,
   SalonServiceProvider,
   ServiceCategoryProvider,
   SubscriptionProvider,
   UserProvider
  } from '@/contexts';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <DatabaseProvider>
      <GeolocationProvider locale="ru"> 
      <UserProvider>
        <SalonProvider>
          <SalonInvitationProvider>
            <ServiceCategoryProvider>
              <SalonServiceProvider>
                <SalonScheduleProvider>
                  <AppointmentProvider>
                    <ChatProvider>
                      <SalonRatingProvider>
                        <PromotionProvider>
                          <AdminProvider>
                            <BlogAdminProvider>
                              <SubscriptionProvider>
                                {children}
                              </SubscriptionProvider>
                            </BlogAdminProvider>
                          </AdminProvider>
                        </PromotionProvider>
                      </SalonRatingProvider>
                    </ChatProvider>
                  </AppointmentProvider>
                </SalonScheduleProvider>
              </SalonServiceProvider>
            </ServiceCategoryProvider>
          </SalonInvitationProvider>
        </SalonProvider>
      </UserProvider>
      </GeolocationProvider>
    </DatabaseProvider>
  );
} 