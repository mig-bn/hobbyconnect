export type Profile = {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  reputation_score: number
  total_ratings: number
  city: string
  interests: string[]
  created_at: string
}

export type Category = {
  id: string
  name: string
  emoji: string
  color: string
  tags?: string[]
}

export type ActivityStatus = 'open' | 'full' | 'cancelled' | 'completed'

export type Activity = {
  id: string
  creator_id: string
  creator?: Profile
  category_id?: string | null
  category?: Category
  categories?: Category[]
  title: string
  description: string | null
  location_name: string
  location_address: string | null
  lat: number
  lng: number
  scheduled_at: string
  max_participants: number
  is_free: boolean
  cost: number | null
  status: ActivityStatus
  created_at: string
  participants?: { user_id: string }[]
  participants_count?: number
}

export type ActivityParticipant = {
  activity_id: string
  user_id: string
  user?: Profile
  joined_at: string
}

export type CreateActivityInput = {
  category_ids: string[]
  team_id?: string
  title: string
  description?: string
  location_name: string
  location_address?: string
  lat: number
  lng: number
  scheduled_at: string
  max_participants: number
  is_free: boolean
  cost?: number
}

export type SocialPlatform =
  | 'whatsapp' | 'telegram' | 'instagram' | 'twitter'
  | 'facebook' | 'tiktok' | 'discord' | 'email' | 'youtube' | 'linkedin'

export type SocialVisibility = 'public' | 'friends' | 'private'

export type SocialLink = {
  id: string
  user_id: string
  platform: SocialPlatform
  handle: string
  visibility: SocialVisibility
  created_at: string
}

export const PLATFORM_META: Record<SocialPlatform, {
  label: string
  icon: string
  color: string
  buildUrl: (handle: string) => string
  placeholder: string
}> = {
  whatsapp:  { label: 'WhatsApp',  icon: '💬', color: '#25d366', buildUrl: h => `https://wa.me/${h.replace(/\D/g,'')}`,         placeholder: '+57 300 123 4567' },
  telegram:  { label: 'Telegram',  icon: '✈️', color: '#229ed9', buildUrl: h => `https://t.me/${h.replace('@','')}`,             placeholder: '@usuario' },
  instagram: { label: 'Instagram', icon: '📸', color: '#e1306c', buildUrl: h => `https://instagram.com/${h.replace('@','')}`,    placeholder: '@usuario' },
  twitter:   { label: 'X / Twitter',icon:'𝕏',  color: '#000000', buildUrl: h => `https://x.com/${h.replace('@','')}`,           placeholder: '@usuario' },
  facebook:  { label: 'Facebook',  icon: '👤', color: '#1877f2', buildUrl: h => `https://facebook.com/${h}`,                    placeholder: 'nombre.usuario' },
  tiktok:    { label: 'TikTok',    icon: '🎵', color: '#010101', buildUrl: h => `https://tiktok.com/@${h.replace('@','')}`,      placeholder: '@usuario' },
  discord:   { label: 'Discord',   icon: '🎮', color: '#5865f2', buildUrl: h => h,                                              placeholder: 'usuario#0000' },
  email:     { label: 'Email',     icon: '📧', color: '#ea4335', buildUrl: h => `mailto:${h}`,                                  placeholder: 'tu@email.com' },
  youtube:   { label: 'YouTube',   icon: '▶️', color: '#ff0000', buildUrl: h => `https://youtube.com/@${h.replace('@','')}`,    placeholder: '@canal' },
  linkedin:  { label: 'LinkedIn',  icon: '💼', color: '#0a66c2', buildUrl: h => `https://linkedin.com/in/${h}`,                 placeholder: 'tu-perfil' },
}

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected'

export type Friendship = {
  id: string
  requester_id: string
  addressee_id: string
  status: FriendshipStatus
  created_at: string
  updated_at: string
  requester?: Profile
  addressee?: Profile
}

export type ActivityInvitation = {
  id: string
  activity_id: string
  inviter_id: string
  invitee_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  activity?: Activity
  inviter?: Profile
  invitee?: Profile
}

export type TeamRole = 'captain' | 'member'
export type TeamMemberStatus = 'pending' | 'accepted' | 'declined'

export type Team = {
  id: string
  name: string
  description: string | null
  emoji: string
  color: string
  creator_id: string
  category_id: string | null
  category?: Category
  created_at: string
  members?: TeamMember[]
}

export type TeamMember = {
  id: string
  team_id: string
  user_id: string
  role: TeamRole
  status: TeamMemberStatus
  invited_by: string | null
  created_at: string
  profile?: Profile
}

export type LatLng = {
  lat: number
  lng: number
}

export type MapBounds = {
  north: number
  south: number
  east: number
  west: number
}
