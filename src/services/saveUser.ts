import { Context } from 'telegraf';
import { Users } from '../models/user';

export default async function saveUser(ctx: Context) {
  if (!ctx.from) return 400;
  const user = await Users.findOne({ user_id: ctx.from?.id });
  if (user) return 'User already exists';

  try {
    const newUser = new Users({
      name: ctx.from.first_name,
      username: ctx.from.username,
      user_id: ctx.from.id,
    });

    newUser.save();
    return 200;
  } catch (error) {
    return error;
  }
}
