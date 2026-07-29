const fs = require('node:fs');
const path = require('node:path');

const progressFilePath = path.join(
  __dirname,
  '..',
  'data',
  'progress.json',
);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureProgressFile() {
  const folder = path.dirname(progressFilePath);

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  if (!fs.existsSync(progressFilePath)) {
    fs.writeFileSync(
      progressFilePath,
      JSON.stringify({}, null, 2),
      'utf8',
    );
  }
}

function readAllProgress() {
  ensureProgressFile();

  try {
    const content = fs.readFileSync(
      progressFilePath,
      'utf8',
    );

    if (!content.trim()) {
      return {};
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('讀取 progress.json 失敗：', error);
    return {};
  }
}

function saveAllProgress(allProgress) {
  ensureProgressFile();

  fs.writeFileSync(
    progressFilePath,
    JSON.stringify(allProgress, null, 2),
    'utf8',
  );
}

function createDefaultChannelProgress() {
  return {
    granny: {
      questions: {
        whereabouts: false,
        appearance: false,
      },
      chatStarted: false,
      unlocked: false,
      completed: false,
    },

    guBeichen: {
      questions: {
        details: false,
        appearance: false,
      },
      chatStage: 0,
      completed: false,
    },

    mrsHo: {
      questions: {
        childDetails: false,
        appearance: false,
      },
      completed: false,
    },

    canadianCouple: {
      stage: 0,
      completed: false,
    },

    writerWong: {
      questions: {
        girl: false,
        teacher: false,
      },
      chatted: false,
      completed: false,
    },

    siuYi: {
      stage: 0,
      completed: false,
    },

    seniorLam: {
      askedGirl: false,
      chatStarted: false,
      unlocked: false,
      completed: false,
    },

    teacher: {
      questions: {
        earthquake: false,
        crash: false,
      },
      waitingForName: false,
      completed: false,
    },

    comicArtist: {
      questions: {
        girlClue: false,
        praiseSketchbook: false,
      },
      completed: false,
    },

    littleBoy: {
      stage: 0,
      taskStarted: false,
      unlocked: false,
      completed: false,
    },

    papaAli: {
      askedNice: false,
      completed: false,
    },

    kaiting: {
      stage: 0,
      completed: false,
    },
  };
}

function mergeDefaults(current, defaults) {
  if (
    current === null ||
    typeof current !== 'object' ||
    Array.isArray(current)
  ) {
    return clone(defaults);
  }

  const repaired = { ...current };

  for (const [key, defaultValue] of Object.entries(
    defaults,
  )) {
    if (repaired[key] === undefined) {
      repaired[key] = clone(defaultValue);
      continue;
    }

    if (
      defaultValue &&
      typeof defaultValue === 'object' &&
      !Array.isArray(defaultValue)
    ) {
      repaired[key] = mergeDefaults(
        repaired[key],
        defaultValue,
      );
    }
  }

  return repaired;
}

function repairChannelProgress(channelProgress = {}) {
  return mergeDefaults(
    channelProgress,
    createDefaultChannelProgress(),
  );
}

function getChannelProgress(channelId) {
  const allProgress = readAllProgress();

  allProgress[channelId] = repairChannelProgress(
    allProgress[channelId],
  );

  saveAllProgress(allProgress);

  return allProgress[channelId];
}

function saveChannelProgress(
  channelId,
  channelProgress,
) {
  const allProgress = readAllProgress();

  allProgress[channelId] =
    repairChannelProgress(channelProgress);

  saveAllProgress(allProgress);
}

function resetChannelProgress(channelId) {
  const allProgress = readAllProgress();

  delete allProgress[channelId];

  saveAllProgress(allProgress);
}

module.exports = {
  getChannelProgress,
  saveChannelProgress,
  resetChannelProgress,
};