import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { ConfirmDialog } from "@/components/collection/ConfirmDialog";
import { getApiErrorMessage } from "@/lib/apiErrorMessage";
import { useUpdateDocument } from "@/queries/collections/useCollectionMutations";

const WARNING_TITLE = "ביטול הנחה";
const WARNING_MESSAGE = "לשורה זו יש הנחה. שינוי מחיר היחידה יבטל את ההנחה.";

export type DiscountedUnitCostEdit = {
  id: string;
  unitCost: number;
  resolve: () => void;
  reject: () => void;
};

export function requestDiscountedUnitCostEdit(
  setPending: Dispatch<SetStateAction<DiscountedUnitCostEdit | null>>,
  id: string,
  unitCost: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    setPending({
      id,
      unitCost,
      resolve: () => {
        setPending(null);
        resolve();
      },
      reject: () => {
        setPending(null);
        reject(new Error("cancelled"));
      },
    });
  });
}

export function DiscountedUnitCostWarning({
  pending,
}: {
  pending: DiscountedUnitCostEdit | null;
}) {
  const update = useUpdateDocument("operationsTrackings");
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pending) setError(null);
  }, [pending]);

  return (
    <ConfirmDialog
      open={pending != null}
      title={WARNING_TITLE}
      message={WARNING_MESSAGE}
      confirmLabel="אישור"
      cancelLabel="ביטול"
      error={error}
      onCancel={() => {
        if (savingRef.current) return;
        pending?.reject();
      }}
      onConfirm={() => {
        if (!pending || savingRef.current) return;
        savingRef.current = true;
        setError(null);
        void update
          .mutateAsync({
            id: pending.id,
            body: { unitCost: pending.unitCost, isDiscount: false },
          })
          .then(() => {
            pending.resolve();
          })
          .catch((err: unknown) => {
            setError(getApiErrorMessage(err, "שגיאה בשמירת מחיר היחידה"));
          })
          .finally(() => {
            savingRef.current = false;
          });
      }}
    />
  );
}
