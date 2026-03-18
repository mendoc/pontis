'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Box, Flex, Text, Heading, Button } from '@radix-ui/themes'
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
} from '@radix-ui/react-icons'
import { useAuth } from '@/app/context/auth'
import { ProjectsProvider } from '@/app/context/projects'
import { useThemeMode } from '@/app/components/ThemeProvider'

interface NavItem {
  label: string
  icon: React.ReactNode
  href: string
}

const globalNavItems: NavItem[] = [
  { label: 'Projets', icon: <LayersIcon />, href: '/dashboard' },
]

const accountNavItems: NavItem[] = [
  { label: 'Mon profil', icon: <PersonIcon />, href: '/profile' },
  { label: 'Feedback', icon: <ChatBubbleIcon />, href: '/feedback' },
]

const getProjectNavItems = (projectId: string): NavItem[] => [
  { label: 'Configuration', icon: <GearIcon />, href: `/projects/${projectId}/settings` },
  { label: 'Déploiements', icon: <RocketIcon />, href: `/projects/${projectId}/deployments` },
  { label: 'Logs', icon: <ReaderIcon />, href: `/projects/${projectId}/logs` },
  { label: 'Terminal', icon: <DesktopIcon />, href: `/projects/${projectId}/terminal` },
  { label: "Variables d'env", icon: <MixerHorizontalIcon />, href: `/projects/${projectId}/env` },
  { label: 'Notifications', icon: <BellIcon />, href: `/projects/${projectId}/notifications` },
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
      }}
      onClick={onClick}
    >
      <Flex align="center" gap="2" style={{ width: '100%' }}>
        <Box style={{ color: isActive ? 'var(--gray-12)' : 'var(--gray-8)', flexShrink: 0, display: 'flex' }}>
          {item.icon}
        </Box>
        <Text size="2" weight={isActive ? 'medium' : 'regular'} style={{ color: isActive ? 'var(--gray-12)' : 'var(--gray-11)' }}>
          {item.label}
        </Text>
      </Flex>
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
        <Heading
          size="4"
          style={{ paddingLeft: 16, marginBottom: 24, color: 'var(--gray-12)', display: 'block' }}
        >
          Pontis
        </Heading>

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
      style={{ cursor: 'pointer', gap: 6 }}
      title={`Thème : ${label}`}
    >
      {icon}
      <Text size="2" style={{ color: 'var(--gray-11)' }}>{label}</Text>
    </Button>
  )
}

function Topbar() {
  const { email, name } = useAuth()
  const displayName = name ?? email
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
      <Box />
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
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
          <ProjectsProvider>{children}</ProjectsProvider>
        </main>
      </div>
    </div>
  )
}
