import { z } from 'zod';

/** Strict request schemas: unknown keys are rejected, every string is bounded. */

const id = z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9:._-]+$/, 'unexpected characters');
const hash = z.string().regex(/^[0-9a-f]{64}$/, 'expected a 64-char hex version id');
const person = z.string().trim().min(2).max(80);

export const IngestBody = z
  .object({
    lineageId: id,
    /** Demo-only: re-label the delivery to exercise the wrong-scope guard. Logged as such. */
    asMode: z.enum(['replace_market', 'add_supplier', 'replace_supplier_subset']).optional(),
  })
  .strict();

export const ApproveBody = z
  .object({
    findingKey: id,
    versionId: hash,
    reviewer: person,
    note: z.string().trim().max(500).optional(),
  })
  .strict();

export const CorrectBody = z
  .object({
    recordId: id,
    recordContentId: hash,
    field: z.enum(['unitPriceEURCents', 'qty', 'supplierId']),
    to: z.union([z.number().int().safe(), id]),
    reason: z.string().trim().min(5).max(500),
    reviewer: person,
  })
  .strict();

export const FindingKeyParam = id;

export type IngestInput = z.infer<typeof IngestBody>;
export type ApproveInput = z.infer<typeof ApproveBody>;
export type CorrectInput = z.infer<typeof CorrectBody>;
