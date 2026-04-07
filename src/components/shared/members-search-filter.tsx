'use client'

import { Search } from 'lucide-react'
import { useRef } from 'react'

export function MembersSearchFilter() {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const query = e.target.value.toLowerCase()
    const rows = document.querySelectorAll<HTMLElement>('[data-member-name]')
    rows.forEach((row) => {
      const name = row.dataset.memberName ?? ''
      const email = row.dataset.memberEmail ?? ''
      row.style.display = name.includes(query) || email.includes(query) ? '' : 'none'
    })
  }

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        placeholder="Search members..."
        onChange={handleSearch}
        className="h-8 w-48 rounded-lg border border-zinc-200 bg-zinc-50 pl-8 pr-3 text-[12px] text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-300 focus:bg-white transition-all"
      />
    </div>
  )
}