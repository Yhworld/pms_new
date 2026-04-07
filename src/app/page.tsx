import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { prisma } from '@/src/lib/prisma'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const orgMember = await prisma.orgMember.findFirst({
    where: { userId: user.id },
    include: { organization: true },
  })

  if (!orgMember) redirect('/setup')

  redirect(`/org/${orgMember.organization.slug}/dashboard`)  // ← was just /org/slug
}