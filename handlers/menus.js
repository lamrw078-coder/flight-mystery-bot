const {
  ActionRowBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require('discord.js');

const {
  GRANNY_DIALOGUE,
  GU_BEICHEN_DIALOGUE,
  MRS_HO_DIALOGUE,
  CANADIAN_COUPLE_DIALOGUE,
  WRITER_WONG_DIALOGUE,
  SIU_YI_DIALOGUE,
  SENIOR_LAM_DIALOGUE,
  TEACHER_DIALOGUE,
  COMIC_ARTIST_DIALOGUE,
  LITTLE_BOY_DIALOGUE,
  PAPA_ALI_DIALOGUE,
  KAITING_DIALOGUE,
} = require('../data');

const {
  getChannelProgress,
  saveChannelProgress,
} = require('../utils/progress');

const {
  getChannelArea,
  rejectWrongChannel,
} = require('../utils/channel');

const DEFAULT_OPENING =
  '**你：**「請問你啱啱有冇見到有個小妹妹喺附近？」';

const ECONOMY_OPENING =
  '**你：**「請問你有冇見過坐35D嘅妹妹呀？」';

function addOpening(dialogue, area = 'default') {
  const opening =
    area === 'economy'
      ? ECONOMY_OPENING
      : DEFAULT_OPENING;

  return `${opening}\n\n${dialogue}`;
}

function addReminder(dialogue) {
  return `${dialogue}\n\n請輸入 \`/investigate\` 繼續調查其他乘客。`;
}

function row(menu) {
  return new ActionRowBuilder().addComponents(menu);
}

function option(label, emoji, value) {
  return new StringSelectMenuOptionBuilder()
    .setLabel(label)
    .setEmoji(emoji)
    .setValue(value);
}

function chat(value) {
  return option('閒聊', '💬', value);
}

function leave(value) {
  return option('離開', '🚪', value);
}

function shuffleArray(items) {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(
      Math.random() * (i + 1),
    );

    [shuffled[i], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[i],
    ];
  }

  return shuffled;
}

async function stale(interaction) {
  await interaction.reply({
    content:
      '⚠️ 呢個係舊選單，或者其他玩家已完成呢一步。\n\n請輸入 `/investigate` 查看進度。',
    flags: MessageFlags.Ephemeral,
  });
}

/* ---------- Menu builders ---------- */

function createGrannyMenu(p) {
  const m = new StringSelectMenuBuilder()
    .setCustomId('granny_question')
    .setPlaceholder('選擇問題或行動');

  if (!p.questions.whereabouts) {
    m.addOptions(option('細路女去向', '📍', 'granny_whereabouts'));
  }
  if (!p.questions.appearance) {
    m.addOptions(option('細路女外貌', '👧', 'granny_appearance'));
  }
  if (p.questions.whereabouts && p.questions.appearance) {
    m.addOptions(chat('granny_chat'), leave('granny_leave'));
  }
  return row(m);
}

function createGuMenu(p) {
  const m = new StringSelectMenuBuilder()
    .setCustomId('gu_question')
    .setPlaceholder('選擇問題或行動');

  // 第一步：只顯示追問細節
  if (!p.questions.details) {
    m.addOptions(option('追問細節', '🔎', 'gu_details'));

  // 第二步：完成細節後才顯示女仔特徵
  } else if (!p.questions.appearance) {
    m.addOptions(option('追問女仔特徵', '👧', 'gu_appearance'));

  // 第三步：兩個問題都完成後
  } else {
    if (p.chatStage === 0) {
      m.addOptions(
        option('有冇發達貼士？', '💰', 'gu_tip'),
        leave('gu_leave'),
      );
    } else {
      m.addOptions(
        option('顧總仲有冇嘢需要我？', '💬', 'gu_final'),
        option('反智轉身離場', '🚪', 'gu_leave'),
      );
    }
  }

  return row(m);
}

function createMrsHoMenu(p) {
  const m = new StringSelectMenuBuilder()
    .setCustomId('mrs_ho_question')
    .setPlaceholder('選擇問題或行動');

  if (!p.questions.childDetails) {
    m.addOptions(option('追問細路', '🔎', 'mrs_child'));
  }
  if (!p.questions.appearance) {
    m.addOptions(option('女孩特徵', '👧', 'mrs_appearance'));
  }
  if (p.questions.childDetails && p.questions.appearance) {
    m.addOptions(chat('mrs_chat'), leave('mrs_leave'));
  }
  return row(m);
}

function createCanadianMenu(p) {
  const m = new StringSelectMenuBuilder()
    .setCustomId('canadian_question')
    .setPlaceholder('選擇問題或行動');

  if (p.stage === 0) {
    m.addOptions(option('有冇單獨出現嘅女仔？', '👧', 'canadian_single'));
  } else if (p.stage === 1) {
    m.addOptions(option('追問港人老婆見到啲咩', '🔎', 'canadian_wife'));
  } else {
    m.addOptions(chat('canadian_chat'), leave('canadian_leave'));
  }
  return row(m);
}

