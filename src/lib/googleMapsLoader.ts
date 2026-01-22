let promise: Promise<void> | null = null;

export const loadGoogleMapsApi = (): Promise<void> => {
  if (typeof window === 'undefined') {
    return new Promise(() => {});
  }

  if (window.google?.maps) {
    return Promise.resolve();
  }

  if (promise) {
    return promise;
  }

  promise = new Promise<void>((resolve, reject) => {
    const scriptId = "google-maps-script";
    const callbackName = "googleMapsApiLoaded";

    if (document.getElementById(scriptId)) {
      if (window.google?.maps) {
        resolve();
        return;
      }
    }

    (window as any)[callbackName] = () => {
      resolve();
      delete (window as any)[callbackName];
    };

    const script = document.createElement("script");
    script.id = scriptId;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey.includes("YOUR_GOOGLE_MAPS_API_KEY")) {
      reject(new Error("Invalid or missing Google Maps API key."));
      delete (window as any)[callbackName];
      return;
    }

    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      script.remove();
      reject(new Error("Failed to load Google Maps script."));
      delete (window as any)[callbackName];
    };

    document.head.appendChild(script);
  });

  return promise;
};