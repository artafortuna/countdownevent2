// --- CONFIG & INISIALISASI VARIABEL INDEXEDDB ---
let events = [];
let currentFilter = 'all';
let editEventId = null; 
let searchQuery = '';
let isSearchActive = false;
let db;

// Manajemen Tema (Light / Night Mode)
const htmlElement = document.documentElement;
const themeIcon = document.getElementById('theme-icon');

const savedTheme = localStorage.getItem('arta_theme') || 'dark';
if (savedTheme === 'dark') {
    htmlElement.classList.add('dark');
    if(themeIcon) themeIcon.className = "fa-solid fa-sun text-[18px] text-amber-500";
} else {
    htmlElement.classList.remove('dark');
    if(themeIcon) themeIcon.className = "fa-solid fa-moon text-[18px] text-slate-600";
}

function toggleTheme() {
    if (htmlElement.classList.contains('dark')) {
        htmlElement.classList.remove('dark');
        if(themeIcon) themeIcon.className = "fa-solid fa-moon text-[18px] text-slate-600";
        localStorage.setItem('arta_theme', 'light');
    } else {
        htmlElement.classList.add('dark');
        if(themeIcon) themeIcon.className = "fa-solid fa-sun text-[18px] text-amber-500";
        localStorage.setItem('arta_theme', 'dark');
    }
}

// --- LOGIKA SEARCH BAR INTERAKTIF HEADER ---
function handleThemeBtnClick() {
    if (isSearchActive) {
        closeSearch();
    } else {
        toggleTheme();
    }
}

function openSearch() {
    isSearchActive = true;
    const brand = document.getElementById('header-brand');
    const searchBar = document.getElementById('search-bar');
    const searchBtn = document.getElementById('search-btn');
    const themeBtnIcon = document.getElementById('theme-icon');
    const searchInput = document.getElementById('searchInput');

    brand.classList.add('opacity-0', 'pointer-events-none');
    searchBtn.classList.add('hidden');
    
    searchBar.classList.remove('opacity-0', 'pointer-events-none', 'translate-x-10');
    searchBar.classList.add('opacity-100', 'translate-x-0');

    themeBtnIcon.className = "fa-solid fa-xmark text-[20px] text-amber-600";

    bukaHalamanLinimasa();
    setTimeout(() => searchInput.focus(), 300);
}

function closeSearch() {
    isSearchActive = false;
    const brand = document.getElementById('header-brand');
    const searchBar = document.getElementById('search-bar');
    const searchBtn = document.getElementById('search-btn');
    const themeBtnIcon = document.getElementById('theme-icon');
    const searchInput = document.getElementById('searchInput');

    brand.classList.remove('opacity-0', 'pointer-events-none');
    searchBtn.classList.remove('hidden');

    searchBar.classList.remove('opacity-100', 'translate-x-0');
    searchBar.classList.add('opacity-0', 'pointer-events-none', 'translate-x-10');

    if (htmlElement.classList.contains('dark')) {
        themeBtnIcon.className = "fa-solid fa-sun text-[18px] text-amber-500";
    } else {
        themeBtnIcon.className = "fa-solid fa-moon text-[18px] text-slate-600";
    }

    searchInput.value = '';
    searchEvents('');
}

function searchEvents(val) {
    searchQuery = val.toLowerCase();
    renderEvents();
}


// --- MODAL POPUP CUSTOM (ALERT & CONFIRM) - FIX CENTERED ---
const customModal = document.getElementById('custom-modal');
const modalIcon = document.getElementById('modal-icon');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalActions = document.getElementById('modal-actions');

