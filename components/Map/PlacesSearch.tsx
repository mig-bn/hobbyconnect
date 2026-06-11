'use client'

import { useEffect, useRef } from 'react'
import { useMapsLibrary, useMap } from '@vis.gl/react-google-maps'

// Barranquilla bounding box
const BAQ_BOUNDS = {
  north: 11.0500,
  south: 10.9000,
  east: -74.6800,
  west: -74.9200,
}

export default function PlacesSearch() {
  const map = useMap('main-map')
  const places = useMapsLibrary('places')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!places || !inputRef.current || !map) return

    const bounds = new google.maps.LatLngBounds(
      { lat: BAQ_BOUNDS.south, lng: BAQ_BOUNDS.west },
      { lat: BAQ_BOUNDS.north, lng: BAQ_BOUNDS.east }
    )

    const autocomplete = new places.Autocomplete(inputRef.current, {
      bounds,
      strictBounds: false, // suggest within bounds but allow outside if no results
      fields: ['geometry', 'name', 'formatted_address'],
      componentRestrictions: { country: 'co' },
    })

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (place.geometry?.viewport) {
        map.fitBounds(place.geometry.viewport)
      } else if (place.geometry?.location) {
        map.panTo(place.geometry.location)
        map.setZoom(16)
      }
    })

    return () => {
      google.maps.event.removeListener(listener)
    }
  }, [places, map])

  return (
    <div className="absolute top-3 left-3 right-3 md:left-1/2 md:-translate-x-1/2 md:w-[420px] md:right-auto z-10">
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          🔍
        </span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar lugar en Barranquilla..."
          className="
            w-full pl-9 pr-10 py-2.5
            bg-white rounded-2xl
            shadow-lg border border-gray-200
            text-sm text-gray-800 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-shadow
          "
        />
        {/* Clear button — handled by browser since type=text */}
      </div>
    </div>
  )
}
