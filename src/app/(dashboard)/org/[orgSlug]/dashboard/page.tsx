import { notFound } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { prisma } from '@/src/lib/prisma'
import { isPast, differenceInDays } from 'date-fns'
import {
  FolderKanban, CheckSquare, AlertTriangle,
  Users, TrendingUp, Clock
} from 'lucide-react'
import { CardsByStatusChart } from '@/src/components/shared/CardsByStatusChart'
import { CardsByPriorityChart } from '@/src/components/shared/CardsByPriorityChart'
import { ProjectProgressList } from '@/src/components/shared/ProjectProgressList'
import { RecentActivity } from '@/src/components/shared/RecentActivity'
import { TasksCompletedChart } from '@/src/components/shared/TasksCompletedChart'
import { TimeLoggedChart } from '@/src/components/shared/TimeLoggedChart'
import { TopContributors } from '@/src/components/shared/TopContributors'

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      members: true,
      projects: {
        include: {
          members: true,
          boards: {
            include: {
              lists: {
                include: {
                  cards: {
                    where: { isArchived: false },
                    include: {
                      checklists: {
                        include: {
                          items: { select: { isCompleted: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!org) notFound()

  // ── Flatten all cards ─────────────────────────────────────────────────────
  const allCards = org.projects.flatMap((p) =>
    p.boards.flatMap((b) => b.lists.flatMap((l) => l.cards))
  )

  // ── KPI Calculations ──────────────────────────────────────────────────────
  const activeProjects = org.projects.filter(p => p.status === 'ACTIVE').length
  const completedProjects = org.projects.filter(p => p.status === 'COMPLETED').length
  const totalCards = allCards.length
  const doneCards = allCards.filter(c => c.status === 'DONE').length
  const overdueCards = allCards.filter(
    c => c.dueDate && isPast(new Date(c.dueDate)) && c.status !== 'DONE'
  ).length
  const completionRate = totalCards > 0 ? Math.round((doneCards / totalCards) * 100) : 0

  // ── Chart Data ────────────────────────────────────────────────────────────
  const statusData = [
    { name: 'To Do',       value: allCards.filter(c => c.status === 'TODO').length,        color: '#94a3b8' },
    { name: 'In Progress', value: allCards.filter(c => c.status === 'IN_PROGRESS').length, color: '#3b82f6' },
    { name: 'In Review',   value: allCards.filter(c => c.status === 'IN_REVIEW').length,   color: '#f59e0b' },
    { name: 'Blocked',     value: allCards.filter(c => c.status === 'BLOCKED').length,     color: '#ef4444' },
    { name: 'Done',        value: doneCards,                                                color: '#22c55e' },
  ].filter(d => d.value > 0)

  const priorityData = [
    { name: 'Low',    value: allCards.filter(c => c.priority === 'LOW').length,    color: '#94a3b8' },
    { name: 'Medium', value: allCards.filter(c => c.priority === 'MEDIUM').length, color: '#3b82f6' },
    { name: 'High',   value: allCards.filter(c => c.priority === 'HIGH').length,   color: '#f97316' },
    { name: 'Urgent', value: allCards.filter(c => c.priority === 'URGENT').length, color: '#ef4444' },
  ].filter(d => d.value > 0)

  // ── Project Progress ──────────────────────────────────────────────────────
  const projectProgress = org.projects
    .filter(p => p.status === 'ACTIVE' || p.status === 'ON_HOLD')
    .map((project) => {
      const cards = project.boards.flatMap(b => b.lists.flatMap(l => l.cards))
      const total = cards.length
      const done = cards.filter(c => c.status === 'DONE').length
      const percent = total > 0 ? Math.round((done / total) * 100) : 0
      return {
        id: project.id,
        name: project.name,
        status: project.status,
        deadline: project.deadline,
        total,
        done,
        percent,
        checklistTotal: cards.flatMap(c => c.checklists).flatMap(cl => cl.items).length,
        checklistDone: cards.flatMap(c => c.checklists).flatMap(cl => cl.items).filter(i => i.isCompleted).length,
        memberCount: project.members.length,
      }
    })
    .sort((a, b) => b.percent - a.percent)

  // ── Recent Activity ───────────────────────────────────────────────────────
  const recentActivity = await prisma.activity.findMany({
    where: {
      card: {
        list: { board: { project: { organizationId: org.id } } },
      },
    },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 8,
  })

  // ── Team Productivity ─────────────────────────────────────────────────────
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 7)
  weekStart.setHours(0, 0, 0, 0)

  const timeLogs = await prisma.timeLog.findMany({
    where: {
      card: { list: { board: { project: { organizationId: org.id } } } },
      loggedAt: { gte: weekStart },
    },
    include: { user: true },
  })

  const timeByMember = Object.values(
    timeLogs.reduce<Record<string, { name: string; minutes: number }>>(
      (acc, log) => {
        const name = log.user.name ?? log.user.email.split('@')[0]
        if (!acc[log.userId]) acc[log.userId] = { name, minutes: 0 }
        acc[log.userId].minutes += log.minutes
        return acc
      },
      {}
    )
  )
    .map(m => ({ ...m, hours: +(m.minutes / 60).toFixed(1) }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 8)

  // Tasks completed per day (last 7 days)
  const completedThisWeek = await prisma.card.findMany({
    where: {
      list: { board: { project: { organizationId: org.id } } },
      status: 'DONE',
      completedAt: { gte: weekStart },
    },
    select: { completedAt: true },
  })

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateStr: d.toDateString(),
      completed: 0,
    }
  })

  completedThisWeek.forEach((card) => {
    if (!card.completedAt) return
    const match = days.find(d => d.dateStr === new Date(card.completedAt!).toDateString())
    if (match) match.completed++
  })

  // Top contributors
  const completedWithMembers = await prisma.card.findMany({
    where: {
      list: { board: { project: { organizationId: org.id } } },
      status: 'DONE',
      completedAt: { gte: weekStart },
    },
    include: { members: { include: { user: true } } },
  })

  const contributorMap: Record<string, { name: string; email: string; completed: number }> = {}
  completedWithMembers.forEach((card) => {
    card.members.forEach((m) => {
      if (!contributorMap[m.userId]) {
        contributorMap[m.userId] = {
          name: m.user.name ?? m.user.email.split('@')[0],
          email: m.user.email,
          completed: 0,
        }
      }
      contributorMap[m.userId].completed++
    })
  })

  const topContributors = Object.values(contributorMap)
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 5)

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = [
    {
      label: 'Active Projects',
      value: activeProjects,
      sub: `${completedProjects} completed`,
      icon: FolderKanban,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Total Tasks',
      value: totalCards,
      sub: `${doneCards} completed`,
      icon: CheckSquare,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Completion Rate',
      value: `${completionRate}%`,
      sub: `${totalCards - doneCards} remaining`,
      icon: TrendingUp,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'Overdue Tasks',
      value: overdueCards,
      sub: overdueCards > 0 ? 'Need attention' : 'All on track',
      icon: overdueCards > 0 ? AlertTriangle : Clock,
      color: overdueCards > 0 ? 'text-red-600' : 'text-zinc-500',
      bg: overdueCards > 0 ? 'bg-red-50' : 'bg-zinc-50',
    },
    {
      label: 'Team Members',
      value: org.members.length,
      sub: `across ${org.projects.length} project${org.projects.length !== 1 ? 's' : ''}`,
      icon: Users,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ]

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-8 px-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Overview of <span className="font-medium text-zinc-700">{org.name}</span>
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white border border-zinc-100 rounded-xl p-4 shadow-sm flex flex-col gap-3"
          >
            <div className={`h-9 w-9 rounded-lg ${kpi.bg} flex items-center justify-center`}>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 leading-none">{kpi.value}</p>
              <p className="text-[11px] font-medium text-zinc-400 mt-1">{kpi.sub}</p>
            </div>
            <p className="text-[12px] font-medium text-zinc-500">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardsByStatusChart data={statusData} total={totalCards} />
        <CardsByPriorityChart data={priorityData} />
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProjectProgressList projects={projectProgress} />
        <RecentActivity activities={recentActivity} />
      </div>

      {/* ── Team Productivity ── */}
      <div>
        <h2 className="text-[13px] font-semibold text-zinc-500 uppercase tracking-wide mb-4">
          Team Productivity · This Week
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TasksCompletedChart data={days} />
          <TimeLoggedChart data={timeByMember} />
          <TopContributors contributors={topContributors} />
        </div>
      </div>

    </div>
  )
}