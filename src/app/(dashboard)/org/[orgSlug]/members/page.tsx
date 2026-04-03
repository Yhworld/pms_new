import { notFound } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { prisma } from '@/src/lib/prisma'
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar'
import { Badge } from '@/src/components/ui/badge'
import { InviteMemberDialog } from '@/src/components/shared/InviteMemberDialog'
import { formatDate } from '@/src/lib/utlis'

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-muted-foreground text-sm">
            {org.members.length} member{org.members.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isOwner && (
          <InviteMemberDialog orgId={org.id} />
        )}
      </div>

      {/* Active Members */}
      <div className="space-y-2">
        {org.members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-4 bg-white border rounded-lg"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-slate-200 text-slate-600 text-sm">
                  {(member.user.name ?? member.user.email).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {member.user.name ?? 'No name set'}
                  {member.userId === user!.id && (
                    <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{member.user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                Joined {formatDate(member.createdAt)}
              </span>
              <Badge variant={member.role === 'OWNER' ? 'default' : 'secondary'}>
                {member.role}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Invitations */}
      {isOwner && org.invitations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-muted-foreground">
            Pending Invitations ({org.invitations.length})
          </h2>
          {org.invitations.map((invite) => (
            <div
              key={invite.id}
              className="flex items-center justify-between p-4 bg-slate-50 border border-dashed rounded-lg"
            >
              <div>
                <p className="text-sm font-medium">{invite.email}</p>
                <p className="text-xs text-muted-foreground">
                  Expires {formatDate(invite.expiresAt)}
                </p>
              </div>
              <Badge variant="outline">Pending</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
