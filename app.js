(() => {
  "use strict";

  const CONFIG = {
    correctPoints: 10,
    wrongPenalty: 5,
    fallDurationMs: 4800,
    nextItemDelayMs: 700
  };

  const BINS = {
    recycle: {
      name: "ถังสีเหลือง — ขยะรีไซเคิล",
      short: "ขยะรีไซเคิล"
    },
    organic: {
      name: "ถังสีเขียว — ขยะอินทรีย์",
      short: "ขยะอินทรีย์"
    },
    general: {
      name: "ถังสีน้ำเงิน — ขยะทั่วไป",
      short: "ขยะทั่วไป"
    },
    hazardous: {
      name: "ถังสีแดง — ขยะอันตราย",
      short: "ขยะอันตราย"
    },
    burnable: {
      name: "ถังสีเทา — ขยะเชื้อเพลิง",
      short: "ขยะเชื้อเพลิง"
    }
  };

  // คำตอบตามที่ผู้ใช้ยืนยันล่าสุด
  const ITEMS = [
    {
      id: "tissue",
      name: "กระดาษทิชชู่",
      image: "assets/tissue.jpg",
      bin: "general",
      explanation: "กระดาษทิชชู่ใช้แล้วเป็นขยะทั่วไป จึงใส่ถังสีน้ำเงิน"
    },
    {
      id: "food_box",
      name: "กล่องใส่อาหารเปื้อน",
      image: "assets/food_box.jpg",
      bin: "burnable",
      explanation: "กล่องใส่อาหารที่เปื้อนจัดเป็นขยะเชื้อเพลิง จึงใส่ถังสีเทา"
    },
    {
      id: "bubble_tea",
      name: "แก้วชาไข่มุก",
      image: "assets/bubble_tea.jpg",
      bin: "general",
      explanation: "แก้วชาไข่มุกในกติกาเกมนี้เป็นขยะทั่วไป จึงใส่ถังสีน้ำเงิน"
    },
    {
      id: "wrappers",
      name: "ซองขนม / ซองเครื่องปรุง",
      image: "assets/wrappers.jpg",
      bin: "burnable",
      explanation: "ซองขนมและซองเครื่องปรุงเป็นขยะเชื้อเพลิง จึงใส่ถังสีเทา"
    },
    {
      id: "curry_bag",
      name: "ถุงแกงเปื้อนอาหาร",
      image: "assets/curry_bag.jpg",
      bin: "burnable",
      explanation: "ถุงแกงที่เปื้อนอาหารเป็นขยะเชื้อเพลิง จึงใส่ถังสีเทา"
    },
    {
      id: "utensils",
      name: "ช้อนส้อมพลาสติก",
      image: "assets/utensils.jpg",
      bin: "burnable",
      explanation: "ช้อนส้อมพลาสติกใช้แล้วเป็นขยะเชื้อเพลิง จึงใส่ถังสีเทา"
    },
    {
      id: "plastic_bag",
      name: "ถุงพลาสติก",
      image: "assets/plastic_bag.jpg",
      bin: "burnable",
      explanation: "ถุงพลาสติกในกติกาเกมนี้เป็นขยะเชื้อเพลิง จึงใส่ถังสีเทา"
    },
    {
      id: "plastic_bottle",
      name: "ขวดน้ำพลาสติก",
      image: "assets/plastic_bottle.jpg",
      bin: "recycle",
      explanation: "ขวดน้ำพลาสติกที่เทของเหลวออกแล้วนำไปรีไซเคิลได้ จึงใส่ถังสีเหลือง"
    },
    {
      id: "batteries",
      name: "ถ่านอัลคาไลน์",
      image: "assets/batteries.jpg",
      bin: "hazardous",
      explanation: "ถ่านอัลคาไลน์มีสารเคมี ต้องแยกเป็นขยะอันตรายและใส่ถังสีแดง"
    },
    {
      id: "food_scraps",
      name: "เศษอาหาร",
      image: "assets/food_scraps.jpg",
      bin: "organic",
      explanation: "เศษอาหารย่อยสลายได้ เป็นขยะอินทรีย์และใส่ถังสีเขียว"
    }
  ];

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const screens = {
    registration: $("#registrationScreen"),
    menu: $("#menuScreen"),
    help: $("#helpScreen"),
    fall: $("#fallGameScreen"),
    quiz: $("#quizGameScreen"),
    result: $("#resultScreen")
  };

  const state = {
    player: null,
    muted: false,
    activeGame: null,
    replayAction: null,

    fall: {
      score: 0,
      completed: 0,
      wrong: 0,
      queue: [],
      current: null,
      accepting: false,
      running: false,
      animationId: null,
      y: -160,
      duration: 4800,
      startedAt: 0
    },

    quiz: {
      items: [],
      index: 0,
      score: 0,
      correct: 0,
      accepting: false
    }
  };

  const registrationForm = $("#registrationForm");
  const fullNameInput = $("#fullName");
  const phoneInput = $("#phone");
  const birthDateInput = $("#birthDate");
  const registerError = $("#registerError");

  const menuPlayerName = $("#menuPlayerName");
  const fallBestMenu = $("#fallBestMenu");
  const quizBestMenu = $("#quizBestMenu");

  const menuSoundButton = $("#menuSoundButton");
  const fallSoundButton = $("#fallSoundButton");
  const quizSoundButton = $("#quizSoundButton");

  const fallButtons = $$('.bin-button[data-game="fall"]');
  const quizButtons = $$('.bin-button[data-game="quiz"]');

  let audioContext = null;

  function showScreen(name) {
    Object.entries(screens).forEach(([key, element]) => {
      element.classList.toggle("hidden", key !== name);
    });
  }

  function sanitizePhone(value) {
    return value.replace(/\D/g, "").slice(0, 10);
  }

  function firstName(name) {
    return (name || "ผู้เล่น").trim().split(/\s+/)[0];
  }

  function loadPlayer() {
    try {
      const raw = localStorage.getItem("cgq2_player");
      if (!raw) return null;
      const player = JSON.parse(raw);
      if (!player.name || !player.phone || !player.birthDate) return null;
      return player;
    } catch {
      return null;
    }
  }

  function savePlayer(player) {
    localStorage.setItem("cgq2_player", JSON.stringify(player));
  }

  function updatePlayerUI() {
    const name = firstName(state.player?.name);
    menuPlayerName.textContent = name;
    $("#fallPlayerName").textContent = name;
    $("#quizPlayerName").textContent = name;
    updateBestScores();
  }

  function updateBestScores() {
    fallBestMenu.textContent = String(getBest("fall"));
    quizBestMenu.textContent = String(getBest("quiz"));
  }

  function getBest(mode) {
    return Number(localStorage.getItem(`cgq2_best_${mode}`) || 0);
  }

  function setBest(mode, score) {
    const best = Math.max(getBest(mode), score);
    localStorage.setItem(`cgq2_best_${mode}`, String(best));
    return best;
  }

  function setMuted(value) {
    state.muted = value;
    const icon = state.muted ? "🔇" : "🔊";
    [menuSoundButton, fallSoundButton, quizSoundButton].forEach((button) => {
      button.textContent = icon;
      button.setAttribute(
        "aria-label",
        state.muted ? "เปิดเสียง" : "ปิดเสียง"
      );
    });
  }

  function toggleSound() {
    setMuted(!state.muted);
  }

  [menuSoundButton, fallSoundButton, quizSoundButton].forEach((button) => {
    button.addEventListener("click", toggleSound);
  });

  phoneInput.addEventListener("input", () => {
    phoneInput.value = sanitizePhone(phoneInput.value);
  });

  birthDateInput.max = new Date().toISOString().slice(0, 10);

  registrationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    registerError.textContent = "";

    const name = fullNameInput.value.trim();
    const phone = sanitizePhone(phoneInput.value);
    const birthDate = birthDateInput.value;

    if (!name) {
      registerError.textContent = "กรุณากรอกชื่อ–นามสกุล";
      fullNameInput.focus();
      return;
    }

    if (phone.length < 9 || phone.length > 10) {
      registerError.textContent = "กรุณากรอกเบอร์โทรศัพท์ 9–10 หลัก";
      phoneInput.focus();
      return;
    }

    if (!birthDate || birthDate > birthDateInput.max) {
      registerError.textContent = "กรุณาเลือกวันเดือนปีเกิดให้ถูกต้อง";
      birthDateInput.focus();
      return;
    }

    state.player = { name, phone, birthDate };
    savePlayer(state.player);
    updatePlayerUI();
    showScreen("menu");
  });

  $("#changePlayerButton").addEventListener("click", () => {
    stopAllGames();
    localStorage.removeItem("cgq2_player");
    state.player = null;
    registrationForm.reset();
    registerError.textContent = "";
    showScreen("registration");
  });

  $("#howToPlayButton").addEventListener("click", () => showScreen("help"));
  $("#closeHelpButton").addEventListener("click", () => showScreen("menu"));

  $("#openFallGameButton").addEventListener("click", startFallGame);
  $("#openQuizGameButton").addEventListener("click", startQuizGame);

  $("#fallBackButton").addEventListener("click", returnToMenu);
  $("#quizBackButton").addEventListener("click", returnToMenu);
  $("#resultMenuButton").addEventListener("click", returnToMenu);
  $("#resultReplayButton").addEventListener("click", () => {
    if (typeof state.replayAction === "function") {
      state.replayAction();
    }
  });

  fallButtons.forEach((button) => {
    button.addEventListener("click", () => {
      chooseFallBin(button.dataset.bin, button);
    });
  });

  quizButtons.forEach((button) => {
    button.addEventListener("click", () => {
      chooseQuizBin(button.dataset.bin, button);
    });
  });

  $("#quizNextButton").addEventListener("click", nextQuizQuestion);

  document.addEventListener("keydown", (event) => {
    const keyMap = {
      "1": "recycle",
      "2": "organic",
      "3": "general",
      "4": "hazardous",
      "5": "burnable"
    };

    const bin = keyMap[event.key];
    if (!bin) return;

    if (state.activeGame === "fall" && state.fall.accepting) {
      const button = fallButtons.find((item) => item.dataset.bin === bin);
      chooseFallBin(bin, button);
    } else if (state.activeGame === "quiz" && state.quiz.accepting) {
      const button = quizButtons.find((item) => item.dataset.bin === bin);
      chooseQuizBin(bin, button);
    }
  });

  function returnToMenu() {
    stopAllGames();
    updatePlayerUI();
    showScreen("menu");
  }

  function stopAllGames() {
    stopFallGame();
    state.quiz.accepting = false;
    state.activeGame = null;
    clearEffects(fallButtons);
    clearEffects(quizButtons);
  }

  function clearEffects(buttons) {
    buttons.forEach((button) => {
      button.classList.remove("correct-bin", "wrong-bin");
      button.disabled = false;
    });
  }

  /* ---------------- Game 1 ---------------- */

  function startFallGame() {
    stopAllGames();
    state.activeGame = "fall";

    const fall = state.fall;
    fall.score = 0;
    fall.completed = 0;
    fall.wrong = 0;
    fall.queue = shuffle([...ITEMS]);
    fall.current = null;
    fall.accepting = false;
    fall.running = true;
    fall.duration = CONFIG.fallDurationMs;

    $("#fallScore").textContent = "0";
    $("#fallCompleted").textContent = "0";
    $("#fallFeedback").textContent = "";
    updateFallStatus();
    clearEffects(fallButtons);
    showScreen("fall");

    window.setTimeout(spawnFallingItem, 350);
  }

  function stopFallGame() {
    const fall = state.fall;
    fall.running = false;
    fall.accepting = false;

    if (fall.animationId) {
      cancelAnimationFrame(fall.animationId);
      fall.animationId = null;
    }

    const element = $("#fallingItem");
    element.classList.add("hidden");
    element.classList.remove("fly");
  }

  function spawnFallingItem() {
    const fall = state.fall;
    if (!fall.running) return;

    if (fall.completed >= ITEMS.length) {
      finishFallGame();
      return;
    }

    if (fall.queue.length === 0) {
      // Safety fallback: only unanswered items should be returned to the queue.
      finishFallGame();
      return;
    }

    clearEffects(fallButtons);
    $("#fallFeedback").textContent = "";

    fall.current = fall.queue.shift();
    fall.accepting = true;

    const element = $("#fallingItem");
    const image = $("#fallingImage");
    const label = $("#fallingLabel");

    image.src = fall.current.image;
    image.alt = fall.current.name;
    label.textContent = fall.current.name;

    element.classList.remove("hidden", "fly");
    element.style.opacity = "1";

    const zone = $("#fallZone");
    fall.duration = CONFIG.fallDurationMs;
    fall.startedAt = performance.now();
    fall.y = -160;

    const tick = (now) => {
      if (!fall.running || !fall.accepting) return;

      const ratio = Math.min((now - fall.startedAt) / fall.duration, 1);
      const maxY = Math.max(70, zone.clientHeight - 120);
      fall.y = -160 + (maxY + 160) * ratio;
      element.style.transform = `translate3d(-50%, ${fall.y}px, 0)`;

      if (ratio >= 1) {
        missFallingItem();
        return;
      }

      fall.animationId = requestAnimationFrame(tick);
    };

    fall.animationId = requestAnimationFrame(tick);
  }

  function chooseFallBin(bin, selectedButton) {
    const fall = state.fall;
    if (!fall.running || !fall.accepting || !fall.current) return;

    fall.accepting = false;

    if (fall.animationId) {
      cancelAnimationFrame(fall.animationId);
      fall.animationId = null;
    }

    const correctButton = fallButtons.find(
      (button) => button.dataset.bin === fall.current.bin
    );
    const isCorrect = bin === fall.current.bin;

    if (isCorrect) {
      fall.score += CONFIG.correctPoints;
      fall.completed += 1;
      selectedButton.classList.add("correct-bin");
      setFallFeedback(`ถูกต้อง! +${CONFIG.correctPoints} ชิ้นนี้จะไม่กลับมาอีก`);
      playCorrectSound();
    } else {
      fall.score = Math.max(0, fall.score - CONFIG.wrongPenalty);
      fall.wrong += 1;
      // Wrong items return at the end of the queue and will be asked again.
      fall.queue.push(fall.current);
      selectedButton.classList.add("wrong-bin");
      correctButton.classList.add("correct-bin");
      setFallFeedback(
        `ยังไม่ถูก — ${BINS[fall.current.bin].name} ชิ้นนี้จะกลับมาใหม่`
      );
      playWrongSound();
    }

    $("#fallScore").textContent = String(fall.score);
    $("#fallCompleted").textContent = String(fall.completed);
    updateFallStatus();
    animateFallItemIntoBin(correctButton);

    window.setTimeout(() => {
      if (!fall.running) return;

      if (fall.completed >= ITEMS.length) {
        finishFallGame();
      } else {
        spawnFallingItem();
      }
    }, CONFIG.nextItemDelayMs);
  }

  function missFallingItem() {
    const fall = state.fall;
    if (!fall.running || !fall.accepting || !fall.current) return;

    fall.accepting = false;
    fall.wrong += 1;
    // An item that reaches the ground is unanswered, so it returns later.
    fall.queue.push(fall.current);

    const correctButton = fallButtons.find(
      (button) => button.dataset.bin === fall.current.bin
    );
    correctButton.classList.add("correct-bin");

    setFallFeedback(
      `ยังไม่ได้ตอบ — ${BINS[fall.current.bin].name} ชิ้นนี้จะกลับมาใหม่`
    );
    playMissSound();
    updateFallStatus();

    const element = $("#fallingItem");
    element.style.opacity = "0";

    window.setTimeout(() => {
      if (!fall.running) return;
      spawnFallingItem();
    }, CONFIG.nextItemDelayMs);
  }

  function animateFallItemIntoBin(targetButton) {
    const fall = state.fall;
    const element = $("#fallingItem");
    const itemRect = element.getBoundingClientRect();
    const binRect = targetButton.getBoundingClientRect();

    const dx =
      binRect.left + binRect.width / 2 -
      (itemRect.left + itemRect.width / 2);
    const dy =
      binRect.top + Math.min(34, binRect.height * 0.2) -
      (itemRect.top + itemRect.height / 2);

    element.classList.add("fly");
    element.style.transform =
      `translate3d(calc(-50% + ${dx}px), ${fall.y + dy}px, 0) scale(0.28)`;
    element.style.opacity = "0.22";
  }

  function setFallFeedback(text) {
    $("#fallFeedback").textContent = text;
  }

  function updateFallStatus() {
    const remaining = Math.max(ITEMS.length - state.fall.completed, 0);
    $("#fallStatus").textContent =
      remaining === 0
        ? "ตอบถูกครบทุกชิ้นแล้ว!"
        : `เหลือ ${remaining} ชิ้นที่ต้องตอบให้ถูก`;
  }

  function finishFallGame() {
    if (!state.fall.running) return;

    const score = state.fall.score;
    const wrong = state.fall.wrong;
    stopFallGame();

    const best = setBest("fall", score);
    const message =
      wrong === 0
        ? "ตอบถูกครบทุกชิ้นตั้งแต่ครั้งแรก เยี่ยมมาก!"
        : `ตอบถูกครบทั้ง 10 ชิ้นแล้ว มีคำตอบผิดหรือขยะตก ${wrong} ครั้ง`;

    showResult({
      mode: "GAME 1 — ภารกิจขยะร่วง",
      title: "ตอบถูกครบทุกชิ้นแล้ว",
      message,
      score,
      best,
      extraLabel: "ผิด/ตก",
      extra: wrong,
      emoji: wrong === 0 ? "🏆" : wrong <= 3 ? "🌟" : "♻️",
      replay: startFallGame
    });
  }

  /* ---------------- Game 2 ---------------- */

  function startQuizGame() {
    stopAllGames();
    state.activeGame = "quiz";

    state.quiz.items = shuffle([...ITEMS]);
    state.quiz.index = 0;
    state.quiz.score = 0;
    state.quiz.correct = 0;
    state.quiz.accepting = true;

    $("#quizScore").textContent = "0";
    $("#quizFeedback").classList.add("hidden");
    $("#quizNextButton").classList.add("hidden");
    clearEffects(quizButtons);
    showScreen("quiz");
    renderQuizQuestion();
  }

  function shuffle(array) {
    for (let index = array.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [array[index], array[randomIndex]] =
        [array[randomIndex], array[index]];
    }
    return array;
  }

  function renderQuizQuestion() {
    const quiz = state.quiz;
    const item = quiz.items[quiz.index];

    quiz.accepting = true;
    clearEffects(quizButtons);
    quizButtons.forEach((button) => {
      button.disabled = false;
    });

    $("#quizNumber").textContent = String(quiz.index + 1);
    $("#quizProgress").style.width =
      `${((quiz.index + 1) / quiz.items.length) * 100}%`;
    $("#quizImage").src = item.image;
    $("#quizImage").alt = item.name;
    $("#quizItemName").textContent = item.name;

    const feedback = $("#quizFeedback");
    feedback.className = "quiz-feedback hidden";
    $("#quizFeedbackTitle").textContent = "";
    $("#quizExplanation").textContent = "";
    $("#quizNextButton").classList.add("hidden");
  }

  function chooseQuizBin(bin, selectedButton) {
    const quiz = state.quiz;
    if (!quiz.accepting) return;

    quiz.accepting = false;
    const item = quiz.items[quiz.index];
    const isCorrect = bin === item.bin;
    const correctButton = quizButtons.find(
      (button) => button.dataset.bin === item.bin
    );

    quizButtons.forEach((button) => {
      button.disabled = true;
    });

    const feedback = $("#quizFeedback");
    feedback.classList.remove("hidden");

    if (isCorrect) {
      quiz.score += CONFIG.correctPoints;
      quiz.correct += 1;
      selectedButton.classList.add("correct-bin");
      feedback.classList.add("correct");
      $("#quizFeedbackTitle").textContent =
        `ถูกต้อง! ${BINS[item.bin].name}`;
      playCorrectSound();
    } else {
      selectedButton.classList.add("wrong-bin");
      correctButton.classList.add("correct-bin");
      feedback.classList.add("wrong");
      $("#quizFeedbackTitle").textContent =
        `ยังไม่ถูก — คำตอบคือ ${BINS[item.bin].name}`;
      playWrongSound();
    }

    $("#quizExplanation").textContent = item.explanation;
    $("#quizScore").textContent = String(quiz.score);

    const nextButton = $("#quizNextButton");
    nextButton.textContent =
      quiz.index === quiz.items.length - 1 ? "ดูผลคะแนน" : "ข้อต่อไป";
    nextButton.classList.remove("hidden");
  }

  function nextQuizQuestion() {
    const quiz = state.quiz;

    if (quiz.index >= quiz.items.length - 1) {
      finishQuizGame();
      return;
    }

    quiz.index += 1;
    renderQuizQuestion();
  }

  function finishQuizGame() {
    const score = state.quiz.score;
    const correct = state.quiz.correct;
    state.quiz.accepting = false;

    const best = setBest("quiz", score);
    const message =
      score === 100
        ? "ตอบถูกครบทุกข้อ เยี่ยมมาก!"
        : score >= 70
          ? "เข้าใจการแยกขยะได้ดีมาก"
          : score >= 50
            ? "ทำได้ดี ลองอ่านเฉลยแล้วเล่นอีกครั้ง"
            : "ลองฝึกอีกครั้งเพื่อจำประเภทถังให้แม่นขึ้น";

    showResult({
      mode: "GAME 2 — ฝึกเลือกถัง",
      title: "จบเกมที่ 2",
      message,
      score,
      best,
      extraLabel: "ตอบถูก",
      extra: `${correct}/10`,
      emoji: score === 100 ? "🏆" : score >= 70 ? "🌟" : "📚",
      replay: startQuizGame
    });
  }

  /* ---------------- Result and sound ---------------- */

  function showResult(data) {
    state.activeGame = null;
    state.replayAction = data.replay;

    $("#resultMode").textContent = data.mode;
    $("#resultTitle").textContent = data.title;
    $("#resultMessage").textContent = data.message;
    $("#resultScore").textContent = String(data.score);
    $("#resultBest").textContent = String(data.best);
    $("#resultExtraLabel").textContent = data.extraLabel;
    $("#resultExtra").textContent = String(data.extra);
    $("#resultEmoji").textContent = data.emoji;

    updateBestScores();
    showScreen("result");
  }

  function playCorrectSound() {
    playTone(660, 0.11, "sine");
    window.setTimeout(() => playTone(880, 0.12, "sine"), 85);
  }

  function playWrongSound() {
    playTone(190, 0.2, "sawtooth");
  }

  function playMissSound() {
    playTone(145, 0.26, "square");
  }

  function playTone(frequency, duration, type) {
    if (state.muted) return;

    try {
      audioContext ||= new (
        window.AudioContext || window.webkitAudioContext
      )();

      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = type;
      oscillator.frequency.value = frequency;

      gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.12,
        audioContext.currentTime + 0.01
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime + duration
      );

      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration + 0.03);
    } catch {
      // เสียงเป็นฟังก์ชันเสริม เกมยังทำงานได้หากเบราว์เซอร์ปิดกั้นเสียง
    }
  }

  state.player = loadPlayer();
  setMuted(false);

  if (state.player) {
    updatePlayerUI();
    showScreen("menu");
  } else {
    showScreen("registration");
  }
})();
