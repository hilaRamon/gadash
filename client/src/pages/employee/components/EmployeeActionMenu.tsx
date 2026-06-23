import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import {
  AdminTaskIcon,
  FieldWorkIcon,
  FuelIcon,
  MaterialIcon,
} from './EmployeeMenuIcons'

const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.875rem;
  margin-bottom: 1rem;
`

const MenuCard = styled.button<{ $accent: string; $accentSoft: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  aspect-ratio: 1;
  width: 100%;
  padding: 1rem 0.75rem;
  border: none;
  border-radius: 16px;
  background: ${({ $accentSoft }) => $accentSoft};
  color: ${({ $accent }) => $accent};
  font: inherit;
  cursor: pointer;
  box-sizing: border-box;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
`

const IconWrap = styled.span<{ $accent: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 14px;
  background: ${({ $accent }) => $accent};
  color: #fff;
  flex-shrink: 0;
`

const MenuLabel = styled.span`
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.25;
  text-align: center;
  color: var(--text-primary);
`

const ACTIONS = [
  {
    path: '/employee/field-work',
    label: 'משימת עיבוד',
    accent: '#2d8a5e',
    accentSoft: 'rgba(45, 138, 94, 0.14)',
    Icon: FieldWorkIcon,
  },
  {
    path: '/employee/admin',
    label: 'משימת מנהלה',
    accent: '#2563eb',
    accentSoft: 'rgba(37, 99, 235, 0.14)',
    Icon: AdminTaskIcon,
  },
  {
    path: '/employee/material',
    label: 'שימוש בחומר',
    accent: '#d97706',
    accentSoft: 'rgba(217, 119, 6, 0.14)',
    Icon: MaterialIcon,
  },
  {
    path: '/employee/fuel',
    label: 'פעולת דלק',
    accent: '#dc2626',
    accentSoft: 'rgba(220, 38, 38, 0.14)',
    Icon: FuelIcon,
  },
] as const

export function EmployeeActionMenu() {
  const navigate = useNavigate()

  return (
    <MenuGrid>
      {ACTIONS.map((action) => (
        <MenuCard
          key={action.path}
          type="button"
          $accent={action.accent}
          $accentSoft={action.accentSoft}
          onClick={() => navigate(action.path)}
        >
          <IconWrap $accent={action.accent}>
            <action.Icon size={28} />
          </IconWrap>
          <MenuLabel>{action.label}</MenuLabel>
        </MenuCard>
      ))}
    </MenuGrid>
  )
}
