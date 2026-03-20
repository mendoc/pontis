'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Box, Flex, Text, Heading, Button, DropdownMenu } from '@radix-ui/themes'
import {
  LayersIcon,
  PersonIcon,
  BellIcon,
  ChatBubbleIcon,
  GearIcon,
  RocketIcon,
  ReaderIcon,
  DesktopIcon,
  MixerHorizontalIcon,
  ExitIcon,
  SunIcon,
  MoonIcon,
  ChevronDownIcon,
  ClockIcon,
} from '@radix-ui/react-icons'
import { useAuth } from '@/app/context/auth'
import pkg from '@/package.json'
import { ProjectsProvider, useProjects, Project } from '@/app/context/projects'
import { useThemeMode } from '@/app/components/ThemeProvider'
import { ToastProvider } from '@/app/components/Toast'

interface NavItem {
  label: string
  icon: React.ReactNode
  href: string
  comingSoon?: boolean
}

const globalNavItems: NavItem[] = [
  { label: 'Projets', icon: <LayersIcon />, href: '/dashboard' },
]

const accountNavItems: NavItem[] = [
  { label: 'Mon profil', icon: <PersonIcon />, href: '/profile', comingSoon: true },
  { label: 'Feedback', icon: <ChatBubbleIcon />, href: '/feedback', comingSoon: true },
]

const getProjectNavItems = (projectId: string): NavItem[] => [
  { label: 'Configuration', icon: <GearIcon />, href: `/projects/${projectId}/settings` },
  { label: 'Déploiements', icon: <RocketIcon />, href: `/projects/${projectId}/deployments` },
  { label: 'Logs', icon: <ReaderIcon />, href: `/projects/${projectId}/logs`, comingSoon: true },
  { label: 'Terminal', icon: <DesktopIcon />, href: `/projects/${projectId}/terminal`, comingSoon: true },
  { label: "Variables d'env", icon: <MixerHorizontalIcon />, href: `/projects/${projectId}/env`, comingSoon: true },
  { label: 'Notifications', icon: <BellIcon />, href: `/projects/${projectId}/notifications`, comingSoon: true },
]

function NavButton({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      color="gray"
      size="1"
      style={{
        width: '100%',
        justifyContent: 'flex-start',
        cursor: 'pointer',
        height: 32,
        paddingLeft: 16,
        paddingRight: 8,
        borderRadius: 4,
        backgroundColor: isActive ? 'var(--gray-4)' : undefined,
        position: 'relative',
      }}
      onClick={onClick}
    >
      <Flex align="center" gap="2">
        <Box style={{ color: isActive ? 'var(--gray-12)' : 'var(--gray-8)', flexShrink: 0, display: 'flex' }}>
          {item.icon}
        </Box>
        <Text size="2" weight={isActive ? 'medium' : 'regular'} style={{ color: isActive ? 'var(--gray-12)' : 'var(--gray-11)' }}>
          {item.label}
        </Text>
      </Flex>
      {item.comingSoon && (
        <Box style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-7)', display: 'flex' }}>
          <ClockIcon />
        </Box>
      )}
    </Button>
  )
}

function NavSection({ title, items, pathname, router }: {
  title?: string
  items: NavItem[]
  pathname: string
  router: ReturnType<typeof useRouter>
}) {
  return (
    <Box>
      {title && (
        <Text
          style={{
            display: 'block',
            paddingLeft: 16,
            marginBottom: 6,
            color: 'var(--gray-9)',
            fontSize: 11,
            letterSpacing: '0.05em',
            fontWeight: 500,
          }}
        >
          {title}
        </Text>
      )}
      <Flex direction="column" style={{ gap: 10 }}>
        {items.map((item) => (
          <NavButton
            key={item.href}
            item={item}
            isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
            onClick={() => router.push(item.href)}
          />
        ))}
      </Flex>
    </Box>
  )
}

