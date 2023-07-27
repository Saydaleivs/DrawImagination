import { Context, Telegraf } from 'telegraf';
import { Update } from 'typegram';
import saveUser from './services/saveUser';
import generateImage from './services/generateImage';
import { translateText } from './services/google_translate_rapidapi';
import TelegrafI18n from 'telegraf-i18n';
import path from 'path';
import mongoose, { ConnectOptions } from 'mongoose';
import express from 'express';
import cors from 'cors';
import changeLanguage from './services/changeLanguage';
import selectedLanguage from './utils/selectedLanguage';
const app = express();
require('dotenv').config();

mongoose.set('strictQuery', false);
mongoose
  .connect(process.env.MONGO_URI!, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as ConnectOptions)
  .then(() => console.log('Connected to database'))
  .catch((err) => {
    console.log(
      `Initial Distribution API Database connection error occured -`,
      err
    );
  });

app.use(express.json({ limit: '50mb' }));
app.use(
  cors({
    origin: '*',
  })
);

app.get('/', (req, res) => {
  res.send('Bot is working');
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Started listerning to port ${port}....`);
});

const i18n = new TelegrafI18n({
  directory: path.resolve('./src/locales'),
  useSession: true,
  sessionName: 'sessionLanguage',
  allowMissing: false,
  defaultLanguage: 'ru',
});

const bot: Telegraf<Context<Update>> = new Telegraf(
  process.env.BOT_TOKEN as string,
  { handlerTimeout: 9000000 }
);

// app.use(bot.webhookCallback('/' + process.env.BOT_TOKEN));
// bot.telegram.setWebhook(process.env.WEBHOOK_URL! + '/' + process.env.BOT_TOKEN);

bot.use(i18n);

bot.command('changelanguage', async (ctx) => {
  askToSelectLang(ctx);
});

bot.start(async (ctx) => {
  askToSelectLang(ctx);
  await saveUser(ctx);
});

bot.on('callback_query', async (ctx) => {
  switch ((ctx.callbackQuery as any).data) {
    case 'en':
    case 'uz':
    case 'ru':
    case 'ar':
      ctx.deleteMessage(+ctx.callbackQuery.message?.message_id!);
      await changeLanguage(ctx.from?.id!, (ctx.callbackQuery as any).data);

      const language = await selectedLanguage(ctx);
      ctx.reply((ctx as any).i18n.repository[language].languageChanged());
      askPrompt(ctx);
      break;

    default:
      break;
  }
});

async function askPrompt(ctx: Context) {
  const language = await selectedLanguage(ctx);
  ctx.reply((ctx as any).i18n.repository[language].greeting());
}

async function askToSelectLang(ctx: Context) {
  const language = await selectedLanguage(ctx);

  ctx.reply((ctx as any).i18n.repository[language].chooseLanguage(), {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'English', callback_data: 'en' },
          { text: 'Uzbek', callback_data: 'uz' },
        ],
        [
          { text: 'Russian', callback_data: 'ru' },
          { text: 'Arabic', callback_data: 'ar' },
        ],
      ],
    },
  });
}

bot.on('message', async (ctx) => {
  const language = await selectedLanguage(ctx);
  const id = await ctx.reply(
    (ctx as any).i18n.repository[language].pleaseWait()
  );

  const userText = (ctx.update.message as any).text;
  const response = await generateImage(
    language === 'en' ? userText : await translateText(userText, 'en')
  );

  ctx.deleteMessage(id.message_id);
  if (response === 400) {
    return ctx.reply('Error happened');
  }

  for (const image of response) {
    ctx.sendPhoto({ source: Buffer.from(image.base64, 'base64') });
  }
});

bot.launch({
  webhook: {
    domain: process.env.WEBHOOK_URL!,
    port: 4000,
  },
});
