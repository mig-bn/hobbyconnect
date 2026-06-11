import type { SocialLink } from '@/types'
import { PLATFORM_META } from '@/types'

type Props = {
  links: SocialLink[]
  /** Pass true if the viewer is a friend of the profile owner */
  isFriend?: boolean
  /** Pass true if the viewer IS the profile owner */
  isOwner?: boolean
  /** Compact layout (e.g. inside activity card) */
  compact?: boolean
}

/**
 * Read-only display of social links filtered by visibility rules:
 *  - public   → visible to everyone
 *  - friends  → visible only to friends (and owner)
 *  - private  → visible only to the owner
 */
export default function SocialLinksDisplay({
  links,
  isFriend = false,
  isOwner = false,
  compact = false,
}: Props) {
  const visible = links.filter(link => {
    if (isOwner) return true
    if (link.visibility === 'public') return true
    if (link.visibility === 'friends' && isFriend) return true
    return false
  })

  if (visible.length === 0) return null

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {visible.map(link => {
          const meta = PLATFORM_META[link.platform]
          const url = meta.buildUrl(link.handle)
          return (
            <a
              key={link.id}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title={`${meta.label}: ${link.handle}`}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm hover:opacity-80 transition-opacity shadow-sm"
              style={{ backgroundColor: meta.color }}
            >
              {meta.icon}
            </a>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {visible.map(link => {
        const meta = PLATFORM_META[link.platform]
        const url = meta.buildUrl(link.handle)
        const visIcon = link.visibility === 'friends' ? ' 🤝' : link.visibility === 'private' ? ' 🔒' : ''

        return (
          <a
            key={link.id}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all group"
          >
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm flex-shrink-0 shadow-sm"
              style={{ backgroundColor: meta.color }}
            >
              {meta.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-500">{meta.label}{isOwner ? visIcon : ''}</p>
              <p className="text-sm text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                {link.handle}
              </p>
            </div>
            <svg
              className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        )
      })}
    </div>
  )
}
