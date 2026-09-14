"use strict";

const GAME_DATA = {
  comments: [
    "Any luck?",
    "Not that one.",
    "I was sure you'd find it quickly.",
    "There are quite a few of these, aren't there?",
    "Can you hurry up, please?",
    "Still looking?"
  ],
  crystalRange: [10, 99],
  potionRange: [1000, 9999],
  creatureNames: ["Babbage", "Hopper", "Lovelace", "Matsumoto", "Shannon", "Turing", "Vaughan", "Wozniak"],
  creatures: {
    Babbage: ["🦇", "#d1b0ff", "#563a78"],
    Hopper: ["🐇", "#d5f4bd", "#48764f"],
    Lovelace: ["🐈", "#f1b8dc", "#78436f"],
    Matsumoto: ["🦊", "#f4b180", "#833c2c"],
    Shannon: ["🦉", "#eedaa6", "#665538"],
    Turing: ["🐺", "#bdc9e8", "#435372"],
    Vaughan: ["🐲", "#c6edb0", "#3c6b4c"],
    Wozniak: ["🦁", "#f6d492", "#8b552f"]
  }
};

const app = document.querySelector("#app");
const overlay = document.querySelector("#reveal-overlay");
const revealKind = document.querySelector("#reveal-kind");
const revealId = document.querySelector("#reveal-id");
let overlayTimer;
let overlayAfterReveal;
let crystalRound;
let potionRound;
let creatureRound;
let previousCrystalTargetIndex = -1;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function uniqueNumbers(count, min, max) {
  const values = new Set();
  while (values.size < count) values.add(randomInt(min, max));
  return [...values];
}

function skewedNumbers(count, min, max) {
  const values = new Set();
  const skewTowardHigh = Math.random() < 0.5;
  const exponent = 1.7 + Math.random() * 1.6;

  while (values.size < count) {
    let position = Math.pow(Math.random(), exponent);
    if (skewTowardHigh) position = 1 - position;
    values.add(Math.round(min + position * (max - min)));
  }

  return [...values];
}

