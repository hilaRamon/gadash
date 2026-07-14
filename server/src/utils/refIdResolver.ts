import { Types } from 'mongoose'
import { BaleModel } from '../models/Bale'
import { ContractorModel } from '../models/Contractor'
import { CustomerModel } from '../models/Customer'
import { EmployeeModel } from '../models/Employee'
import { FuelTankModel } from '../models/FuelTank'
import { MaterialModel } from '../models/Material'
import { MoverModel } from '../models/Mover'
import { OperationModel } from '../models/Operation'
import { PlotModel } from '../models/Plot'
import { SupplierModel } from '../models/Supplier'
import { TractorModel } from '../models/Tractor'

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

type LeanIdModel = {
  find: (filter: Record<string, unknown>) => {
    select: (fields: string) => {
      lean: () => Promise<Array<{ _id: Types.ObjectId }>>
    }
  }
}

const modelByName: Record<string, LeanIdModel> = {
  Customer: CustomerModel as unknown as LeanIdModel,
  Employee: EmployeeModel as unknown as LeanIdModel,
  Operation: OperationModel as unknown as LeanIdModel,
  Plot: PlotModel as unknown as LeanIdModel,
  Material: MaterialModel as unknown as LeanIdModel,
  Supplier: SupplierModel as unknown as LeanIdModel,
  Contractor: ContractorModel as unknown as LeanIdModel,
  Mover: MoverModel as unknown as LeanIdModel,
  Tractor: TractorModel as unknown as LeanIdModel,
  FuelTank: FuelTankModel as unknown as LeanIdModel,
  Bale: BaleModel as unknown as LeanIdModel,
}

export async function resolveRefIds(
  modelName: string,
  nameField: string,
  search: string,
): Promise<Types.ObjectId[]> {
  const model = modelByName[modelName]
  if (!model) return []
  const rows = await model
    .find({
      [nameField]: { $regex: escapeRegex(search), $options: 'i' },
    })
    .select('_id')
    .lean()
  return rows.map((r) => r._id)
}

export async function findOperationIdsByType(
  types: Array<'עיבוד' | 'מנהלה' | 'דלק'> | { $ne: 'עיבוד' | 'מנהלה' | 'דלק' },
): Promise<Types.ObjectId[]> {
  const filter = Array.isArray(types)
    ? { operationType: { $in: types } }
    : { operationType: types }
  const rows = await OperationModel.find(filter).select('_id').lean()
  return rows.map((r) => r._id as Types.ObjectId)
}
