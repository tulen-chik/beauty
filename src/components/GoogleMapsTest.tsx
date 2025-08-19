"use client"

import { useEffect, useState } from 'react'

export const GoogleMapsTest = () => {
  const [status, setStatus] = useState<string>('Checking...')
  const [details, setDetails] = useState<any>({})

  useEffect(() => {
    const checkGoogleMaps = async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      
      setDetails({
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey?.length,
        apiKeyStart: apiKey?.substring(0, 10),
        isDefaultKey: apiKey === 'YOUR_GOOGLE_MAPS_API_KEY' || apiKey === 'your_google_maps_api_key_here',
        windowGoogle: !!window.google,
        windowGoogleMaps: !!window.google?.maps
      })

      if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY' || apiKey === 'your_google_maps_api_key_here') {
        setStatus('❌ API key not configured')
        return
      }

      if (window.google?.maps) {
        setStatus('✅ Google Maps already loaded')
        return
      }

      try {
        setStatus('🔄 Loading Google Maps...')
        
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
        script.async = true
        script.defer = true
        
        const loadPromise = new Promise<void>((resolve, reject) => {
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Script load failed'))
        })

        document.head.appendChild(script)
        
        await loadPromise
        
        if (window.google?.maps) {
          setStatus('✅ Google Maps loaded successfully')
        } else {
          setStatus('❌ Google Maps failed to initialize')
        }
      } catch (error) {
        setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    checkGoogleMaps()
  }, [])

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="font-semibold mb-2">Google Maps Test</h3>
      <p className="mb-2">{status}</p>
      <details className="text-sm">
        <summary className="cursor-pointer">Technical Details</summary>
        <pre className="mt-2 bg-white p-2 rounded text-xs overflow-auto">
          {JSON.stringify(details, null, 2)}
        </pre>
      </details>
    </div>
  )
}