function shuffled(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = randomInt(0, index);
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

function showReveal(kind, id, afterReveal) {
  clearTimeout(overlayTimer);
  overlayAfterReveal = afterReveal;
  revealKind.textContent = kind;
  revealId.textContent = `#${id}`;
  overlay.hidden = false;
  overlay.focus({ preventScroll: true });
  overlayTimer = setTimeout(hideReveal, 1700);
}

function hideReveal() {
  if (overlay.hidden) return;
  clearTimeout(overlayTimer);
  overlay.hidden = true;
  const afterReveal = overlayAfterReveal;
  overlayAfterReveal = null;
  afterReveal?.();
}

overlay.addEventListener("click", hideReveal);
overlay.addEventListener("keydown", event => {
  if (["Enter", " ", "Escape"].includes(event.key)) {
    event.preventDefault();
    hideReveal();
  }
});

function headerMarkup(title, countLabel, count) {
  return `
    <div class="game-header">
      <a class="back-link" href="#shop">← Back to Shop</a>
      <h1 class="game-title">${title}</h1>
      <div class="counter" aria-live="polite">${countLabel}: <strong id="counter-value">${count}</strong></div>
    </div>`;
}

function resultMarkup(iconTitle, description, replayHash) {
  return `
    <section class="result-panel parchment" aria-live="polite">
      <h3>${iconTitle}</h3>
      <p>${description}</p>
      <p>👍 Give your instructor a thumbs up when you're finished.</p>
      <div class="result-actions">
        <button class="magic-button" id="play-again" type="button">Play Again</button>
        <a class="magic-button" href="#shop">Back to Shop</a>
      </div>
    </section>`;
}

function renderShop() {
  document.title = "The Magical Miscellany";
  app.innerHTML = `
    <section class="hero parchment">
      <p class="eyebrow">Welcome to</p>
      <h1>The Magical Miscellany</h1>
      <p class="tagline">Curious things for curious minds</p>
      <p class="cue">Play each challenge when your instructor gives the cue.</p>
    </section>
    <section class="challenge-grid" aria-label="Shop challenges">
      <article class="challenge-card parchment">
        <div class="card-icon" aria-hidden="true">🔮</div>
        <h2>Crystal Chaos</h2>
        <p>Find a hidden crystal in the cabinet of curiosities.</p>
        <a class="magic-button" href="#crystals">Enter</a>
      </article>
      <article class="challenge-card parchment">
        <div class="card-icon" aria-hidden="true">🧪</div>
        <h2>Potion Archives</h2>
        <p>Find the right potion among the shop's numbered bottles.</p>
        <a class="magic-button" href="#potions">Enter</a>
      </article>
      <article class="challenge-card parchment">
        <div class="card-icon" aria-hidden="true">🐉</div>
        <h2>Creature Registry</h2>
        <p>Arrange eight magical creatures from A to Z.</p>
        <a class="magic-button" href="#creatures">Enter</a>
      </article>
    </section>`;
}

function newCrystalRound() {
  const [min, max] = GAME_DATA.crystalRange;
  const ids = shuffled(uniqueNumbers(18, min, max));
  let targetIndex = randomInt(0, ids.length - 1);
  while (targetIndex === previousCrystalTargetIndex) targetIndex = randomInt(0, ids.length - 1);
  previousCrystalTargetIndex = targetIndex;
  crystalRound = { ids, target: ids[targetIndex], targetIndex, checks: 0, busy: false, complete: false };
  renderCrystals();
}

function renderCrystals() {
  document.title = "Crystal Chaos · The Magical Miscellany";
  app.innerHTML = `${headerMarkup("🔮 Crystal Chaos", "Checks", crystalRound.checks)}
    <div class="customer-row">
      <div id="customer" class="customer" aria-hidden="true">🧙🏽</div>
      <p id="customer-speech" class="speech parchment">Could you find Crystal #${crystalRound.target} for me?<span class="target-line">Requested: Crystal #${crystalRound.target}</span></p>
    </div>
    <section class="cabinet" aria-label="Cabinet with 18 closed crystal drawers">
      <div class="drawer-grid">
        ${crystalRound.ids.map((id, index) => `<button class="drawer" type="button" data-id="${id}" aria-label="Open drawer ${index + 1}"></button>`).join("")}
      </div>
    </section>
    <div id="result"></div>`;
  document.querySelector(".drawer-grid").addEventListener("click", inspectCrystal);
}

function inspectCrystal(event) {
  const drawer = event.target.closest(".drawer");
  if (!drawer || crystalRound.busy || crystalRound.complete) return;
  crystalRound.busy = true;
  crystalRound.checks += 1;
  document.querySelector("#counter-value").textContent = crystalRound.checks;
  drawer.classList.add("open");
  const id = Number(drawer.dataset.id);
  const found = id === crystalRound.target;
  showReveal("CRYSTAL", id, () => {
    if (found) {
      crystalRound.complete = true;
      document.querySelector("#customer").classList.add("happy");
      document.querySelector("#customer-speech").innerHTML = `Thanks!<span class="target-line">Crystal #${crystalRound.target}</span>`;
      document.querySelectorAll(".drawer").forEach(button => { button.disabled = true; });
      document.querySelector("#result").innerHTML = resultMarkup("✨ Found it!", `You found Crystal #${id} in ${crystalRound.checks} ${crystalRound.checks === 1 ? "check" : "checks"}.`, "crystals");
      document.querySelector("#play-again").addEventListener("click", newCrystalRound);
      document.querySelector(".result-panel").scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      drawer.classList.remove("open");
      document.querySelector("#customer-speech").innerHTML = `${GAME_DATA.comments[randomInt(0, GAME_DATA.comments.length - 1)]}<span class="target-line">Requested: Crystal #${crystalRound.target}</span>`;
      crystalRound.busy = false;
      drawer.focus();
    }
  });
}

function newPotionRound() {
  const [catalogMin, catalogMax] = GAME_DATA.potionRange;
  const rangeWidth = randomInt(2400, 6000);
  const rangeMin = randomInt(catalogMin, catalogMax - rangeWidth);
  const rangeMax = rangeMin + rangeWidth;
  const ids = skewedNumbers(18, rangeMin, rangeMax).sort((a, b) => a - b);
  potionRound = { ids, target: ids[randomInt(0, ids.length - 1)], checks: 0, busy: false, complete: false, inspected: new Set() };
  renderPotions();
}

function renderPotions() {
  document.title = "Potion Archives · The Magical Miscellany";
  app.innerHTML = `${headerMarkup("🧪 Potion Archives", "Checks", potionRound.checks)}
    <div class="customer-row">
      <div id="customer" class="customer" aria-hidden="true">🧝🏾</div>
      <p id="customer-speech" class="speech parchment">I'm looking for Potion #${potionRound.target}.<span class="target-line">Requested: Potion #${potionRound.target}</span></p>
    </div>
    <section class="archive-frame" aria-label="18 potion bottles arranged from the lowest catalog number to the highest">
      <div class="archive-labels"><span>← Lowest catalog number</span><span>Highest catalog number →</span></div>
      <div class="potion-row">
        ${potionRound.ids.map((id, index) => {
          const hues = ["#35c8e0", "#7dcc69", "#d25bb9", "#ee9d38", "#756bea", "#e55561"];
          const color = hues[index % hues.length];
          return `<button class="potion" type="button" data-id="${id}" style="--liquid:${color};--glow:${color}" aria-label="Inspect potion bottle ${index + 1}"><span class="bottle-neck"></span><span class="bottle-body"><span class="potion-id">${id}</span></span></button>`;
        }).join("")}
      </div>
    </section>
    <div id="result"></div>`;
  document.querySelector(".potion-row").addEventListener("click", inspectPotion);
}

function inspectPotion(event) {
  const bottle = event.target.closest(".potion");
  if (!bottle || potionRound.busy || potionRound.complete) return;
  potionRound.busy = true;
  potionRound.checks += 1;
  const id = Number(bottle.dataset.id);
  potionRound.inspected.add(id);
  bottle.classList.add("inspected");
  bottle.setAttribute("aria-label", `Potion #${id}`);
  document.querySelector("#counter-value").textContent = potionRound.checks;
  const found = id === potionRound.target;
  showReveal("POTION", id, () => {
    if (found) {
      potionRound.complete = true;
      document.querySelector("#customer").classList.add("happy");
      document.querySelector("#customer-speech").innerHTML = `Thanks!<span class="target-line">Potion #${potionRound.target}</span>`;
      document.querySelectorAll(".potion").forEach(button => { button.disabled = true; });
      document.querySelector("#result").innerHTML = resultMarkup("🧪 That's the one!", `You found Potion #${id} in ${potionRound.checks} ${potionRound.checks === 1 ? "check" : "checks"}.`, "potions");
      document.querySelector("#play-again").addEventListener("click", newPotionRound);
      document.querySelector(".result-panel").scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      document.querySelector("#customer-speech").innerHTML = `${GAME_DATA.comments[randomInt(0, GAME_DATA.comments.length - 1)]}<span class="target-line">Requested: Potion #${potionRound.target}</span>`;
      potionRound.busy = false;
      bottle.focus();
    }
  });
}

function newCreatureRound() {
  let names = shuffled(GAME_DATA.creatureNames);
  while (names.every((name, index) => name === GAME_DATA.creatureNames[index])) names = shuffled(names);
  creatureRound = { names, moves: 0, complete: false, drag: null };
  renderCreatures();
}

function renderCreatures() {
  document.title = "Creature Registry · The Magical Miscellany";
  app.innerHTML = `${headerMarkup("🐉 Creature Registry", "Moves", creatureRound.moves)}
    <section class="registry-instruction parchment">
      Arrange the creatures in alphabetical order.
      <strong>A → Z</strong>
    </section>
    <div class="creature-scroller">
      <div class="creature-row" aria-label="Reorderable creature cards">
        ${creatureRound.names.map(creatureMarkup).join("")}
      </div>
    </div>
    <p class="drag-hint">Drag a card into place. Keyboard users can use the arrow keys.</p>
    <div id="result"></div>`;
  const row = document.querySelector(".creature-row");
  row.addEventListener("pointerdown", creaturePointerDown);
  row.addEventListener("pointermove", creaturePointerMove);
  row.addEventListener("pointerup", creaturePointerUp);
  row.addEventListener("pointercancel", creaturePointerUp);
  row.addEventListener("keydown", creatureKeyDown);
}

function creatureMarkup(name) {
  const [emoji, light, dark] = GAME_DATA.creatures[name];
  return `<button class="creature-card" type="button" data-name="${name}" style="--creature-light:${light};--creature-dark:${dark}" aria-label="${name}. Drag to move, or use arrow keys."><span class="creature-art" aria-hidden="true">${emoji}</span><span class="creature-name">${name}</span></button>`;
}

function creaturePointerDown(event) {
  const card = event.target.closest(".creature-card");
  if (!card || creatureRound.complete) return;
  creatureRound.drag = { card, startX: event.clientX, startY: event.clientY, moved: false };
  card.setPointerCapture(event.pointerId);
}

function creaturePointerMove(event) {
  const drag = creatureRound.drag;
  if (!drag) return;
  if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 10) {
    drag.moved = true;
    drag.card.classList.add("dragging");
    drag.card.style.transform = `translate3d(${event.clientX - drag.startX}px, ${event.clientY - drag.startY}px, 0) scale(1.03)`;
    drag.card.style.zIndex = "10";
  }
}

