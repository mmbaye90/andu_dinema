// On remplace le tableau statique par une variable qui sera remplie dynamiquement
let DATA = [];

const audio = document.getElementById('audioElement');
const grid = document.getElementById('trackGrid');
const libGrid = document.getElementById('libraryGrid');
const filterBar = document.getElementById('filterBar');
const searchInput = document.getElementById('searchInput');
const player = document.getElementById('player');
const pTitle = document.getElementById('pTitle');
const pArtist = document.getElementById('pArtist');
const playBtn = document.getElementById('playBtn');
const playIcon = document.getElementById('playIcon');
const progressFill = document.getElementById('progressFill');
const timeDisplay = document.getElementById('timeDisplay');
const visualizer = document.getElementById('visualizer');
const themeToggle = document.getElementById('themeToggle');

let currentTrackIndex = -1;
let isPlaying = false;
let activeCategory = 'Tous';

// --- CHARGEMENT DYNAMIQUE ---
async function loadMusicData() {
    try {
        // Chargement du fichier généré par ton script Bash
        const response = await fetch('./audios.json'); 
        if (!response.ok) throw new Error("Fichier audios.json introuvable");
        
        DATA = await response.json();
        
        // Initialisation de l'affichage une fois les données reçues
        initFilters();
        render();
    } catch (error) {
        console.error("Erreur Netlify Fetch:", error);
        grid.innerHTML = `<div class="empty-msg">Erreur : impossible de charger la playlist.</div>`;
    }
}

// --- NAVIGATION ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    document.getElementById(`nav-${pageId}`).classList.add('active');
    if(pageId === 'library') renderLibrary();
}

// --- GESTION DES FAVORIS ---
function toggleFavorite(index, event) {
    event.stopPropagation();
    DATA[index].fav = !DATA[index].fav;
    render();
    if(document.getElementById('page-library').classList.contains('active')) renderLibrary();
}

// --- CRÉATION DES CARTES ---
function createCard(t, globalIndex) {
    const card = document.createElement('div');
    card.className = 'track-card';
    
    // Utilisation de l'image du JSON ou d'un fallback
    const trackImg = t.image || ''; 
    
    card.innerHTML = `
        <div class="card-art" style="background-image: url('${trackImg}'); background-size: cover;">
            <div class="play-overlay"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
        </div>
        <div class="card-meta">
            <span class="t-title">${t.title}</span>
            <span class="t-artist">${t.artist}</span>
        </div>
        <button class="heart-btn ${t.fav ? 'is-fav' : ''}" onclick="toggleFavorite(${globalIndex}, event)">
            <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        </button>
    `;
    card.onclick = () => playTrack(globalIndex);
    return card;
}

// --- RENDU GRILLE PRINCIPALE ---
function render() {
    if (!grid) return;
    const filterText = searchInput.value.toLowerCase();
    grid.innerHTML = '';
    DATA.forEach((t, index) => {
        const matchesSearch = t.title.toLowerCase().includes(filterText) || t.artist.toLowerCase().includes(filterText);
        const matchesCat = activeCategory === 'Tous' || t.category === activeCategory;
        if(matchesSearch && matchesCat) grid.appendChild(createCard(t, index));
    });
}

// --- RENDU BIBLIOTHÈQUE ---
function renderLibrary() {
    if (!libGrid) return;
    libGrid.innerHTML = '';
    const favorites = DATA.filter(t => t.fav);
    if(favorites.length === 0) {
        libGrid.innerHTML = '<div class="empty-msg">Votre bibliothèque est vide.</div>';
    } else {
        DATA.forEach((t, index) => {
            if(t.fav) libGrid.appendChild(createCard(t, index));
        });
    }
}

// --- FILTRES ---
function initFilters() {
    if (!filterBar) return;
    const cats = ['Tous', ...new Set(DATA.map(t => t.category))];
    filterBar.innerHTML = '';
    cats.forEach(cat => {
        const chip = document.createElement('div');
        chip.className = `filter-chip ${activeCategory === cat ? 'active' : ''}`;
        chip.innerText = cat;
        chip.onclick = () => { activeCategory = cat; initFilters(); render(); };
        filterBar.appendChild(chip);
    });
}

// --- LECTEUR ---
function playTrack(index) {
    currentTrackIndex = index;
    const track = DATA[index];
    pTitle.innerText = track.title;
    pArtist.innerText = track.artist;
    
    // Utilisation de l'URL réelle provenant d'Internet Archive
    audio.src = track.url;
    audio.play();
    
    isPlaying = true;
    player.classList.add('visible');
    updatePlayerUI();
}

function updatePlayerUI() {
    playIcon.innerHTML = isPlaying ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>' : '<path d="M8 5v14l11-7z"/>';
    visualizer.classList.toggle('active', isPlaying);
}

playBtn.onclick = () => {
    if(isPlaying) audio.pause(); else audio.play();
    isPlaying = !isPlaying;
    updatePlayerUI();
};

audio.ontimeupdate = () => {
    const pct = (audio.currentTime / audio.duration) * 100 || 0;
    progressFill.style.width = pct + '%';
    timeDisplay.innerText = Math.floor(pct) + '%';
};

function next() { 
    if (DATA.length === 0) return;
    playTrack((currentTrackIndex + 1) % DATA.length); 
}

function prev() { 
    if (DATA.length === 0) return;
    playTrack((currentTrackIndex - 1 + DATA.length) % DATA.length); 
}

document.getElementById('progressArea').onclick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
};

// --- LOGIQUE THÈME ---
themeToggle.onclick = () => {
    const current = document.body.getAttribute('data-theme');
    const target = current === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', target);
};

searchInput.oninput = render;

// --- LANCEMENT INITIAL ---
loadMusicData();