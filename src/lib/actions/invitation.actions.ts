'use server'

import { createClient } from '@/src/lib/supabase/server'
import { prisma } from '@/src/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function inviteMember(formData: FormData) {
  const email = formData.get('email') as string
  const orgId = formData.get('orgId') as string

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Verify sender is owner
  const member = await prisma.orgMember.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
  })
  if (!member || member.role !== 'OWNER') return { error: 'Only owners can invite members' }

  const org = await prisma.organization.findUnique({ where: { id: orgId } })

  // Check if invite exists
  const existing = await prisma.invitation.findUnique({
    where: { email_organizationId: { email, organizationId: orgId } },
  })
  if (existing && existing.status === 'PENDING') {
    return { error: 'An invite is already pending for this email' }
  }

  // Create secure invitation record
  const invitation = await prisma.invitation.upsert({
    where: { email_organizationId: { email, organizationId: orgId } },
    update: {
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
    },
    create: {
      email,
      organizationId: orgId,
      invitedById: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  // Generate the clean token URL
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite?token=${invitation.id}`

  // Send the email! (Replace 'yourdomain.com' with the domain you just verified)
  const { error: resendError } = await resend.emails.send({
    from: 'Acme PMS <invites@theluul.com>', 
    to: email,
    subject: `You've been invited to join ${org?.name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to the team!</h2>
        <p>You have been invited to join <strong>${org?.name}</strong> on our project management platform.</p>
        <br/>
        <a href="${inviteLink}" style="display:inline-block; padding:12px 24px; background-color:#0f172a; color:#ffffff; text-decoration:none; border-radius:6px; font-weight:bold;">
          Accept Invitation
        </a>
        <br/><br/>
        <p style="color: #64748b; font-size: 14px;">
          If the button doesn't work, copy and paste this link into your browser:<br/>
          <a href="${inviteLink}">${inviteLink}</a>
        </p>
      </div>
    `,
  })

  if (resendError) {
    console.error(resendError)
    return { error: 'Failed to send invite email. Check Resend config.' }
  }

  return { success: true }
}