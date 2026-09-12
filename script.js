const API="https://pokeapi.co/api/v2";
const genRanges={1:[1,151],2:[152,251],3:[252,386],4:[387,493],5:[494,649],6:[650,721],7:[722,809],8:[810,905],9:[906,1025]};
let cache=null,currentPool=[],lastId=null,timer=null,timeLeft=180,active=false,penalty=0;

const overrides={
 pikachu:{easy:["yellow","electric","mouse","thunder"],medium:["yellow","electric","Ash","Thunderbolt","Volt","Pichu"],hard:["mascot","cheeks","rodent","Lightning","Kanto","Raichu"]},
 charizard:{easy:["fire","dragon","flying","flame"],medium:["Charmeleon","wings","blaze","ember","tail","orange"],hard:["blast","Drake","lizard","inferno","X","Y"]},
 mewtwo:{easy:["psychic","clone","legendary","Mew"],medium:["lab","genetic","armor","telepathy","clone","cat"],hard:["experiment","DNA","scientist","telekinesis","amnesia","mutation"]},
 mew:{easy:["psychic","cute","pink","legendary"],medium:["Mewtwo","transform","mythical","DNA","tail","New"],hard:["ancestor","genetic","Ditto","telepathy","origin","clone"]},
 squirtle:{easy:["water","turtle","blue","shell"],medium:["Wartortle","Blastoise","Bubble","starter","cannon","rain"],hard:["withdraw","shelter","aqua","torrent","reptile","Shell"]},
 bulbasaur:{easy:["grass","poison","frog","starter"],medium:["Ivy","Venusaur","seed","vine","plant","squirtle"],hard:["overgrow","chlorophyll","leech","flower","toad","herb"]},
 gengar:{easy:["ghost","poison","purple","haunt"],medium:["Gastly","Haunter","shadow","night","spooky","Mega"],hard:["hypnosis","curse","shadow","Kanto","mischief","substitute"]},
 eevee:{easy:["evolve","brown","fox","normal"],medium:["Vaporeon","Jolteon","Flareon","evolution","tail","stone"],hard:["adaptability","Sylveon","Umbreon","Espeon","glaceon","friendship"]}
};

function norm(s){return s.toLowerCase().replace(/[^a-z0-9]/g,"")}
async function getData(){
 if(cache)return cache;
 loading.style.display="block";
 const r=await fetch(API+"/pokemon?limit=1025&offset=0"); const list=(await r.json()).results;
 cache=list.map((x,i)=>({id:i+1,name:x.name}));
 loading.style.display="none"; return cache;
}
function genericWords(p,details,species,diff){
 const types=details.types.map(x=>x.type.name);
 const abilities=details.abilities.map(x=>x.ability.name.replace("-"," "));
 const moves=details.moves.slice(0,20).map(x=>x.move.name.replace("-"," "));
 const genus=(species.genera||[]).find(x=>x.language.name==="en")?.genus?.replace(" Pokémon","")||"";
 const candidates=[...types,...abilities,...moves,genus];
 const clean=[];
 for(const w of candidates){
   const z=w.toLowerCase();
   if(!z || z===p.name || z.includes(p.name) || z==="generation" || z==="region")continue;
   if(!clean.includes(w))clean.push(w);
 }
 let count=diff==="easy"?4:6;
 return clean.slice(0,count);
}
async function cardFor(p,diff){
 const [a,b]=await Promise.all([fetch(API+"/pokemon/"+p.id).then(r=>r.json()),fetch(API+"/pokemon-species/"+p.id).then(r=>r.json())]);
 let words=overrides[norm(p.name)]?.[diff]||genericWords(p,a,b,diff);
 return {name:p.name.replace(/-/g," "),words};
}
function titleCase(s){return s.split(" ").map(x=>x[0].toUpperCase()+x.slice(1)).join(" ")}
async function randomize(){
 if(!active && timer===null){/* initial randomization is allowed */}
 if(!currentPool.length){
   const g=+generation.value, [lo,hi]=genRanges[g];
   const all=await getData(); currentPool=all.filter(p=>p.id>=lo&&p.id<=hi);
 }
 let p=currentPool[Math.floor(Math.random()*currentPool.length)];
 if(currentPool.length>1 && p.id===lastId)p=currentPool[Math.floor(Math.random()*currentPool.length)];
 lastId=p.id;
 const c=await cardFor(p,difficulty.value);
 pokemon.textContent=titleCase(c.name); taboo.innerHTML=c.words.map(w=>`<span class="word">${titleCase(w)}</span>`).join("");
 card.style.display="block"; gameOver.style.display="none";
}
function startTimer(){
 clearInterval(timer); active=true; penalty=0; timeLeft=180; penaltyResult.style.display="none";
 timer=setInterval(()=>{
   timeLeft--; updateTimer();
   if(timeLeft<=0)endGame();
 },1000);
 timerEl.style.display="block"; red.style.display="block"; randomizeBtn.textContent="NEXT POKEMON"; currentPool=[]; randomize();
}
function updateTimer(){timerEl.textContent=`${Math.floor(timeLeft/60)}:${String(timeLeft%60).padStart(2,"0")}`}
function endGame(){
 clearInterval(timer); timer=null; active=false; red.style.display="none"; timerEl.style.display="none";
 randomizeBtn.textContent="RANDOMIZE!"; gameOver.style.display="block";
 penaltyResult.style.display="block"; penalty.textContent=penalty;
}
rulesBtn.onclick=()=>rulesModal.style.display="flex";
closeRules.onclick=()=>rulesModal.style.display="none";
rulesModal.onclick=e=>{if(e.target===rulesModal)rulesModal.style.display="none"};
randomizeBtn.onclick=randomize;
blue.onclick=startTimer;
red.onclick=()=>{
 if(!active)return;
 penalty+=2; penalty.textContent=penalty;
 red.classList.remove("flash"); void red.offsetWidth; red.classList.add("flash");
 setTimeout(()=>red.classList.remove("flash"),180);
};
generation.onchange=()=>{currentPool=[];card.style.display="none"};
difficulty.onchange=()=>{if(lastId){randomize()}};
const timerEl=document.getElementById("timer"),generation=document.getElementById("generation"),difficulty=document.getElementById("difficulty"),
randomizeBtn=document.getElementById("randomize"),pokemon=document.getElementById("pokemon"),taboo=document.getElementById("taboo"),
card=document.getElementById("card"),loading=document.getElementById("loading"),red=document.getElementById("red"),blue=document.getElementById("blue"),
gameOver=document.getElementById("gameOver"),penaltyResult=document.getElementById("penaltyResult"),rulesBtn=document.getElementById("rulesBtn"),
rulesModal=document.getElementById("rulesModal"),closeRules=document.getElementById("closeRules"),penaltyEl=document.getElementById("penalty");
getData().catch(e=>{loading.textContent="Could not load Pokémon data. Check your internet connection.";});
