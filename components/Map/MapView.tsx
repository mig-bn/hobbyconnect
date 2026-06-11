'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  APIProvider,
  Map,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps'
import type { MapMouseEvent } from '@vis.gl/react-google-maps'
import { createClient } from '@/lib/supabase/client'
import type { Activity, Category, CreateActivityInput, LatLng, Team } from '@/types'
import { inviteTeamToActivity } from '@/app/actions/teams'
import ActivityMarker from './ActivityMarker'
import PlacesSearch from './PlacesSearch'
import ActivityCard from '@/components/Activity/ActivityCard'
import CreateActivityModal from '@/components/Activity/CreateActivityModal'

const BAQ_CENTER: LatLng = { lat: 10.9685, lng: -74.7813 }
const INITIAL_ZOOM = 13

// ─── Side panel ───────────────────────────────────────────────────────────────

type PanelProps = {
  activities: Activity[]
  allActivities: Activity[]
  categories: Category[]
  filterCategoryIds: string[]
  onToggleCategory: (id: string) => void
  filterByInterests: boolean
  onToggleInterests: () => void
  userInterests: string[]
  searchQuery: string
  onSearchChange: (q: string) => void
  onClearAll: () => void
  selectedId: string | null
  onSelectActivity: (a: Activity) => void
  hideHeader?: boolean
}

