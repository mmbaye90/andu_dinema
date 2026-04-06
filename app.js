let DATA = [];
let currentTrackIndex = -1;
let activeCategory = "Tous";
let itemsPerPage = 10;
let currentPage = 1;
let isLoading = false;

const audio = document.getElementById("audioElement");
const grid = document.getElementById("trackGrid");
const libGrid = document.getElementById("libraryGrid");
const filterBar = document.getElementById("filterBar");
const searchInput = document.getElementById("searchInput");
const player = document.getElementById("player");
const pTitle = document.getElementById("pTitle");
const pArtist = document.getElementById("pArtist");
const pArt = document.getElementById("pArt");
const playBtn = document.getElementById("playBtn");
const playIcon = document.getElementById("playIcon");
const progressFill = document.getElementById("progressFill");
const timeDisplay = document.getElementById("timeDisplay");
const visualizer = document.getElementById("visualizer");
const themeToggle = document.getElementById("themeToggle");
const sidebarToggle = document.getElementById("sidebarToggle");

// --- SIDEBAR ---
if (sidebarToggle) {
  sidebarToggle.onclick = () => document.body.classList.toggle("collapsed");
}

const burgerBtn = document.getElementById("burgerBtn");
const sidebar = document.getElementById("sidebar");

if (burgerBtn && sidebar) {
    burgerBtn.onclick = (e) => {
        e.stopPropagation();
        sidebar.classList.toggle("open");
        burgerBtn.classList.toggle("active");
    };
}

// --- FETCH DATA ---
async function loadMusicData() {
  try {
    const response = await fetch("./audios.json");
    if (!response.ok) throw new Error("Fichier introuvable");
    DATA = await response.json();
    initFilters();
    render();
  } catch (error) {
    console.error(error);
    if (grid)
      grid.innerHTML = `<div class="empty-msg">Erreur de chargement.</div>`;
  }
}

// --- NAVIGATION ---
function showPage(pageId) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  document.getElementById(`page-${pageId}`).classList.add("active");
  document.querySelectorAll(".menu-item").forEach((m) => m.classList.remove("active"));
  document.getElementById(`nav-${pageId}`).classList.add("active");

  const mainElement = document.querySelector("main");
  if (mainElement) mainElement.scrollTop = 0;

  if (pageId === "library") renderLibrary();
}

// --- FAVORITES ---
function toggleFavorite(index, event) {
    if (event) event.stopPropagation();
    
    DATA[index].fav = !DATA[index].fav;
    const isNowFav = DATA[index].fav;
    
    const allMatchingButtons = document.querySelectorAll(`.heart-btn[onclick*="toggleFavorite(${index},"]`);
    
    allMatchingButtons.forEach(btn => {
        if (isNowFav) {
            btn.classList.add('is-fav');
        } else {
            btn.classList.remove('is-fav');
        }
    });
    
    if (document.getElementById("page-library").classList.contains("active")) {
        setTimeout(() => renderLibrary(), 200);
    }
}

// --- RENDU ---
const islamicIcons = [
    '<path d="M12 2L9 9H2l5.5 4L5 22l7-5 7 5-2.5-9 5.5-4h-7z"/>',
    '<path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>',
    '<path d="M12 22v-5l-3-3H5l-3 3v5h10zm10 0v-5l-3-3h-4l-3 3v5h10zM12 2l-2 4h4l-2-4z"/>',
    '<path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>'
];

const iconColors = ['#FFD700', '#2ecc71', '#3498db', '#e74c3c', '#9b59b6', '#f1c40f'];

function createCard(t, globalIndex) {
    const card = document.createElement('div');
    card.className = 'track-card';
    const iconSvg = islamicIcons[globalIndex % islamicIcons.length];
    const iconColor = iconColors[globalIndex % iconColors.length];
    
    card.innerHTML = `
        <div class="card-art icon-mode" style="background: var(--bg-color); border: 2px solid var(--border-color); position: relative;">
            <svg class="decor-icon" viewBox="0 0 24 24" style="width:50%; fill:${iconColor}; filter: drop-shadow(0 0 8px ${iconColor}44); transition: all 0.3s ease;">
                ${iconSvg}
            </svg>
            <div class="play-overlay"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="white"/></svg></div>
        </div>
        <div class="card-meta">
            <span class="t-title">${t.title}</span>
            <span class="t-artist">${t.artist}</span>
        </div>
        <button class="heart-btn ${t.fav ? 'is-fav' : ''}" onclick="toggleFavorite(${globalIndex}, event)">
            <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        </button>`;
    card.onclick = () => playTrack(globalIndex);
    return card;
}

function render(append = false) {
  if (!grid) return;
  const filterText = searchInput.value.toLowerCase();
  const loader = document.getElementById("scrollLoader");
  if (!append) { grid.innerHTML = ""; currentPage = 1; }

  const filteredData = DATA.filter(t => {
    const mS = t.title.toLowerCase().includes(filterText) || t.artist.toLowerCase().includes(filterText);
    const mC = activeCategory === "Tous" || t.category === activeCategory;
    return mS && mC;
  });

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedData = filteredData.slice(start, end);

  paginatedData.forEach((t) => {
    const globalIndex = DATA.indexOf(t);
    grid.appendChild(createCard(t, globalIndex));
  });

  if (loader) loader.style.display = (end >= filteredData.length) ? "none" : "flex";
  isLoading = false;
}

function renderLibrary() {
  if (!libGrid) return;
  libGrid.innerHTML = "";
  DATA.forEach((t, index) => {
    if (t.fav) libGrid.appendChild(createCard(t, index));
  });
}

