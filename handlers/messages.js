const { TEACHER_DIALOGUE } = require('../data');

const {
  getChannelProgress,
  saveChannelProgress,
} = require('../utils/progress');

const {
  getChannelArea,
} = require('../utils/channel');

function normalizeAnswer(content) {
  return content
    .trim()
    .replace(/\s+/g, '')
    .replace(/[！!。．，,？?：:「」『』"'“”‘’]/g, '');
}

async function handleMessage(message) {
  if (message.author.bot) {
    return;
  }

  if (getChannelArea(message) !== 'businessClass') {
    return;
  }

  const channelProgress = getChannelProgress(
    message.channelId,
  );

  const progress = channelProgress.teacher;

  if (
    !progress.waitingForName ||
    progress.completed
  ) {
    return;
  }

  const answer = normalizeAnswer(message.content);

  const acceptedAnswers = new Set([
    '愛美蘭小學吳皓訓',
    '愛美蘭小學吳皓訓老師',
  ]);

  if (!acceptedAnswers.has(answer)) {
    return;
  }

  progress.waitingForName = false;
  progress.completed = true;

  saveChannelProgress(
    message.channelId,
    channelProgress,
  );

  await message.channel.send(
    `${TEACHER_DIALOGUE.correctName}\n\n請輸入 \`/investigate\` 繼續調查其他乘客。`,
  );
}

module.exports = {
  handleMessage,
};