require('dotenv').config();

const {
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
} = require('discord.js');

const {
  handleCommand,
} = require('./handlers/commands');

const {
  handleMenu,
} = require('./handlers/menus');

const {
  handleMessage,
} = require('./handlers/messages');

if (!process.env.TOKEN) {
  console.error('❌ .env 缺少 TOKEN');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log('================================');
  console.log(`✅ Bot 已上線：${readyClient.user.tag}`);
  console.log('✈️ Flight Mystery Bot 已準備完成');
  console.log('================================');
});

client.on(
  Events.InteractionCreate,
  async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        await handleCommand(interaction);
        return;
      }

      if (interaction.isStringSelectMenu()) {
        await handleMenu(interaction);
      }
    } catch (error) {
      console.error(
        '處理 Discord interaction 時發生錯誤：',
        error,
      );

      const payload = {
        content:
          '❌ Bot 發生錯誤，請通知 GM 查看 Terminal。',
        flags: MessageFlags.Ephemeral,
      };

      if (
        interaction.replied ||
        interaction.deferred
      ) {
        await interaction.followUp(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
  },
);

client.on(
  Events.MessageCreate,
  async (message) => {
    try {
      await handleMessage(message);
    } catch (error) {
      console.error(
        '處理 Discord message 時發生錯誤：',
        error,
      );
    }
  },
);

client.login(process.env.TOKEN);