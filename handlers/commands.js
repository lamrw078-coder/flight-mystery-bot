const {
  ActionRowBuilder,
  MessageFlags,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require('discord.js');

const {
  FIRST_CLASS_NPCS,
  BUSINESS_CLASS_NPCS,
  ECONOMY_CLASS_NPCS,
} = require('../data');

const {
  getChannelProgress,
  saveChannelProgress,
  resetChannelProgress,
} = require('../utils/progress');

const {
  getChannelArea,
  isGameChannel,
  canUseGMCommand,
  rejectWrongChannel,
  rejectNonGM,
} = require('../utils/channel');

const commandData = [
  new SlashCommandBuilder()
    .setName('investigate')
    .setDescription('開始調查目前艙等的乘客'),

  new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('GM 解鎖指定 NPC 的實體任務')
    .addStringOption((option) =>
      option
        .setName('npc')
        .setDescription('需要解鎖的 NPC')
        .setRequired(true)
        .addChoices(
          { name: '李婆婆', value: 'granny' },
          { name: '林師兄', value: 'senior' },
          { name: '小男孩', value: 'boy' },
        ),
    ),

  new SlashCommandBuilder()
    .setName('reset')
    .setDescription('GM 重設目前頻道的遊戲進度'),

  new SlashCommandBuilder()
    .setName('cleanup')
    .setDescription('GM 清除目前頻道最近的訊息'),
];

function createNPCMenu(npcs, customId) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder('選擇想調查的乘客')
    .addOptions(
      Object.entries(npcs).map(([value, npc]) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(npc.label)
          .setEmoji(npc.emoji)
          .setValue(value),
      ),
    );

  return new ActionRowBuilder().addComponents(menu);
}

function createMissionMenu({
  customId,
  label,
  emoji,
  value,
}) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder('選擇任務完成狀態')
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(label)
        .setEmoji(emoji)
        .setValue(value),
    );

  return new ActionRowBuilder().addComponents(menu);
}

async function handleInvestigateCommand(interaction) {
  const area = getChannelArea(interaction);

  if (!area) {
    await rejectWrongChannel(interaction);
    return;
  }

  const configs = {
    firstClass: {
      title: '✈️ **頭等艙調查系統**',
      npcs: FIRST_CLASS_NPCS,
      customId: 'first_class_npc_select',
    },
    businessClass: {
      title: '💼 **商務艙調查系統**',
      npcs: BUSINESS_CLASS_NPCS,
      customId: 'business_class_npc_select',
    },
    economyClass: {
      title: '💺 **經濟艙調查系統**',
      npcs: ECONOMY_CLASS_NPCS,
      customId: 'economy_class_npc_select',
    },
  };

  const config = configs[area];

  await interaction.reply({
    content: `${config.title}\n\n請選擇你想詢問的乘客。`,
    components: [
      createNPCMenu(config.npcs, config.customId),
    ],
  });
}

