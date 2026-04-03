import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { prisma } from '@/src/lib/prisma'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ redirect: '/login?error=Unauthorized' })
  }

  // Check if user has completed onboarding (has a name set)
  const existingUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true },
  })

  if (!existingUser || !existingUser.name) {
    return NextResponse.json({ redirect: '/onboarding' })
  }

  // Already onboarded — find their org
  const orgMember = await prisma.orgMember.findFirst({
    where: { userId: user.id },
    include: { organization: true },
  })

  if (!orgMember) {
    return NextResponse.json({ redirect: '/setup' })
  }

  return NextResponse.json({ redirect: `/org/${orgMember.organization.slug}` })
}
