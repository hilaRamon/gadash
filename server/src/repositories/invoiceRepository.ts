import { InvoiceModel } from '../models/Invoice';
import type { ListQuery } from '../utils/listQuery';
import { listPaginatedDocuments } from '../utils/listPaginatedDocuments';
import { toObjectIds } from '../utils/mongoIds';

export type InvoiceInput = {
  date: Date;
  invoiceNumber: string;
  companyName: string;
  amount: number;
  dueDate?: Date | null;
  paid?: boolean;
  notes?: string;
};

export const invoiceRepository = {
  findAll() {
    return InvoiceModel.find().sort({ date: -1 }).lean();
  },

  findPaginated(listQuery: ListQuery) {
    return listPaginatedDocuments('invoices', InvoiceModel, listQuery);
  },

  findById(id: string) {
    return InvoiceModel.findById(id).lean();
  },

  create(data: InvoiceInput) {
    return InvoiceModel.create(data);
  },

  update(id: string, data: Partial<InvoiceInput>) {
    return InvoiceModel.findByIdAndUpdate(id, data, {
      returnDocument: 'after',
      runValidators: true,
    }).lean();
  },

  delete(id: string) {
    return InvoiceModel.findByIdAndDelete(id).lean();
  },

  deleteMany(ids: string[]) {
    return InvoiceModel.deleteMany({ _id: { $in: toObjectIds(ids) } });
  },

  async sumByDueMonth(start: Date, endExclusive: Date) {
    const [row] = await InvoiceModel.aggregate<{
      totalAmount: number;
      paidAmount: number;
    }>([
      {
        $match: {
          dueDate: { $gte: start, $lt: endExclusive },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          paidAmount: {
            $sum: { $cond: ['$paid', '$amount', 0] },
          },
        },
      },
    ]);

    return {
      totalAmount: Number(row?.totalAmount ?? 0),
      paidAmount: Number(row?.paidAmount ?? 0),
    };
  },
};