function openModal(type, title, message, onConfirm) {
    if (type === 'alert') {
        modalIcon.className = "w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800";
        modalIcon.innerHTML = '<i class="fa-solid fa-bell text-2xl"></i>';
        modalActions.innerHTML = `
            <button onclick="closeModal()" class="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-black py-3.5 rounded-2xl transition-all shadow-lg shadow-teal-500/40 active:scale-[0.98] text-sm border border-teal-400/50">
                Tutup Peringatan
            </button>
        `;
    } else if (type === 'confirm') {
        modalIcon.className = "w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800";
        modalIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-2xl"></i>';
        modalActions.innerHTML = `
            <button onclick="closeModal()" class="flex-1 bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black py-3.5 rounded-2xl transition-all shadow-sm text-sm">
                Batal
            </button>
            <button id="btn-confirm-action" class="flex-1 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-black py-3.5 rounded-2xl transition-all shadow-lg shadow-rose-500/40 active:scale-[0.98] text-sm border border-rose-400/50">
                Ya, Hapus
            </button>
        `;
        document.getElementById('btn-confirm-action').onclick = () => {
            if(onConfirm) onConfirm();
            closeModal();
        };
    }

    modalTitle.innerText = title;
    modalMessage.innerHTML = message.replace('\n\n', '<br><br>');

    // FIX: Tambahkan class 'flex' untuk memastikan items ter-center dengan benar
    customModal.classList.remove('hidden');
    customModal.classList.add('flex');
    
    void customModal.offsetWidth; // trigger reflow untuk animasi
    
    customModal.classList.remove('opacity-0');
    customModal.firstElementChild.classList.remove('scale-95');
}

function closeModal() {
    customModal.classList.add('opacity-0');
    customModal.firstElementChild.classList.add('scale-95');
    setTimeout(() => {
        customModal.classList.add('hidden');
        customModal.classList.remove('flex');
    }, 300);
}


// --- LOGIKA APLIKASI INTI ---

function ulangTahunAcara(id) {
    const idx = events.findIndex(e => e.id === id);
    if (idx === -1) return;

    const tglLama = new Date(events[idx].targetDate);
    tglLama.setFullYear(tglLama.getFullYear() + 1);

    const y = tglLama.getFullYear();
    const m = String(tglLama.getMonth() + 1).padStart(2, '0');
    const d = String(tglLama.getDate()).padStart(2, '0');
    const h = String(tglLama.getHours()).padStart(2, '0');
    const min = String(tglLama.getMinutes()).padStart(2, '0');

    events[idx].targetDate = `${y}-${m}-${d}T${h}:${min}`;
    events[idx].notified = false; 

    simpanKeDB(() => renderEvents());
}

function initDatabase() {
    const request = indexedDB.open('ArtaTimerDB', 1);

    request.onupgradeneeded = function(e) {
        db = e.target.result;
        if (!db.objectStoreNames.contains('store')) {
            db.createObjectStore('store', { keyPath: 'id' });
        }
    };

    request.onsuccess = function(e) {
        db = e.target.result;
        muatDariDB();
    };

    request.onerror = function(e) {
        console.error("IndexedDB Error:", e);
        openModal('alert', 'Database Error', 'Gagal memuat penyimpanan IndexedDB.');
    };
}

function muatDariDB() {
    const tx = db.transaction('store', 'readonly');
    const store = tx.objectStore('store');
    const req = store.get('eventsData');

    req.onsuccess = function() {
        if (req.result) {
            events = req.result.data;
        }
        renderEvents();
    };
}

function simpanKeDB(callback) {
    const tx = db.transaction('store', 'readwrite');
    const store = tx.objectStore('store');
    const req = store.put({ id: 'eventsData', data: events });
    
    req.onsuccess = function() {
        if (callback) callback();
    };
}

function bukaHalamanUtama() {
    document.getElementById('halaman-linimasa').style.display = 'none';
    document.getElementById('halaman-utama').style.display = 'block';
    if(isSearchActive) closeSearch();
    
    document.getElementById('nav-home').classList.add('text-teal-600', 'dark:text-teal-400', 'scale-105', 'drop-shadow-md');
    document.getElementById('nav-home').classList.remove('text-slate-400', 'dark:text-slate-500');
    document.getElementById('nav-timeline').classList.add('text-slate-400', 'dark:text-slate-500');
    document.getElementById('nav-timeline').classList.remove('text-teal-600', 'dark:text-teal-400', 'scale-105', 'drop-shadow-md');
}

