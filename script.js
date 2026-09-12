// Mock Database of Pokémon across generations with Taboo lists based on difficulty level
const pokemonDatabase = [
    {
        name: "Pikachu", gen: 1,
        easy: ["Yellow", "Electric", "Mouse", "Tail"],
        medium: ["Yellow", "Electric", "Mouse", "Tail", "Thunderbolt", "Cheeks"],
        hard: ["Yellow", "Electric", "Mouse", "Tail", "Static", "Puka"]
    },
    {
        name: "Charizard", gen: 1,
        easy: ["Fire", "Flying", "Dragon", "Lizard"],
        medium: ["Fire", "Flying", "Dragon", "Lizard", "Flame", "Tail"],
        hard: ["Fire", "Flying", "Dragon", "Lizard", "Blaze", "Seismic Toss"]
    },
    {
        name: "Bulbasaur", gen: 1,
        easy: ["Grass", "Poison", "Seed", "Green"],
        medium: ["Grass", "Poison", "Seed", "Green", "Bulb", "Vine Whip"],
        hard: ["Grass", "Poison", "Seed", "Green", "Overgrow", "Starter"]
    },
    {
        name: "Mewtwo", gen: 1,
        easy: ["Psychic", "Clone", "Mew", "Legendary"],
        medium: ["Psychic", "Clone", "Mew", "Legendary", "Lab", "Cave"],
        hard: ["Psychic", "Clone", "Mew", "Legendary", "Strikes Back", "Spoon"]
    },
    {
        name: "Lugia", gen: 2,
        easy: ["Psychic", "Flying", "Legendary", "Silver"],
        medium: ["Psychic", "Flying", "Legendary", "Silver", "Ocean", "Diving"],
        hard: ["Psychic", "Flying", "Legendary", "Silver", "Aeroblast", "Whirl Islands"]
    },
    {
        name: "Tyranitar", gen: 2,
        easy: ["Rock", "Dark", "Armor", "Green"],
        medium: ["Rock", "Dark", "Armor", "Green", "Sandstorm", "Monster"],
        hard: ["Rock", "Dark", "Armor", "Green", "Pupitar", "Pseudo"]
    },
    {
        name: "Blaziken", gen: 3,
        easy: ["Fire", "Fighting", "Chicken", "Bird"],
        medium: ["Fire", "Fighting", "Chicken", "Bird", "Kick", "Torchic"],
        hard: ["Fire", "Fighting", "Chicken", "Bird", "Speed Boost", "Blaze Kick"]
    },
    {
        name: "Gardevoir", gen: 3,
        easy: ["Psychic", "Fairy", "Dress", "Green"],
        medium: ["Psychic", "Fairy", "Dress", "Green", "Embrace", "Gallade"],
        hard: ["Psychic", "Fairy", "Dress", "Green", "Synchronize", "Black Hole"]
    },
    {
        name: "Lucario", gen: 4,
        easy: ["Fighting", "Steel", "Aura", "Blue"],
        medium: ["Fighting", "Steel", "Aura", "Blue", "Jackal", "Riolu"],
        hard: ["Fighting", "Steel", "Aura", "Blue", "Inner Focus", "Bone Rush"]
    },
    {
        name: "Garchomp", gen: 4,
        easy: ["Dragon", "Ground", "Shark", "Sand"],
        medium: ["Dragon", "Ground", "Shark", "Sand", "Fin", "Cynthia"],
        hard: ["Dragon", "Ground", "Shark", "Sand", "Rough Skin", "Gabite"]
    },
    {
        name: "Zoroark", gen: 5,
        easy: ["Dark", "Fox", "Illusion", "Disguise"],
        medium: ["Dark", "Fox", "Illusion", "Disguise", "Zorua", "Hair"],
        hard: ["Dark", "Fox", "Illusion", "Disguise", "Night Daze", "Copycat"]
    },
    {
        name: "Greninja", gen: 6,
        easy: ["Water", "Dark", "Frog", "Ninja"],
        medium: ["Water", "Dark", "Frog", "Ninja", "Tongue", "Scarf"],
        hard: ["Water", "Dark", "Frog", "Ninja", "Battle Bond", "Water Shuriken"]
    },
    {
        name: "Sylveon", gen: 6,
        easy: ["Fairy", "Eevee", "Ribbons", "Pink"],
        medium: ["Fairy", "Eevee", "Ribbons", "Pink", "Evolution", "Flesh"],
        hard: ["Fairy", "Eevee", "Ribbons", "Pink", "Cute Charm", "Pixilate"]
    },
    {
        name: "Mimikyu", gen: 7,
        easy: ["Ghost", "Fairy", "Rag", "Pikachu"],
        medium: ["Ghost", "Fairy", "Rag", "Pikachu", "Disguise", "Cloth"],
        hard: ["Ghost", "Fairy", "Rag", "Pikachu", "Sun", "Moon"]
    },
    {
        name: "Dragapult", gen: 8,
        easy: ["Dragon", "Ghost", "Stealth", "Missile"],
        medium: ["Dragon", "Ghost", "Stealth", "Missile", "Dreepy", "Head"],
        hard: ["Dragon", "Ghost", "Stealth", "Missile", "Clear Body", "Infiltrator"]
    },
    {
        name: "Tinkaton", gen: 9,
        easy: ["Fairy", "Steel", "Hammer", "Pink"],
        medium: ["Fairy", "Steel", "Hammer", "Pink", "Corviknight", "Gigaton"],
        hard: ["Fairy", "Steel", "Hammer", "Pink", "Mold Breaker", "Own Tempo"]
    }
];

