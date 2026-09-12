import { analysisResultSchema } from './analysisSchema';

describe('analysisResultSchema', () => {
  it('rejects invalid finding objects with extra keys like findingType', () => {
    const invalidPayload = {
      summary: 'ok',
      findings: [
        {
          label: 'name',
          value: 'Jane Doe',
          evidence: 'name field',
          findingType: 'primary',
        },
      ],
      missing_info: [],
      discrepancy: [],
    };

    expect(() => analysisResultSchema.parse(invalidPayload)).toThrow();
  });
});
