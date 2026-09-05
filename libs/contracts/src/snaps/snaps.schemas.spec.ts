import { FindNearSnapsSchema } from './snaps.schemas';

describe('FindNearSnapsSchema', () => {
  const base = { userId: 'u1', lng: '4.9', lat: '52.3' };

  it('accepts a single tag string from HTTP (?tags=LOST)', () => {
    const parsed = FindNearSnapsSchema.parse({ ...base, tags: 'LOST' });
    expect(parsed.tags).toEqual(['LOST']);
  });

  it('accepts repeated tag query params', () => {
    const parsed = FindNearSnapsSchema.parse({
      ...base,
      tags: ['LOST', 'SOCIAL'],
    });
    expect(parsed.tags).toEqual(['LOST', 'SOCIAL']);
  });

  it('splits a comma-separated tag list', () => {
    const parsed = FindNearSnapsSchema.parse({
      ...base,
      tags: 'LOST,HIDDEN_GEM',
    });
    expect(parsed.tags).toEqual(['LOST', 'HIDDEN_GEM']);
  });

  it('omits tags when the query is empty', () => {
    const parsed = FindNearSnapsSchema.parse(base);
    expect(parsed.tags).toBeUndefined();
  });
});
