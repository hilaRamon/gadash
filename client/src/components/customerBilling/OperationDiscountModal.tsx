import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { ModalOverlay } from "@/components/ui/ModalOverlay";
import { ModalPanel } from "@/components/ui/Modal";
import { buttonBase, toolbarButtonAccent } from "@/styles/buttonStyles";
import { formatNumber } from "@/lib/formatNumber";
import type { CollectionDocument } from "@/schema/types";

export type DiscountType = "amount" | "percent";

type OperationDiscountModalProps = {
  open: boolean;
  row: CollectionDocument | null;
  isPending?: boolean;
  error?: string | null;
  onClose: () => void;
  onApprove: (discountType: DiscountType, discountValue: number) => void;
};

function previewUnitCost(
  base: number,
  discountType: DiscountType,
  rawAmount: string,
): number | null {
  const value = Number(rawAmount);
  if (!Number.isFinite(base) || base < 0) return null;
  if (!Number.isFinite(value) || value <= 0) return null;
  if (discountType === "percent" && value > 100) return null;
  const next =
    discountType === "amount" ? base - value : base * (1 - value / 100);
  if (!Number.isFinite(next) || next < 0) return null;
  return Number(next.toFixed(2));
}

export function OperationDiscountModal({
  open,
  row,
  isPending = false,
  error = null,
  onClose,
  onApprove,
}: OperationDiscountModalProps) {
  const [discountType, setDiscountType] = useState<DiscountType>("amount");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (!open) return;
    setDiscountType("amount");
    setAmount("");
  }, [open, row?._id]);

  const base = Number(row?.priceBeforeDiscount ?? 0);
  const missingPrice = !Number.isFinite(base) || base <= 0;
  const nextUnitCost = useMemo(
    () => (missingPrice ? null : previewUnitCost(base, discountType, amount)),
    [amount, base, discountType, missingPrice],
  );
  const amountInvalid = amount.trim() !== "" && nextUnitCost == null;

  if (!open || !row) return null;

  return (
    <ModalOverlay open={open} onClose={onClose} layout="centered">
      <ModalPanel
        title="הנחה"
        titleId="operation-discount-title"
        maxWidth="22rem"
        onClose={onClose}
        role="dialog"
        aria-modal={true}
        aria-labelledby="operation-discount-title"
      >
        <CurrentPrice>
          מחיר נוכחי: {Number.isFinite(base) ? formatNumber(base) : "—"}
        </CurrentPrice>
        <ChoiceRow>
          <ChoiceLabel>
            <input
              type="radio"
              name="discount-type"
              checked={discountType === "amount"}
              onChange={() => setDiscountType("amount")}
            />
            סכום
          </ChoiceLabel>
          <ChoiceLabel>
            <input
              type="radio"
              name="discount-type"
              checked={discountType === "percent"}
              onChange={() => setDiscountType("percent")}
            />
            אחוז
          </ChoiceLabel>
        </ChoiceRow>
        <Field>
          <FieldLabel htmlFor="operation-discount-amount">
            {discountType === "amount" ? "סכום בש״ח" : "אחוז"}
          </FieldLabel>
          <AmountInput
            id="operation-discount-amount"
            type="text"
            inputMode="decimal"
            dir="ltr"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            autoComplete="off"
          />
        </Field>
        <Preview>
          מחיר ליחידה חדש:{" "}
          {nextUnitCost == null ? "—" : formatNumber(nextUnitCost)}
        </Preview>
        {missingPrice && (
          <ErrorText role="alert">אין מחיר נוכחי, לא ניתן לתת הנחה</ErrorText>
        )}
        {amountInvalid && !missingPrice && (
          <ErrorText role="alert">ההנחה גדולה ממחיר היחידה או אינה תקינה</ErrorText>
        )}
        {error && <ErrorText role="alert">{error}</ErrorText>}
        <Actions>
          <SecondaryButton type="button" onClick={onClose} disabled={isPending}>
            ביטול
          </SecondaryButton>
          <PrimaryButton
            type="button"
            disabled={isPending || nextUnitCost == null}
            onClick={() => {
              if (nextUnitCost == null) return;
              onApprove(discountType, Number(amount));
            }}
          >
            {isPending ? "שומר..." : "אישור"}
          </PrimaryButton>
        </Actions>
      </ModalPanel>
    </ModalOverlay>
  );
}

const CurrentPrice = styled.p`
  margin: 0 0 1rem;
  font-size: 0.875rem;
  font-weight: 600;
`;

const ChoiceRow = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const ChoiceLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.875rem;
`;

const Field = styled.div`
  margin-bottom: 0.75rem;
`;

const FieldLabel = styled.label`
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
`;

const AmountInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 0.45rem 0.6rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--page-bg);
  color: inherit;
  font: inherit;
`;

const Preview = styled.p`
  margin: 0 0 1rem;
  font-size: 0.875rem;
`;

const ErrorText = styled.p`
  margin: 0 0 1rem;
  color: var(--color-error-text);
  font-size: 0.875rem;
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-start;
`;

const SecondaryButton = styled.button`
  ${buttonBase};
  background: transparent;
`;

const PrimaryButton = styled.button`
  ${buttonBase};
  ${toolbarButtonAccent};
  font-weight: 600;
`;
