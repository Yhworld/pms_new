'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { prisma } from '@/src/lib/prisma'
import { slugify } from '@/src/lib/utlis'
import { revalidatePath } from 'next/cache'

export async function createOrg(formData: FormData) {
  const name = formData.get('name') as string
  const orgName = formData.get('orgName') as string

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const baseSlug = slugify(orgName)
  const existingSlug = await prisma.organization.findUnique({
    where: { slug: baseSlug },
  })
  const slug = existingSlug ? `${baseSlug}-${Date.now()}` : baseSlug

  // ✅ Keep redirect OUTSIDE try/catch
  let orgSlug: string

  try {
    await prisma.user.upsert({
      where: { id: user.id },
      update: { name },
      create: {
        id: user.id,
        email: user.email!,
        name,
      },
    })

    const org = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: orgName, slug },
      })

      await tx.orgMember.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: 'OWNER',
        },
      })

      return organization
    })

    orgSlug = org.slug
  } catch (e) {
    console.error(e)
    redirect(`/setup?error=${encodeURIComponent('Failed to create organization. Try again.')}`)
  }

  // ✅ redirect lives here — outside try/catch
  redirect(`/org/${orgSlug!}`)
}

export async function removeOrgMember(orgId: string, userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const requester = await prisma.orgMember.findUnique({
    where: {
      userId_organizationId: { userId: user.id, organizationId: orgId },
    },
  })

  if (!requester || requester.role !== 'OWNER') {
    return { error: 'Only organization owners can remove members.' }
  }

  if (userId === user.id) {
    return { error: 'You cannot remove yourself from the organization.' }
  }

  // Get the user's email to revoke their invitations
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })

  // Run both deletions in a transaction — atomic, all or nothing
  await prisma.$transaction([
    // 1. Remove org membership
    prisma.orgMember.delete({
      where: {
        userId_organizationId: { userId, organizationId: orgId },
      },
    }),
    // 2. Revoke any pending invitations for their email in this org
    prisma.invitation.updateMany({
      where: {
        organizationId: orgId,
        email: targetUser!.email,
        status: 'PENDING',
      },
      data: { status: 'REVOKED' },
    }),
  ])

  revalidatePath(`/org/[slug]/members`)
  return { success: true }
}


export async function updateOrgMemberRole(
  orgId: string,
  userId: string,
  role: 'OWNER' | 'MEMBER'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const requester = await prisma.orgMember.findUnique({
    where: {
      userId_organizationId: { userId: user.id, organizationId: orgId },
    },
  })

  if (!requester || requester.role !== 'OWNER') {
    return { error: 'Only organization owners can change roles.' }
  }

  if (userId === user.id) {
    return { error: 'You cannot change your own role.' }
  }

  await prisma.orgMember.update({
    where: {
      userId_organizationId: { userId, organizationId: orgId },
    },
    data: { role },
  })

  revalidatePath(`/org/[slug]/members`)
  return { success: true }
}