async function unlockMission({
  interaction,
  requiredArea,
  progressKey,
  ready,
  completedMessage,
  notReadyMessage,
  mission,
}) {
  if (getChannelArea(interaction) !== requiredArea) {
    await interaction.reply({
      content: '❌ 呢個 NPC 唔喺目前艙等。',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const channelProgress = getChannelProgress(
    interaction.channelId,
  );
  const progress = channelProgress[progressKey];

  if (progress.completed) {
    await interaction.reply({
      content: completedMessage,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (!ready(progress)) {
    await interaction.reply({
      content: notReadyMessage,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  progress.unlocked = true;
  saveChannelProgress(
    interaction.channelId,
    channelProgress,
  );

  await interaction.reply({
    content: mission.message,
    components: [
      createMissionMenu(mission.menu),
    ],
  });
}

async function handleUnlockCommand(interaction) {
  if (!isGameChannel(interaction)) {
    await rejectWrongChannel(interaction);
    return;
  }

  if (!canUseGMCommand(interaction)) {
    await rejectNonGM(interaction);
    return;
  }

  const npc = interaction.options.getString(
    'npc',
    true,
  );

  if (npc === 'granny') {
    await unlockMission({
      interaction,
      requiredArea: 'firstClass',
      progressKey: 'granny',
      ready: (progress) => progress.chatStarted,
      completedMessage: 'ℹ️ 李婆婆調查已經完成。',
      notReadyMessage:
        '❌ 玩家需要先完成普通問題及「閒聊」。',
      mission: {
        message:
          '🔓 **GM 已確認唱歌任務完成。**\n\n玩家可選擇「歌已唱」。',
        menu: {
          customId: 'granny_mission',
          label: '歌已唱',
          emoji: '🎵',
          value: 'song_completed',
        },
      },
    });
    return;
  }

  if (npc === 'senior') {
    await unlockMission({
      interaction,
      requiredArea: 'businessClass',
      progressKey: 'seniorLam',
      ready: (progress) => progress.chatStarted,
      completedMessage: 'ℹ️ 林師兄調查已經完成。',
      notReadyMessage:
        '❌ 玩家需要先完成「獨自走過的女孩」及「閒聊」。',
      mission: {
        message:
          '🔓 **GM 已確認跳舞任務完成。**\n\n玩家可選擇「舞已跳」。',
        menu: {
          customId: 'senior_lam_mission',
          label: '舞已跳',
          emoji: '🕺',
          value: 'dance_completed',
        },
      },
    });
    return;
  }

  if (npc === 'boy') {
    await unlockMission({
      interaction,
      requiredArea: 'economyClass',
      progressKey: 'littleBoy',
      ready: (progress) => progress.taskStarted,
      completedMessage: 'ℹ️ 小男孩調查已經完成。',
      notReadyMessage:
        '❌ 玩家需要先答中 Toy Story，並完成 Forky 交換任務。',
      mission: {
        message:
          '🔓 **GM 已確認 Forky 交換任務完成。**\n\n玩家可選擇「交換完成」。',
        menu: {
          customId: 'little_boy_mission',
          label: '交換完成',
          emoji: '🧸',
          value: 'trade_completed',
        },
      },
    });
  }
}

async function handleResetCommand(interaction) {
  if (!isGameChannel(interaction)) {
    await rejectWrongChannel(interaction);
    return;
  }

  if (!canUseGMCommand(interaction)) {
    await rejectNonGM(interaction);
    return;
  }

  resetChannelProgress(interaction.channelId);

  await interaction.reply({
    content:
      '♻️ **目前頻道進度已重設。**\n\n請輸入 `/investigate` 重新開始。',
  });
}

async function handleCleanupCommand(interaction) {
  if (!canUseGMCommand(interaction)) {
    await rejectNonGM(interaction);
    return;
  }

  if (
    !interaction.channel ||
    !interaction.channel.isTextBased() ||
    typeof interaction.channel.bulkDelete !==
      'function'
  ) {
    await interaction.reply({
      content: '❌ 呢個指令只可以喺文字頻道使用。',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply({
    flags: MessageFlags.Ephemeral,
  });

  try {
    resetChannelProgress(interaction.channelId);

    const messages =
      await interaction.channel.messages.fetch({
        limit: 100,
      });

    const deleted =
      await interaction.channel.bulkDelete(
        messages,
        true,
      );

    await interaction.editReply({
      content: `🧹 已清除 ${deleted.size} 則訊息，並重設進度。`,
    });

    setTimeout(() => {
      interaction.deleteReply().catch(() => {});
    }, 3000);
  } catch (error) {
    console.error('/cleanup 失敗：', error);

    await interaction.editReply({
      content:
        '❌ 清理失敗。請確認 Bot 有 View Channel、Read Message History、Manage Messages 權限。',
    });
  }
}

async function handleCommand(interaction) {
  switch (interaction.commandName) {
    case 'investigate':
      await handleInvestigateCommand(interaction);
      break;
    case 'unlock':
      await handleUnlockCommand(interaction);
      break;
    case 'reset':
      await handleResetCommand(interaction);
      break;
    case 'cleanup':
      await handleCleanupCommand(interaction);
      break;
    default:
      await interaction.reply({
        content: '❌ 找不到這個指令。',
        flags: MessageFlags.Ephemeral,
      });
  }
}

module.exports = {
  commandData,
  handleCommand,
};