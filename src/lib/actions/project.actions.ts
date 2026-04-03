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
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const member = await prisma.orgMember.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
  })

  if (!member || member.role !== 'OWNER') return { error: 'Not authorized' }

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

      await tx.projectMember.create({
        data: {
          userId: user.id,
          projectId: p.id,
          role: 'MANAGER',
        },
      })

      return p
    })

    revalidatePath('/')
    revalidatePath(`/projects/${project.id}`)

    return { projectId: project.id }
  } catch {
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