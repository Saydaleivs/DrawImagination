import { Users } from '../models/user';
import { Languages } from '../types';

export default async function changeLanguage(
  user_id: number,
  language: Languages
) {
  const user = await Users.findOne({ user_id });
  if (!user) return 'User not found';

  user.language = language;
  await user.save();

  return 'Language changed';
}
