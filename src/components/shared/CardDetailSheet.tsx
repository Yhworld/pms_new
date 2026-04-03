'use client'

import { useState, useEffect, useTransition } from 'react'
import { format } from 'date-fns'
import {
  Sheet, SheetContent,
} from '@/src/components/ui/sheet'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar'
import { Calendar } from '@/src/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover'
import { AttachmentList } from '@/src/components/shared/AttachmentList'
import { UploadButton } from '@/src/components/shared/UploadButton'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/src/components/ui/select'
import {
  CalendarIcon, AlignLeft, CheckSquare,
  MessageSquare, Plus, Check, Loader2, X, Paperclip, LayoutList, ChevronRight, ChevronDown, 
  CircleDashed, SignalHigh, Tag, Users
} from 'lucide-react'
import { formatDate, isOverdue } from '@/src/lib/utlis' 
import { MemberPicker } from '@/src/components/shared/MemberPicker'
import { LabelPicker } from '@/src/components/shared/LabelPicker'
import {
  getCardDetail, updateCard, addComment, editComment, deleteComment,
  toggleChecklistItem, addChecklist, addChecklistItem
} from '@/src/lib/actions/card.actions'

type CardDetail = Awaited<ReturnType<typeof getCardDetail>>

interface CardDetailSheetProps {
  cardId: string | null
  onClose: () => void
  canEdit?: boolean
  currentUserId?: string
}