function initFilters() {
  if (!filterBar) return;
  const cats = ["Tous", ...new Set(DATA.map((t) => t.category))];
  filterBar.innerHTML = "";
  cats.forEach((cat) => {
    const chip = document.createElement("div");
    chip.className = `filter-chip ${activeCategory === cat ? "active" : ""}`;
    chip.innerText = cat;
    chip.onclick = () => { activeCategory = cat; initFilters(); render(); };
    filterBar.appendChild(chip);
  });
}

// --- PLAYER ---
function playTrack(index) {
  currentTrackIndex = index;
  const track = DATA[index];
  pTitle.innerText = track.title;
  pArtist.innerText = track.artist;
  if (pArt) pArt.style.backgroundImage = `url('${track.image}')`;
  audio.src = track.url;
  audio.play();
  player.classList.add("visible");
}

audio.onplay = () => {
  playIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="#00f2ff"/>';
  visualizer.classList.add("active");
};

audio.onpause = () => {
  playIcon.innerHTML = '<path d="M8 5v14l11-7z" fill="#00f2ff"/>';
  visualizer.classList.remove("active");
};

playBtn.onclick = () => (audio.paused ? audio.play() : audio.pause());

audio.ontimeupdate = () => {
  const pct = (audio.currentTime / audio.duration) * 100 || 0;
  progressFill.style.width = pct + "%";
  timeDisplay.innerText = Math.floor(pct) + "%";
};

document.getElementById("progressArea").onclick = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
};

function next() { playTrack((currentTrackIndex + 1) % DATA.length); }
function prev() { playTrack((currentTrackIndex - 1 + DATA.length) % DATA.length); }

function closePlayer() {
    if (audio) { audio.pause(); audio.currentTime = 0; }
    if (player) player.classList.remove("visible");
    if (visualizer) visualizer.classList.remove("active");
}

// --- UX & SCROLL ---
themeToggle.onclick = () => {
  const cur = document.body.getAttribute("data-theme");
  document.body.setAttribute("data-theme", cur === "dark" ? "light" : "dark");
};

searchInput.oninput = () => { currentPage = 1; render(); };

document.querySelector("main").onclick = () => {
    if (sidebar && sidebar.classList.contains("open")) {
        sidebar.classList.remove("open");
        if (burgerBtn) burgerBtn.classList.remove("active");
    }
};

const mainElement = document.querySelector("main");
mainElement.onscroll = () => {
    const isHomeActive = document.getElementById("page-home").classList.contains("active");
    if (isLoading || !isHomeActive) return;
    if (mainElement.scrollTop + mainElement.clientHeight >= mainElement.scrollHeight - 100) {
        const filterText = searchInput.value.toLowerCase();
        const filteredCount = DATA.filter(t => {
            const mS = t.title.toLowerCase().includes(filterText) || t.artist.toLowerCase().includes(filterText);
            const mC = activeCategory === "Tous" || t.category === activeCategory;
            return mS && mC;
        }).length;
        if (currentPage * itemsPerPage < filteredCount) {
            isLoading = true;
            currentPage++;
            setTimeout(() => render(true), 600);
        }
    }
};

// --- CONTACT MODAL ---
function toggleContactModal(show) {
    const modal = document.getElementById('contactModal');
    if (!modal) return;
    modal.style.display = show ? 'flex' : 'none';
    document.body.style.overflow = show ? 'hidden' : 'auto';
    if (!show && contactForm) {
        contactForm.reset();
        document.getElementById('successMsg').style.display = 'none';
        document.getElementById('errorMsg').style.display = 'none';
        validateForm();
    }
}

document.addEventListener('keydown', (e) => { if (e.key === "Escape") toggleContactModal(false); });
window.onclick = (e) => { if (e.target.id === 'contactModal') toggleContactModal(false); };

// --- SECURE FORM SUBMISSION (NETLIFY FUNCTIONS) ---
const contactForm = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');

if (contactForm) {
    contactForm.onsubmit = async function(event) {
        event.preventDefault();
        submitBtn.innerText = "Envoi en cours...";
        submitBtn.disabled = true;

        const templateParams = {
            last_name: document.getElementById('lastName').value,
            first_name: document.getElementById('firstName').value,
            user_email: document.getElementById('userEmail').value,
            mail_title: document.getElementById('mailTitle').value,
            message: document.getElementById('userMessage').value
        };

        try {
            // Appel à ta fonction serveur Netlify
            const response = await fetch('/.netlify/functions/send-mail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(templateParams)
            });

            if (response.ok) {
                document.getElementById('successMsg').style.display = 'block';
                document.getElementById('errorMsg').style.display = 'none';
                contactForm.reset();
                validateForm();
                setTimeout(() => {
                    toggleContactModal(false);
                    document.getElementById('successMsg').style.display = 'none';
                    submitBtn.innerText = "Envoyer";
                }, 3000);
            } else {
                throw new Error("Erreur serveur lors de l'envoi");
            }
        } catch (error) {
            console.error("Erreur envoi:", error);
            document.getElementById('errorMsg').style.display = 'block';
            document.getElementById('successMsg').style.display = 'none';
            submitBtn.innerText = "Réessayer";
            submitBtn.disabled = false;
        }
    };

    function validateForm() {
        const inputs = contactForm.querySelectorAll('input[required], textarea[required]');
        let isValid = true;
        inputs.forEach(input => {
            if (input.value.trim() === '') isValid = false;
            if (input.type === 'email') {
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(input.value)) isValid = false;
            }
        });
        submitBtn.disabled = !isValid;
    }

    contactForm.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', validateForm);
    });
}

loadMusicData();