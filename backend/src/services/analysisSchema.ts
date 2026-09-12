import { z } from 'zod';

export const analysisResultSchema = z
  .object({
    summary: z.string().min(1),
    findings: z.array(
      z
        .object({
          label: z.string().min(1),
          value: z.string().min(1),
          evidence: z.string().min(1),
        })
        .strict(),
    ),
    missing_info: z.array(z.string()),
    discrepancy: z.array(z.string()),
  })
  .strict();

export const analysisSchema = analysisResultSchema;

export type AnalysisResult = z.infer<typeof analysisResultSchema>;
