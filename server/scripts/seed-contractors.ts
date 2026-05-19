import 'dotenv/config';
import mongoose from 'mongoose';
import { contractorRepository } from '../src/repositories/contractorRepository';
import type { ContractorInput } from '../src/repositories/contractorRepository';
import { loadContractorsSeed } from './loadSeedData';
import { toSeedInput } from './seed-utils';

async function seedContractors() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  const seedData = loadContractorsSeed();
  const rows = toSeedInput<ContractorInput>(seedData);
  await contractorRepository.deleteAll();
  await contractorRepository.insertMany(rows);

  console.log(`Seeded ${rows.length} contractors`);
  await mongoose.disconnect();
}

seedContractors().catch((err) => {
  console.error(err);
  process.exit(1);
});
