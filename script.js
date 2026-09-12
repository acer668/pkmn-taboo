const API = "https://pokeapi.co/api/v2";
const genRanges = {
  1:[1,151], 2:[152,251], 3:[252,386], 4:[387,493], 5:[494,649],
  6:[650,721], 7:[722,809], 8:[810,905], 9:[906,1025]
};

let cache = null;
let currentPool = [];
let lastId = null;
let timer = null;
let timeLeft = 180;
let active = false;
let penalty = 0;

const timerEl = document.getElementById("timer");
const generationMenu = document.getElementById("generationMenu");
const generationButton = document.getElementById("generationButton");
const generationOptions = document.getElementById("generationOptions");
const generationChecks = [...generationOptions.querySelectorAll('input[type="checkbox"]')];
const selectAllGenerations = document.getElementById("selectAllGenerations");
const clearGenerations = document.getElementById("clearGenerations");
const difficulty = document.getElementById("difficulty");
const randomizeBtn = document.getElementById("randomize");
const pokemon = document.getElementById("pokemon");
const taboo = document.getElementById("taboo");
const card = document.getElementById("card");
const loading = document.getElementById("loading");
const red = document.getElementById("red");
const blue = document.getElementById("blue");
const gameOver = document.getElementById("gameOver");
const penaltyResult = document.getElementById("penaltyResult");
const penaltyEl = document.getElementById("penalty");
const rulesBtn = document.getElementById("rulesBtn");
const rulesModal = document.getElementById("rulesModal");
const closeRules = document.getElementById("closeRules");

const overrides = {
  pikachu:{easy:["yellow","electric","mouse","thunder"],medium:["yellow","electric","Ash","Thunderbolt","Volt","Pichu"],hard:["mascot","cheeks","rodent","Lightning","Kanto","Raichu"]},
  charizard:{easy:["fire","dragon","flying","flame"],medium:["Charmeleon","wings","blaze","ember","tail","orange"],hard:["blast","Drake","lizard","inferno","X","Y"]},
  mewtwo:{easy:["psychic","clone","legendary","Mew"],medium:["lab","genetic","armor","telepathy","clone","cat"],hard:["experiment","DNA","scientist","telekinesis","amnesia","mutation"]},
  mew:{easy:["psychic","cute","pink","legendary"],medium:["Mewtwo","transform","mythical","DNA","tail","New"],hard:["ancestor","genetic","Ditto","telepathy","origin","clone"]},
  squirtle:{easy:["water","turtle","blue","shell"],medium:["Wartortle","Blastoise","Bubble","starter","cannon","rain"],hard:["withdraw","shelter","aqua","torrent","reptile","Shell"]},
  bulbasaur:{easy:["grass","poison","frog","starter"],medium:["Ivy","Venusaur","seed","vine","plant","squirtle"],hard:["overgrow","chlorophyll","leech","flower","toad","herb"]},
  gengar:{easy:["ghost","poison","purple","haunt"],medium:["Gastly","Haunter","shadow","night","spooky","Mega"],hard:["hypnosis","curse","shadow","Kanto","mischief","substitute"]},
  eevee:{easy:["evolve","brown","fox","normal"],medium:["Vaporeon","Jolteon","Flareon","evolution","tail","stone"],hard:["adaptability","Sylveon","Umbreon","Espeon","glaceon","friendship"]}
};

function norm(s){
  return s.toLowerCase().replace(/[^a-z0-9]/g,"");
}

function titleCase(s){
  return s.split(" ").map(x => x ? x[0].toUpperCase()+x.slice(1) : x).join(" ");
}

function selectedGenerations(){
  return generationChecks.filter(c => c.checked).map(c => Number(c.value));
}

function updateGenerationButton(){
  const chosen = selectedGenerations();
  if(chosen.length === 0) generationButton.textContent = "No Generations ▾";
  else if(chosen.length === 9) generationButton.textContent = "All Generations ▾";
  else if(chosen.length <= 2) generationButton.textContent = chosen.map(g => `Gen ${g}`).join(", ") + " ▾";
  else generationButton.textContent = `${chosen.length} Generations ▾`;
}

async function getData(){
  if(cache) return cache;
  loading.style.display = "block";
  try{
    const r = await fetch(`${API}/pokemon?limit=1025&offset=0`);
    if(!r.ok) throw new Error("Failed to load Pokémon list.");
    const list = (await r.json()).results;
    cache = list.map((x,i) => ({id:i+1,name:x.name}));
    loading.style.display = "none";
    return cache;
  }catch(err){
    loading.textContent = "Could not load Pokémon data. Check your internet connection.";
    loading.style.display = "block";
    throw err;
  }
}