function bukaHalamanLinimasa() {
    document.getElementById('halaman-utama').style.display = 'none';
    document.getElementById('halaman-linimasa').style.display = 'block';
    renderEvents();
    
    document.getElementById('nav-timeline').classList.add('text-teal-600', 'dark:text-teal-400', 'scale-105', 'drop-shadow-md');
    document.getElementById('nav-timeline').classList.remove('text-slate-400', 'dark:text-slate-500');
    document.getElementById('nav-home').classList.add('text-slate-400', 'dark:text-slate-500');
    document.getElementById('nav-home').classList.remove('text-teal-600', 'dark:text-teal-400', 'scale-105', 'drop-shadow-md');
}

if (window.Notification && Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission();
}

const nowIso = new Date().toISOString().substring(0, 16);
document.getElementById('event-date').min = nowIso;
document.getElementById('event-date').value = nowIso;

setInterval(() => {
    const d = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName = days[d.getDay()];
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    
    document.getElementById('live-date').innerText = `${dayName}, ${dd}/${mm}/${yyyy}`;
    document.getElementById('live-clock').innerText = d.toLocaleTimeString('id-ID');
}, 1000);

function setFilter(filter) {
    currentFilter = filter;
    ['all', 'active', 'passed'].forEach(f => {
        const btn = document.getElementById(`btn-filter-${f}`);
        if (f === filter) {
            btn.className = "flex-1 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-teal-500 to-emerald-600 text-white transition-all shadow-md";
        } else {
            btn.className = "flex-1 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-all";
        }
    });
    renderEvents();
}

function addEvent(e) {
    e.preventDefault();
    
    const name = document.getElementById('event-name').value;
    const targetDate = document.getElementById('event-date').value;
    const category = document.getElementById('event-category').value;
    const theme = document.getElementById('event-theme').value;

    if (editEventId) {
        const idx = events.findIndex(evt => evt.id === editEventId);
        if (idx !== -1) {
            events[idx] = { ...events[idx], name, targetDate, category, theme };
        }
        batalEdit();
    } else {
        const newEvent = {
            id: 'EVT-' + Date.now(),
            name, targetDate, category, theme, notified: false
        };
        events.push(newEvent);
    }

    simpanKeDB(() => {
        document.getElementById('event-form').reset();
        document.getElementById('event-date').value = nowIso;
        bukaHalamanLinimasa();
    });
}

function siapkanEdit(id) {
    const evt = events.find(e => e.id === id);
    if (!evt) return;

    editEventId = id;
    document.getElementById('event-name').value = evt.name;
    document.getElementById('event-date').value = evt.targetDate;
    document.getElementById('event-category').value = evt.category;
    document.getElementById('event-theme').value = evt.theme; 

    document.getElementById('judul-form').innerHTML = '<i class="fa-solid fa-pen-nib text-amber-500 mr-2"></i> Ubah Detail Acara';
    document.getElementById('teks-submit').innerText = "Simpan Perubahan";
    document.getElementById('icon-submit').className = "fa-solid fa-floppy-disk";
    document.getElementById('btn-batal-edit').classList.remove('hidden');

    bukaHalamanUtama(); 
}

function batalEdit() {
    editEventId = null;
    document.getElementById('event-form').reset();
    document.getElementById('judul-form').innerText = "Buat Acara Baru";
    document.getElementById('teks-submit').innerText = "Simpan Acara Mewah";
    document.getElementById('icon-submit').className = "fa-solid fa-wand-magic-sparkles";
    document.getElementById('btn-batal-edit').classList.add('hidden');
}

function deleteEvent(id) {
    openModal('confirm', 'Hapus Acara', 'Yakin ingin menghapus acara mewah ini dari riwayat?', () => {
        events = events.filter(evt => evt.id !== id);
        simpanKeDB(() => renderEvents());
    });
}

function triggerNotification(eventName) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        let osc1 = audioCtx.createOscillator();
        let gain1 = audioCtx.createGain();
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.frequency.value = 587.33; 
        gain1.gain.setValueAtTime(0.3, audioCtx.currentTime);
        osc1.start(audioCtx.currentTime);
        osc1.stop(audioCtx.currentTime + 0.15);

        setTimeout(() => {
            let osc2 = audioCtx.createOscillator();
            let gain2 = audioCtx.createGain();
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.frequency.value = 880; 
            gain2.gain.setValueAtTime(0.3, audioCtx.currentTime);
            osc2.start(audioCtx.currentTime);
            osc2.stop(audioCtx.currentTime + 0.3);
        }, 150);
    } catch (err) {}

    if (window.Notification && Notification.permission === "granted") {
        new Notification("Waktunya Tiba!", {
            body: `Acara "${eventName}" sedang berlangsung sekarang!`,
            icon: "https://cdn-icons-png.flaticon.com/512/2693/2693507.png"
        });
    } else {
        openModal('alert', 'Waktunya Tiba!', `Acara <b>"${eventName}"</b> sudah dimulai saat ini!`);
    }
}