function createWriterMenu(p) {
  const m = new StringSelectMenuBuilder()
    .setCustomId('writer_question')
    .setPlaceholder('選擇問題或行動');

  if (!p.questions.girl) {
    m.addOptions(
      option('查詢女孩', '👧', 'writer_girl'),
    );
  }

  if (!p.questions.teacher) {
    m.addOptions(
      option('查詢老師', '📖', 'writer_teacher'),
    );
  }

  if (
  p.questions.girl &&
  p.questions.teacher
) {
  if (!p.chatted) {
    m.addOptions(
      chat('writer_chat'),
      leave('writer_leave'),
    );
  } else {
    if (!p.askedAlias) {
      m.addOptions(
        option(
          '子有別號乎？',
          '🖋️',
          'writer_alias',
        ),
      );
    }

    if (!p.askedBook) {
      m.addOptions(
        option(
          '子曾著書乎？',
          '📚',
          'writer_book',
        ),
      );
    }

    if (!p.askedSchool) {
      m.addOptions(
        option(
          '尚記學名否？',
          '🏫',
          'writer_school',
        ),
      );
    }

    m.addOptions(
      leave('writer_leave'),
    );
  }
}

  return row(m);
}

function createSiuYiMenu(p) {
  const m = new StringSelectMenuBuilder()
    .setCustomId('siu_yi_question')
    .setPlaceholder('選擇問題或行動');

  if (p.stage === 0) {
    m.addOptions(option('再問一次', '🔁', 'siu_ask'));
  } else if (p.stage >= 1 && p.stage <= 4) {
    m.addOptions(option('佢叫心美', '💬', 'siu_name'));
  } else if (p.stage === 5) {
    m.addOptions(option('唔緊要啦', '🙂', 'siu_never_mind'));
  } else {
    m.addOptions(chat('siu_chat'), leave('siu_leave'));
  }
  return row(m);
}

function createSeniorMenu(p) {
  const m = new StringSelectMenuBuilder()
    .setCustomId('senior_question')
    .setPlaceholder('選擇問題或行動');

  if (!p.askedGirl) {
    m.addOptions(option('獨自走過的女孩', '👧', 'senior_girl'));
  } else {
    m.addOptions(chat('senior_chat'), leave('senior_leave'));
  }
  return row(m);
}

function createTeacherMenu(p) {
  const m = new StringSelectMenuBuilder()
    .setCustomId('teacher_question')
    .setPlaceholder('選擇叫醒老師的方法');

  if (!p.questions.earthquake) {
    m.addOptions(option('地震喇老師', '🌍', 'teacher_earthquake'));
  }
  if (!p.questions.crash) {
    m.addOptions(option('墮機喇老師', '✈️', 'teacher_crash'));
  }
  if (p.questions.earthquake && p.questions.crash) {
    m.addOptions(leave('teacher_leave'));
  }
  return row(m);
}

function createComicMenu(p) {
  const m = new StringSelectMenuBuilder()
    .setCustomId('comic_question')
    .setPlaceholder('選擇問題或行動');

  if (!p.questions.girlClue) {
    m.addOptions(option('女孩線索', '👧', 'comic_girl'));
  }
  if (!p.questions.praiseSketchbook) {
    m.addOptions(option('讚美畫簿畫作', '📒', 'comic_praise'));
  }
  if (p.questions.girlClue && p.questions.praiseSketchbook) {
    m.addOptions(option('詢問畫作', '🎨', 'comic_artwork'), leave('comic_leave'));
  }
  return row(m);
}

function createBoyMenu(p) {
  const m = new StringSelectMenuBuilder()
    .setCustomId('boy_question')
    .setPlaceholder('選擇問題或行動');

  const stages = {
    0: option('詢問姐姐', '👧', 'boy_ask_sister'),
    1: option('唔信', '🤨', 'boy_disbelief'),
    2: option('咩嚟㗎？', '🧥', 'boy_whats_that'),
    3: option('可唔可以俾隻公仔我？', '🧸', 'boy_ask_doll'),
  };

  if (stages[p.stage]) {
    m.addOptions(stages[p.stage]);
  } else if (p.stage === 4) {
    m.addOptions(
      option('寵物小精靈？', '⚡', 'boy_pokemon'),
      option('Ben and Jerry？', '🐭', 'boy_ben_jerry'),
      option('Toy Story？', '🧸', 'boy_toy_story'),
      leave('boy_leave'),
    );
  }
  return row(m);
}

function createPapaMenu(p) {
  const m = new StringSelectMenuBuilder()
    .setCustomId('papa_question')
    .setPlaceholder('選擇問題或行動');

  if (!p.askedNice) {
    m.addOptions(option("What do you mean she's nice?", '❓', 'papa_nice'));
  } else {
    m.addOptions(chat('papa_chat'), leave('papa_leave'));
  }
  return row(m);
}

