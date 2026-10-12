// Global variables
let database = {};
let questions = [];
let activeBatch = [];
let finishedQuestions = [];
let remainingQuestions = [];
let history = [];
let current = null;
let totalQuestions = 0;
let wrongMode = false;
let swapped = false;
const batchSize = 15;
let repeatSameQuestion = false;
let activeLevel = null;
let directionStates = {
  false: null,
  true: null,
};
// Load vocabulary data
fetch("words.json")
  .then((response) => response.json())
  .then((data) => {
    database = data;
  });

// Helper functions
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/ą/g, "a")
    .replace(/ć/g, "c")
    .replace(/ę/g, "e")
    .replace(/ł/g, "l")
    .replace(/ń/g, "n")
    .replace(/ó/g, "o")
    .replace(/ś/g, "s")
    .replace(/ź/g, "z")
    .replace(/ż/g, "z");
}

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}
// Menu and quiz setup
function goMenu() {
  document.getElementById("quiz").style.display = "none";
  document.getElementById("menu").style.display = "flex";
  document.getElementById("mixMenu").style.display = "none";

  questions = [];
  activeBatch = [];
  finishedQuestions = [];
  remainingQuestions = [];
  history = [];
  current = null;

  directionStates = {
    false: null,
    true: null,
  };
  swapped = false;
  activeLevel = null;
}

function startSingle(level) {
  activeLevel = level;
  swapped = false;

  directionStates = {
    false: null,
    true: null,
  };

  questions = JSON.parse(JSON.stringify(database[level]));

  document.getElementById("quizTitle").src = "assets/" + level + ".png";

  initQuiz();
  saveDirectionState();
}

function initQuiz() {
  finishedQuestions = [];
  history = [];
  remainingQuestions = shuffle([...questions]);
  activeBatch = remainingQuestions.splice(0, batchSize);

  activeBatch.forEach((q) => {
    q.hadWrong = false;
    q.id = q.id || Math.random();
  });

  totalQuestions = questions.length;

  document.getElementById("menu").style.display = "none";
  document.getElementById("quiz").style.display = "block";

  nextQuestion();
}

// Quiz state and question flow
function saveDirectionState() {
  if (!activeLevel) return;

  directionStates[swapped] = {
    questions,
    activeBatch,
    finishedQuestions,
    remainingQuestions,
    history,
    current,
    totalQuestions,
    wrongMode,
    repeatSameQuestion,
  };
}

function restoreDirectionState(state) {
  questions = state.questions;
  activeBatch = state.activeBatch;
  finishedQuestions = state.finishedQuestions;
  remainingQuestions = state.remainingQuestions;
  history = state.history;
  current = state.current;
  totalQuestions = state.totalQuestions;
  wrongMode = state.wrongMode;
  repeatSameQuestion = state.repeatSameQuestion;

  document.getElementById("quizTitle").src = "assets/" + activeLevel + ".png";

  document.getElementById("answer").value = "";
  document.getElementById("result").innerText = "";

  if (activeBatch.length === 0) {
    showFinished();
  } else {
    document.getElementById("question").innerText = swapped
      ? current.a
      : current.q;

    wrongMode = false;
    updateProgress();
  }
}

function nextQuestion() {
  if (activeBatch.length === 0) {
    showFinished();
    return;
  }

  if (!repeatSameQuestion) {
    let available = activeBatch.filter((q) => !history.includes(q));
    if (available.length === 0) available = activeBatch;
    current = available[Math.floor(Math.random() * available.length)];

    history.push(current);
    if (history.length > 6) history.shift();
  }

  repeatSameQuestion = false;

  document.getElementById("question").innerText = swapped
    ? current.a
    : current.q;
  document.getElementById("answer").value = "";
  document.getElementById("result").innerText = "";
  wrongMode = false;
  updateProgress();
  document.querySelectorAll(".flower").forEach((f) => {
    f.classList.remove("flower-tap");
  });
}
// Answer handling
document.getElementById("answer").addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    if (wrongMode) {
      wrongMode = false;
      document.getElementById("result").innerText = "";
      document.getElementById("answer").value = "";
      return;
    }

    checkAnswer();
  }
});

function checkAnswer() {
  let user = normalize(document.getElementById("answer").value);
  let correctRaw = swapped ? current.q : current.a;
  let correct = normalize(correctRaw);

  if (isCorrect(user, correct)) {
    if (!current.hadWrong) {
      animateBox("final");

      setTimeout(() => {
        removeFromBatch(current);
        nextQuestion();
      }, 200);

      return;
    }

    current.correctCount = (current.correctCount || 0) + 1;

    animateBox("soft");

    setTimeout(() => {
      if (current.correctCount >= 3) {
        animateBox("final");
        removeFromBatch(current);
        current.correctCount = 0;
        current.hadWrong = false;
      }

      nextQuestion();
    }, 200);
  } else {
    current.hadWrong = true;
    current.correctCount = 0;

    animateBox("wrong");
    document.getElementById("result").innerText = "Wrong: " + correctRaw;

    wrongMode = true;
  }
}
function isCorrect(user, correct) {
  return user === correct;
}
// Progress and completion
function removeFromBatch(q) {
  activeBatch = activeBatch.filter((x) => x.id !== q.id);
  finishedQuestions.push(q);

  if (remainingQuestions.length > 0) {
    let nextQ = remainingQuestions.shift();
    nextQ.id = nextQ.id || Math.random();
    activeBatch.push(nextQ);
  }
}

function showFinished() {
  document.getElementById("question").innerText = "Finished!";
  document.getElementById("progress").style.width = "100%";
}

function updateProgress() {
  let done = finishedQuestions.length;
  let percent = (done / totalQuestions) * 100;

  document.getElementById("progress").style.width = percent + "%";
  document.getElementById("bison").style.left = percent + "%";
}

// Direction switching and restart
function swapQA() {
  saveDirectionState();

  swapped = !swapped;

  if (directionStates[swapped]) {
    restoreDirectionState(directionStates[swapped]);
  } else {
    questions = JSON.parse(JSON.stringify(database[activeLevel]));

    initQuiz();
    saveDirectionState();
  }
}
function restartSection() {
  questions = JSON.parse(JSON.stringify(database[activeLevel]));

  initQuiz();
  saveDirectionState();

  document.querySelectorAll(".flower").forEach((f) => {
    f.classList.remove("flower-tap");
  });
}
// Animations and visual effects
function animateBox(type) {
  const box = document.getElementById("box");

  box.classList.remove(
    "box-wrong",
    "box-correct",
    "box-correct-soft",
    "box-correct-final",
  );

  void box.offsetWidth;

  if (type === "wrong") {
    box.classList.add("box-wrong");
  } else if (type === "soft") {
    box.classList.add("box-correct-soft");
  } else if (type === "final") {
    box.classList.add("box-correct-final");
  }
}

document.querySelectorAll(".flower").forEach((flower) => {
  flower.addEventListener("click", () => {
    flower.classList.add("flower-tap");

    setTimeout(() => {
      flower.classList.remove("flower-tap");
    }, 250);
  });
});