function renderEvents() {
    const grid = document.getElementById('events-grid');
    const emptyState = document.getElementById('empty-state');
    const now = new Date().getTime();

    document.getElementById('total-events-nav').innerText = events.length;

    let filtered = events;
    
    if (currentFilter === 'active') {
        filtered = filtered.filter(e => new Date(e.targetDate).getTime() > now);
    } else if (currentFilter === 'passed') {
        filtered = filtered.filter(e => new Date(e.targetDate).getTime() <= now);
    }

    if (searchQuery) {
        filtered = filtered.filter(e => 
            e.name.toLowerCase().includes(searchQuery) || 
            e.category.toLowerCase().includes(searchQuery)
        );
    }

    filtered.sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());
    document.getElementById('total-events').innerText = filtered.length;
    grid.innerHTML = '';

    if (filtered.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    emptyState.classList.add('hidden');

    filtered.forEach(evt => {
        const card = document.createElement('div');
        card.className = `p-3.5 sm:p-5 rounded-3xl bg-gradient-to-br ${evt.theme} text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[160px] border border-white/30 backdrop-blur-lg group hover:scale-[1.02] transition-transform`;
        card.setAttribute('data-target', evt.targetDate);
        card.setAttribute('data-id', evt.id);

        const isBirthday = evt.category.includes('Ulang Tahun');

        card.innerHTML = `
            <div class="absolute -top-10 -right-10 w-24 h-24 bg-white/20 rounded-full blur-2xl z-0 pointer-events-none group-hover:scale-150 transition-transform duration-700"></div>
            
            <div class="relative z-10 flex flex-col h-full justify-between">
                <div>
                    <div class="flex justify-between items-start gap-1">
                        <span class="text-[9px] sm:text-[10px] uppercase font-black tracking-widest px-2.5 py-1.5 rounded-full bg-black/40 text-white backdrop-blur-md shadow-inner border border-white/20">
                            ${evt.category}
                        </span>
                        <div class="flex gap-1 shrink-0">
                            <button onclick="siapkanEdit('${evt.id}')" class="text-white/90 hover:text-white bg-black/20 hover:bg-black/40 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 border border-white/10">
                                <i class="fa-solid fa-pen text-[9px] sm:text-[10px]"></i>
                            </button>
                            <button onclick="deleteEvent('${evt.id}')" class="text-white/90 hover:text-rose-400 bg-black/20 hover:bg-black/40 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 border border-white/10">
                                <i class="fa-solid fa-trash-can text-[9px] sm:text-[10px]"></i>
                            </button>
                        </div>
                    </div>
                    <h4 class="text-[14px] sm:text-base font-mewah font-black text-white mt-4 leading-tight tracking-wide pr-1 drop-shadow-md line-clamp-2">${evt.name}</h4>
                    <p class="text-[10px] sm:text-[11px] text-white/90 font-bold mt-1.5 drop-shadow-sm"><i class="fa-regular fa-calendar text-amber-300 mr-1"></i> ${new Date(evt.targetDate).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'})}</p>
                </div>

                <div class="grid grid-cols-4 gap-0.5 text-center mt-4 bg-black/30 p-1.5 sm:p-2 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner countdown-container">
                    <div class="flex flex-col">
                        <div class="text-xs sm:text-sm font-black tracking-tighter days-val text-white drop-shadow-md">00</div>
                        <div class="text-[6px] sm:text-[7px] uppercase font-black tracking-widest text-white/70">Hari</div>
                    </div>
                    <div class="flex flex-col">
                        <div class="text-xs sm:text-sm font-black tracking-tighter hours-val text-white drop-shadow-md">00</div>
                        <div class="text-[6px] sm:text-[7px] uppercase font-black tracking-widest text-white/70">Jam</div>
                    </div>
                    <div class="flex flex-col">
                        <div class="text-xs sm:text-sm font-black tracking-tighter minutes-val text-white drop-shadow-md">00</div>
                        <div class="text-[6px] sm:text-[7px] uppercase font-black tracking-widest text-white/70">Mnt</div>
                    </div>
                    <div class="flex flex-col">
                        <div class="text-xs sm:text-sm font-black tracking-tighter seconds-val text-white drop-shadow-md">00</div>
                        <div class="text-[6px] sm:text-[7px] uppercase font-black tracking-widest text-white/70">Det</div>
                    </div>
                </div>
            </div>

            <div class="absolute inset-0 bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center text-center p-3 transition-opacity duration-500 opacity-0 pointer-events-none passed-overlay z-20 rounded-3xl">
                <div class="bg-gradient-to-tr from-teal-400 to-emerald-500 text-white w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.6)] mb-2 border border-white/50">
                    <i class="fa-solid fa-check text-sm sm:text-lg"></i>
                </div>
                <div class="text-[12px] sm:text-sm font-black text-white tracking-wide drop-shadow-md line-clamp-1">${evt.name}</div>
                <div class="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-teal-400 mt-1 bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20">Acara Tiba ✨</div>
                
                <div class="flex flex-col sm:flex-row justify-center items-center mt-3 gap-1.5 w-full px-2">
                    ${isBirthday ? `
                        <button onclick="ulangTahunAcara('${evt.id}')" class="w-full text-[9px] sm:text-[10px] bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white py-2 rounded-xl transition font-black pointer-events-auto active:scale-95 shadow-lg border border-teal-400/50">
                            Tahun Depan
                        </button>
                    ` : ''}
                    <button onclick="deleteEvent('${evt.id}')" class="w-full text-[9px] sm:text-[10px] bg-white/10 hover:bg-rose-500/30 text-white hover:text-rose-300 py-2 rounded-xl transition font-black pointer-events-auto active:scale-95 border border-white/20 hover:border-rose-500/50 backdrop-blur-md">
                        Hapus
                    </button>
                </div>
            </div>
        `;

        grid.appendChild(card);
    });

    updateAllCountdowns();
}

