import { Users, Shield, FileText } from 'lucide-react'
import type { SidebarNavItem } from './Sidebar'

const basePath = '/super/admin/management'

export const managementSidebarItems: SidebarNavItem[] = [
  { label: 'Accounts', href: `${basePath}?tab=accounts`, icon: Users },
  { label: 'Permission', href: `${basePath}?tab=permission`, icon: Shield },
  { label: 'Placeholder', href: `${basePath}?tab=placeholder`, icon: FileText },
]
