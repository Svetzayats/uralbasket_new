/// <reference types="@cloudflare/workers-types" />
import { validateOrderFields, type OrderFields } from '../../src/lib/formValidation';
import { sendToTelegram } from '../../src/lib/telegram';

interface Env {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const fields = body as OrderFields;
  const errors = validateOrderFields(fields);
  if (errors) {
    return Response.json({ error: 'Validation failed', errors }, { status: 400 });
  }

  try {
    await sendToTelegram(fields, env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID);
  } catch {
    return Response.json({ error: 'Failed to send notification' }, { status: 500 });
  }

  return Response.json({ success: true });
};