function updateAllCountdowns() {
    const now = new Date().getTime();
    const cards = document.querySelectorAll('#events-grid > div');

    cards.forEach(card => {
        const id = card.getAttribute('data-id');
        const targetStr = card.getAttribute('data-target');
        const targetTime = new Date(targetStr).getTime();
        const distance = targetTime - now;

        const overlay = card.querySelector('.passed-overlay');
        const container = card.querySelector('.countdown-container');

        if (distance <= 0) {
            if(overlay && overlay.classList.contains('opacity-0')) {
                overlay.classList.remove('opacity-0', 'pointer-events-none');
                overlay.classList.add('opacity-100');
                if(container) container.classList.add('hidden');
            }

            const idx = events.findIndex(e => e.id === id);
            if (idx !== -1 && !events[idx].notified) {
                events[idx].notified = true;
                simpanKeDB(() => {
                    triggerNotification(events[idx].name);
                });
            }
            return;
        }

        if (distance > 0 && overlay && overlay.classList.contains('opacity-100')) {
            overlay.classList.remove('opacity-100');
            overlay.classList.add('opacity-0', 'pointer-events-none');
            if(container) container.classList.remove('hidden');
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        const dVal = card.querySelector('.days-val');
        const hVal = card.querySelector('.hours-val');
        const mVal = card.querySelector('.minutes-val');
        const sVal = card.querySelector('.seconds-val');

        if(dVal) dVal.innerText = String(days).padStart(2, '0');
        if(hVal) hVal.innerText = String(hours).padStart(2, '0');
        if(mVal) mVal.innerText = String(minutes).padStart(2, '0');
        if(sVal) sVal.innerText = String(seconds).padStart(2, '0');
    });
}

// --- RUNNING SYSTEM ONLOAD ---
window.onload = function() {
    initDatabase();
    setInterval(updateAllCountdowns, 1000);
};
