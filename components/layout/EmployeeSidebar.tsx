import {
  BookOpen,
  UserMinus,
  UserPlus,
  CheckSquare,
} from 'lucide-react'
import type { SidebarNavItem } from './Sidebar'

const basePath = '/super/admin'

export const employeeSidebarItems: SidebarNavItem[] = [
  { label: 'Masterfile', href: `${basePath}/employee`, icon: BookOpen },
  { label: 'Onboard Employee', href: `${basePath}/employee/onboard`, icon: UserPlus },
  { label: 'Terminate Employee', href: `${basePath}/employee/terminate`, icon: UserMinus },
  { label: 'Evaluation', href: `${basePath}/employee/evaluation`, icon: CheckSquare },
]
