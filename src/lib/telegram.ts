import type { OrderFields } from './formValidation';

function buildMessage(fields: OrderFields): string {
  const lines: string[] = [
    '📦 <b>Новый запрос с сайта UralBasket</b>',
    '',
  ];

  if (fields.productSlug) {
    const url = fields.productUrl ?? `/product/${fields.productSlug}`;
    const title = fields.productTitle ?? fields.productSlug;
    lines.push(`🛒 <b>Товар:</b> <a href="${url}">${title}</a>`);
    if (fields.productSizes) lines.push(`📐 <b>Размеры:</b> ${fields.productSizes}`);
    if (fields.productDescription) {
      const desc = fields.productDescription.length > 150
        ? fields.productDescription.slice(0, 150) + '…'
        : fields.productDescription;
      lines.push(`📝 <b>Описание:</b> ${desc}`);
    }
    lines.push('');
  }

  lines.push(
    `👤 <b>Имя:</b> ${fields.name}`,
    `📞 <b>Телефон:</b> ${fields.phone || '—'}`,
    `✉️ <b>Email:</b> ${fields.email || '—'}`,
  );
  if (fields.message) lines.push(`\n💬 <b>Сообщение:</b> ${fields.message}`);
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