// App State variables
let timerInterval = null;
let tabooPenaltyCount = 0;
let isTimerActive = false;

// DOM Elements
const rulesBtn = document.getElementById("rules-btn");
const rulesModal = document.getElementById("rules-modal");
const closeModal = document.querySelector(".close-modal");
const randomizeBtn = document.getElementById("randomize-btn");
const timerDisplay = document.getElementById("timer-display");
const gameOverDisplay = document.getElementById("game-over-display");
const cardDisplay = document.getElementById("card-display");
const pokemonName = document.getElementById("pokemon-name");
const tabooWordsList = document.getElementById("taboo-words-list");
const endgameResults = document.getElementById("endgame-results");
const penaltyScore = document.getElementById("penalty-score");
const startBtn = document.getElementById("start-btn");
const penaltyBtn = document.getElementById("penalty-btn");
const generationSelect = document.getElementById("generation-select");
const difficultySelect = document.getElementById("difficulty-select");

// Rules Modal Logic
rulesBtn.addEventListener("click", () => { rulesModal.style.display = "flex"; });
closeModal.addEventListener("click", () => { rulesModal.style.display = "none"; });
window.addEventListener("click", (e) => { if (e.target === rulesModal) rulesModal.style.display = "none"; });

// Randomize Card Function
function showRandomPokemon() {
    const selectedGen = generationSelect.value;
    const selectedDifficulty = difficultySelect.value;
    
    // Filter database
    let filtered = pokemonDatabase;
    if (selectedGen !== "all") {
        filtered = pokemonDatabase.filter(p => p.gen === parseInt(selectedGen));
    }
    
    if (filtered.length === 0) {
        pokemonName.textContent = "None Found";
        tabooWordsList.innerHTML = "<li>Add database entries for this filter!</li>";
        cardDisplay.classList.remove("hidden");
        return;
    }
    
    const randomPokemon = filtered[Math.floor(Math.random() * filtered.length)];
    pokemonName.textContent = randomPokemon.name;
    
    // Grab list of words based on selected option
    const words = randomPokemon[selectedDifficulty] || [];
    tabooWordsList.innerHTML = words.map(word => `<li>${word}</li>`).join("");
    cardDisplay.classList.remove("hidden");
}

// Randomize Action Trigger
randomizeBtn.addEventListener("click", showRandomPokemon);

// Blue Circle Button Loop (3 Minute Timer Loop)
startBtn.addEventListener("click", () => {
    // Reset state parameters
    clearInterval(timerInterval);
    tabooPenaltyCount = 0;
    isTimerActive = true;
    
    // UI Visibility Adjustments
    randomizeBtn.classList.add("hidden");
    timerDisplay.classList.remove("hidden");
    gameOverDisplay.classList.add("hidden");
    endgameResults.classList.add("hidden");
    penaltyBtn.disabled = false;
    
    // Pick first randomized item automatically
    showRandomPokemon();
    
    let timeRemaining = 3 * 60; // 3 Minutes
    
    function updateTimerUI() {
        const minutes = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
        const seconds = (timeRemaining % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${minutes}:${seconds}`;
    }
    
    updateTimerUI();
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerUI();
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            isTimerActive = false;
            
            // Endgame State Toggles
            randomizeBtn.classList.remove("hidden");
            gameOverDisplay.classList.remove("hidden");
            penaltyBtn.disabled = true;
            
            // Render Penalty Total Numbers
            penaltyScore.textContent = tabooPenaltyCount;
            endgameResults.classList.remove("hidden");
        }
    }, 1000);
});

// Red Circle Button Loop (Penalty tracking)
penaltyBtn.addEventListener("click", () => {
    if (!isTimerActive) return;
    
    tabooPenaltyCount += 2;
    
    // Trigger visual flash ring animation class
    penaltyBtn.classList.remove("flash-ring");
    void penaltyBtn.offsetWidth; // Force DOM element layout recalculation to retrigger keyframe
    penaltyBtn.classList.add("flash-ring");
});