export function CardDetailSheet({ 
  cardId, 
  onClose, 
  canEdit = false, 
  currentUserId 
}: CardDetailSheetProps) {
  const [card, setCard] = useState<CardDetail>(null)
  const [loading, setLoading] = useState(false)
  const [editingDesc, setEditingDesc] = useState(false)
  const [desc, setDesc] = useState('')
  const [comment, setComment] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [newChecklistTitle, setNewChecklistTitle] = useState('')
  const [addingChecklist, setAddingChecklist] = useState(false)
  const [savingChecklist, setSavingChecklist] = useState(false)
  const [addingItemId, setAddingItemId] = useState<string | null>(null)
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({})
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentText, setEditingCommentText] = useState('')
  const [, startTransition] = useTransition()

  const [collapsedLists, setCollapsedLists] = useState<Record<string, boolean>>({})
  const [hideCompleted, setHideCompleted] = useState<Record<string, boolean>>({})

  const toggleCollapse = (id: string) => setCollapsedLists(prev => ({ ...prev, [id]: !prev[id] }))
  const toggleHideCompleted = (id: string) => setHideCompleted(prev => ({ ...prev, [id]: !prev[id] }))

  useEffect(() => {
    if (!cardId) { 
      setCard(null)
      return 
    }
    setLoading(true)
    getCardDetail(cardId).then((data) => {
      setCard(data)
      setDesc(data?.description ?? '')
      setLoading(false)
    })
  }, [cardId])

  function refresh() {
    if (!cardId) return
    getCardDetail(cardId).then((data) => {
      setCard(data)
      setDesc(data?.description ?? '')
    })
  }

  async function handleStatusChange(value: string) {
    if (!card || !canEdit) return
    setCard((prev) => prev ? { ...prev, status: value as any } : prev)
    await updateCard(card.id, { status: value as any })
  }

  async function handlePriorityChange(value: string) {
    if (!card || !canEdit) return
    setCard((prev) => prev ? { ...prev, priority: value as any } : prev)
    await updateCard(card.id, { priority: value as any })
  }

  async function handleDateSelect(date: Date | undefined) {
    if (!card || !canEdit) return
    setCard((prev) => prev ? { ...prev, dueDate: date ?? null } : prev)
    setDatePickerOpen(false)
    await updateCard(card.id, { dueDate: date ?? null })
  }

  async function handleClearDate() {
    if (!card || !canEdit) return
    setCard((prev) => prev ? { ...prev, dueDate: null } : prev)
    await updateCard(card.id, { dueDate: null })
  }

  async function handleSaveDesc() {
    if (!card || !canEdit) return
    setCard((prev) => prev ? { ...prev, description: desc } : prev)
    setEditingDesc(false)
    await updateCard(card.id, { description: desc })
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    if (!card || !comment.trim() || postingComment) return
    setPostingComment(true)
    await addComment(card.id, comment.trim())
    setComment('')
    setPostingComment(false)
    refresh()
  }

  async function handleToggleItem(itemId: string, current: boolean) {
    if (!canEdit) return
    setCard((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        checklists: prev.checklists.map((cl) => ({
          ...cl,
          items: cl.items.map((item) =>
            item.id === itemId ? { ...item, isCompleted: !current } : item
          ),
        })),
      }
    })
    startTransition(async () => {
      await toggleChecklistItem(itemId, !current)
    })
  }

  async function handleAddChecklist(e: React.FormEvent) {
    e.preventDefault()
    if (!card || !newChecklistTitle.trim() || savingChecklist || !canEdit) return
    setSavingChecklist(true)
    await addChecklist(card.id, newChecklistTitle.trim(), card.checklists.length)
    setNewChecklistTitle('')
    setAddingChecklist(false)
    setSavingChecklist(false)
    refresh()
  }

  async function handleAddItem(checklistId: string, itemCount: number) {
    if (!canEdit) return
    const text = newItemTexts[checklistId]?.trim()
    if (!text || addingItemId === checklistId) return
    setAddingItemId(checklistId)
    await addChecklistItem(checklistId, text, itemCount)
    setNewItemTexts((prev) => ({ ...prev, [checklistId]: '' }))
    setAddingItemId(null)
    setCollapsedLists(prev => ({ ...prev, [checklistId]: false }))
    refresh()
  }

  function handleAttachmentUpdate() {
    refresh()
  }

  return (
    <Sheet open={!!cardId} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent className="w-full sm:max-w-5xl overflow-hidden p-0 border-l border-zinc-200 shadow-2xl bg-white flex flex-col">
        {loading || !card ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
          </div>
        ) : (
          <>
            <header className="px-8 py-4 border-b border-zinc-100 flex items-center justify-between shrink-0 bg-white z-10">
              <div className="flex items-center gap-2 text-[13px] text-zinc-500">
                <LayoutList className="h-4 w-4 text-zinc-400" />
                <span className="font-medium text-zinc-600">{card.list.name}</span>
                <ChevronRight className="h-3.5 w-3.5 text-zinc-300 mx-1" />
                <span className="truncate max-w-[200px]">{card.title}</span>
              </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar">
                
                <div className="mb-10">
                  <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 leading-tight">
                    {card.title}
                  </h1>
                </div>

                <section className="mb-12">
                  {editingDesc ? (
                    <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-1">
                      <Textarea
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        rows={4}
                        placeholder="Write a description..."
                        autoFocus
                        className="text-[15px] leading-relaxed resize-none focus-visible:ring-1 focus-visible:ring-zinc-300 border-zinc-200"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveDesc} className="bg-zinc-900 text-white hover:bg-zinc-800">
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setEditingDesc(false); setDesc(card.description ?? '') }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => canEdit && setEditingDesc(true)}
                      className={`text-[15px] leading-relaxed whitespace-pre-wrap -ml-3 p-3 rounded-lg transition-colors border border-transparent ${
                        card.description 
                          ? `text-zinc-700 ${canEdit ? 'hover:bg-zinc-50 cursor-pointer' : ''}` 
                          : `text-zinc-400 ${canEdit ? 'hover:border-zinc-200 border-dashed cursor-text' : ''}`
                      }`}
                    >
                      {card.description || 'Add a description...'}
                    </div>
                  )}
                </section>

                {card.checklists.length > 0 && (
                  <section className="flex flex-col gap-8 mb-12">
                    {card.checklists.map((checklist) => {
                      const completed = checklist.items.filter((i) => i.isCompleted).length
                      const total = checklist.items.length
                      const pct = total > 0 ? Math.round((completed / total) * 100) : 0
                      const isCollapsed = collapsedLists[checklist.id]
                      const isHidingCompleted = hideCompleted[checklist.id]
                      const isSavingItem = addingItemId === checklist.id
                      const visibleItems = isHidingCompleted ? checklist.items.filter(i => !i.isCompleted) : checklist.items

                      return (
                        <div key={checklist.id} className="group/list">
                          <div className="flex items-center gap-2 mb-3 group/header">
                            <button onClick={() => toggleCollapse(checklist.id)} className="p-0.5 -ml-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 rounded transition-colors">
                              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
                            </button>
                            <h3 onClick={() => toggleCollapse(checklist.id)} className="text-[15px] font-semibold text-zinc-900 flex-1 cursor-pointer select-none">
                              {checklist.title}
                            </h3>
                            {!isCollapsed && completed > 0 && (
                              <button onClick={() => toggleHideCompleted(checklist.id)} className="text-[12px] font-medium text-zinc-400 hover:text-zinc-800 opacity-0 group-hover/header:opacity-100 transition-opacity">
                                {isHidingCompleted ? 'Show checked' : 'Hide checked'}
                              </button>
                            )}
                            <span className="text-[12px] font-medium text-zinc-500 ml-2">
                              {completed}/{total}
                            </span>
                          </div>

                          <div className={`h-[3px] w-full bg-zinc-100 rounded-full overflow-hidden ${isCollapsed ? 'mb-1' : 'mb-4'}`}>
                            <div className={`h-full transition-all duration-500 ease-out rounded-full ${pct === 100 ? 'bg-zinc-900' : 'bg-zinc-400'}`} style={{ width: `${pct}%` }} />
                          </div>

                          {!isCollapsed && (
                            <div className="animate-in fade-in slide-in-from-top-1 duration-200 pl-1">
                              <div className="flex flex-col gap-1 mb-2">
                                {visibleItems.length === 0 && isHidingCompleted && total > 0 && (
                                  <p className="text-[13px] text-zinc-400 italic py-2">All items completed.</p>
                                )}
                                {visibleItems.map((item) => (
                                  <label key={item.id} className={`flex items-start gap-3 py-1.5 -mx-2 px-2 rounded-md ${canEdit ? 'cursor-pointer hover:bg-zinc-50' : ''} transition-colors group`}>
                                    <div className="mt-[3px] relative flex items-center justify-center">
                                      <input 
                                        type="checkbox" 
                                        className="peer sr-only" 
                                        checked={item.isCompleted} 
                                        onChange={() => handleToggleItem(item.id, item.isCompleted)} 
                                        disabled={!canEdit}
                                      />
                                      <div className={`h-4 w-4 rounded-[4px] border border-zinc-300 bg-white transition-all peer-checked:bg-zinc-900 peer-checked:border-zinc-900 flex items-center justify-center ${canEdit ? 'group-hover:border-zinc-400' : 'opacity-70'}`}>
                                        <Check className={`h-3 w-3 text-white stroke-[3px] transition-transform ${item.isCompleted ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} />
                                      </div>
                                    </div>
                                    <span className={`text-[14px] pt-[1px] transition-colors ${item.isCompleted ? 'line-through text-zinc-400' : `text-zinc-700 ${canEdit ? 'group-hover:text-zinc-900' : ''}`}`}>
                                      {item.title}
                                    </span>
                                  </label>
                                ))}
                              </div>
                              
                              {canEdit && (
                                <div className="flex items-center gap-2 mt-1 -mx-2">
                                  <Plus className="h-4 w-4 text-zinc-400 ml-2 shrink-0" />
                                  <Input
                                    placeholder="Add an item..."
                                    value={newItemTexts[checklist.id] ?? ''}
                                    onChange={(e) => setNewItemTexts((prev) => ({ ...prev, [checklist.id]: e.target.value }))}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') { e.preventDefault(); handleAddItem(checklist.id, checklist.items.length) }
                                    }}
                                    disabled={isSavingItem}
                                    className="h-8 text-[14px] border-transparent bg-transparent shadow-none hover:bg-zinc-50 focus-visible:bg-white focus-visible:border-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-300 px-2"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </section>
                )}

                {canEdit && (
                  <div className="mb-12">
                    {addingChecklist ? (
                      <form onSubmit={handleAddChecklist} className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                        <Input autoFocus placeholder="Name this checklist..." value={newChecklistTitle} onChange={(e) => setNewChecklistTitle(e.target.value)} disabled={savingChecklist} className="text-[14px] border-zinc-200 bg-white" />
                        <div className="flex gap-2">
                          <Button type="submit" size="sm" className="bg-zinc-900 text-white hover:bg-zinc-800" disabled={savingChecklist || !newChecklistTitle.trim()}>
                            {savingChecklist ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Create'}
                          </Button>
                          <Button type="button" size="sm" variant="ghost" disabled={savingChecklist} onClick={() => setAddingChecklist(false)}>Cancel</Button>
                        </div>
                      </form>
                    ) : (
                      <Button variant="ghost" className="text-zinc-500 hover:text-zinc-900 -ml-3 hover:bg-zinc-50" onClick={() => setAddingChecklist(true)}>
                        <CheckSquare className="h-4 w-4 mr-2" /> Add a checklist
                      </Button>
                    )}
                  </div>
                )}

                <div className="h-px bg-zinc-100 w-full mb-10" aria-hidden="true" />

                <section>
                  <h3 className="text-[15px] font-semibold text-zinc-900 mb-6">Activity</h3>
                  
                  <form onSubmit={handleAddComment} className="mb-8 relative rounded-xl border border-zinc-200 shadow-sm overflow-hidden focus-within:ring-1 focus-within:ring-zinc-300 focus-within:border-zinc-300 transition-shadow bg-white">
                    <Textarea
                      placeholder="Leave a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      disabled={postingComment}
                      rows={2}
                      className="text-[14px] resize-none pb-12 border-0 focus-visible:ring-0 rounded-none shadow-none"
                    />
                    <div className="absolute bottom-0 inset-x-0 p-2 bg-zinc-50 border-t border-zinc-100 flex justify-between items-center">
                      <div className="flex gap-1"></div>
                      <Button type="submit" size="sm" disabled={!comment.trim() || postingComment} className="h-7 px-4 bg-zinc-900 text-white hover:bg-zinc-800 rounded-md font-medium">
                        {postingComment ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Comment'}
                      </Button>
                    </div>
                  </form>

                  <div className="flex flex-col relative before:absolute before:inset-y-0 before:left-4 before:w-px before:bg-zinc-100 before:-z-10 gap-8">
                    {card.comments.length === 0 && (
                      <div className="pl-12 text-[14px] text-zinc-400 italic">No activity yet.</div>
                    )}
                    {card.comments.map((c) => {
                      const isEditing = editingCommentId === c.id
                      const isCommentOwner = currentUserId && c.user.id === currentUserId
                      const canModifyComment = isCommentOwner || canEdit

                      return (
                        <div key={c.id} className="flex gap-4 group relative">
                          <Avatar className="h-8 w-8 shrink-0 ring-4 ring-white shadow-sm">
                            <AvatarFallback className="text-xs bg-zinc-100 text-zinc-600 font-medium">
                              {c.user.name?.[0]?.toUpperCase() ?? '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0 pt-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[14px] font-medium text-zinc-900">{c.user.name ?? c.user.email}</span>
                              <span className="text-[12px] text-zinc-400">{formatDate(c.createdAt)}</span>
                              
                              {canModifyComment && (
                                <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {isCommentOwner && (
                                    <button onClick={() => { setEditingCommentId(c.id); setEditingCommentText(c.content) }} className="text-[12px] font-medium text-zinc-400 hover:text-zinc-700 px-2 py-0.5 rounded transition-colors">Edit</button>
                                  )}
                                  <button onClick={async () => { await deleteComment(c.id); refresh() }} className="text-[12px] font-medium text-zinc-400 hover:text-red-600 px-2 py-0.5 rounded transition-colors">Delete</button>
                                </div>
                              )}
                            </div>

                            {isEditing ? (
                              <div className="flex flex-col gap-2 bg-white rounded-lg border border-zinc-200 p-2 shadow-sm">
                                <Textarea value={editingCommentText} onChange={(e) => setEditingCommentText(e.target.value)} rows={2} autoFocus className="text-[14px] border-0 focus-visible:ring-0 resize-none p-1" />
                                <div className="flex gap-2 justify-end">
                                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingCommentId(null)}>Cancel</Button>
                                  <Button size="sm" className="h-7 text-xs bg-zinc-900 text-white" onClick={async () => {
                                    if (!editingCommentText.trim()) return
                                    await editComment(c.id, editingCommentText.trim())
                                    setEditingCommentId(null)
                                    refresh()
                                  }}>Save</Button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-[14px] leading-relaxed text-zinc-700 whitespace-pre-wrap">{c.content}</div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              </div>

              <div className="w-[300px] shrink-0 border-l border-zinc-100 bg-zinc-50/50 px-6 py-8 flex flex-col gap-8 overflow-y-auto custom-scrollbar">
                
                <div className="flex flex-col">
                  <h3 className="text-[12px] font-semibold text-zinc-900 uppercase tracking-wider mb-4">Properties</h3>
                  
                  <div className="grid grid-cols-[90px_1fr] gap-y-1 items-center">
                    
                    <div className="text-[13px] text-zinc-500 flex items-center gap-2"><CircleDashed className="h-3.5 w-3.5" /> Status</div>
                    <div>
                      <Select value={card.status} onValueChange={handleStatusChange} disabled={!canEdit}>
                        <SelectTrigger className={`h-7 text-[13px] font-medium border-0 bg-transparent ${canEdit ? 'hover:bg-zinc-100 cursor-pointer' : 'cursor-default opacity-80'} shadow-none px-2 focus:ring-0 w-auto justify-start gap-2`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="start">
                          <SelectItem value="TODO">Todo</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="BLOCKED">Blocked</SelectItem>
                          <SelectItem value="IN_REVIEW">In Review</SelectItem>
                          <SelectItem value="DONE">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="text-[13px] text-zinc-500 flex items-center gap-2"><SignalHigh className="h-3.5 w-3.5" /> Priority</div>
                    <div>
                      <Select value={card.priority} onValueChange={handlePriorityChange} disabled={!canEdit}>
                        <SelectTrigger className={`h-7 text-[13px] font-medium border-0 bg-transparent ${canEdit ? 'hover:bg-zinc-100 cursor-pointer' : 'cursor-default opacity-80'} shadow-none px-2 focus:ring-0 w-auto justify-start gap-2`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="start">
                          <SelectItem value="LOW"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-zinc-300" />Low</div></SelectItem>
                          <SelectItem value="MEDIUM"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-blue-500" />Medium</div></SelectItem>
                          <SelectItem value="HIGH"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-orange-500" />High</div></SelectItem>
                          <SelectItem value="URGENT"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-red-500" />Urgent</div></SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="text-[13px] text-zinc-500 flex items-center gap-2"><CalendarIcon className="h-3.5 w-3.5" /> Due</div>
                    <div className="flex items-center group">
                      {canEdit ? (
                        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className={`h-7 text-[13px] font-medium border-0 hover:bg-zinc-100 shadow-none px-2 justify-start ${card.dueDate && isOverdue(card.dueDate) ? 'text-red-600' : 'text-zinc-900'}`}>
                              {card.dueDate ? format(new Date(card.dueDate), 'MMM d, yyyy') : <span className="text-zinc-400 font-normal">Empty</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 border-zinc-200" align="start">
                            <Calendar mode="single" selected={card.dueDate ? new Date(card.dueDate) : undefined} onSelect={handleDateSelect} disabled={{ before: new Date() }} initialFocus />
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <div className={`px-2 py-1 text-[13px] font-medium ${card.dueDate && isOverdue(card.dueDate) ? 'text-red-600' : 'text-zinc-900'}`}>
                          {card.dueDate ? format(new Date(card.dueDate), 'MMM d, yyyy') : <span className="text-zinc-400 font-normal">Empty</span>}
                        </div>
                      )}
                      
                      {canEdit && card.dueDate && (
                        <button onClick={handleClearDate} className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-zinc-800 transition-opacity">
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    <div className="text-[13px] text-zinc-500 flex items-center gap-2 self-start mt-1.5"><Users className="h-3.5 w-3.5" /> Assignee</div>
                    <div className="flex flex-col gap-1 py-1">
                      {card.members.map((m) => (
                        <div key={m.id} className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-zinc-100 transition-colors w-fit">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[9px] bg-zinc-200 text-zinc-700 font-medium">
                              {m.user.name?.[0]?.toUpperCase() ?? '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[13px] font-medium text-zinc-900">{m.user.name ?? m.user.email}</span>
                        </div>
                      ))}
                      {canEdit && (
                        <div className="px-1 mt-0.5">
                          <MemberPicker cardId={card.id} assignedIds={card.members.map((m) => m.userId)} onUpdate={refresh} />
                        </div>
                      )}
                    </div>

                    <div className="text-[13px] text-zinc-500 flex items-center gap-2 self-start mt-1.5"><Tag className="h-3.5 w-3.5" /> Labels</div>
                    <div className="flex flex-wrap gap-1.5 py-1 px-2">
                      {card.labels.map((cl) => (
                        <span key={cl.labelId} className="text-[11px] px-2 py-0.5 rounded-md text-zinc-900 font-medium border border-black/5" style={{ backgroundColor: cl.label.color }}>
                          {cl.label.name}
                        </span>
                      ))}
                      {canEdit && (
                        <LabelPicker cardId={card.id} boardId={card.list.board.id} attachedLabelIds={card.labels.map((cl) => cl.labelId)} onUpdate={refresh} />
                      )}
                    </div>

                  </div>
                </div>

                <div className="h-px bg-zinc-200 w-full" aria-hidden="true" />

                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[12px] font-semibold text-zinc-900 uppercase tracking-wider">Attachments</h3>
                    {canEdit && <UploadButton cardId={card.id} onUpdate={handleAttachmentUpdate} />}
                  </div>
                  
                  {card.attachments.length > 0 ? (
                     <AttachmentList attachments={card.attachments} onUpdate={handleAttachmentUpdate} />
                  ) : (
                    <p className="text-[13px] text-zinc-400 italic">No attachments added.</p>
                  )}
                </div>

              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}