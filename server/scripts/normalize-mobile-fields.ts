import 'dotenv/config';
import mongoose from 'mongoose';
import { ContractorModel } from '../src/models/Contractor';
import { CustomerModel } from '../src/models/Customer';
import { EmployeeModel } from '../src/models/Employee';
import { tryNormalizeMobile } from '../src/utils/mobileFormat';

type ContactDoc = {
  _id: unknown;
  name?: string;
  mobile?: string;
};

async function normalizeCollectionMobiles(
  label: string,
  model: mongoose.Model<ContactDoc>,
) {
  const docs = await model.find({ mobile: { $nin: ['', null] } }).lean<ContactDoc[]>();

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const doc of docs) {
    const current = String(doc.mobile ?? '').trim();
    if (!current) continue;

    const result = tryNormalizeMobile(current);
    if (!result.ok) {
      failed += 1;
      console.warn(`[${label}] invalid mobile for "${doc.name ?? doc._id}": ${current}`);
      continue;
    }

    if (result.value === current) {
      skipped += 1;
      continue;
    }

    await model.updateOne({ _id: doc._id }, { $set: { mobile: result.value } });
    updated += 1;
  }

  console.log(
    `${label}: updated ${updated}, skipped ${skipped} (already E.164), failed ${failed}`,
  );
}

async function normalizeMobileFields() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  await Promise.all([
    normalizeCollectionMobiles('customers', CustomerModel),
    normalizeCollectionMobiles('employees', EmployeeModel),
    normalizeCollectionMobiles('contractors', ContractorModel),
  ]);

  await mongoose.disconnect();
}

normalizeMobileFields().catch((err) => {
  console.error(err);
  process.exit(1);
});
