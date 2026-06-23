import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  BackButton,
  EmployeeContent,
  EmployeeHeader,
  EmployeeTitle,
  ErrorBanner,
  StickySubmitBar,
  StickySubmitInner,
  SubmitButton,
  SuccessBanner,
} from "../employeeStyles";

type EmployeeFormShellProps = {
  title: string;
  onSubmit: () => void;
  isSubmitting?: boolean;
  error?: string | null;
  success?: boolean;
  submitLabel?: string;
  children: ReactNode;
};

export function EmployeeFormShell({
  title,
  onSubmit,
  isSubmitting = false,
  error = null,
  success = false,
  submitLabel = "שמור",
  children,
}: EmployeeFormShellProps) {
  const navigate = useNavigate();

  return (
    <>
      <EmployeeContent>
        <EmployeeHeader>
          <div>
            <BackButton type="button" onClick={() => navigate("/employee")}>
              → חזרה
            </BackButton>
            <EmployeeTitle>{title}</EmployeeTitle>
          </div>
        </EmployeeHeader>

        {error ? <ErrorBanner>{error}</ErrorBanner> : null}
        {success ? <SuccessBanner>נשמר בהצלחה</SuccessBanner> : null}

        {children}
      </EmployeeContent>

      <StickySubmitBar>
        <StickySubmitInner>
          <SubmitButton
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || success}
          >
            {isSubmitting ? "שומר..." : submitLabel}
          </SubmitButton>
        </StickySubmitInner>
      </StickySubmitBar>
    </>
  );
}
