import { notFound } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { prisma } from '@/src/lib/prisma'
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar'
import { Badge } from '@/src/components/ui/badge'
import { InviteMemberDialog } from '@/src/components/shared/InviteMemberDialog'
import { RemoveOrgMemberButton } from '@/src/components/shared/remove-org-member-button'
import { ChangeOrgRoleSelect } from '@/src/components/shared/change-org-role-select'
import { MembersSearchFilter } from '@/src/components/shared/members-search-filter'
import { formatDate } from '@/src/lib/utlis'
import { Users, UserCheck, Clock, Shield } from 'lucide-react'

export default async function MembersPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      members: {
        include: { user: true },
        orderBy: { createdAt: 'asc' },
      },
      invitations: {
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!org) notFound()

  const currentMember = org.members.find(m => m.userId === user!.id)
  if (!currentMember) notFound()

  const isOwner = currentMember.role === 'OWNER'
  const ownerCount = org.members.filter(m => m.role === 'OWNER').length
  const memberCount = org.members.filter(m => m.role === 'MEMBER').length

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-8 px-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Team Members
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage who has access to <span className="font-medium text-zinc-700">{org.name}</span>
          </p>
        </div>
        {isOwner && <InviteMemberDialog orgId={org.id} />}
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-100 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="h-9 w-9 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
            <Users className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <p className="text-xl font-semibold text-zinc-900 leading-none">
              {org.members.length}
            </p>
            <p className="text-xs text-zinc-400 mt-1">Total members</p>
          </div>
        </div>

        <div className="bg-white border border-zinc-100 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="h-9 w-9 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
            <Shield className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <p className="text-xl font-semibold text-zinc-900 leading-none">{ownerCount}</p>
            <p className="text-xs text-zinc-400 mt-1">Owner{ownerCount !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="bg-white border border-zinc-100 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="h-9 w-9 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
            <Clock className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <p className="text-xl font-semibold text-zinc-900 leading-none">
              {org.invitations.length}
            </p>
            <p className="text-xs text-zinc-400 mt-1">Pending invite{org.invitations.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* ── Members List with Search ── */}
      <div className="bg-white border border-zinc-100 rounded-xl shadow-sm overflow-hidden">

        {/* Table Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-zinc-400" />
            <h2 className="text-[13px] font-semibold text-zinc-700">
              Active Members
            </h2>
            <span className="text-[11px] font-medium text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-full">
              {org.members.length}
            </span>
          </div>
          {/* Client-side search filter */}
          <MembersSearchFilter />
        </div>

        {/* Members */}
        <div className="divide-y divide-zinc-50" id="members-list">
          {org.members.map((member) => {
            const displayName = member.user.name ?? member.user.email
            const initials = displayName.slice(0, 2).toUpperCase()
            const isYou = member.userId === user!.id
            const isThisOwner = member.role === 'OWNER'

            return (
              <div
                key={member.id}
                data-member-name={displayName.toLowerCase()}
                data-member-email={member.user.email.toLowerCase()}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50/60 transition-colors"
              >
                {/* Avatar + Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-zinc-100 text-zinc-600 text-[12px] font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium text-zinc-900 truncate">
                        {member.user.name ?? 'No name set'}
                      </p>
                      {isYou && (
                        <span className="text-[10px] font-medium text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-full shrink-0">
                          you
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-zinc-400 truncate">{member.user.email}</p>
                  </div>
                </div>

                {/* Right Side: Joined + Role + Actions */}
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-[11px] text-zinc-400 hidden sm:block">
                    Joined {formatDate(member.createdAt)}
                  </span>

                  {/* Role — dropdown for owner editing others, badge for self */}
                  {isOwner && !isYou ? (
                    <ChangeOrgRoleSelect
                      orgId={org.id}
                      userId={member.userId}
                      currentRole={member.role}
                      userName={displayName}
                    />
                  ) : (
                    <Badge
                      variant={isThisOwner ? 'default' : 'secondary'}
                      className="text-[11px]"
                    >
                      {member.role.toLowerCase()}
                    </Badge>
                  )}

                  {/* Remove — only for non-owners, not self */}
                  {isOwner && !isYou && !isThisOwner && (
                    <RemoveOrgMemberButton
                      orgId={org.id}
                      userId={member.userId}
                      userName={displayName}
                    />
                  )}

                  {/* Spacer to keep rows aligned when no remove button */}
                  {(!isOwner || isYou || isThisOwner) && (
                    <div className="w-7" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Pending Invitations ── */}
      {isOwner && org.invitations.length > 0 && (
        <div className="bg-white border border-zinc-100 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-100">
            <Clock className="h-4 w-4 text-zinc-400" />
            <h2 className="text-[13px] font-semibold text-zinc-700">Pending Invitations</h2>
            <span className="text-[11px] font-medium text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-full">
              {org.invitations.length}
            </span>
          </div>
          <div className="divide-y divide-zinc-50">
            {org.invitations.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between px-5 py-3.5"
              >
                <div className="flex items-center gap-3">
                  {/* Ghost avatar for pending */}
                  <div className="h-9 w-9 rounded-full bg-zinc-100 border-2 border-dashed border-zinc-300 flex items-center justify-center shrink-0">
                    <span className="text-[11px] text-zinc-400">?</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-zinc-700">{invite.email}</p>
                    <p className="text-[12px] text-zinc-400">
                      Expires {formatDate(invite.expiresAt)}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="text-[11px] text-amber-600 border-amber-200 bg-amber-50"
                >
                  pending
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}