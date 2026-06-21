import 'dotenv/config';
import mongoose from 'mongoose';
import {
  EmployeeModel,
  EMPLOYEE_FORM_OF_PAYMENT_GLOBAL,
  EMPLOYEE_FORM_OF_PAYMENT_HOURLY,
} from '../src/models/Employee';

const GLOBAL_EMPLOYEE_NAME = 'אבי סיטון';

async function migrateEmployeeFormOfPayment() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  const rows = await EmployeeModel.find().lean();
  let hourlyCount = 0;
  let globalCount = 0;

  for (const row of rows) {
    const formOfPayment =
      row.name === GLOBAL_EMPLOYEE_NAME
        ? EMPLOYEE_FORM_OF_PAYMENT_GLOBAL
        : EMPLOYEE_FORM_OF_PAYMENT_HOURLY;

    await EmployeeModel.updateOne({ _id: row._id }, { $set: { formOfPayment } });

    if (formOfPayment === EMPLOYEE_FORM_OF_PAYMENT_GLOBAL) {
      globalCount += 1;
    } else {
      hourlyCount += 1;
    }
  }

  console.log(`Updated ${rows.length} employees`);
  console.log(`Set formOfPayment="${EMPLOYEE_FORM_OF_PAYMENT_HOURLY}" on ${hourlyCount} rows`);
  console.log(`Set formOfPayment="${EMPLOYEE_FORM_OF_PAYMENT_GLOBAL}" on ${globalCount} rows`);

  await mongoose.disconnect();
}

migrateEmployeeFormOfPayment().catch((err) => {
  console.error(err);
  process.exit(1);
});
