// Google Analytics utility functions

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || '';

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_location: url,
    });
  }
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({ action, category, label, value }: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Custom events for beauty platform
export const trackBooking = (serviceName: string, salonName: string) => {
  event({
    action: 'booking_initiated',
    category: 'engagement',
    label: `${serviceName} at ${salonName}`,
  });
};

export const trackSearch = (query: string, resultsCount: number) => {
  event({
    action: 'search',
    category: 'engagement',
    label: query,
    value: resultsCount,
  });
};

export const trackSalonView = (salonName: string) => {
  event({
    action: 'salon_view',
    category: 'engagement',
    label: salonName,
  });
};

export const trackRegistration = (userType: 'client' | 'professional') => {
  event({
    action: 'registration',
    category: 'conversion',
    label: userType,
  });
};
