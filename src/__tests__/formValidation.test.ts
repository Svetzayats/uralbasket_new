import { describe, it, expect } from 'vitest';
import {
  validateName,
  validateEmail,
  validatePhone,
  validateOrderFields,
} from '../lib/formValidation';

describe('validateName', () => {
  it('accepts a valid name', () => expect(validateName('Анна')).toBeNull());
  it('rejects an empty string', () => expect(validateName('')).not.toBeNull());
  it('rejects a whitespace-only string', () => expect(validateName('   ')).not.toBeNull());
  it('rejects a single character', () => expect(validateName('А')).not.toBeNull());
});

describe('validateEmail', () => {
  it('accepts a valid email', () => expect(validateEmail('user@example.com')).toBeNull());
  it('rejects an empty string', () => expect(validateEmail('')).not.toBeNull());
  it('rejects missing @', () => expect(validateEmail('userexample.com')).not.toBeNull());
  it('rejects missing domain', () => expect(validateEmail('user@')).not.toBeNull());
  it('rejects missing TLD', () => expect(validateEmail('user@example')).not.toBeNull());
});

describe('validatePhone', () => {
  it('accepts a valid Russian mobile number', () => expect(validatePhone('+7 900 123-45-67')).toBeNull());
  it('accepts a 10-digit number', () => expect(validatePhone('9001234567')).toBeNull());
  it('rejects an empty string', () => expect(validatePhone('')).not.toBeNull());
  it('rejects a number with fewer than 10 digits', () => expect(validatePhone('12345')).not.toBeNull());
  it('rejects a number with more than 15 digits', () => expect(validatePhone('1234567890123456')).not.toBeNull());
});

describe('validateOrderFields', () => {
  const withBoth = { name: 'Анна', email: 'anna@example.com', phone: '+7 900 123-45-67' };
  const withEmailOnly = { name: 'Анна', email: 'anna@example.com', phone: '' };
  const withPhoneOnly = { name: 'Анна', email: '', phone: '+7 900 123-45-67' };

  it('returns null when both email and phone are provided', () =>
    expect(validateOrderFields(withBoth)).toBeNull());

  it('returns null when only email is provided', () =>
    expect(validateOrderFields(withEmailOnly)).toBeNull());

  it('returns null when only phone is provided', () =>
    expect(validateOrderFields(withPhoneOnly)).toBeNull());

  it('errors on both email and phone when neither is provided', () => {
    const result = validateOrderFields({ name: 'Анна', email: '', phone: '' });
    expect(result?.email).toBeDefined();
    expect(result?.phone).toBeDefined();
  });

  it('returns errors when name is missing', () => {
    const result = validateOrderFields({ ...withEmailOnly, name: '' });
    expect(result?.name).toBeDefined();
  });

  it('validates email format when email is provided', () => {
    const result = validateOrderFields({ ...withPhoneOnly, email: 'bad-email' });
    expect(result?.email).toBeDefined();
  });

  it('validates phone format when phone is provided', () => {
    const result = validateOrderFields({ ...withEmailOnly, phone: '123' });
    expect(result?.phone).toBeDefined();
  });

  it('does not require email when phone is valid', () =>
    expect(validateOrderFields(withPhoneOnly)).toBeNull());

  it('does not require phone when email is valid', () =>
    expect(validateOrderFields(withEmailOnly)).toBeNull());

  it('ignores missing optional fields', () =>
    expect(validateOrderFields({ ...withEmailOnly, message: undefined, productSlug: undefined })).toBeNull());
});
