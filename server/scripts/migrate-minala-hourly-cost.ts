import 'dotenv/config';
import mongoose from 'mongoose';
import { EmployeeModel } from '../src/models/Employee';
import '../src/models/Operation';
import { OperationTrackingModel } from '../src/models/OperationTracking';
import { calcHoursBetween } from '../src/utils/operationTrackingPricing';

const ADMIN_OPERATION_TYPE = 'מנהלה';

function looksUnmigrated(row: {
  amount?: number | null;
  unitCost?: number | null;
}): boolean {
  if (row.amount == null) return true;
  if (row.unitCost == null) return true;
  if (Number(row.unitCost) === 0) return true;
  return false;
}

async function migrateMinalaHourlyCost() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  const rows = await OperationTrackingModel.find()
    .populate({ path: 'operation', select: '_id operationType' })
    .populate({ path: 'employee', select: '_id hourlyCost' })
    .lean();

  let updatedCount = 0;
  let skippedCount = 0;
  let skippedAlreadyMigrated = 0;
  let skippedInvalid = 0;

  for (const row of rows) {
    const operation = row.operation as
      | { _id?: unknown; operationType?: string }
      | null
      | undefined;
    if (String(operation?.operationType ?? '') !== ADMIN_OPERATION_TYPE) {
      skippedCount += 1;
      continue;
    }

    if (!looksUnmigrated(row)) {
      skippedAlreadyMigrated += 1;
      continue;
    }

    const employee = row.employee as
      | { _id?: unknown; hourlyCost?: number | null }
      | null
      | undefined;
    if (!employee?._id) {
      skippedInvalid += 1;
      console.warn(`Skipping tracking ${String(row._id)}: missing employee`);
      continue;
    }

    let hours: number;
    try {
      hours = calcHoursBetween(String(row.startTime ?? ''), String(row.endTime ?? ''));
    } catch (error) {
      skippedInvalid += 1;
      console.warn(
        `Skipping tracking ${String(row._id)}: invalid times (${String(error)})`,
      );
      continue;
    }

    const hourlyCost = Number(employee.hourlyCost ?? 0);
    if (!Number.isFinite(hourlyCost) || hourlyCost < 0) {
      skippedInvalid += 1;
      console.warn(
        `Skipping tracking ${String(row._id)}: invalid employee hourlyCost`,
      );
      continue;
    }

    await OperationTrackingModel.updateOne(
      { _id: row._id },
      { $set: { amount: hours, unitCost: hourlyCost } },
    );
    updatedCount += 1;
  }

  const employeesMissingHourlyCost = await EmployeeModel.updateMany(
    { hourlyCost: { $exists: false } },
    { $set: { hourlyCost: 0 } },
  );

  console.log(`Updated ${updatedCount} מנהלה operation trackings`);
  console.log(`Skipped non-מנהלה: ${skippedCount}`);
  console.log(`Skipped already migrated: ${skippedAlreadyMigrated}`);
  console.log(`Skipped invalid: ${skippedInvalid}`);
  console.log(
    `Set hourlyCost=0 on ${employeesMissingHourlyCost.modifiedCount} employees missing the field`,
  );

  await mongoose.disconnect();
}

migrateMinalaHourlyCost().catch((error) => {
  console.error(error);
  process.exit(1);
});
