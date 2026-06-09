import { useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { CreateCustomerBillingSections } from "../components/customerBilling/CreateCustomerBillingSections";
import { useCustomersWithUnbilled } from "../hooks/customerBilling/useCustomersWithUnbilled";
import { useUnbilledPreview } from "../hooks/customerBilling/useUnbilledPreview";
import "./Page.css";

export function CreateCustomerBillingPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  const {
    data: customersData,
    isLoading: customersLoading,
    isError: customersError,
    error: customersErrorObj,
  } = useCustomersWithUnbilled();

  const customers = customersData ?? [];

  const {
    data: preview,
    isLoading: previewLoading,
    isError: previewError,
    error: previewErrorObj,
  } = useUnbilledPreview(selectedCustomerId);

  const showPreview = Boolean(selectedCustomerId);
  const selectedCustomerName =
    customers.find((customer) => customer._id === selectedCustomerId)?.name ?? "";

  return (
    <div className="page page-collection">
      <PageHeader>
        <div>
          <BackLink to="/trackings/customer-billing">
            {" "}
            → חזרה למעקב חיובי לקוחות
          </BackLink>
          <PageTitle>יצירת חיוב חדש</PageTitle>
        </div>
      </PageHeader>

      <section className="page-body">
        <CustomerStep>
          <StepLabel htmlFor="customer-select">לקוח</StepLabel>
          {customersLoading ? (
            <StatusText>טוען לקוחות...</StatusText>
          ) : customersError ? (
            <StatusText $error role="alert">
              {customersErrorObj?.message ?? "שגיאה בטעינת לקוחות"}
            </StatusText>
          ) : customers.length === 0 ? (
            <StatusText>אין לקוחות עם פריטים לחיוב</StatusText>
          ) : (
            <CustomerSelect
              id="customer-select"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              <option value="">בחר לקוח...</option>
              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.name}
                </option>
              ))}
            </CustomerSelect>
          )}
        </CustomerStep>

        {showPreview && (
          <CreateCustomerBillingSections
            customerId={selectedCustomerId}
            customerName={selectedCustomerName}
            preview={preview}
            isLoading={previewLoading}
            isError={previewError}
            errorMessage={previewErrorObj?.message}
          />
        )}
      </section>
    </div>
  );
}

const PageHeader = styled.header`
  margin-bottom: 1rem;
`;

const BackLink = styled(Link)`
  display: inline-block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-decoration: none;

  &:hover {
    color: var(--accent);
  }
`;

const PageTitle = styled.h1`
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
`;

const CustomerStep = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 24rem;
  margin-bottom: 2rem;
`;

const StepLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
`;

const CustomerSelect = styled.select`
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  color: var(--text-primary);
  font: inherit;
  font-size: 0.9375rem;
`;

const StatusText = styled.p<{ $error?: boolean }>`
  margin: 0;
  font-size: 0.875rem;
  color: ${({ $error }) => ($error ? "#fc8181" : "var(--text-secondary)")};
`;