function genericWords(p, details, species, diff){
  const types = details.types.map(x => x.type.name);
  const abilities = details.abilities.map(x => x.ability.name.replaceAll("-"," "));
  const moves = details.moves.slice(0,20).map(x => x.move.name.replaceAll("-"," "));
  const genus = (species.genera || []).find(x => x.language.name === "en")?.genus?.replace(" Pokémon","") || "";
  const candidates = [...types, ...abilities, ...moves, genus];
  const clean = [];
  for(const w of candidates){
    const z = w.toLowerCase();
    if(!z || z === p.name || z.includes(p.name) || z === "generation" || z === "region") continue;
    if(!clean.includes(w)) clean.push(w);
  }
  return clean.slice(0, diff === "easy" ? 4 : 6);
}

async function cardFor(p, diff){
  const [a,b] = await Promise.all([
    fetch(`${API}/pokemon/${p.id}`).then(r => r.json()),
    fetch(`${API}/pokemon-species/${p.id}`).then(r => r.json())
  ]);
  const words = overrides[norm(p.name)]?.[diff] || genericWords(p,a,b,diff);
  return {name:p.name.replace(/-/g," "), words};
}

async function randomize(){
  const generations = selectedGenerations();
  if(generations.length === 0){
    card.style.display = "none";
    return;
  }

  if(!currentPool.length){
    const all = await getData();
    const ranges = generations.map(g => genRanges[g]);
    currentPool = all.filter(p => ranges.some(([lo,hi]) => p.id >= lo && p.id <= hi));
  }

  if(!currentPool.length) return;

  let p = currentPool[Math.floor(Math.random()*currentPool.length)];
  if(currentPool.length > 1 && p.id === lastId){
    let tries = 0;
    while(p.id === lastId && tries < 10){
      p = currentPool[Math.floor(Math.random()*currentPool.length)];
      tries++;
    }
  }

  lastId = p.id;
  const c = await cardFor(p,difficulty.value);
  pokemon.textContent = titleCase(c.name);
  taboo.innerHTML = c.words.map(w => `<span class="word">${titleCase(w)}</span>`).join("");
  card.style.display = "block";
  gameOver.style.display = "none";
}

function updateTimer(){
  timerEl.textContent = `${Math.floor(timeLeft/60)}:${String(timeLeft%60).padStart(2,"0")}`;
}

function startTimer(){
  clearInterval(timer);
  active = true;
  penalty = 0;
  penaltyEl.textContent = "0";
  timeLeft = 180;
  penaltyResult.style.display = "none";
  gameOver.style.display = "none";
  timerEl.style.display = "block";
  red.style.display = "block";
  randomizeBtn.textContent = "NEXT POKEMON";
  currentPool = [];
  updateTimer();
  randomize();

  timer = setInterval(() => {
    timeLeft--;
    updateTimer();
    if(timeLeft <= 0) endGame();
  },1000);
}

function endGame(){
  clearInterval(timer);
  timer = null;
  active = false;
  red.style.display = "none";
  timerEl.style.display = "none";
  randomizeBtn.textContent = "RANDOMIZE!";
  gameOver.style.display = "block";
  penaltyResult.style.display = "block";
  penaltyEl.textContent = penalty;
}

function flashRed(){
  red.classList.remove("flash");
  void red.offsetWidth;
  red.classList.add("flash");
  setTimeout(() => red.classList.remove("flash"),180);
}

rulesBtn.addEventListener("click", () => {
  rulesModal.style.display = "flex";
  rulesModal.setAttribute("aria-hidden","false");
});

closeRules.addEventListener("click", () => {
  rulesModal.style.display = "none";
  rulesModal.setAttribute("aria-hidden","true");
});

rulesModal.addEventListener("click", e => {
  if(e.target === rulesModal){
    rulesModal.style.display = "none";
    rulesModal.setAttribute("aria-hidden","true");
  }
});

generationButton.addEventListener("click", e => {
  e.stopPropagation();
  generationOptions.classList.toggle("open");
  generationOptions.setAttribute("aria-hidden", String(!generationOptions.classList.contains("open")));
});

generationOptions.addEventListener("click", e => e.stopPropagation());

generationChecks.forEach(check => {
  check.addEventListener("change", () => {
    updateGenerationButton();
    currentPool = [];
    card.style.display = "none";
    if(active) randomize();
  });
});

selectAllGenerations.addEventListener("click", () => {
  generationChecks.forEach(c => c.checked = true);
  updateGenerationButton();
  currentPool = [];
  if(active) randomize();
});

clearGenerations.addEventListener("click", () => {
  generationChecks.forEach(c => c.checked = false);
  updateGenerationButton();
  currentPool = [];
  card.style.display = "none";
});

document.addEventListener("click", () => {
  generationOptions.classList.remove("open");
  generationOptions.setAttribute("aria-hidden","true");
});

randomizeBtn.addEventListener("click", randomize);
blue.addEventListener("click", startTimer);
red.addEventListener("click", () => {
  if(!active) return;
  penalty += 2;
  penaltyEl.textContent = penalty;
  flashRed();
});

difficulty.addEventListener("change", () => {
  currentPool = [];
  if(lastId) randomize();
});

updateGenerationButton();
getData().catch(() => {});
