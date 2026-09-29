const PASSWORD = "0930";
const quotes = {
  kitty: "> Kitty.app\n蝴蝶结已挂载。可爱可以很认真，认真也可以很可爱。",
  tay: "> tay.img\n表情包进程在线。工作以后也请保留鼓着腮帮子的松弛。",
  miffy: "> miffy.cake\n蜡烛不多，心意刚好。吹灭前先闻一口内蒙风里的青青草香。",
  bear: "> rilakkuma.daemon\n二十六岁，不用一直紧绷。布丁和樱桃，加上一点下班后的空闲，日子就已经够甜。",
};

const meats = ["🥩 烤肉", "🍖 羊腿", "🥓 五花", "🍗 鸡翅"];
const vegs = ["🥦 西兰花", "🥬 生菜", "🥒 黄瓜", "🥕 胡萝卜"];

const appTitles = {
  about: "关于本机",
  photos: "相册",
  profile: "系统信息",
  canteen: "食堂.exe",
  mail: "邮件",
  scratch: "运势.dat",
  wish: "许愿",
};

const gate = document.getElementById("gate");
const stage = document.getElementById("stage");
const pinBoxes = [...document.querySelectorAll("#pinBoxes i")];
const gateHint = document.getElementById("gateHint");
const keypad = document.getElementById("keypad");
const pinInput = document.getElementById("pinInput");
const quoteBoard = document.getElementById("quoteBoard");
const plate = document.getElementById("plate");
const meatScoreEl = document.getElementById("meatScore");
const gameMsg = document.getElementById("gameMsg");
const envelope = document.getElementById("envelope");
const mailClosed = document.getElementById("mailClosed");
const mailOpen = document.getElementById("mailOpen");
const cake = document.getElementById("cake");
const candlesEl = document.getElementById("candles");
const lightBtn = document.getElementById("lightBtn");
const blowBtn = document.getElementById("blowBtn");
const wish = document.getElementById("wish");
const soundBtn = document.getElementById("soundBtn");
const toast = document.getElementById("toast");
const activeApp = document.getElementById("activeApp");

let pin = "";
let meatScore = 0;
let audioCtx = null;
let musicOn = false;
let musicTimer = null;
let zCounter = 40;
let mailOpened = false;

function pad(n) {
  return String(n).padStart(2, "0");
}
function tickClock() {
  const now = new Date();
  const hm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const dateStr = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
  const lockHm = document.getElementById("lockHm");
  const lockDate = document.getElementById("lockDate");
  const deskClock = document.getElementById("deskClock");
  if (lockHm) lockHm.textContent = hm;
  if (lockDate) lockDate.textContent = dateStr;
  if (deskClock) deskClock.textContent = hm;
}
tickClock();
setInterval(tickClock, 1000);

function renderPin() {
  pinBoxes.forEach((box, i) => box.classList.toggle("filled", i < pin.length));
}

function tryUnlock() {
  if (pin === PASSWORD) {
    unlock();
    return;
  }
  gate.classList.add("shake");
  gateHint.textContent = "口令不对哦 · 想想生日";
  pin = "";
  renderPin();
  setTimeout(() => gate.classList.remove("shake"), 400);
}

function unlock() {
  gate.style.transition = "opacity .5s ease";
  gate.style.opacity = "0";
  setTimeout(() => {
    gate.hidden = true;
    stage.hidden = false;
    showToast("ryyOS 26.0 启动成功 ♡");
    burstConfetti();
  }, 480);
}

window.addEventListener("keydown", (e) => {
  if (!gate.hidden) {
    if (e.key >= "0" && e.key <= "9" && pin.length < 4) {
      pin += e.key;
      renderPin();
      if (pin.length === 4) tryUnlock();
    } else if (e.key === "Backspace") {
      pin = pin.slice(0, -1);
      renderPin();
    } else if (e.key === "Enter") {
      tryUnlock();
    }
    return;
  }
  if (e.key === "Escape") {
    const active = document.querySelector(".window.active:not([hidden])");
    if (active) closeWindow(active.dataset.win);
  }
});

keypad.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const key = btn.dataset.key;
  if (key === "del") pin = pin.slice(0, -1);
  else if (key === "ok") {
    tryUnlock();
    return;
  } else if (pin.length < 4) pin += key;
  renderPin();
  if (pin.length === 4) tryUnlock();
});

pinInput.addEventListener("input", () => {
  pin = pinInput.value.replace(/\D/g, "").slice(0, 4);
  renderPin();
  if (pin.length === 4) tryUnlock();
});

function getWin(id) {
  return document.getElementById(`win-${id}`);
}

