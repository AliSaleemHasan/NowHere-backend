import { ChangePasswordSchema } from './auth.schemas';

describe('auth contracts', () => {
  it('requires newPassword to satisfy PasswordSchema', () => {
    const weak = ChangePasswordSchema.safeParse({
      userId: 'u1',
      currentPassword: 'old',
      newPassword: 'short',
    });
    expect(weak.success).toBe(false);

    const strong = ChangePasswordSchema.safeParse({
      userId: 'u1',
      currentPassword: 'old',
      newPassword: 'Password123!',
    });
    expect(strong.success).toBe(true);
  });
});
