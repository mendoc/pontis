'use client'

import { Flex, Text } from '@radix-ui/themes'
import { ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons'

export type SortOrder = 'asc' | 'desc'

export function SortableHeader({ label, field, sortBy, sortOrder, onSort }: {
  label: string
  field: string
  sortBy: string
  sortOrder: SortOrder
  onSort: (field: string) => void
}) {
  const active = sortBy === field
  return (
    <th
      onClick={() => onSort(field)}
      style={{ padding: '10px 16px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}
    >
      <Flex align="center" gap="1">
        <Text size="1" weight="medium" style={{ color: active ? 'var(--gray-12)' : 'var(--gray-9)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </Text>
        {active
          ? sortOrder === 'asc'
            ? <ChevronUpIcon style={{ color: 'var(--gray-11)' }} />
            : <ChevronDownIcon style={{ color: 'var(--gray-11)' }} />
          : <ChevronDownIcon style={{ color: 'var(--gray-6)' }} />
        }
      </Flex>
    </th>
  )
}