function createKaitingMenu(p) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId('kaiting_question')
    .setPlaceholder('選擇下一句說話');

  // 第一部分：正常順序對話
  if (
    p.introStage <
    KAITING_DIALOGUE.introSteps.length
  ) {
    const step =
      KAITING_DIALOGUE.introSteps[p.introStage];

    menu.addOptions(
      option(
        step.label,
        '💬',
        'kaiting_intro_next',
      ),
    );

    if (p.introStage > 0) {
      menu.addOptions(
        leave('kaiting_leave'),
      );
    }

    return row(menu);
  }

  // 第二部分：1至9順序謎題
  if (p.sequenceActive) {
    const remainingOptions =
      KAITING_DIALOGUE.sequenceOptions.filter(
        (sequenceOption) =>
          sequenceOption.number >
          p.sequenceProgress,
      );

    const shuffledOptions =
      shuffleArray(remainingOptions);

    for (const sequenceOption of shuffledOptions) {
      menu.addOptions(
        option(
          sequenceOption.label,
          '🎵',
          `kaiting_sequence_${sequenceOption.number}`,
        ),
      );
    }

    // 「離開」永遠放最後，不參與洗牌
    menu.addOptions(
      leave('kaiting_leave'),
    );

    return row(menu);
  }

  // 成功完成1至9後
  if (
    p.sequenceCompleted &&
    p.postStage === 0
  ) {
    menu.addOptions(
      option(
        KAITING_DIALOGUE.afterSequence.label,
        '💬',
        'kaiting_after_sequence',
      ),
      leave('kaiting_leave'),
    );

    return row(menu);
  }

  // 最後一句
  if (
    p.sequenceCompleted &&
    p.postStage === 1
  ) {
    menu.addOptions(
      option(
        KAITING_DIALOGUE.finalStep.label,
        '💬',
        'kaiting_final',
      ),
      leave('kaiting_leave'),
    );

    return row(menu);
  }

  return row(menu);
}

/* ---------- NPC selections ---------- */

async function completed(interaction, name) {
  await interaction.update({
    content: addReminder(`✅ **${name}的調查已經完成。**`),
    components: [],
  });
}

async function handleFirstNPC(interaction) {
  const selected = interaction.values[0];
  const cp = getChannelProgress(interaction.channelId);

  const configs = {
    granny: [cp.granny, GRANNY_DIALOGUE.opening, createGrannyMenu, '李婆婆'],
    guBeichen: [cp.guBeichen, GU_BEICHEN_DIALOGUE.opening, createGuMenu, '顧北辰'],
    mrsHo: [cp.mrsHo, MRS_HO_DIALOGUE.opening, createMrsHoMenu, '何太'],
    canadianCouple: [cp.canadianCouple, CANADIAN_COUPLE_DIALOGUE.opening, createCanadianMenu, '加港夫婦'],
  };

  const config = configs[selected];
  if (!config) return stale(interaction);

  const [p, opening, menu, name] = config;
  if (p.completed) return completed(interaction, name);

  if (selected === 'granny' && p.chatStarted) {
    await interaction.update({
      content: addReminder(
        p.unlocked
          ? '🔓 請使用 GM 發出的「歌已唱」選單。'
          : '⏳ 正在等待 GM 使用 `/unlock granny`。',
      ),
      components: [],
    });
    return;
  }

  await interaction.update({
    content: addOpening(opening),
    components: [menu(p)],
  });
}

async function handleBusinessNPC(interaction) {
  const selected = interaction.values[0];
  const cp = getChannelProgress(interaction.channelId);

  if (selected === 'writerWong') {
    if (cp.writerWong.completed) return completed(interaction, '黃作家');
    return interaction.update({
      content: addOpening(WRITER_WONG_DIALOGUE.opening),
      components: [createWriterMenu(cp.writerWong)],
    });
  }

  if (selected === 'siuYi') {
    if (cp.siuYi.completed) return completed(interaction, '小怡');
    return interaction.update({
      content: addOpening(SIU_YI_DIALOGUE.opening),
      components: [createSiuYiMenu(cp.siuYi)],
    });
  }

  if (selected === 'seniorLam') {
    const p = cp.seniorLam;
    if (p.completed) return completed(interaction, '林師兄');

    if (p.chatStarted) {
      return interaction.update({
        content: addReminder(
          p.unlocked
            ? '🔓 請使用 GM 發出的「舞已跳」選單。'
            : '⏳ 正在等待 GM 使用 `/unlock senior`。',
        ),
        components: [],
      });
    }

    return interaction.update({
      content: addOpening(SENIOR_LAM_DIALOGUE.opening),
      components: [createSeniorMenu(p)],
    });
  }

  if (selected === 'teacher') {
    const p = cp.teacher;
    if (p.completed) return completed(interaction, '老師');

    return interaction.update({
      content: p.waitingForName
        ? `${TEACHER_DIALOGUE.opening}\n\n${TEACHER_DIALOGUE.typePrompt}`
        : TEACHER_DIALOGUE.opening,
      components: p.waitingForName ? [] : [createTeacherMenu(p)],
    });
  }

  return stale(interaction);
}

