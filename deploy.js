require('dotenv').config();

const {
  REST,
  Routes,
} = require('discord.js');

const {
  commandData,
} = require('./handlers/commands');

for (const name of [
  'TOKEN',
  'CLIENT_ID',
  'GUILD_ID',
]) {
  if (!process.env[name]) {
    console.error(`❌ .env 缺少 ${name}`);
    process.exit(1);
  }
}

const rest = new REST({
  version: '10',
}).setToken(process.env.TOKEN);

async function deployCommands() {
  try {
    console.log('⏳ 正在註冊 Slash Commands...');

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID,
      ),
      {
        body: commandData.map((command) =>
          command.toJSON(),
        ),
      },
    );

    console.log('✅ Slash Commands 註冊完成。');
  } catch (error) {
    console.error('❌ 註冊失敗：', error);
    process.exit(1);
  }
}

deployCommands();