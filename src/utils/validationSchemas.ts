import { z } from 'zod';

/**
 * Zod Schema for Stock Receiving (Inbound) Entry
 */
export const stockEntrySchema = z.object({
  coldStorageId: z.string().trim().min(1, 'Cold Storage facility must be selected.'),
  date: z.string().trim().min(1, 'Date is required.'),
  entryNo: z.string().trim().optional(),
  kblChallanNo: z
    .string()
    .trim()
    .min(1, 'Challan number is required.')
    .max(50, 'Challan number cannot exceed 50 characters.'),
  srNo: z
    .string()
    .trim()
    .min(1, 'SR number is required.')
    .max(50, 'SR number cannot exceed 50 characters.'),
  varietyId: z.string().trim().min(1, 'Potato variety must be selected.'),
  classId: z.string().trim().min(1, 'Seed class must be selected.'),
  gradeId: z.string().trim().min(1, 'Grade classification must be selected.'),
  productionBlockId: z.string().trim().min(1, 'Production block must be selected.'),
  potatoTypeId: z.string().trim().min(1, 'Potato type must be selected.'),
  sackQuantity: z
    .number()
    .int('Sack quantity must be a whole number.')
    .positive('Sack quantity must be greater than zero.'),
  kgPerBag: z
    .number()
    .positive('Kg per bag must be greater than zero.'),
  remarks: z.string().trim().optional(),
});

export type StockEntryFormData = z.infer<typeof stockEntrySchema>;

/**
 * Zod Schema for Delivery (Outbound) Transaction
 */
export const deliveryEntrySchema = z.object({
  date: z.string().trim().min(1, 'Date is required.'),
  deliveryNo: z
    .string()
    .trim()
    .min(1, 'Delivery voucher number is required.')
    .max(50, 'Delivery voucher number cannot exceed 50 characters.'),
  deliveryReference: z.string().trim().optional(),
  customerReceiver: z
    .string()
    .trim()
    .min(1, 'Customer / Receiver destination is required.')
    .max(100, 'Customer name cannot exceed 100 characters.'),
  vehicleNo: z.string().trim().optional(),
  driverName: z.string().trim().optional(),
  coldStorageId: z.string().trim().min(1, 'Cold Storage source must be selected.'),
  varietyId: z.string().trim().min(1, 'Variety must be selected.'),
  classId: z.string().trim().min(1, 'Seed class must be selected.'),
  gradeId: z.string().trim().min(1, 'Grade must be selected.'),
  productionBlockId: z.string().trim().min(1, 'Production block must be selected.'),
  potatoTypeId: z.string().trim().min(1, 'Potato type must be selected.'),
  sackQuantity: z
    .number()
    .int('Quantity must be a whole number.')
    .positive('Delivery quantity must be greater than zero.'),
  kgPerBag: z
    .number()
    .positive('Kg per bag must be greater than zero.'),
  remarks: z.string().trim().optional(),
});

export type DeliveryEntryFormData = z.infer<typeof deliveryEntrySchema>;

/**
 * Utility to convert ZodError into a flat key-value dictionary for modal error displays
 */
export function extractZodFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (key && typeof key === 'string' && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}
