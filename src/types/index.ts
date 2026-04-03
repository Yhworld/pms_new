import type {
  User, Organization, OrgMember, Project,
  ProjectMember, CardMember,
  CardLabel, Board, List, Card, Label,
  OrgRole, ProjectRole, CardStatus, CardPriority
} from '@prisma/client'

// Re-export prisma types for easy import elsewhere
export type {
  User, Organization, OrgMember, Project,
  ProjectMember, Board, List, Card, Label,
  OrgRole, ProjectRole, CardStatus, CardPriority
}

// Common extended types you'll use across components
export type ProjectWithMembers = Project & {
  members: (ProjectMember & { user: User })[]
}

export type CardWithRelations = Card & {
  members: (CardMember & { user: User })[]
  labels: (CardLabel & { label: Label })[]
  _count: { comments: number; attachments: number; checklists: number }
}

export type ListWithCards = List & {
  cards: CardWithRelations[]
}

export type OrgMemberWithUser = OrgMember & {   // 👈 new helper type
  user: User
}

export type BoardWithRelations = Board & {
  project: Project & {
    organization: Organization & {
      members: OrgMemberWithUser[]              // 👈 added
    }
  }
  lists: ListWithCards[]
}
