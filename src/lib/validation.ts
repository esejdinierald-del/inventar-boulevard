import { z } from 'zod';

// Validation schemas
export const quantitySchema = z.number()
  .min(0.01, "Sasia duhet të jetë të paktën 0.01")
  .max(10000, "Sasia nuk mund të jetë më shumë se 10000");

export const priceSchema = z.number()
  .min(0, "Çmimi nuk mund të jetë negativ")
  .max(1000000, "Çmimi është shumë i lartë");

export const pinSchema = z.string()
  .regex(/^\d{4}$/, "PIN duhet të jetë saktësisht 4 shifra");

export const staffNameSchema = z.string()
  .min(2, "Emri duhet të jetë të paktën 2 karaktere")
  .max(50, "Emri nuk mund të jetë më shumë se 50 karaktere")
  .trim();

export const productNameSchema = z.string()
  .min(1, "Emri i produktit nuk mund të jetë bosh")
  .max(100, "Emri i produktit nuk mund të jetë më shumë se 100 karaktere")
  .trim();

// Helper function to validate and return error message
export const validateField = <T>(schema: z.ZodSchema<T>, value: unknown): { valid: boolean; error?: string; data?: T } => {
  try {
    const data = schema.parse(value);
    return { valid: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message };
    }
    return { valid: false, error: "Validim i pasuksesshëm" };
  }
};