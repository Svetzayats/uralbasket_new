import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendToTelegram } from '../lib/telegram';

const validFields = {
  name: 'Анна',
  phone: '+7 900 123-45-67',
  email: 'anna@example.com',
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('sendToTelegram', () => {
  it('calls the Telegram API with the correct URL', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"ok":true}', { status: 200 }),
    );

    await sendToTelegram(validFields, 'test-token', 'test-chat-id');

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url] = mockFetch.mock.calls[0] as [string, ...unknown[]];
    expect(url).toBe('https://api.telegram.org/bottest-token/sendMessage');
  });

  it('sends name, phone, and email in the message body', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"ok":true}', { status: 200 }),
    );

    await sendToTelegram(validFields, 'tok', 'cid');

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.text).toContain('Анна');
    expect(body.text).toContain('+7 900 123-45-67');
    expect(body.text).toContain('anna@example.com');
  });

  it('includes product slug when provided', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"ok":true}', { status: 200 }),
    );

    await sendToTelegram({ ...validFields, productSlug: 'my-basket' }, 'tok', 'cid');

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.text).toContain('my-basket');
  });

  it('throws when Telegram API returns a non-ok status', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"ok":false}', { status: 401 }),
    );

    await expect(sendToTelegram(validFields, 'bad-token', 'cid')).rejects.toThrow(
      'Telegram API error: 401',
    );
  });

  it('propagates network errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network failure'));

    await expect(sendToTelegram(validFields, 'tok', 'cid')).rejects.toThrow('Network failure');
  });
});
