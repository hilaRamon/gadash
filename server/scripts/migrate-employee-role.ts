import 'dotenv/config';
import mongoose from 'mongoose';
import {
  EmployeeModel,
  EMPLOYEE_ROLE_ADMIN,
  EMPLOYEE_ROLE_EMPLOYEE,
} from '../src/models/Employee';

const ADMIN_EMPLOYEE_NAME = 'אבי סיטון';

async function migrateEmployeeRole() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  const rows = await EmployeeModel.find().lean();
  let employeeCount = 0;
  let adminCount = 0;

  for (const row of rows) {
    const role =
      row.name === ADMIN_EMPLOYEE_NAME
        ? EMPLOYEE_ROLE_ADMIN
        : EMPLOYEE_ROLE_EMPLOYEE;

    await EmployeeModel.updateOne({ _id: row._id }, { $set: { role } });

    if (role === EMPLOYEE_ROLE_ADMIN) {
      adminCount += 1;
    } else {
      employeeCount += 1;
    }
  }

  console.log(`Updated ${rows.length} employees`);
  console.log(`Set role="${EMPLOYEE_ROLE_EMPLOYEE}" on ${employeeCount} rows`);
  console.log(`Set role="${EMPLOYEE_ROLE_ADMIN}" on ${adminCount} rows`);

  await mongoose.disconnect();
}

migrateEmployeeRole().catch((err) => {
  console.error(err);
  process.exit(1);
});
