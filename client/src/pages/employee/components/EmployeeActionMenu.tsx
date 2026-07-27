import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { FieldWorkIcon, FuelIcon, MaterialIcon } from "./EmployeeMenuIcons";

const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.875rem;
  margin-bottom: 1rem;
`;

const MenuCard = styled.button<{ $accent: string; $accentSoft: string }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  width: 100%;
  height: 5rem;
  padding: 0 1.25rem;
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
`;

const IconWrap = styled.span<{ $accent: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 14px;
  background: ${({ $accent }) => $accent};
  color: var(--text-on-brand);
  flex-shrink: 0;
`;

const MenuLabel = styled.span`
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.25;
  text-align: right;
  color: var(--text-primary);
`;

const ACTIONS = [
  {
    path: "/employee/operation-report",
    label: "משימות",
    accent: "var(--color-employee-field)",
    accentSoft: "var(--color-employee-field-soft)",
    Icon: FieldWorkIcon,
  },
  {
    path: "/employee/material",
    label: "שימוש בחומר",
    accent: "var(--color-employee-material)",
    accentSoft: "var(--color-employee-material-soft)",
    Icon: MaterialIcon,
  },
  {
    path: "/employee/fuel",
    label: "פעולת דלק",
    accent: "var(--color-employee-fuel)",
    accentSoft: "var(--color-employee-fuel-soft)",
    Icon: FuelIcon,
  },
] as const;

export function EmployeeActionMenu() {
  const navigate = useNavigate();

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
  );
}
