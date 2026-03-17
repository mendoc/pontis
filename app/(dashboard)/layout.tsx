'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Box, Flex, Text, Heading, Button } from '@radix-ui/themes'
import {
  LayersIcon,
  ComponentInstanceIcon,
  ArchiveIcon,
  ActivityLogIcon,
  CubeIcon,
  BellIcon,
  Link1Icon,
  CardStackIcon,
  GearIcon,
  ExitIcon,
} from '@radix-ui/react-icons'
import { useAuth } from '@/app/context/auth'
import { ProjectsProvider } from '@/app/context/projects'

interface NavItem {
  label: string
  icon: React.ReactNode
  href: string
}

interface NavSection {
  title?: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    items: [
      { label: 'Projets', icon: <LayersIcon />, href: '/dashboard' },
      { label: 'Blueprints', icon: <ComponentInstanceIcon />, href: '/blueprints' },
      { label: "Groupes d'environnement", icon: <ArchiveIcon />, href: '/environments' },
    ],
  },
  {
    title: 'INTÉGRATIONS',
    items: [
      { label: 'Observabilité', icon: <ActivityLogIcon />, href: '/observability' },
      { label: 'Webhooks', icon: <CubeIcon />, href: '/webhooks' },
      { label: 'Notifications', icon: <BellIcon />, href: '/notifications' },
    ],
  },
  {
    title: 'RÉSEAU',
    items: [
      { label: 'Liens privés', icon: <Link1Icon />, href: '/private-links' },
    ],
  },
  {
    title: 'WORKSPACE',
    items: [
      { label: 'Facturation', icon: <CardStackIcon />, href: '/billing' },
      { label: 'Paramètres', icon: <GearIcon />, href: '/settings' },
    ],
  },
]


function NavButton({ item, isActive, onClick, marginBottom }: { item: NavItem; isActive: boolean; onClick: () => void; marginBottom?: number }) {
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
        marginBottom,
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

function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { logout } = useAuth()

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
        backgroundColor: 'var(--color-panel-solid)',
        borderRight: '1px solid var(--gray-4)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Zone scrollable : titre + nav */}
      <Box style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px 8px 0' }}>
        {/* Titre */}
        <Heading
          size="4"
          style={{ paddingLeft: 16, marginBottom: 24, color: 'var(--gray-12)', display: 'block' }}
        >
          Pontis
        </Heading>

        {/* Navigation principale */}
        {navSections.map((section, i) => (
          <Box key={i} style={{ marginTop: i > 0 ? 20 : 0 }}>
            {section.title && (
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
                {section.title}
              </Text>
            )}
            <Flex direction="column" style={{ gap: 1 }}>
              {section.items.map((item) => (
                <NavButton
                  key={item.href}
                  item={item}
                  isActive={pathname === item.href}
                  onClick={() => router.push(item.href)}
                  marginBottom={item.href === '/dashboard' ? 6 : undefined}
                />
              ))}
            </Flex>
          </Box>
        ))}
      </Box>

      {/* Déconnexion — fixée en bas */}
      <Box
        style={{
          borderTop: '1px solid var(--gray-4)',
          padding: '8px 8px',
          flexShrink: 0,
        }}
      >
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
      <Flex align="center" gap="2">
        <LayersIcon style={{ color: 'var(--gray-9)' }} />
        <Text size="2" weight="medium" style={{ color: 'var(--gray-12)' }}>
          Projets
        </Text>
      </Flex>
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
