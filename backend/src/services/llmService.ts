import { analysisSchema, type AnalysisResult } from './analysisSchema';

const FIELD_PATTERNS = {
  name: [
    /\b(?:full\s+name|name)\s*[:=]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi,
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g,
  ],
  address: [
    /\b(?:address|mailing address)\s*[:=]\s*([^\n]+)/gi,
    /\b\d+\s+[A-Za-z0-9.\- ]+,\s*[A-Za-z .'-]+\b/g,
  ],
  income: [
    /\b(?:annual\s+income|monthly\s+income|income|salary)\s*[:=]\s*\$?\s*([0-9][0-9,]*(?:\.\d{2})?)/gi,
    /\$\s*([0-9][0-9,]*(?:\.\d{2})?)/g,
  ],
  salary: [
    /\b(?:salary|annual\s+salary|monthly\s+salary)\s*[:=]\s*\$?\s*([0-9][0-9,]*(?:\.\d{2})?)/gi,
    /\$\s*([0-9][0-9,]*(?:\.\d{2})?)/g,
  ],
  loan_amount: [
    /\b(?:loan\s+amount|requested\s+loan|amount\s+requested)\s*[:=]\s*\$?\s*([0-9][0-9,]*(?:\.\d{2})?)/gi,
    /\$\s*([0-9][0-9,]*(?:\.\d{2})?)/g,
  ],
  id_number: [
    /\b(?:id\s*(?:number)?|identification\s*(?:number)?)\s*[:=]\s*([A-Z0-9-]{6,})/gi,
    /\b[A-Z0-9-]{6,}\b/g,
  ],
} as const;

function getFirstValue(values: string[] | undefined): string {
  return values && values.length > 0 ? values[0] : '';
}

export function extractFields(text: string): Record<string, string[]> {
  const values: Record<string, string[]> = {
    name: [],
    address: [],
    income: [],
    salary: [],
    loan_amount: [],
    id_number: [],
  };

  for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (!matches) {
        continue;
      }

      for (const match of matches) {
        const extracted = match.replace(/^.*?[:=]\s*/i, '').trim();
        const cleaned = extracted.replace(/^[^A-Za-z0-9$]+|[^A-Za-z0-9$]+$/g, '').trim();

        if (cleaned.length > 0) {
          values[field].push(cleaned);
        }
      }
    }
  }

  return values;
}

export function callMockLlm(text: string): AnalysisResult {
  const extracted = extractFields(text);
  const findings = Object.entries(extracted)
    .filter(([, values]) => values.length > 0)
    .map(([label, values]) => ({
      label,
      value: getFirstValue(values),
      evidence: values.join('; '),
    }));

  const missingInfo = Object.entries(extracted)
    .filter(([, values]) => values.length === 0)
    .map(([label]) => label);

  const incomeValueText = getFirstValue(extracted.income.length > 0 ? extracted.income : extracted.salary);
  const loanValueText = getFirstValue(extracted.loan_amount);
  const discrepancy = incomeValueText && loanValueText
    ? (() => {
        const incomeValue = Number(incomeValueText.replace(/[^\d.]/g, ''));
        const loanValue = Number(loanValueText.replace(/[^\d.]/g, ''));

        return !Number.isNaN(incomeValue) && !Number.isNaN(loanValue) && incomeValue < loanValue
          ? ['Income is lower than requested loan amount.']
          : [];
      })()
    : [];

  return analysisSchema.parse({
    summary: `Processed document with ${findings.length} extracted field(s).`,
    findings,
    missing_info: missingInfo,
    discrepancy,
  });
}

export function runAnalysis(text: string): AnalysisResult {
  const extracted = extractFields(text);
  const missingInfo: string[] = [];
  const discrepancy: string[] = [];

  for (const field of ['name', 'address', 'income', 'salary', 'loan_amount', 'id_number'] as const) {
    if ((extracted[field] ?? []).length === 0) {
      missingInfo.push(field);
    }
  }

  const incomeValueText = getFirstValue(extracted.income.length > 0 ? extracted.income : extracted.salary);
  const loanValueText = getFirstValue(extracted.loan_amount);

  if (incomeValueText && loanValueText) {
    const incomeValue = Number(incomeValueText.replace(/[^\d.]/g, ''));
    const loanValue = Number(loanValueText.replace(/[^\d.]/g, ''));

    if (!Number.isNaN(incomeValue) && !Number.isNaN(loanValue) && incomeValue < loanValue) {
      discrepancy.push('Income is lower than requested loan amount.');
    }
  }

  const findings = Object.entries(extracted)
    .filter(([, values]) => values.length > 0)
    .map(([label, values]) => ({
      label,
      value: getFirstValue(values),
      evidence: values.join('; '),
    }));

  return analysisSchema.parse({
    summary: `Processed document with ${findings.length} extracted field(s).`,
    findings,
    missing_info: missingInfo,
    discrepancy,
  });
}