async function handleEconomyNPC(interaction) {
  const selected = interaction.values[0];
  const cp = getChannelProgress(interaction.channelId);

  if (selected === 'comicArtist') {
    if (cp.comicArtist.completed) return completed(interaction, '女漫畫家');
    return interaction.update({
      content: addOpening(COMIC_ARTIST_DIALOGUE.opening, 'economy'),
      components: [createComicMenu(cp.comicArtist)],
    });
  }

  if (selected === 'littleBoy') {
    const p = cp.littleBoy;
    if (p.completed) return completed(interaction, '小男孩');

    if (p.taskStarted) {
      return interaction.update({
        content: addReminder(
          p.unlocked
            ? '🔓 請使用 GM 發出的「交換完成」選單。'
            : '⏳ 正在等待 GM 使用 `/unlock boy`。',
        ),
        components: [],
      });
    }

    return interaction.update({
      content: addOpening(LITTLE_BOY_DIALOGUE.opening, 'economy'),
      components: [createBoyMenu(p)],
    });
  }

  if (selected === 'papaAli') {
    if (cp.papaAli.completed) return completed(interaction, 'Papa Ali');
    return interaction.update({
      content: addOpening(PAPA_ALI_DIALOGUE.opening, 'economy'),
      components: [createPapaMenu(cp.papaAli)],
    });
  }

  if (selected === 'kaiting') {
    if (cp.kaiting.completed) return completed(interaction, '凱婷');
    return interaction.update({
      content: addOpening(KAITING_DIALOGUE.opening, 'economy'),
      components: [createKaitingMenu(cp.kaiting)],
    });
  }

  return stale(interaction);
}

/* ---------- Question handlers ---------- */

async function handleGranny(interaction) {
  const v = interaction.values[0];
  const cp = getChannelProgress(interaction.channelId);
  const p = cp.granny;

  if (v === 'granny_leave') return interaction.update({ content: '離開調查其他乘客。\n\n請輸入 `/investigate` 繼續調查。', components: [] });

  if (v === 'granny_whereabouts' && !p.questions.whereabouts) {
    p.questions.whereabouts = true;
    saveChannelProgress(interaction.channelId, cp);
    return interaction.update({ content: GRANNY_DIALOGUE.whereabouts, components: [createGrannyMenu(p)] });
  }

  if (v === 'granny_appearance' && !p.questions.appearance) {
    p.questions.appearance = true;
    saveChannelProgress(interaction.channelId, cp);
    return interaction.update({ content: GRANNY_DIALOGUE.appearance, components: [createGrannyMenu(p)] });
  }

  if (v === 'granny_chat' && p.questions.whereabouts && p.questions.appearance && !p.chatStarted) {
    p.chatStarted = true;
    saveChannelProgress(interaction.channelId, cp);
    return interaction.update({ content: addReminder(GRANNY_DIALOGUE.chat), components: [] });
  }

  return stale(interaction);
}

async function handleGu(interaction) {
  const v = interaction.values[0];
  const cp = getChannelProgress(interaction.channelId);
  const p = cp.guBeichen;

  if (v === 'gu_leave') return interaction.update({ content: '你轉身離開咗顧北辰。\n\n請輸入 `/investigate` 繼續調查。', components: [] });

  if (v === 'gu_details' && !p.questions.details) {
    p.questions.details = true;
    saveChannelProgress(interaction.channelId, cp);
    return interaction.update({ content: GU_BEICHEN_DIALOGUE.details, components: [createGuMenu(p)] });
  }

  if (v === 'gu_appearance' && !p.questions.appearance) {
    p.questions.appearance = true;
    saveChannelProgress(interaction.channelId, cp);
    return interaction.update({ content: GU_BEICHEN_DIALOGUE.appearance, components: [createGuMenu(p)] });
  }

  if (v === 'gu_tip' && p.chatStage === 0) {
    p.chatStage = 1;
    saveChannelProgress(interaction.channelId, cp);
    return interaction.update({ content: GU_BEICHEN_DIALOGUE.investmentTip, components: [createGuMenu(p)] });
  }

  if (v === 'gu_final' && p.chatStage === 1) {
    p.completed = true;
    saveChannelProgress(interaction.channelId, cp);
    return interaction.update({ content: addReminder(GU_BEICHEN_DIALOGUE.final), components: [] });
  }

  return stale(interaction);
}

