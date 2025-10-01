'use client';

import { ReactNode } from 'react';

import {
   AdminProvider,
   AppointmentProvider,
   BlogAdminProvider,
   ChatProvider,
   DatabaseProvider,
   PromotionProvider,
   SalonInvitationProvider,
   SalonProvider,
   SalonRatingProvider,
   SalonScheduleProvider,
   SalonServiceProvider,
   ServiceCategoryProvider,
   SubscriptionProvider,
   UserProvider   } from '@/contexts';

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