import { Context } from 'telegraf';
import { Users } from '../models/user';
import { Languages } from '../types';

export default async function selectedLanguage(
  ctx: Context
): Promise<Languages | 'User details not found'> {
  if (!ctx.from) return 'User details not found';
  const { language } = (await Users.findOne({
    user_id: ctx.from.id,
    language: { $exists: true },
  }).select('-_id language')) || { language: (ctx as any).i18n.locale() };

  return language;
}
