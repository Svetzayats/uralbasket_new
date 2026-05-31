export function validateName(value: string): string | null {
  if (!value.trim()) return 'Укажите ваше имя';
  if (value.trim().length < 2) return 'Имя слишком короткое';
  return null;
}

export function validateEmail(value: string): string | null {
  if (!value.trim()) return 'Укажите email';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Некорректный email';
  return null;
}

export function validatePhone(value: string): string | null {
  if (!value.trim()) return 'Укажите номер телефона';
  const digits = value.replace(/\D/g, '');
  if (digits.length < 10) return 'Слишком короткий номер';
  if (digits.length > 15) return 'Слишком длинный номер';
  return null;
}

export interface OrderFields {
  name: string;
  email: string;
  phone: string;
  message?: string;
  productSlug?: string;
  productTitle?: string;
  productDescription?: string;
  productSizes?: string;
  productUrl?: string;
}

export interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
}

export function validateOrderFields(fields: OrderFields): ValidationErrors | null {
  const errors: ValidationErrors = {};

  const nameErr = validateName(fields.name);
  if (nameErr) errors.name = nameErr;

  const hasEmail = !!fields.email?.trim();
  const hasPhone = !!fields.phone?.trim();

  if (!hasEmail && !hasPhone) {
    errors.email = 'Укажите email или номер телефона';
    errors.phone = 'Укажите email или номер телефона';
  } else {
    if (hasEmail) {
      const emailErr = validateEmail(fields.email);
      if (emailErr) errors.email = emailErr;
    }
    if (hasPhone) {
      const phoneErr = validatePhone(fields.phone);
      if (phoneErr) errors.phone = phoneErr;
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
}
