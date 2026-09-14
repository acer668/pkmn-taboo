let data=[];
let available=[];
let current=null;
let timerId=null;
let timeLeft=180;
let active=false;
let penalty=0;
let correctCount=0;
let renderSerial=0;

const $=id=>document.getElementById(id);
const genMenu=$('generationMenu'), genButton=$('generationButton'), genOptions=$('generationOptions');
const checkboxes=[...genOptions.querySelectorAll('input[type="checkbox"]')];

const metaCache=new Map();
const chainCache=new Map();

const STARTERS=new Set([
  1,4,7,25,133,152,155,158,252,255,258,387,390,393,
  495,498,501,650,653,656,722,725,728,810,813,816,906,909,912
]);

const FOSSILS=new Set([
  138,139,140,141,142,
  345,346,347,348,
  408,409,410,411,
  564,565,566,567,
  696,697,698,699,
  880,881,882,883
]);

const GROUPS=new Map();
function group(ids,word){ids.forEach(id=>GROUPS.set(id,word));}

group([1,4,7],"trio");
group([152,155,158],"trio");
group([252,255,258],"trio");
group([387,390,393],"trio");
group([495,498,501],"trio");
group([650,653,656],"trio");
group([722,725,728],"trio");
group([810,813,816],"trio");
group([906,909,912],"trio");

group([144,145,146],"trio");
group([243,244,245],"trio");
group([377,378,379],"trio");
group([382,383,384],"trio");
group([480,481,482],"trio");
group([483,484,487],"trio");
group([643,644,646],"trio");
group([716,717,718],"trio");
group([791,792,800],"trio");
group([1014,1015,1016],"trio");

group([249,250],"duo");
group([311,312],"duo");
group([313,314],"duo");
group([337,338],"duo");
group([380,381],"duo");
group([888,889],"duo");
group([1007,1008],"duo");

group([638,639,640,647],"quad");
group([641,642,645,905],"quad");
group([785,786,787,788],"quad");
group([1001,1002,1003,1004],"quad");

const BANNED=new Set([
  "move","moves","pokedex","pokédex","pokedex entry","pokédex entry","entry",
  "species","evolution","evolve","evolves","attack","status","rare","type",
  "habitat","powerful","boss","item","weight","height","battle","pokemon",
  "pokémon","creature","animal","design","body","color","ability","abilities",
  "clue","friendship","weather","day","night"
]);

const WEAK_GENUS_WORDS=new Set([
  "pokemon","pokémon","tiny","big","mega","young","old","mysterious",
  "formidable","proud","cruel","devious","loyal","wild","scout","lookout",
  "gratitude","victory","alpha","renegade","colossal","legendary"
]);

const ANIMAL_WORDS=new Set([
  "mouse","rat","cat","dog","fox","wolf","lion","tiger","leopard","bear",
  "rabbit","hare","monkey","ape","gorilla","pig","boar","swine","cow","bull",
  "horse","pony","deer","goat","sheep","elephant","rhinoceros","kangaroo",
  "otter","weasel","badger","mongoose","squirrel","chinchilla","sloth",
  "giraffe","zebra","hippo","seal","walrus","dolphin","whale","bat",
  "bird","pigeon","duck","penguin","owl","eagle","vulture","crow","parrot",
  "woodpecker","flamingo","chick","fowl","butterfly","moth","bee","wasp",
  "beetle","cricket","cicada","spider","scorpion","centipede","ant",
  "worm","caterpillar","grub","mantis","fly","firefly","dragonfly",
  "snake","cobra","lizard","gecko","crocodile","alligator","turtle",
  "tortoise","frog","toad","salamander","axolotl","fish","shark","eel",
  "seahorse","jellyfish","octopus","squid","crab","lobster","crayfish",
  "shrimp","clam","shellfish","coral","slug","snail","starfish","urchin",
  "pufferfish","manta","mole","armadillo","panda","tapir"
]);