async function handleMrsHo(interaction) {
  const v = interaction.values[0];
  const cp = getChannelProgress(interaction.channelId);
  const p = cp.mrsHo;

  if (v === 'mrs_leave') return interaction.update({ content: '離開調查其他乘客。\n\n請輸入 `/investigate` 繼續調查。', components: [] });

  if (v === 'mrs_child' && !p.questions.childDetails) {
    p.questions.childDetails = true;
    saveChannelProgress(interaction.channelId, cp);
    return interaction.update({ content: MRS_HO_DIALOGUE.childDetails, components: [createMrsHoMenu(p)] });
  }

  if (v === 'mrs_appearance' && !p.questions.appearance) {
    p.questions.appearance = true;
    saveChannelProgress(interaction.channelId, cp);
    return interaction.update({ content: MRS_HO_DIALOGUE.appearance, components: [createMrsHoMenu(p)] });
  }

  if (v === 'mrs_chat' && p.questions.childDetails && p.questions.appearance) {
    p.completed = true;
    saveChannelProgress(interaction.channelId, cp);
    return interaction.update({ content: addReminder(MRS_HO_DIALOGUE.chat), components: [] });
  }

  return stale(interaction);
}

async function handleCanadian(interaction) {
  const v = interaction.values[0];
  const cp = getChannelProgress(interaction.channelId);
  const p = cp.canadianCouple;

  if (v === 'canadian_leave') return interaction.update({ content: '離開調查其他乘客。\n\n請輸入 `/investigate` 繼續調查。', components: [] });

  if (v === 'canadian_single' && p.stage === 0) {
    p.stage = 1;
    saveChannelProgress(interaction.channelId, cp);
    return interaction.update({ content: CANADIAN_COUPLE_DIALOGUE.singleGirl, components: [createCanadianMenu(p)] });
  }

  if (v === 'canadian_wife' && p.stage === 1) {
    p.stage = 2;
    saveChannelProgress(interaction.channelId, cp);
    return interaction.update({ content: CANADIAN_COUPLE_DIALOGUE.wifeDetails, components: [createCanadianMenu(p)] });
  }

  if (v === 'canadian_chat' && p.stage === 2) {
    p.completed = true;
    saveChannelProgress(interaction.channelId, cp);
    return interaction.update({ content: addReminder(CANADIAN_COUPLE_DIALOGUE.chat), components: [] });
  }

  return stale(interaction);
}

async function handleWriter(interaction) {
  const v = interaction.values[0];
  const cp = getChannelProgress(interaction.channelId);
  const p = cp.writerWong;

  if (v === 'writer_leave') {
    return interaction.update({
      content:
        '離開調查其他乘客。\n\n請輸入 `/investigate` 繼續調查。',
      components: [],
    });
  }

  if (
    v === 'writer_girl' &&
    !p.questions.girl
  ) {
    p.questions.girl = true;

    saveChannelProgress(
      interaction.channelId,
      cp,
    );

    return interaction.update({
      content: WRITER_WONG_DIALOGUE.girl,
      components: [createWriterMenu(p)],
    });
  }

  if (
    v === 'writer_teacher' &&
    !p.questions.teacher
  ) {
    p.questions.teacher = true;

    saveChannelProgress(
      interaction.channelId,
      cp,
    );

    return interaction.update({
      content: WRITER_WONG_DIALOGUE.teacher,
      components: [createWriterMenu(p)],
    });
  }

  if (
    v === 'writer_chat' &&
    !p.chatted
  ) {
    p.chatted = true;

    saveChannelProgress(
      interaction.channelId,
      cp,
    );

    return interaction.update({
      content: WRITER_WONG_DIALOGUE.chat,
      components: [createWriterMenu(p)],
    });
  }

  if (
    v === 'writer_alias' &&
    p.chatted &&
    !p.askedAlias
  ) {
    p.askedAlias = true;

    const allAsked =
      p.askedAlias &&
      p.askedBook &&
      p.askedSchool;

    if (allAsked) {
      p.completed = true;
    }

    saveChannelProgress(
      interaction.channelId,
      cp,
    );

    return interaction.update({
      content: allAsked
        ? addReminder(
            `${WRITER_WONG_DIALOGUE.alias}\n\n**（黃作家調查已經完成。）**`,
          )
        : WRITER_WONG_DIALOGUE.alias,
      components: allAsked
        ? []
        : [createWriterMenu(p)],
    });
  }

  if (
    v === 'writer_book' &&
    p.chatted &&
    !p.askedBook
  ) {
    p.askedBook = true;

    const allAsked =
      p.askedAlias &&
      p.askedBook &&
      p.askedSchool;

    if (allAsked) {
      p.completed = true;
    }

    saveChannelProgress(
      interaction.channelId,
      cp,
    );

    return interaction.update({
      content: allAsked
        ? addReminder(
            `${WRITER_WONG_DIALOGUE.book}\n\n**（黃作家調查已經完成。）**`,
          )
        : WRITER_WONG_DIALOGUE.book,
      components: allAsked
        ? []
        : [createWriterMenu(p)],
    });
  }

  if (
    v === 'writer_school' &&
    p.chatted &&
    !p.askedSchool
  ) {
    p.askedSchool = true;

    const allAsked =
      p.askedAlias &&
      p.askedBook &&
      p.askedSchool;

    if (allAsked) {
      p.completed = true;
    }

    saveChannelProgress(
      interaction.channelId,
      cp,
    );

    return interaction.update({
      content: allAsked
        ? addReminder(
            `${WRITER_WONG_DIALOGUE.schoolName}\n\n**（黃作家調查已經完成。）**`,
          )
        : WRITER_WONG_DIALOGUE.schoolName,
      components: allAsked
        ? []
        : [createWriterMenu(p)],
    });
  }

  return stale(interaction);
}

