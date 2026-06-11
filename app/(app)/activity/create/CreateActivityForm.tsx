'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps'
import type { MapMouseEvent } from '@vis.gl/react-google-maps'
import { createClient } from '@/lib/supabase/client'
import { inviteTeamToActivity } from '@/app/actions/teams'
import type { Category, Team, LatLng } from '@/types'
import CategorySelect from '@/components/Activity/CategorySelect'
import Link from 'next/link'

const BAQ_CENTER: LatLng = { lat: 10.9685, lng: -74.7813 }

// ─── Known parks & places in Barranquilla (quick shortcuts) ──────────────────
const QUICK_PLACES = [
  { name: 'Parque Estadio Romelio Martínez', lat: 10.9999, lng: -74.8098 },
  { name: 'Parque Cultural del Caribe', lat: 10.9874, lng: -74.8033 },
  { name: 'Parque Metropolitano Las Américas', lat: 11.0050, lng: -74.8312 },
  { name: 'Parque Sagrado Corazón', lat: 11.0100, lng: -74.8204 },
  { name: 'Parque Olaya Herrera', lat: 10.9806, lng: -74.7917 },
  { name: 'La Loma del Peyé', lat: 10.9985, lng: -74.8152 },
  { name: 'Malecón del Río', lat: 10.9930, lng: -74.7968 },
  { name: 'Parque Los Fundadores', lat: 10.9740, lng: -74.7960 },
]

type Props = {
  categories: Category[]
  userTeams: Team[]
  userId: string
}

// ─── Default form state ───────────────────────────────────────────────────────
const DEFAULT_FORM = {
  title: '',
  categoryIds: [] as string[],
  teamId: '',
  scheduledAt: '',
  maxParticipants: 10,
  description: '',
  isFree: true,
  cost: '',
}

