'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { prisma } from '@/src/lib/prisma'
// Add this new import for the admin bypass:
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  const userId = data.user.id

  // Check if user has a DB record — create one if missing (edge case)
  const existing = await prisma.user.findUnique({ where: { id: userId } })

  if (!existing) {
    await prisma.user.create({
      data: {
        id: userId,
        email: data.user.email!,
        name: data.user.user_metadata?.name ?? null,
      },
    })
  }

  // Check if user belongs to an org
  const orgMember = await prisma.orgMember.findFirst({
    where: { userId },
    include: { organization: true },
  })

  if (!orgMember) redirect('/setup')

  redirect(`/org/${orgMember.organization.slug}`)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function completeOnboarding(formData: FormData) {
  const name = formData.get('name') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    redirect('/onboarding?error=Passwords do not match')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Set password via Supabase Auth
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    redirect(`/onboarding?error=${encodeURIComponent(error.message)}`)
  }

  // Read org info from invite metadata
  const organizationId = user.user_metadata?.organizationId as string | undefined
  const role = (user.user_metadata?.role ?? 'MEMBER') as 'OWNER' | 'MEMBER'

  // Create User row + OrgMember row in one transaction
  await prisma.$transaction(async (tx) => {
    await tx.user.upsert({
      where: { id: user.id },
      update: { name },
      create: {
        id: user.id,
        email: user.email!,
        name,
      },
    })

    // Mark invitation as accepted
    if (organizationId) {
      await tx.orgMember.upsert({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId,
          },
        },
        update: {},
        create: {
          userId: user.id,
          organizationId,
          role,
        },
      })

      await tx.invitation.updateMany({
        where: {
          email: user.email!,
          organizationId,
          status: 'PENDING',
        },
        data: { status: 'ACCEPTED' },
      })
    }
  })

  // Find org and redirect
  const orgMember = await prisma.orgMember.findFirst({
    where: { userId: user.id },
    include: { organization: true },
  })

  if (!orgMember) redirect('/setup')

  redirect(`/org/${orgMember.organization.slug}`)
}

export async function processInvitation(formData: FormData) {
  const token = formData.get('token') as string
  const name = formData.get('name') as string
  const password = formData.get('password') as string

  if (!token || !name || !password) {
    redirect('/accept-invite?error=Missing required fields')
  }

  // 1. Fetch the pending invitation
  const invitation = await prisma.invitation.findUnique({
    where: { id: token },
    include: { organization: true },
  })

  if (!invitation || invitation.status !== 'PENDING') {
    redirect('/login?error=Invalid or expired invitation')
  }

  // 2. Initialize the Supabase Admin Client
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 3. Create the user in Supabase Auth instantly (bypassing email verification)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: invitation.email,
    password,
    email_confirm: true,
    user_metadata: { name },
  })

  if (authError || !authData.user) {
    redirect(`/accept-invite?token=${token}&error=${encodeURIComponent(authError?.message || 'Failed to create user')}`)
  }

  const userId = authData.user.id

  // 4. Create Prisma records mimicking your completeOnboarding logic
  await prisma.$transaction(async (tx) => {
    await tx.user.upsert({
      where: { id: userId },
      update: { name },
      create: {
        id: userId,
        email: invitation.email,
        name,
      },
    })

    await tx.orgMember.upsert({
      where: {
        userId_organizationId: {
          userId,
          organizationId: invitation.organizationId,
        },
      },
      update: {},
      create: {
        userId,
        organizationId: invitation.organizationId,
        role: invitation.role,
      },
    })

    await tx.invitation.update({
      where: { id: token },
      data: { status: 'ACCEPTED' },
    })
  })

  // 5. Log the new user in using the standard Next.js client
  const supabase = await createClient()
  await supabase.auth.signInWithPassword({
    email: invitation.email,
    password,
  })

  // 6. Redirect them directly into their newly joined workspace
  redirect(`/org/${invitation.organization.slug}`)
}