async function handleSiuYi(interaction) {
  const v = interaction.values[0];
  const cp = getChannelProgress(interaction.channelId);
  const p = cp.siuYi;

  if (v === 'siu_leave') return interaction.update({ content: '離開調查其他乘客。\n\n請輸入 `/investigate` 繼續調查。', components: [] });

  if (v === 'siu_ask' && p.stage === 0) {
    p.stage = 1;
    saveChannelProgress(interaction.channelId, cp);
    return interaction.update({ content: SIU_YI_DIALOGUE.askAgain, components: [createSiuYiMenu(p)] });
  }

  if (v === 'siu_name' && p.stage >= 1 && p.stage <= 4) {
    const responses = [SIU_YI_DIALOGUE.name1, SIU_YI_DIALOGUE.name2, SIU_YI_DIALOGUE.name3, SIU_YI_DIALOGUE.name4];
    const response = responses[p.stage - 1];
    p.stage += 1;
    saveChannelProgress(interaction.channelId, cp);
    return interaction.update({ content: response, components: [createSiuYiMenu(p)] });
  }

  if (v === 'siu_never_mind' && p.stage === 5) {
    p.stage = 6;
    saveChannelProgress(interaction.channelId, cp);
    return interaction.update({ content: SIU_YI_DIALOGUE.neverMind, components: [createSiuYiMenu(p)] });
  }

  if (v === 'siu_chat' && p.stage === 6) {
    p.completed = true;
    saveChannelProgress(interaction.channelId, cp);
    return interaction.update({ content: addReminder(SIU_YI_DIALOGUE.chat), components: [] });
  }

  return stale(interaction);
}

async function handleSenior(interaction) {
  const v = interaction.values[0];
  const cp = getChannelProgress(interaction.channelId);
  const p = cp.seniorLam;

  if (v === 'senior_leave') return interaction.update({ content: '離開調查其他乘客。\n\n請輸入 `/investigate` 繼續調查。', components: [] });

  if (v === 'senior_girl' && !p.askedGirl) {
    p.askedGirl = true;
    saveChannelProgress(interaction.channelId, cp);
    return interaction.update({ content: SENIOR_LAM_DIALOGUE.girl, components: [createSeniorMenu(p)] });
  }

  if (v === 'senior_chat' && p.askedGirl && !p.chatStarted) {
    p.chatStarted = true;
    saveChannelProgress(interaction.channelId, cp);
    return interaction.update({ content: addReminder(SENIOR_LAM_DIALOGUE.chat), components: [] });
  }

  return stale(interaction);
}

async function handleTeacher(interaction) {
  const v = interaction.values[0];
  const cp = getChannelProgress(interaction.channelId);
  const p = cp.teacher;

  if (v === 'teacher_leave') return interaction.update({ content: '離開調查其他乘客。\n\n請輸入 `/investigate` 繼續調查。', components: [] });

  if (v === 'teacher_earthquake' && !p.questions.earthquake) {
    p.questions.earthquake = true;
    const both = p.questions.earthquake && p.questions.crash;
    p.waitingForName = both;
    saveChannelProgress(interaction.channelId, cp);
    return interaction.update({
      content: both ? `${TEACHER_DIALOGUE.earthquake}\n\n${TEACHER_DIALOGUE.typePrompt}` : TEACHER_DIALOGUE.earthquake,
      components: both ? [] : [createTeacherMenu(p)],
    });
  }

  if (v === 'teacher_crash' && !p.questions.crash) {
    p.questions.crash = true;
    const both = p.questions.earthquake && p.questions.crash;
    p.waitingForName = both;
    saveChannelProgress(interaction.channelId, cp);
    return interaction.update({
      content: both ? `${TEACHER_DIALOGUE.crash}\n\n${TEACHER_DIALOGUE.typePrompt}` : TEACHER_DIALOGUE.crash,
      components: both ? [] : [createTeacherMenu(p)],
    });
  }

  return stale(interaction);
}

