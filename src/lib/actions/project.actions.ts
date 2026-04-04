'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/src/lib/supabase/server'
import { prisma } from '@/src/lib/prisma'
import type { User } from '@/src/types'
import type { ProjectStatus } from '@prisma/client'

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')
  return user
}

async function requireProjectManager(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  })

  if (!member || member.role !== 'MANAGER') {
    throw new Error('Only managers can perform this action')
  }

  return member
}

export async function createProject(formData: FormData) {
  const projectName = formData.get('projectName') as string
  const description = formData.get('description') as string
  const orgId = formData.get('orgId') as string
  const startDate = formData.get('startDate') as string
  const deadline = formData.get('deadline') as string

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // 1. Fetch the creator's role
  const member = await prisma.orgMember.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
  })

  // (Optional: You can remove this check if you want Org MEMBERs to be able to create projects too)
  if (!member || member.role !== 'OWNER') return { error: 'Not authorized' }

  // 2. Fetch ALL Org Owners so they can be auto-assigned
  const orgOwners = await prisma.orgMember.findMany({
    where: { organizationId: orgId, role: 'OWNER' }
  })

  try {
    const project = await prisma.$transaction(async (tx) => {
      const p = await tx.project.create({
        data: {
          name: projectName,
          description: description || null,
          organizationId: orgId,
          startDate: startDate ? new Date(startDate) : null,
          deadline: deadline ? new Date(deadline) : null,
        },
      })

      // 3. Prepare the list of managers (All Org Owners)
      const membersData = orgOwners.map((owner) => ({
        userId: owner.userId,
        projectId: p.id,
        role: 'MANAGER' as any // Prisma enum type
      }))

      // Ensure the creator is always added, even if they aren't an owner
      if (!membersData.some(m => m.userId === user.id)) {
        membersData.push({ userId: user.id, projectId: p.id, role: 'MANAGER' as any })
      }

      // Auto-add everyone
      await tx.projectMember.createMany({
        data: membersData,
      })

      return p
    })

    return { projectId: project.id }
  } catch (error) {
    console.error(error)
    return { error: 'Failed to create project' }
  }
}

export async function updateProject(
  projectId: string,
  data: {
    name?: string
    description?: string | null
    startDate?: Date | null
    deadline?: Date | null
    status?: ProjectStatus
  }
) {
  try {
    const user = await requireUser()
    await requireProjectManager(projectId, user.id)

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
        ...(data.startDate !== undefined ? { startDate: data.startDate } : {}),
        ...(data.deadline !== undefined ? { deadline: data.deadline } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
    })

    revalidatePath('/')
    revalidatePath(`/projects/${projectId}`)

    return { success: true, project: updated }
  } catch (error) {
    console.error(error)
    return { error: 'Failed to update project' }
  }
}

export async function deleteProject(projectId: string) {
  try {
    const user = await requireUser()
    await requireProjectManager(projectId, user.id)

    await prisma.project.delete({
      where: { id: projectId },
    })

    revalidatePath('/')

    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: 'Failed to delete project' }
  }
}

export async function addProjectMember(
  projectId: string,
  userId: string,
  role: 'MANAGER' | 'MEMBER' 
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const currentMember = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: user.id, projectId } },
  })

  if (!currentMember || currentMember.role !== 'MANAGER') {
    return { error: 'Only managers can add members' }
  }

  try {
    await prisma.projectMember.create({
      data: { userId, projectId, role },
    })

    revalidatePath(`/projects/${projectId}`)

    return { success: true }
  } catch {
    return { error: 'Failed to add member' }
  }
}

export async function getOrgMembersNotInProject(
  orgId: string,
  existingMemberIds: string[]
): Promise<User[]> {
  const orgMembers = await prisma.orgMember.findMany({
    where: {
      organizationId: orgId,
      userId: { notIn: existingMemberIds },
    },
    include: { user: true },
  })

  return orgMembers.map((m) => m.user)
}