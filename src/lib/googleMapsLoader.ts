let promise: Promise<void> | null = null;

export const loadGoogleMapsApi = (): Promise<void> => {
  if (typeof window === 'undefined') {
    // Return a promise that never resolves on the server
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
    
    // The script may have been loaded by other means, so we still check for its existence.
    if (document.getElementById(scriptId)) {
        // Give it a moment to load, then check for the google.maps object.
        const checkInterval = setInterval(() => {
            if (window.google?.maps) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 100);
        
        // Add a timeout to prevent an infinite loop
        setTimeout(() => {
            clearInterval(checkInterval);
            if (!window.google?.maps) {
                reject(new Error("Google Maps script exists but failed to initialize."));
            }
        }, 5000);
        return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey.includes("YOUR_GOOGLE_MAPS_API_KEY")) {
      reject(new Error("Invalid or missing Google Maps API key."));
      return;
    }

    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    const timeout = setTimeout(() => {
      script.remove();
      reject(new Error("Google Maps loading timeout."));
    }, 15000);

    script.onload = () => {
      clearTimeout(timeout);
      resolve();
    };

    script.onerror = () => {
      clearTimeout(timeout);
      script.remove();
      reject(new Error("Failed to load Google Maps script."));
    };

    document.head.appendChild(script);
  });

  return promise;
};