async function handleComic(interaction) {
  const v = interaction.values[0];
  const cp = getChannelProgress(interaction.channelId);
  const p = cp.comicArtist;

  if (v === 'comic_leave') return interaction.update({ content: '離開調查其他乘客。\n\n請輸入 `/investigate` 繼續調查。', components: [] });

  if (v === 'comic_girl' && !p.questions.girlClue) {
    p.questions.girlClue = true;
    saveChannelProgress(interaction.channelId, cp);
    return interaction.update({ content: COMIC_ARTIST_DIALOGUE.girlClue, components: [createComicMenu(p)] });
  }

  if (v === 'comic_praise' && !p.questions.praiseSketchbook) {
    p.questions.praiseSketchbook = true;
    saveChannelProgress(interaction.channelId, cp);
    return interaction.update({ content: COMIC_ARTIST_DIALOGUE.praiseSketchbook, components: [createComicMenu(p)] });
  }

  if (v === 'comic_artwork' && p.questions.girlClue && p.questions.praiseSketchbook) {
    p.completed = true;
    saveChannelProgress(interaction.channelId, cp);
    return interaction.update({ content: addReminder(COMIC_ARTIST_DIALOGUE.artwork), components: [] });
  }

  return stale(interaction);
}

async function handleBoy(interaction) {
  const v = interaction.values[0];
  const cp = getChannelProgress(interaction.channelId);
  const p = cp.littleBoy;

  if (v === 'boy_leave') return interaction.update({ content: '離開調查其他乘客。\n\n請輸入 `/investigate` 繼續調查。', components: [] });

  const linear = {
    boy_ask_sister: [0, LITTLE_BOY_DIALOGUE.askSister],
    boy_disbelief: [1, LITTLE_BOY_DIALOGUE.disbelief],
    boy_whats_that: [2, LITTLE_BOY_DIALOGUE.whatsThat],
    boy_ask_doll: [3, LITTLE_BOY_DIALOGUE.askForDoll],
  };

  if (linear[v] && p.stage === linear[v][0]) {
    p.stage += 1;
    saveChannelProgress(interaction.channelId, cp);
    return interaction.update({ content: linear[v][1], components: [createBoyMenu(p)] });
  }

  if (p.stage === 4 && v === 'boy_pokemon') {
    return interaction.update({ content: LITTLE_BOY_DIALOGUE.pokemon, components: [createBoyMenu(p)] });
  }

  if (p.stage === 4 && v === 'boy_ben_jerry') {
    return interaction.update({ content: LITTLE_BOY_DIALOGUE.benJerry, components: [createBoyMenu(p)] });
  }

  if (p.stage === 4 && v === 'boy_toy_story') {
    p.taskStarted = true;
    saveChannelProgress(interaction.channelId, cp);
    return interaction.update({ content: addReminder(LITTLE_BOY_DIALOGUE.toyStory), components: [] });
  }

  return stale(interaction);
}

async function handlePapa(interaction) {
  const v = interaction.values[0];
  const cp = getChannelProgress(interaction.channelId);
  const p = cp.papaAli;

  if (v === 'papa_leave') return interaction.update({ content: '離開調查其他乘客。\n\n請輸入 `/investigate` 繼續調查。', components: [] });

  if (v === 'papa_nice' && !p.askedNice) {
    p.askedNice = true;
    saveChannelProgress(interaction.channelId, cp);
    return interaction.update({ content: PAPA_ALI_DIALOGUE.nice, components: [createPapaMenu(p)] });
  }

  if (v === 'papa_chat' && p.askedNice) {
    p.completed = true;
    saveChannelProgress(interaction.channelId, cp);
    return interaction.update({ content: addReminder(PAPA_ALI_DIALOGUE.chat), components: [] });
  }

  return stale(interaction);
}

