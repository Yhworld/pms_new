import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { prisma } from '@/src/lib/prisma'

export async function POST() {
  const supabase = await createClient()
  
  // The session was already established by the client component,
  // so we just need to get the user context here.
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ redirect: '/login?error=Unauthorized' })
  }

  // Check if this user already has a DB record with a name set
  // (i.e. they've completed onboarding before)
  const existingUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true },
  })

  // New invited user — no record yet or no name set
  if (!existingUser || !existingUser.name) {
    return NextResponse.json({ redirect: '/onboarding' })
  }

  // Existing user — find their org and send them to dashboard
  const orgMember = await prisma.orgMember.findFirst({
    where: { userId: user.id },
    include: { organization: true },
  })

  if (!orgMember) {
    return NextResponse.json({ redirect: '/setup' })
  }

  return NextResponse.json({ redirect: `/org/${orgMember.organization.slug}` })
}