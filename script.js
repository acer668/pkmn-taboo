let data=[];
let available=[];
let current=null;
let timerId=null;
let timeLeft=180;
let active=false;
let penalty=0;
let correctCount=0;

const $=id=>document.getElementById(id);
const genMenu=$('generationMenu'), genButton=$('generationButton'), genOptions=$('generationOptions');
const checkboxes=[...genOptions.querySelectorAll('input[type="checkbox"]')];

function selectedGens(){return checkboxes.filter(c=>c.checked).map(c=>Number(c.value));}
function updateGenLabel(){
  const gs=selectedGens();
  genButton.textContent=gs.length===9?'All Generations ▾':gs.length?`Gen ${gs.join(', ')} ▾`:'No Generations ▾';
}
function rebuildPool(){
  const gs=selectedGens();
  available=data.filter(p=>gs.includes(p.generation));
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
function renderCard(){
  const d=current[$('difficulty').value];
  $('dexNumber').textContent=`#${String(current.id).padStart(4,'0')} • Generation ${current.generation}`;
  $('pokemon').textContent=current.name;
  $('taboo').innerHTML=d.map(w=>`<span>${w}</span>`).join('');

  const img=$('pokemonImage');
  img.alt=current.name;
  img.classList.remove('imageMissing');
  img.src=`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${current.id}.png`;
  img.onerror=()=>img.classList.add('imageMissing');

  $('card').classList.remove('hidden');
  $('gameOver').classList.add('hidden');
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
  if(locked) genOptions.classList.add('hidden');
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
  penalty+=2;
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
$('blue').addEventListener('click',function(){ if(this.dataset.mode==='stop' || active){ endGame(); } else { startGame(); } });
$('red').addEventListener('click',taboo);
$('rulesBtn').addEventListener('click',()=>{$('rulesModal').classList.remove('hidden');});
$('closeRules').addEventListener('click',()=>{$('rulesModal').classList.add('hidden');});
$('rulesModal').addEventListener('click',e=>{if(e.target===$('rulesModal'))$('rulesModal').classList.add('hidden');});

setBlueButtonState(false);
setSetupLocked(false);

fetch('pokemon.json')
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