function creaturePointerUp(event) {
  const drag = creatureRound.drag;
  if (!drag) return;
  drag.card.classList.remove("dragging");
  drag.card.style.transform = "";
  drag.card.style.zIndex = "";
  if (drag.moved) {
    event.preventDefault();
    drag.card.style.pointerEvents = "none";
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".creature-card");
    drag.card.style.pointerEvents = "";
    if (target && target !== drag.card) moveCreature(drag.card.dataset.name, target.dataset.name);
  }
  creatureRound.drag = null;
}

function creatureKeyDown(event) {
  const card = event.target.closest(".creature-card");
  if (!card || !["ArrowLeft", "ArrowRight"].includes(event.key) || creatureRound.complete) return;
  event.preventDefault();
  const from = creatureRound.names.indexOf(card.dataset.name);
  const to = event.key === "ArrowLeft" ? from - 1 : from + 1;
  if (to < 0 || to >= creatureRound.names.length) return;
  const targetName = creatureRound.names[to];
  moveCreature(card.dataset.name, targetName, event.key === "ArrowRight");
  document.querySelector(`[data-name="${card.dataset.name}"]`)?.focus();
}

function moveCreature(movingName, targetName, placeAfter = false) {
  const from = creatureRound.names.indexOf(movingName);
  let to = creatureRound.names.indexOf(targetName);
  if (from === -1 || to === -1 || from === to) return;
  const [moving] = creatureRound.names.splice(from, 1);
  to = creatureRound.names.indexOf(targetName) + (placeAfter ? 1 : 0);
  creatureRound.names.splice(to, 0, moving);
  creatureRound.moves += 1;
  const complete = creatureRound.names.every((name, index) => name === GAME_DATA.creatureNames[index]);
  creatureRound.complete = complete;
  renderCreatures();
  if (complete) {
    const result = document.querySelector("#result");
    result.innerHTML = resultMarkup("🐉 Registry organized!", `You alphabetized all 8 creatures in ${creatureRound.moves} ${creatureRound.moves === 1 ? "move" : "moves"}.`, "creatures");
    document.querySelectorAll(".creature-card").forEach(button => { button.disabled = true; });
    document.querySelector("#play-again").addEventListener("click", newCreatureRound);
    result.querySelector(".result-panel").scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function route() {
  clearTimeout(overlayTimer);
  overlayAfterReveal = null;
  overlay.hidden = true;
  const page = location.hash.replace("#", "") || "shop";
  if (page === "crystals") newCrystalRound();
  else if (page === "potions") newPotionRound();
  else if (page === "creatures") newCreatureRound();
  else renderShop();
  window.scrollTo(0, 0);
  app.focus({ preventScroll: true });
}

window.addEventListener("hashchange", route);
route();