async function handleKaiting(interaction) {
  const selected = interaction.values[0];

  const channelProgress =
    getChannelProgress(interaction.channelId);

  const progress = channelProgress.kaiting;

  if (selected === 'kaiting_leave') {
    return interaction.update({
      content:
        '你離開咗凱婷。\n\n請輸入 `/investigate` 繼續調查其他乘客。',
      components: [],
    });
  }

  // 第一部分：正常對話
  if (selected === 'kaiting_intro_next') {
    const step =
      KAITING_DIALOGUE.introSteps[
        progress.introStage
      ];

    if (!step) {
      return stale(interaction);
    }

    progress.introStage += 1;

    // 完成「其實最近成日諗好多嘢」後，
    // 正式開始1至9順序謎題
    if (
      progress.introStage >=
      KAITING_DIALOGUE.introSteps.length
    ) {
      progress.sequenceActive = true;
      progress.sequenceProgress = 0;
    }

    saveChannelProgress(
      interaction.channelId,
      channelProgress,
    );

    return interaction.update({
      content: step.response,
      components: [
        createKaitingMenu(progress),
      ],
    });
  }

  // 第二部分：處理1至9選項
  if (
    selected.startsWith(
      'kaiting_sequence_',
    ) &&
    progress.sequenceActive
  ) {
    const selectedNumber = Number(
      selected.replace(
        'kaiting_sequence_',
        '',
      ),
    );

    const expectedNumber =
      progress.sequenceProgress + 1;

    // 選錯順序
    if (selectedNumber !== expectedNumber) {
      progress.sequenceProgress = 0;

      saveChannelProgress(
        interaction.channelId,
        channelProgress,
      );

      return interaction.update({
        content:
          '**凱婷：**「嗯？」\n\n**請重新嘗試**',
        components: [
          createKaitingMenu(progress),
        ],
      });
    }

    const sequenceOption =
      KAITING_DIALOGUE.sequenceOptions.find(
        (item) =>
          item.number === selectedNumber,
      );

    if (!sequenceOption) {
      return stale(interaction);
    }

    progress.sequenceProgress += 1;

    // 完成1至9
    if (
      progress.sequenceProgress >=
      KAITING_DIALOGUE.sequenceOptions.length
    ) {
      progress.sequenceActive = false;
      progress.sequenceCompleted = true;
    }

    saveChannelProgress(
      interaction.channelId,
      channelProgress,
    );

    return interaction.update({
      content: sequenceOption.response,
      components: [
        createKaitingMenu(progress),
      ],
    });
  }

  // 完成1至9後的長對話
  if (
    selected === 'kaiting_after_sequence' &&
    progress.sequenceCompleted &&
    progress.postStage === 0
  ) {
    progress.postStage = 1;

    saveChannelProgress(
      interaction.channelId,
      channelProgress,
    );

    return interaction.update({
      content:
        KAITING_DIALOGUE.afterSequence.response,
      components: [
        createKaitingMenu(progress),
      ],
    });
  }

  // 最後完成
  if (
    selected === 'kaiting_final' &&
    progress.sequenceCompleted &&
    progress.postStage === 1
  ) {
    progress.completed = true;

    saveChannelProgress(
      interaction.channelId,
      channelProgress,
    );

    return interaction.update({
      content: addReminder(
        KAITING_DIALOGUE.finalStep.response,
      ),
      components: [],
    });
  }

  return stale(interaction);
}

/* ---------- Mission handlers ---------- */

async function handleMission(interaction, config) {
  const cp = getChannelProgress(interaction.channelId);
  const p = cp[config.progressKey];

  if (
    interaction.values[0] !== config.expectedValue ||
    !config.ready(p) ||
    !p.unlocked ||
    p.completed
  ) {
    return stale(interaction);
  }

  p.completed = true;
  saveChannelProgress(interaction.channelId, cp);

  return interaction.update({
    content: addReminder(config.finalText),
    components: [],
  });
}

/* ---------- Main router ---------- */

async function handleMenu(interaction) {
  const area = getChannelArea(interaction);
  if (!area) {
    await rejectWrongChannel(interaction);
    return;
  }

  const routes = {
    first_class_npc_select: handleFirstNPC,
    business_class_npc_select: handleBusinessNPC,
    economy_class_npc_select: handleEconomyNPC,

    granny_question: handleGranny,
    gu_question: handleGu,
    mrs_ho_question: handleMrsHo,
    canadian_question: handleCanadian,

    writer_question: handleWriter,
    siu_yi_question: handleSiuYi,
    senior_question: handleSenior,
    teacher_question: handleTeacher,

    comic_question: handleComic,
    boy_question: handleBoy,
    papa_question: handlePapa,
    kaiting_question: handleKaiting,
  };

  if (routes[interaction.customId]) {
    await routes[interaction.customId](interaction);
    return;
  }

  if (interaction.customId === 'granny_mission') {
    await handleMission(interaction, {
      progressKey: 'granny',
      expectedValue: 'song_completed',
      ready: (p) => p.chatStarted,
      finalText: GRANNY_DIALOGUE.final,
    });
    return;
  }

  if (interaction.customId === 'senior_lam_mission') {
    await handleMission(interaction, {
      progressKey: 'seniorLam',
      expectedValue: 'dance_completed',
      ready: (p) => p.chatStarted,
      finalText: SENIOR_LAM_DIALOGUE.final,
    });
    return;
  }

  if (interaction.customId === 'little_boy_mission') {
    await handleMission(interaction, {
      progressKey: 'littleBoy',
      expectedValue: 'trade_completed',
      ready: (p) => p.taskStarted,
      finalText: LITTLE_BOY_DIALOGUE.final,
    });
    return;
  }

  await interaction.reply({
    content: '❌ 找不到呢個選單。',
    flags: MessageFlags.Ephemeral,
  });
}

module.exports = {
  handleMenu,
};