// ─── Inner form (needs to be inside APIProvider to use map hooks) ─────────────
function FormInner({ categories, userTeams, userId }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const map = useMap('create-map')
  const placesLib = useMapsLibrary('places')
  const geocodingLib = useMapsLibrary('geocoding')

  const searchInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  const [form, setForm] = useState(DEFAULT_FORM)
  const [location, setLocation] = useState<{
    name: string
    address: string
    lat: number
    lng: number
  } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = useCallback(
    <K extends keyof typeof DEFAULT_FORM>(key: K, value: (typeof DEFAULT_FORM)[K]) =>
      setForm(prev => ({ ...prev, [key]: value })),
    []
  )

  // ── Init Google Places Autocomplete ───────────────────────────────────────
  useEffect(() => {
    if (!placesLib || !searchInputRef.current) return

    const bounds = new google.maps.LatLngBounds(
      { lat: 10.8000, lng: -75.0500 },
      { lat: 11.1500, lng: -74.6000 }
    )

    autocompleteRef.current = new placesLib.Autocomplete(searchInputRef.current, {
      bounds,
      strictBounds: false,
      fields: ['geometry', 'name', 'formatted_address'],
      componentRestrictions: { country: 'co' },
    })

    const listener = autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current!.getPlace()
      if (!place.geometry?.location) return

      const lat = place.geometry.location.lat()
      const lng = place.geometry.location.lng()
      const name = place.name ?? place.formatted_address ?? ''
      const address = place.formatted_address ?? ''

      setLocation({ name, address, lat, lng })
      setSearchQuery(name)

      if (place.geometry.viewport) {
        map?.fitBounds(place.geometry.viewport)
      } else {
        map?.panTo({ lat, lng })
        map?.setZoom(17)
      }
    })

    return () => { google.maps.event.removeListener(listener) }
  }, [placesLib, map])

  // ── Quick place selection ─────────────────────────────────────────────────
  const selectQuickPlace = useCallback((place: typeof QUICK_PLACES[0]) => {
    setLocation({ name: place.name, address: place.name, lat: place.lat, lng: place.lng })
    setSearchQuery(place.name)
    map?.panTo({ lat: place.lat, lng: place.lng })
    map?.setZoom(17)
  }, [map])

  // ── Reverse geocode a coordinate ─────────────────────────────────────────
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (!geocodingLib) return { name: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, address: '' }
    const geocoder = new geocodingLib.Geocoder()
    const { results } = await geocoder.geocode({ location: { lat, lng } })
    if (results[0]) {
      return {
        name: results[0].address_components[0]?.long_name ?? results[0].formatted_address,
        address: results[0].formatted_address,
      }
    }
    return { name: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, address: '' }
  }, [geocodingLib])

  // ── Marker drag → reverse geocode ────────────────────────────────────────
  const handleMarkerDrag = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return
    const lat = e.latLng.lat()
    const lng = e.latLng.lng()
    setLocation(prev => prev ? { ...prev, lat, lng } : { name: '', address: '', lat, lng })
    const { name, address } = await reverseGeocode(lat, lng)
    setLocation(prev => prev ? { ...prev, name: prev.name || name, address } : { name, address, lat, lng })
  }, [reverseGeocode])

  // ── Map click → place pin ─────────────────────────────────────────────────
  const handleMapClick = useCallback(async (e: MapMouseEvent) => {
    const latLng = e.detail.latLng
    if (!latLng) return
    const lat = latLng.lat
    const lng = latLng.lng
    const { name, address } = await reverseGeocode(lat, lng)
    setLocation({ name, address, lat, lng })
    setSearchQuery(name)
    map?.panTo({ lat, lng })
  }, [reverseGeocode, map])

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!location) { setError('Selecciona una ubicación'); return }
    if (form.categoryIds.length === 0) { setError('Selecciona al menos una categoría'); return }

    setLoading(true)
    setError('')

    try {
      const category_ids = form.categoryIds
      const team_id = form.teamId

      const { data: activity, error: insertError } = await supabase
        .from('activities')
        .insert({
          title: form.title.trim(),
          description: form.description.trim() || null,
          location_name: location.name,
          location_address: location.address || location.name,
          lat: location.lat,
          lng: location.lng,
          scheduled_at: new Date(form.scheduledAt).toISOString(),
          max_participants: form.maxParticipants,
          is_free: form.isFree,
          cost: form.isFree ? null : Number(form.cost) || 0,
          creator_id: userId,
          status: 'open',
          category_id: category_ids[0] ?? null,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Insert categories
      if (category_ids.length > 0) {
        await supabase
          .from('activity_categories')
          .insert(category_ids.map(cid => ({ activity_id: activity.id, category_id: cid })))
      }

      // Auto-join creator
      await supabase
        .from('activity_participants')
        .insert({ activity_id: activity.id, user_id: userId })

      // Invite team
      if (team_id) {
        await inviteTeamToActivity(activity.id, team_id)
      }

      router.push(`/activity/${activity.id}`)
    } catch (e: any) {
      setError(e.message ?? 'Error al crear la actividad')
      setLoading(false)
    }
  }

  const minDateTime = new Date()
  minDateTime.setMinutes(minDateTime.getMinutes() + 30)
  const minStr = minDateTime.toISOString().slice(0, 16)

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6 pb-20 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/map"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          ←
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nueva actividad</h1>
          <p className="text-sm text-gray-400">Completa los detalles de tu actividad</p>
        </div>
      </div>

      {/* ── SECCIÓN 1: Ubicación ─────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-sm font-bold text-gray-700 mb-1">
            📍 Ubicación <span className="text-red-500">*</span>
          </h2>
          <p className="text-xs text-gray-400 mb-3">
            Busca un lugar, elige un parque conocido o toca el mapa
          </p>

          {/* Places search input */}
          <div className="relative mb-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar lugar o dirección..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick place shortcuts */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {QUICK_PLACES.map(place => (
              <button
                key={place.name}
                type="button"
                onClick={() => selectQuickPlace(place)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  location?.name === place.name
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {place.name.replace('Parque ', '').replace(' Barranquilla', '')}
              </button>
            ))}
          </div>
        </div>

        {/* Mini map */}
        <div className="h-56 relative">
          <Map
            id="create-map"
            defaultCenter={BAQ_CENTER}
            defaultZoom={13}
            mapId="create-activity-map"
            gestureHandling="greedy"
            disableDefaultUI
            onClick={handleMapClick}
            className="w-full h-full"
          >
            {location && (
              <AdvancedMarker
                position={{ lat: location.lat, lng: location.lng }}
                draggable
                onDragEnd={handleMarkerDrag}
              />
            )}
          </Map>
          {!location && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow text-xs text-gray-500 font-medium">
                Toca el mapa para colocar la actividad
              </div>
            </div>
          )}
        </div>

        {/* Selected location display */}
        {location && (
          <div className="px-5 py-3 border-t border-gray-50 bg-blue-50/50">
            <div className="flex items-start gap-2">
              <span className="text-blue-500 text-sm mt-0.5">📍</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{location.name}</p>
                {location.address && location.address !== location.name && (
                  <p className="text-xs text-gray-500 truncate">{location.address}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setLocation(null); setSearchQuery('') }}
                className="text-gray-400 hover:text-gray-600 text-xs flex-shrink-0"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── SECCIÓN 2: Detalles básicos ──────────────────────────────────────── */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
        <h2 className="text-sm font-bold text-gray-700">📝 Detalles</h2>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={80}
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="ej. Partido de fútbol 5v5 — buscamos gente"
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Categorías <span className="text-red-500">*</span>
          </label>
          <CategorySelect
            categories={categories}
            value={form.categoryIds}
            onChange={ids => set('categoryIds', ids)}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Descripción <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Nivel requerido, qué llevar, punto de encuentro exacto..."
            rows={3}
            maxLength={500}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-right text-xs text-gray-400 mt-1">{form.description.length}/500</p>
        </div>
      </section>

      {/* ── SECCIÓN 3: Fecha, cupos y costo ──────────────────────────────────── */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
        <h2 className="text-sm font-bold text-gray-700">🗓 Cuándo y cuántos</h2>

        {/* Date/time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Fecha y hora <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            required
            min={minStr}
            value={form.scheduledAt}
            onChange={e => set('scheduledAt', e.target.value)}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Max participants */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Máximo de participantes:{' '}
            <span className="text-blue-600 font-bold text-base">{form.maxParticipants}</span>
          </label>
          <input
            type="range"
            min={2}
            max={50}
            value={form.maxParticipants}
            onChange={e => set('maxParticipants', Number(e.target.value))}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>2 personas</span>
            <span>50 personas</span>
          </div>
        </div>

        {/* Cost */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Costo</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => set('isFree', true)}
              className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                form.isFree
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              🆓 Gratis
            </button>
            <button
              type="button"
              onClick={() => set('isFree', false)}
              className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                !form.isFree
                  ? 'border-amber-400 bg-amber-50 text-amber-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              💰 Con costo
            </button>
          </div>
          {!form.isFree && (
            <div className="mt-2 relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">$</span>
              <input
                type="number"
                min={0}
                step={1000}
                value={form.cost}
                onChange={e => set('cost', e.target.value)}
                placeholder="0"
                className="w-full pl-7 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </section>

      {/* ── SECCIÓN 4: Equipo ────────────────────────────────────────────────── */}
      {userTeams.length > 0 && (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-1">🏆 Invitar equipo</h2>
          <p className="text-xs text-gray-400 mb-3">
            Los miembros del equipo recibirán una invitación automática
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => set('teamId', '')}
              className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                !form.teamId
                  ? 'border-gray-400 bg-gray-100 text-gray-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              Ninguno
            </button>
            {userTeams.map(team => {
              const active = form.teamId === team.id
              const memberCount = (team.members ?? []).filter(m => m.status === 'accepted').length
              return (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => set('teamId', active ? '' : team.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                    active
                      ? 'border-transparent text-white shadow-sm'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                  style={active ? { backgroundColor: team.color } : {}}
                >
                  <span className="text-base">{team.emoji}</span>
                  <span>{team.name}</span>
                  {memberCount > 1 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {memberCount - 1} {memberCount - 1 === 1 ? 'miembro' : 'miembros'}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Error & Submit ───────────────────────────────────────────────────── */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !form.title.trim() || form.categoryIds.length === 0 || !form.scheduledAt || !location}
        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-base hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Creando actividad...
          </span>
        ) : (
          '✓ Publicar actividad'
        )}
      </button>
    </form>
  )
}

// ─── Root export (wraps with APIProvider) ────────────────────────────────────
export default function CreateActivityForm(props: Props) {
  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!}
      libraries={['places', 'geocoding']}
    >
      <FormInner {...props} />
    </APIProvider>
  )
}