function focusWindow(id) {
  document.querySelectorAll(".window").forEach((w) => w.classList.remove("active"));
  const win = getWin(id);
  if (!win || win.hidden) return;
  zCounter += 1;
  win.style.zIndex = String(zCounter);
  win.classList.add("active");
  activeApp.textContent = appTitles[id] || "Finder";
}

function openWindow(id) {
  const win = getWin(id);
  if (!win) return;
  win.hidden = false;
  win.classList.remove("maximized");
  focusWindow(id);
  if (id === "scratch") requestAnimationFrame(sizeScratch);
  if (id === "canteen" && !plate.children.length) scatterFood();
}

function closeWindow(id) {
  const win = getWin(id);
  if (!win) return;
  win.hidden = true;
  win.classList.remove("active", "maximized");
  const next = [...document.querySelectorAll(".window:not([hidden])")].pop();
  if (next) focusWindow(next.dataset.win);
  else activeApp.textContent = "Finder";
}

function toggleMax(id) {
  const win = getWin(id);
  if (!win) return;
  win.classList.toggle("maximized");
  focusWindow(id);
  if (id === "scratch") requestAnimationFrame(sizeScratch);
}

document.querySelectorAll("[data-open]").forEach((el) => {
  el.addEventListener("click", () => openWindow(el.dataset.open));
});

document.querySelectorAll(".window").forEach((win) => {
  win.addEventListener("mousedown", () => focusWindow(win.dataset.win));
  win.addEventListener("touchstart", () => focusWindow(win.dataset.win), { passive: true });

  const closeBtn = win.querySelector("[data-close]");
  const minBtn = win.querySelector("[data-min]");
  const maxBtn = win.querySelector("[data-max]");
  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeWindow(win.dataset.win);
    });
  }
  if (minBtn) {
    minBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeWindow(win.dataset.win);
    });
  }
  if (maxBtn) {
    maxBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMax(win.dataset.win);
    });
  }
});

document.querySelectorAll("[data-drag]").forEach((bar) => {
  const win = bar.closest(".window");
  let dragging = false;
  let ox = 0;
  let oy = 0;

  bar.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".t")) return;
    if (win.classList.contains("maximized")) return;
    if (window.matchMedia("(max-width: 720px)").matches) return;
    bar.setPointerCapture(e.pointerId);
    dragging = true;
    const rect = win.getBoundingClientRect();
    ox = e.clientX - rect.left;
    oy = e.clientY - rect.top;
    focusWindow(win.dataset.win);
  });
  bar.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const x = Math.max(0, Math.min(window.innerWidth - 80, e.clientX - ox));
    const y = Math.max(32, Math.min(window.innerHeight - 60, e.clientY - oy));
    win.style.left = `${x}px`;
    win.style.top = `${y}px`;
  });
  bar.addEventListener("pointerup", () => {
    dragging = false;
  });
});

document.getElementById("logoBtn").addEventListener("click", () => openWindow("about"));

document.querySelectorAll(".photo-tile").forEach((tile) => {
  tile.addEventListener("click", () => {
    quoteBoard.textContent = quotes[tile.dataset.quote];
  });
});

function scatterFood() {
  plate.innerHTML = "";
  meatScore = 0;
  meatScoreEl.textContent = "0";
  gameMsg.textContent = "ready";
  const items = [
    ...meats.map((label) => ({ label, kind: "meat" })),
    ...vegs.map((label) => ({ label, kind: "veg" })),
  ].sort(() => Math.random() - 0.5);

  items.forEach((item, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `food ${item.kind}`;
    btn.textContent = item.label;
    const left = 8 + (i % 4) * 23 + Math.random() * 4;
    const top = 12 + Math.floor(i / 4) * 38 + Math.random() * 6;
    btn.style.left = `${left}%`;
    btn.style.top = `${top}%`;
    btn.addEventListener("click", () => onFood(btn, item.kind));
    plate.appendChild(btn);
  });
}

function onFood(btn, kind) {
  if (btn.classList.contains("eaten") || btn.classList.contains("flee")) return;
  if (kind === "veg") {
    btn.classList.add("flee");
    gameMsg.textContent = "蔬菜溜走啦~";
    return;
  }
  btn.classList.add("eaten");
  meatScore += 1;
  meatScoreEl.textContent = String(meatScore);
  gameMsg.textContent = meatScore >= 4 ? "全是肉！满分♡" : "收下啦♡";
}

document.getElementById("resetGame").addEventListener("click", scatterFood);