const SHAPE_WORDS={
  ball:"ball",
  squiggle:"serpentine",
  fish:"fish-shaped",
  blob:"blob",
  quadruped:"four-legged",
  wings:"wings",
  tentacles:"tentacles",
  humanoid:"humanoid",
  "bug-wings":"insect wings",
  armor:"armored"
};

function selectedGens(){return checkboxes.filter(c=>c.checked).map(c=>Number(c.value));}
function updateGenLabel(){
  const gs=selectedGens();
  genButton.textContent=gs.length===9?'All Generations ▾':gs.length?`Gen ${gs.join(', ')} ▾`:'No Generations ▾';
}
function rebuildPool(){
  const gs=selectedGens();
  available=data.filter(p=>gs.includes(p.generation));
}
function normalizeWord(value){
  return String(value||"").trim().toLowerCase().replace(/-/g," ").replace(/\s+/g," ");
}
function validWord(value,targetName){
  const w=normalizeWord(value);
  if(!w || BANNED.has(w))return false;
  if(w===normalizeWord(targetName))return false;
  if(/^clue\s/i.test(w))return false;
  return true;
}
function uniquePush(arr,value,targetName){
  const w=normalizeWord(value);
  if(!validWord(w,targetName))return;
  if(!arr.includes(w))arr.push(w);
}
function extractGenusClues(genus,targetName){
  let g=normalizeWord(genus).replace(/\bpokémon\b/g,"").replace(/\bpokemon\b/g,"").trim();
  if(!g)return [];
  const bits=g.split(/\s+/).filter(Boolean);
  const animals=bits.filter(x=>ANIMAL_WORDS.has(x));
  if(animals.length)return [...new Set(animals)];
  const useful=bits.filter(x=>!WEAK_GENUS_WORDS.has(x) && !BANNED.has(x));
  if(useful.length===1)return useful;
  if(useful.length>1)return [useful.join(" ")];
  return [];
}
function flattenChain(node,out=[]){
  if(!node)return out;
  if(node.species?.name)out.push(node.species.name);
  for(const child of node.evolves_to||[])flattenChain(child,out);
  return out;
}
async function getChain(url){
  if(!url)return [];
  if(chainCache.has(url))return chainCache.get(url);
  const promise=fetch(url,{cache:"force-cache"})
    .then(r=>{if(!r.ok)throw new Error("Evolution chain request failed");return r.json();})
    .then(j=>flattenChain(j.chain,[]));
  chainCache.set(url,promise);
  return promise;
}
async function getMeta(p){
  if(metaCache.has(p.id))return metaCache.get(p.id);
  const promise=(async()=>{
    const [pkRes,spRes]=await Promise.all([
      fetch(`https://pokeapi.co/api/v2/pokemon/${p.id}`,{cache:"force-cache"}),
      fetch(`https://pokeapi.co/api/v2/pokemon-species/${p.id}`,{cache:"force-cache"})
    ]);
    if(!pkRes.ok || !spRes.ok)throw new Error(`Could not load factual data for ${p.name}`);
    const pk=await pkRes.json();
    const sp=await spRes.json();

    const genus=(sp.genera||[]).find(x=>x.language?.name==="en")?.genus||"";
    const chain=await getChain(sp.evolution_chain?.url);
    return {
      types:(pk.types||[]).sort((a,b)=>a.slot-b.slot).map(x=>x.type.name),
      abilities:(pk.abilities||[]).map(x=>x.ability.name),
      moves:(pk.moves||[])
        .filter(x=>(x.version_group_details||[]).some(v=>v.move_learn_method?.name==="level-up"))
        .map(x=>x.move.name),
      color:sp.color?.name||"",
      shape:sp.shape?.name||"",
      legendary:!!sp.is_legendary,
      mythical:!!sp.is_mythical,
      genus,
      relatives:chain
        .map(x=>normalizeWord(x))
        .filter(x=>x && x!==normalizeWord(p.name))
    };
  })();
  metaCache.set(p.id,promise);
  return promise;
}