function SidePanel({
  activities,
  allActivities,
  categories,
  filterCategoryIds,
  onToggleCategory,
  filterByInterests,
  onToggleInterests,
  userInterests,
  searchQuery,
  onSearchChange,
  onClearAll,
  selectedId,
  onSelectActivity,
  hideHeader,
}: PanelProps) {
  const hasFilters = filterCategoryIds.length > 0 || filterByInterests || searchQuery.trim() !== ''
  const isFiltered = activities.length !== allActivities.length || hasFilters

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      {!hideHeader && (
        <div className="px-4 pt-4 pb-3 flex-shrink-0 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-base">Actividades</h2>
          {hasFilters && (
            <button
              onClick={onClearAll}
              className="text-xs text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1"
            >
              ✕ Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* ── Search bar ── */}
      <div className="px-3 pb-2 flex-shrink-0">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Buscar actividades..."
            className="w-full pl-8 pr-8 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Category filters ── */}
      <div className="px-3 pb-2 flex-shrink-0 space-y-2">
        {/* Interests toggle */}
        {userInterests.length > 0 && (
          <button
            onClick={onToggleInterests}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
              filterByInterests
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <span>⭐</span>
            <span>
              {filterByInterests ? 'Mostrando mis intereses' : 'Filtrar por mis intereses'}
            </span>
            {filterByInterests && (
              <span className="ml-auto text-white/70 text-xs">✕</span>
            )}
          </button>
        )}

        {/* Multi-select chips */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map(cat => {
            const active = filterCategoryIds.includes(cat.id)
            return (
              <button
                key={cat.id}
                onClick={() => onToggleCategory(cat.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
                  active
                    ? 'text-white border-transparent shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
                style={active ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
              >
                {cat.emoji && <span>{cat.emoji}</span>}
                <span>{cat.name}</span>
              </button>
            )
          })}
        </div>

        {/* Active filters summary + clear */}
        {hasFilters && (
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-gray-400">
              {activities.length} de {allActivities.length}{' '}
              {allActivities.length === 1 ? 'actividad' : 'actividades'}
            </p>
            <button
              onClick={onClearAll}
              className="text-xs text-red-500 font-semibold hover:text-red-600 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors"
            >
              ✕ Limpiar todo
            </button>
          </div>
        )}

        {!hasFilters && (
          <p className="text-xs text-gray-400 pt-1">
            {allActivities.length}{' '}
            {allActivities.length === 1 ? 'actividad' : 'actividades'}
          </p>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="mx-3 h-px bg-gray-100 flex-shrink-0" />

      {/* ── Activity list ── */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-3 py-2 space-y-2">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-4xl mb-3">
              {searchQuery ? '🔍' : '🗺️'}
            </span>
            <p className="text-sm font-medium text-gray-500">
              {searchQuery
                ? `Sin resultados para "${searchQuery}"`
                : hasFilters
                ? 'Sin actividades con estos filtros'
                : 'No hay actividades'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {hasFilters ? (
                <button
                  onClick={onClearAll}
                  className="text-blue-500 underline"
                >
                  Limpiar filtros
                </button>
              ) : (
                'Toca el mapa para crear una'
              )}
            </p>
          </div>
        ) : (
          activities.map(activity => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              isSelected={selectedId === activity.id}
              onClick={() => onSelectActivity(activity)}
            />
          ))
        )}
      </div>

      {/* ── Mobile: clear all floating bar ── */}
      {hasFilters && hideHeader && (
        <div className="px-3 pb-3 flex-shrink-0 border-t border-gray-100 pt-2">
          <button
            onClick={onClearAll}
            className="w-full py-2 text-sm font-semibold text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
          >
            ✕ Limpiar todos los filtros
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Inner map component ──────────────────────────────────────────────────────

function MapInner() {
  const supabase = useMemo(() => createClient(), [])
  const map = useMap('main-map')
  const geocodingLib = useMapsLibrary('geocoding')
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)

  const [activities, setActivities] = useState<Activity[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [userInterests, setUserInterests] = useState<string[]>([])
  const [userTeams, setUserTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedId, setSelectedId] = useState<string | null>(null)

  // ── Filters ──
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategoryIds, setFilterCategoryIds] = useState<string[]>([])
  const [filterByInterests, setFilterByInterests] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [clickedLatLng, setClickedLatLng] = useState<LatLng>(BAQ_CENTER)
  const [clickedAddress, setClickedAddress] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)

  // Init geocoder
  useEffect(() => {
    if (!geocodingLib) return
    geocoderRef.current = new geocodingLib.Geocoder()
  }, [geocodingLib])

  // Load data
  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: acts }, { data: cats }, { data: { user } }] = await Promise.all([
        supabase
          .from('activities')
          .select('*, creator:profiles(*), participants:activity_participants(user_id), activity_categories(categories(*))')
          .eq('status', 'open')
          .order('scheduled_at', { ascending: true }),
        supabase.from('categories').select('*').order('name'),
        supabase.auth.getUser(),
      ])

      if (acts) {
        setActivities(
          acts.map((a: any) => ({
            ...a,
            categories: (a.activity_categories ?? []).map((ac: any) => ac.categories).filter(Boolean),
            participants_count: Array.isArray(a.participants) ? a.participants.length : 0,
          }))
        )
      }
      if (cats) setCategories(cats)

      if (user) {
        const [{ data: profile }, { data: memberships }] = await Promise.all([
          supabase.from('profiles').select('interests').eq('id', user.id).single(),
          supabase
            .from('team_members')
            .select('role, team:teams(id, name, emoji, color, members:team_members(id, user_id, status))')
            .eq('user_id', user.id)
            .eq('status', 'accepted'),
        ])
        if (profile?.interests) setUserInterests(profile.interests)
        if (memberships) {
          setUserTeams(memberships.map((m: any) => m.team).filter(Boolean))
        }
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  // Toggle single category in multi-select
  const toggleCategory = useCallback((id: string) => {
    setFilterCategoryIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
    setFilterByInterests(false)
  }, [])

  const clearAllFilters = useCallback(() => {
    setSearchQuery('')
    setFilterCategoryIds([])
    setFilterByInterests(false)
  }, [])

  // Map click → geocode → open modal
  const handleMapClick = useCallback(async (e: MapMouseEvent) => {
    const latLng = e.detail.latLng
    if (!latLng) return
    setClickedLatLng(latLng)
    setClickedAddress('')
    setModalOpen(true)
    if (geocoderRef.current) {
      try {
        const result = await geocoderRef.current.geocode({ location: latLng })
        setClickedAddress(result.results[0]?.formatted_address ?? '')
      } catch { /* geocoding failed */ }
    }
  }, [])

  // Create activity
  const handleCreateActivity = useCallback(
    async (input: CreateActivityInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { category_ids, team_id, ...rest } = input

      const { data, error } = await supabase
        .from('activities')
        .insert({ ...rest, category_id: category_ids[0] ?? null, creator_id: user.id, status: 'open' })
        .select('*, creator:profiles(*)')
        .single()

      if (error) throw error

      if (data) {
        if (category_ids.length > 0) {
          await supabase
            .from('activity_categories')
            .insert(category_ids.map(cid => ({ activity_id: data.id, category_id: cid })))
            .throwOnError()
        }
        await supabase
          .from('activity_participants')
          .insert({ activity_id: data.id, user_id: user.id })
          .throwOnError()

        // Auto-invite team members if a team was selected
        if (team_id) {
          await inviteTeamToActivity(data.id, team_id)
        }

        const activityCategories = category_ids
          .map(id => categories.find(c => c.id === id))
          .filter(Boolean) as Category[]

        setActivities(prev => [...prev, { ...data, categories: activityCategories, participants_count: 1 }])
        setModalOpen(false)
      }
    },
    [supabase, categories]
  )

  const panToActivity = useCallback((activity: Activity) => {
    setSelectedId(activity.id)
    map?.panTo({ lat: activity.lat, lng: activity.lng })
    map?.setZoom(16)
    setSheetOpen(false)
  }, [map])

  // ── Filtered activities ──────────────────────────────────────────────────────
  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      const cats = a.categories ?? []

      // Search by title, description or location
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const inTitle    = a.title.toLowerCase().includes(q)
        const inDesc     = (a.description ?? '').toLowerCase().includes(q)
        const inLocation = a.location_name.toLowerCase().includes(q)
        const inCatName  = cats.some(c => c.name.toLowerCase().includes(q))
        if (!inTitle && !inDesc && !inLocation && !inCatName) return false
      }

      // Multi-category filter (any match)
      if (filterCategoryIds.length > 0) {
        if (!cats.some(c => filterCategoryIds.includes(c.id))) return false
      }

      // Interests filter
      if (filterByInterests && userInterests.length > 0) {
        if (!cats.some(c => userInterests.includes(c.id))) return false
      }

      return true
    })
  }, [activities, searchQuery, filterCategoryIds, filterByInterests, userInterests])

  const panelProps = {
    activities: filteredActivities,
    allActivities: activities,
    categories,
    filterCategoryIds,
    onToggleCategory: toggleCategory,
    filterByInterests,
    onToggleInterests: () => { setFilterByInterests(v => !v); setFilterCategoryIds([]) },
    userInterests,
    searchQuery,
    onSearchChange: setSearchQuery,
    onClearAll: clearAllFilters,
    selectedId,
    onSelectActivity: panToActivity,
  }

  return (
    <>
      {/* ── Map ─────────────────────────────────────────────────────────── */}
      <div className="relative flex-1 h-full">
        <Map
          id="main-map"
          defaultCenter={BAQ_CENTER}
          defaultZoom={INITIAL_ZOOM}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
          onClick={handleMapClick}
          clickableIcons={false}
          reuseMaps
          style={{ width: '100%', height: '100%' }}
        >
          {filteredActivities.map(activity => (
            <ActivityMarker
              key={activity.id}
              activity={activity}
              isSelected={selectedId === activity.id}
              onSelect={setSelectedId}
            />
          ))}
        </Map>

        <PlacesSearch />

        {loading && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md text-sm text-gray-600 z-10">
            <span className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            Cargando actividades...
          </div>
        )}

        {!loading && activities.length === 0 && (
          <div className="absolute bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/80 text-white text-xs px-4 py-2 rounded-full z-10 whitespace-nowrap">
            👆 Toca cualquier punto del mapa para crear una actividad
          </div>
        )}

        {/* Mobile button */}
        <button
          className="md:hidden absolute bottom-4 right-4 flex items-center gap-2 bg-white pl-3.5 pr-4 py-2.5 rounded-2xl shadow-lg text-sm font-semibold text-gray-800 z-10 border border-gray-100"
          onClick={() => setSheetOpen(true)}
        >
          <span className="text-base">📋</span>
          <span>
            {filteredActivities.length}{' '}
            {filteredActivities.length === 1 ? 'actividad' : 'actividades'}
          </span>
          {(filterCategoryIds.length > 0 || filterByInterests || searchQuery) && (
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
          )}
        </button>
      </div>

      {/* ── Desktop side panel ──────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-96 h-full bg-white border-l border-gray-100 flex-shrink-0">
        <SidePanel {...panelProps} />
      </aside>

      {/* ── Mobile bottom sheet ─────────────────────────────────────────── */}
      {sheetOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setSheetOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0">
              <div className="absolute left-1/2 -translate-x-1/2 top-3">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>
              <h3 className="font-bold text-gray-900 text-base">Actividades</h3>
              <button
                onClick={() => setSheetOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <SidePanel {...panelProps} hideHeader />
            </div>
          </div>
        </div>
      )}

      {/* ── Create activity modal ────────────────────────────────────────── */}
      <CreateActivityModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateActivity}
        categories={categories}
        userTeams={userTeams}
        lat={clickedLatLng.lat}
        lng={clickedLatLng.lng}
        address={clickedAddress}
      />
    </>
  )
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function MapView() {
  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!}
      libraries={['places']}
    >
      <div className="flex h-full overflow-hidden bg-gray-100">
        <MapInner />
      </div>
    </APIProvider>
  )
}
