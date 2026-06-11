'use client'

import { useState } from 'react'
import CreateTeamModal from '@/components/Teams/CreateTeamModal'
import type { Category } from '@/types'

type Props = { categories: Category[] }

export default function TeamsPageClient({ categories }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
      >
        + Crear equipo
      </button>
      <CreateTeamModal
        isOpen={open}
        onClose={() => setOpen(false)}
        categories={categories}
      />
    </>
  )
}
