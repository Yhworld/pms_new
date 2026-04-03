'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { prisma } from '@/src/lib/prisma'
import { slugify } from '@/src/lib/utlis'

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
