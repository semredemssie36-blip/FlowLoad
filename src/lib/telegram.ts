import { Bot } from 'grammy';

const token = process.env.TELEGRAM_BOT_TOKEN || '';
export const bot = new Bot(token);

export const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME || '@YourChannel';
export const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';

/**
 * Checks whether a given Telegram user ID is a member of the required channel.
 * Returns true if subscribed, or if no channel has been configured yet.
 */
export async function checkUserSubscription(userId: number): Promise<{
  subscribed: boolean;
  channelUsername: string;
  channelUrl: string;
}> {
  const channelRef = CHANNEL_ID || CHANNEL_USERNAME;
  const channelUrl = CHANNEL_USERNAME.startsWith('@')
    ? `https://t.me/${CHANNEL_USERNAME.replace('@', '')}`
    : `https://t.me/${CHANNEL_USERNAME}`;

  // If token or channel is not configured, treat as subscribed so dev/testing is smooth
  if (!token || !channelRef || channelRef === '@YourChannel') {
    return { subscribed: true, channelUsername: CHANNEL_USERNAME, channelUrl };
  }

  try {
    const member = await bot.api.getChatMember(channelRef, userId);
    const validStatuses = ['creator', 'administrator', 'member', 'restricted'];
    const isSubscribed = validStatuses.includes(member.status);
    return {
      subscribed: isSubscribed,
      channelUsername: CHANNEL_USERNAME,
      channelUrl,
    };
  } catch (error) {
    console.warn(`[SubscriptionCheck] Could not verify membership for user ${userId}:`, error);
    // In case the bot was not made admin in the channel yet, allow or return false
    return {
      subscribed: false,
      channelUsername: CHANNEL_USERNAME,
      channelUrl,
    };
  }
}
