'use client';

import { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';

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
   ToastProvider,
   UserProvider
  } from '@/contexts';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
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
                                  <Toaster
                                    position="bottom-center"
                                    toastOptions={{
                                      duration: 4000,
                                      style: {
                                        background: 'white',
                                        color: '#1f2937',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '0.75rem',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                        padding: '12px 16px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                      },
                                      success: {
                                        duration: 3000,
                                        iconTheme: {
                                        primary: '#dc2626',
                                        secondary: 'white',
                                      },
                                      style: {
                                        background: '#fef2f2',
                                        color: '#991b1b',
                                        border: '1px solid #fecaca',
                                      },
                                    },
                                    error: {
                                      duration: 5000,
                                      iconTheme: {
                                        primary: '#dc2626',
                                        secondary: 'white',
                                      },
                                      style: {
                                        background: '#fef2f2',
                                        color: '#991b1b',
                                        border: '1px solid #fecaca',
                                      },
                                    },
                                    loading: {
                                      iconTheme: {
                                        primary: '#dc2626',
                                        secondary: 'white',
                                      },
                                      style: {
                                        background: 'white',
                                        color: '#1f2937',
                                        border: '1px solid #e5e7eb',
                                      },
                                    },
                                  }}
                                  />
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
    </ToastProvider>
  );
} 