envelope.addEventListener("click", () => {
  mailOpened = !mailOpened;
  mailClosed.hidden = mailOpened;
  mailOpen.hidden = !mailOpened;
});

for (let i = 0; i < 5; i += 1) {
  const c = document.createElement("div");
  c.className = "candle";
  c.innerHTML = '<span class="flame"></span>';
  candlesEl.appendChild(c);
}

lightBtn.addEventListener("click", () => {
  cake.classList.add("lit");
  cake.classList.remove("blown");
  blowBtn.disabled = false;
  wish.textContent = "许个愿吧 ♡";
});

blowBtn.addEventListener("click", () => {
  cake.classList.remove("lit");
  cake.classList.add("blown");
  blowBtn.disabled = true;
  wish.textContent = "二十六岁快乐 ❀";
  burstConfetti();
});

function showToast(text) {
  toast.hidden = false;
  toast.textContent = text;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}

const scratch = document.getElementById("scratch");
const sctx = scratch.getContext("2d");
function sizeScratch() {
  const rect = scratch.getBoundingClientRect();
  if (rect.width < 10) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  scratch.width = Math.floor(rect.width * dpr);
  scratch.height = Math.floor(rect.height * dpr);
  sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const g = sctx.createLinearGradient(0, 0, rect.width, rect.height);
  g.addColorStop(0, "#f5a0b8");
  g.addColorStop(1, "#e888a8");
  sctx.fillStyle = g;
  sctx.fillRect(0, 0, rect.width, rect.height);
  sctx.fillStyle = "rgba(255,255,255,.55)";
  sctx.font = "14px 'IBM Plex Mono', monospace";
  sctx.textAlign = "center";
  sctx.fillText("刮开看看 ♡", rect.width / 2, rect.height / 2);
}
let scratching = false;
function scratchAt(x, y) {
  const rect = scratch.getBoundingClientRect();
  sctx.globalCompositeOperation = "destination-out";
  sctx.beginPath();
  sctx.arc(x - rect.left, y - rect.top, 26, 0, Math.PI * 2);
  sctx.fill();
}
scratch.addEventListener("pointerdown", (e) => {
  scratching = true;
  scratch.setPointerCapture(e.pointerId);
  scratchAt(e.clientX, e.clientY);
});
scratch.addEventListener("pointermove", (e) => {
  if (scratching) scratchAt(e.clientX, e.clientY);
});
window.addEventListener("pointerup", () => {
  scratching = false;
});

const canvas = document.getElementById("petals");
const pctx = canvas.getContext("2d");
let particles = [];
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
function burstConfetti() {
  const colors = ["#f47aa0", "#ff9eb8", "#d4a5e8", "#ffc0d4", "#fff0f5"];
  for (let i = 0; i < 70; i += 1) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height * 0.35,
      vx: (Math.random() - 0.5) * 11,
      vy: Math.random() * -7 - 2,
      g: 0.15 + Math.random() * 0.08,
      s: 3 + Math.random() * 5,
      c: colors[i % colors.length],
      a: 1,
      r: Math.random() * Math.PI,
    });
  }
}
function tickParticles() {
  pctx.clearRect(0, 0, canvas.width, canvas.height);
  particles = particles.filter((p) => p.a > 0 && p.y < canvas.height + 20);
  particles.forEach((p) => {
    p.vy += p.g;
    p.x += p.vx;
    p.y += p.vy;
    p.r += 0.05;
    p.a -= 0.01;
    pctx.save();
    pctx.translate(p.x, p.y);
    pctx.rotate(p.r);
    pctx.globalAlpha = Math.max(0, p.a);
    pctx.fillStyle = p.c;
    pctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
    pctx.restore();
  });
  requestAnimationFrame(tickParticles);
}

function startMusic() {
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  const notes = [523.25, 659.25, 783.99, 659.25, 587.33, 523.25];
  let i = 0;
  const play = () => {
    if (!musicOn) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "triangle";
    o.frequency.value = notes[i % notes.length];
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.03, audioCtx.currentTime + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
    o.connect(g).connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + 0.52);
    i += 1;
    musicTimer = setTimeout(play, 500);
  };
  play();
}

soundBtn.addEventListener("click", async () => {
  musicOn = !musicOn;
  soundBtn.classList.toggle("on", musicOn);
  if (musicOn) {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") await audioCtx.resume();
    startMusic();
  } else if (musicTimer) {
    clearTimeout(musicTimer);
  }
});

window.addEventListener("resize", () => {
  resizeCanvas();
  const scratchWin = getWin("scratch");
  if (scratchWin && !scratchWin.hidden) sizeScratch();
});

resizeCanvas();
tickParticles();
