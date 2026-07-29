const {
  MessageFlags,
  PermissionFlagsBits,
} = require('discord.js');

function getChannelArea(interactionOrMessage) {
  const channelId = interactionOrMessage.channelId;

  if (
    process.env.FIRST_CLASS_CHANNEL_ID &&
    channelId === process.env.FIRST_CLASS_CHANNEL_ID
  ) {
    return 'firstClass';
  }

  if (
    process.env.BUSINESS_CLASS_CHANNEL_ID &&
    channelId === process.env.BUSINESS_CLASS_CHANNEL_ID
  ) {
    return 'businessClass';
  }

  if (
    process.env.ECONOMY_CLASS_CHANNEL_ID &&
    channelId === process.env.ECONOMY_CLASS_CHANNEL_ID
  ) {
    return 'economyClass';
  }

  return null;
}

function isGameChannel(interactionOrMessage) {
  return getChannelArea(interactionOrMessage) !== null;
}

function canUseGMCommand(interaction) {
  const gmRoleId = process.env.GM_ROLE_ID;

  const hasManageGuild =
    interaction.memberPermissions?.has(
      PermissionFlagsBits.ManageGuild,
    );

  const hasAdministrator =
    interaction.memberPermissions?.has(
      PermissionFlagsBits.Administrator,
    );

  const hasGMRole =
    gmRoleId &&
    interaction.member?.roles?.cache?.has(gmRoleId);

  return Boolean(
    hasManageGuild ||
      hasAdministrator ||
      hasGMRole,
  );
}

async function rejectWrongChannel(interaction) {
  await interaction.reply({
    content:
      '❌ 呢個功能只可以喺頭等艙、商務艙或經濟艙調查頻道使用。',
    flags: MessageFlags.Ephemeral,
  });
}

async function rejectNonGM(interaction) {
  await interaction.reply({
    content: '❌ 只有 GM 可以使用呢個指令。',
    flags: MessageFlags.Ephemeral,
  });
}

module.exports = {
  getChannelArea,
  isGameChannel,
  canUseGMCommand,
  rejectWrongChannel,
  rejectNonGM,
};