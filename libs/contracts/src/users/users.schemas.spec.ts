import { UpdateProfileSchema, UpdateSettingsSchema } from './users.schemas';

describe('users contracts', () => {
  it('rejects settings values outside the bound enums', () => {
    const result = UpdateSettingsSchema.safeParse({
      userId: 'u1',
      maxDistance: 123,
      newSnapDistance: 250,
      snapDisappearTime: 1,
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid settings preset triple', () => {
    const result = UpdateSettingsSchema.safeParse({
      userId: 'u1',
      maxDistance: 5000,
      newSnapDistance: 500,
      snapDisappearTime: 3,
    });
    expect(result.success).toBe(true);
  });

  it('requires at least one profile field', () => {
    const empty = UpdateProfileSchema.safeParse({ userId: 'u1' });
    expect(empty.success).toBe(false);

    const patch = UpdateProfileSchema.safeParse({
      userId: 'u1',
      bio: 'hello',
    });
    expect(patch.success).toBe(true);
  });
});