function buildTabooPool(p,m){
  const pool=[];

  // Highest-value identity clues first.
  if(STARTERS.has(p.id))uniquePush(pool,"starter",p.name);
  if(GROUPS.has(p.id))uniquePush(pool,GROUPS.get(p.id),p.name);
  if(m.legendary)uniquePush(pool,"legendary",p.name);
  if(m.mythical)uniquePush(pool,"mythical",p.name);
  if(FOSSILS.has(p.id))uniquePush(pool,"fossil",p.name);

  // Concrete factual descriptors.
  m.types.forEach(x=>uniquePush(pool,x,p.name));
  uniquePush(pool,m.color,p.name);
  (p.manual||[]).forEach(x=>uniquePush(pool,x,p.name));
  extractGenusClues(m.genus,p.name).forEach(x=>uniquePush(pool,x,p.name));

  // Pokémon-specific relationships and abilities.
  m.relatives.forEach(x=>uniquePush(pool,x,p.name));
  m.abilities.forEach(x=>uniquePush(pool,x,p.name));

  // Design/body-shape descriptor when useful.
  if(SHAPE_WORDS[m.shape])uniquePush(pool,SHAPE_WORDS[m.shape],p.name);

  // Actual level-up move names are used only if the Pokémon still does not
  // have eight specific taboo words. We never use the generic word "move".
  for(const mv of m.moves||[]){
    if(pool.length>=8)break;
    uniquePush(pool,mv,p.name);
  }

  if(pool.length<8){
    console.warn(`Only ${pool.length} verified taboo words available for ${p.name}`);
  }

  return pool.slice(0,8);
}

function shuffledCopy(arr){
  const out=[...arr];
  for(let i=out.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [out[i],out[j]]=[out[j],out[i]];
  }
  return out;
}

function wordsForDifficulty(pool,difficulty){
  if(difficulty==="hard")return [...pool];
  const count=difficulty==="easy"?4:6;
  return shuffledCopy(pool).slice(0,count);
}

async function renderCard(){
  if(!current)return;
  const serial=++renderSerial;
  const p=current;

  $('dexNumber').textContent=`#${String(p.id).padStart(4,'0')} • Generation ${p.generation}`;
  $('pokemon').textContent=p.name;
  $('taboo').innerHTML='<span>loading clues…</span>';

  const img=$('pokemonImage');
  img.alt=p.name;
  img.classList.remove('imageMissing');
  img.src=`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`;
  img.onerror=()=>img.classList.add('imageMissing');

  $('card').classList.remove('hidden');
  $('gameOver').classList.add('hidden');

  try{
    if(!p._tabooPool){
      const meta=await getMeta(p);
      p._tabooPool=buildTabooPool(p,meta);
    }
    if(serial!==renderSerial || current!==p)return;
    const shownWords=wordsForDifficulty(p._tabooPool,$('difficulty').value);
    $('taboo').innerHTML=shownWords.map(w=>`<span>${w}</span>`).join('');
  }catch(err){
    if(serial!==renderSerial || current!==p)return;
    console.error(err);
    $('taboo').innerHTML='<span>word data unavailable</span>';
  }
}

