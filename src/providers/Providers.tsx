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
   BlogAdminProvider,
   PromotionProvider,
   SubscriptionProvider
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
    </DatabaseProvider>
  );
} 