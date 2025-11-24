/**
 * Telegram Bot Utility
 * Sends messages to Telegram using the Bot API
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8588724892:AAG00OIhKQAD3KzH7mXT578RYSSAgD3H3Sg';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '6213503516';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

export interface TelegramMessageOptions {
  name: string;
  email: string;
  subject: string;
  message: string;
  userId?: string;
}

/**
 * Formats a support message for Telegram
 */
function formatSupportMessage(options: TelegramMessageOptions): string {
  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'UTC',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return `🔔 *New Support Request*

👤 *Name:* ${options.name}
📧 *Email:* ${options.email}
📝 *Subject:* ${options.subject}

💬 *Message:*
${options.message}

${options.userId ? `🆔 *User ID:* ${options.userId}\n` : ''}⏰ *Time:* ${timestamp}

---
_We will respond via email at ${options.email}_`;
}

/**
 * Sends a message to Telegram
 */
export async function sendTelegramMessage(options: TelegramMessageOptions): Promise<boolean> {
  try {
    const messageText = formatSupportMessage(options);

    const response = await fetch(TELEGRAM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: messageText,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Telegram API error:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return false;
  }
}

