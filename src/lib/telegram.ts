import type { OrderFields } from './formValidation';

function buildMessage(fields: OrderFields): string {
  const lines = [
    '📦 <b>Новый запрос с сайта UralBasket</b>',
    '',
    `👤 <b>Имя:</b> ${fields.name}`,
    `📞 <b>Телефон:</b> ${fields.phone}`,
    `✉️ <b>Email:</b> ${fields.email}`,
  ];
  if (fields.message) lines.push(`💬 <b>Сообщение:</b> ${fields.message}`);
  if (fields.productSlug) lines.push(`🛒 <b>Товар:</b> /product/${fields.productSlug}`);
  return lines.join('\n');
}

export async function sendToTelegram(
  fields: OrderFields,
  botToken: string,
  chatId: string,
): Promise<void> {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: buildMessage(fields),
      parse_mode: 'HTML',
    }),
  });
  if (!res.ok) {
    throw new Error(`Telegram API error: ${res.status}`);
  }
}