function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { logout } = useAuth()

  const projectMatch = pathname.match(/^\/projects\/([^/]+)/)
  const currentProjectId = projectMatch?.[1] !== 'new' ? projectMatch?.[1] : undefined

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <Box
      style={{
        width: 256,
        flexShrink: 0,
        height: '100vh',
        backgroundColor: 'var(--color-background)',
        borderRight: '1px solid var(--gray-4)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Zone scrollable */}
      <Box style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px 8px 0' }}>
        {/* Logo */}
        <Flex align="baseline" justify="between" style={{ paddingLeft: 16, paddingRight: 16, marginBottom: 24 }}>
          <Heading size="4" style={{ color: 'var(--gray-12)' }}>Pontis</Heading>
          <Text size="1" style={{ color: 'var(--gray-8)', fontFamily: 'monospace' }}>v{pkg.version}</Text>
        </Flex>

        {/* Navigation globale */}
        <NavSection items={globalNavItems} pathname={pathname} router={router} />

        {/* Section projet — visible uniquement dans la vue détail */}
        {currentProjectId && (
          <Box style={{ marginTop: 20 }}>
            <Box style={{ borderTop: '1px solid var(--gray-4)', marginBottom: 16 }} />
            <NavSection
              title="PROJET"
              items={getProjectNavItems(currentProjectId)}
              pathname={pathname}
              router={router}
            />
          </Box>
        )}

        {/* Compte */}
        <Box style={{ marginTop: 20 }}>
          <Box style={{ borderTop: '1px solid var(--gray-4)', marginBottom: 16 }} />
          <NavSection title="COMPTE" items={accountNavItems} pathname={pathname} router={router} />
        </Box>
      </Box>

      {/* Déconnexion — fixée en bas */}
      <Box style={{ borderTop: '1px solid var(--gray-4)', padding: '8px 8px', flexShrink: 0 }}>
        <Button
          variant="ghost"
          color="red"
          size="1"
          style={{
            width: '100%',
            justifyContent: 'flex-start',
            cursor: 'pointer',
            height: 32,
            paddingLeft: 16,
            paddingRight: 8,
            borderRadius: 4,
          }}
          onClick={handleLogout}
        >
          <Flex align="center" gap="2">
            <ExitIcon />
            <Text size="2">Se déconnecter</Text>
          </Flex>
        </Button>
      </Box>
    </Box>
  )
}

const THEME_MODES = ['system', 'light', 'dark'] as const

function ThemeToggle() {
  const { mode, setMode } = useThemeMode()

  const cycle = () => {
    const idx = THEME_MODES.indexOf(mode)
    setMode(THEME_MODES[(idx + 1) % THEME_MODES.length])
  }

  const icon = mode === 'light' ? <SunIcon /> : mode === 'dark' ? <MoonIcon /> : <DesktopIcon />
  const label = mode === 'light' ? 'Clair' : mode === 'dark' ? 'Sombre' : 'Système'

  return (
    <Button
      variant="ghost"
      color="gray"
      size="2"
      onClick={cycle}
      style={{ cursor: 'pointer', gap: 6, height: 36 }}
      title={`Thème : ${label}`}
    >
      {icon}
      <Text size="2" style={{ color: 'var(--gray-11)' }}>{label}</Text>
    </Button>
  )
}

function ProjectSwitcher() {
  const pathname = usePathname()
  const router = useRouter()
  const { fetchProjects, projects } = useProjects()
  const { isLoading: authLoading } = useAuth()

  const match = pathname.match(/^\/projects\/([^/]+)/)
  const currentProjectId = match?.[1] !== 'new' ? match?.[1] : undefined

  useEffect(() => {
    if (!currentProjectId || authLoading) return
    fetchProjects().catch(() => {})
  }, [currentProjectId, authLoading])

  if (!currentProjectId) return null

  const currentProject = projects.find((p) => p.id === currentProjectId)
  const rawSuffix = pathname.replace(/^\/projects\/[^/]+/, '') || '/settings'
  // Sur une page de détail (ex: /deployments/[id]), revenir à la liste parente
  const suffix = rawSuffix.replace(/^(\/[^/]+)\/[^/]+$/, '$1') || '/settings'

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button variant="ghost" color="gray" size="2" style={{ cursor: 'pointer', gap: 6, height: 36 }}>
          <Text size="2" weight="medium" style={{ color: 'var(--gray-12)' }}>
            {currentProject?.name ?? '…'}
          </Text>
          <ChevronDownIcon style={{ color: 'var(--gray-9)' }} />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {projects.map((p) => (
          <DropdownMenu.Item
            key={p.id}
            onSelect={() => router.push(`/projects/${p.id}${suffix}`)}
            style={{ fontWeight: p.id === currentProjectId ? 600 : undefined }}
          >
            {p.name}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}

function Topbar() {
  const { email, name } = useAuth()
  const rawName = name ?? email
  const displayName = rawName?.includes('@') ? rawName.split('@')[0] : rawName
  const initial = displayName ? displayName[0].toUpperCase() : '?'

  return (
    <Flex
      align="center"
      justify="between"
      style={{
        height: 60,
        flexShrink: 0,
        paddingLeft: 24,
        paddingRight: 24,
        backgroundColor: 'var(--color-background)',
        borderBottom: '1px solid var(--gray-4)',
      }}
    >
      <Box><ProjectSwitcher /></Box>
      <Flex align="center" gap="6">
        <ThemeToggle />
        {displayName && (
          <Flex align="center" gap="2">
            <Box
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: 'var(--gray-12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Text size="1" weight="bold" style={{ color: 'var(--gray-1)', lineHeight: 1 }}>
                {initial}
              </Text>
            </Box>
            <Text size="2" style={{ color: 'var(--gray-11)' }}>
              {displayName}
            </Text>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProjectsProvider>
      <ToastProvider>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Topbar />
          <main style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
            {children}
          </main>
        </div>
      </div>
      </ToastProvider>
    </ProjectsProvider>
  )
}