function randomize(){
  if(!data.length)return;
  rebuildPool();
  if(!available.length){current=null;$('card').classList.add('hidden');return;}
  let candidates=available;
  if(current&&available.length>1)candidates=available.filter(p=>p.id!==current.id);
  current=candidates[Math.floor(Math.random()*candidates.length)];
  renderCard();
}
function renderTime(){
  $('timer').textContent=`${Math.floor(timeLeft/60)}:${String(timeLeft%60).padStart(2,'0')}`;
}
function setSetupLocked(locked){
  $('difficulty').disabled=locked;
  genButton.disabled=locked;
  checkboxes.forEach(c=>c.disabled=locked);
  $('selectAllGenerations').disabled=locked;
  $('clearGenerations').disabled=locked;
  genMenu.classList.toggle('locked', locked);
  if(locked)genOptions.classList.add('hidden');
}
function setBlueButtonState(isRoundActive){
  const blue=$('blue');
  blue.dataset.mode=isRoundActive?'stop':'start';
  blue.setAttribute('aria-label',isRoundActive?'End round early':'Start timer');
  blue.innerHTML=isRoundActive
    ? '<span class="blueIcon blueX" aria-hidden="true"></span>'
    : '<span class="blueIcon bluePlay" aria-hidden="true"></span>';
}
function startGame(){
  if(!data.length || active)return;
  active=true;
  setBlueButtonState(true);
  setSetupLocked(true);
  penalty=0;
  correctCount=0;
  $('penalty').textContent='0';
  $('correctCount').textContent='0';
  $('totalPoints').textContent='0';
  $('roundResults').classList.add('hidden');
  $('gameOver').classList.add('hidden');
  $('timer').classList.remove('hidden');
  $('red').classList.remove('hidden');
  $('skip').classList.remove('hidden');
  $('red').disabled=false;
  $('skip').disabled=false;
  $('randomize').textContent='NEXT POKÉMON';
  timeLeft=180;
  renderTime();
  clearInterval(timerId);
  timerId=setInterval(()=>{
    timeLeft--;
    renderTime();
    if(timeLeft<=0)endGame();
  },1000);
  randomize();
}
function endGame(){
  if(!active)return;
  active=false;
  setBlueButtonState(false);
  setSetupLocked(false);
  clearInterval(timerId);
  timerId=null;
  $('timer').classList.add('hidden');
  $('red').classList.add('hidden');
  $('skip').classList.add('hidden');
  $('randomize').textContent='RANDOMIZE!';
  $('gameOver').classList.remove('hidden');
  $('correctCount').textContent=correctCount;
  $('totalPoints').textContent=correctCount*10;
  $('penalty').textContent=penalty;
  $('roundResults').classList.remove('hidden');
}
function taboo(){
  if(!active)return;
  penalty+=2;
  $('penalty').textContent=penalty;
  $('red').classList.remove('flash');
  void $('red').offsetWidth;
  $('red').classList.add('flash');
}
function nextPokemon(){
  if(active){
    correctCount++;
    randomize();
  }else{
    randomize();
  }
}
function skipPokemon(){
  if(!active)return;
  penalty+=6;
  $('penalty').textContent=penalty;
  randomize();
}

genButton.addEventListener('click',e=>{e.stopPropagation();if(active)return;genOptions.classList.toggle('hidden');});
genOptions.addEventListener('click',e=>e.stopPropagation());
document.addEventListener('click',()=>genOptions.classList.add('hidden'));
checkboxes.forEach(c=>c.addEventListener('change',()=>{if(active)return;updateGenLabel();rebuildPool();if(current)randomize();}));
$('selectAllGenerations').addEventListener('click',()=>{if(active)return;checkboxes.forEach(c=>c.checked=true);updateGenLabel();rebuildPool();});
$('clearGenerations').addEventListener('click',()=>{if(active)return;checkboxes.forEach(c=>c.checked=false);updateGenLabel();available=[];$('card').classList.add('hidden');});
$('difficulty').addEventListener('change',()=>{if(active)return;if(current)renderCard();});
$('randomize').addEventListener('click',nextPokemon);
$('skip').addEventListener('click',skipPokemon);
$('blue').addEventListener('click',function(){if(this.dataset.mode==='stop'||active){endGame();}else{startGame();}});
$('red').addEventListener('click',taboo);
$('rulesBtn').addEventListener('click',()=>{$('rulesModal').classList.remove('hidden');});
$('closeRules').addEventListener('click',()=>{$('rulesModal').classList.add('hidden');});
$('rulesModal').addEventListener('click',e=>{if(e.target===$('rulesModal'))$('rulesModal').classList.add('hidden');});

setBlueButtonState(false);
setSetupLocked(false);

fetch('pokemon.json?v=20260914-eightword', {cache:'no-store'})
  .then(r=>{if(!r.ok)throw new Error('pokemon.json could not be loaded');return r.json();})
  .then(obj=>{
    data=obj.pokemon||[];
    $('loading').classList.add('hidden');
    rebuildPool();
    updateGenLabel();
  })
  .catch(err=>{
    $('loading').textContent='Could not load pokemon.json. Make sure it is in the same folder as index.html.';
    console.error(err);
  });
