import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-analytics.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Firebase Configuration
const ADMIN_ENABLED = false;
if (!ADMIN_ENABLED) {
    document.documentElement.classList.add("admin-disabled");
}
const firebaseConfig = {
    apiKey: "AIzaSyAmDAEtdDeUrv1bx5j3pRzqGIPvm4DhDK0",
    authDomain: "burakcanozay.firebaseapp.com",
    projectId: "burakcanozay",
    storageBucket: "burakcanozay.firebasestorage.app",
    messagingSenderId: "649821426691",
    appId: "1:649821426691:web:5039b949d97ede82e76a36",
    measurementId: "G-P54JNDYGFC"
};

let app, auth, analytics, db;
// Firebase başlatılıyor...
app = initializeApp(firebaseConfig);
auth = getAuth(app);
analytics = getAnalytics(app);
db = getFirestore(app);
window.firebaseDB = db;
window.firestoreFns = { doc, getDoc, setDoc, collection, addDoc, getDocs, updateDoc, deleteDoc, serverTimestamp, query, orderBy };

const DEFAULT_THEME = {
    '--bg-color': '#050a0f',
    '--panel-bg': '#0b131e',
    '--card-bg': '#0b131e',
    '--theme-color': '#00f3ff',
    '--neon-green': '#00ff66',
    '--text-primary': '#e2e8f0',
    '--text-secondary': '#94a3b8',
    '--danger-color': '#ff3366',
    '--border-color': '#ffffff',
    '--circuit-color': '#00f3ff'
};

function applyThemeColors(colors) {
    for (const [key, value] of Object.entries(colors)) {
        let cssValue = value;
        if (key === '--card-bg' && value.startsWith('#') && value.length === 7) {
            cssValue = value + 'd9'; // 85% opacity
        } else if (key === '--border-color' && value.startsWith('#') && value.length === 7) {
            cssValue = value + '1a'; // 10% opacity
        }
        document.documentElement.style.setProperty(key, cssValue);
    }
}

function loadSavedThemeColors() {
    const saved = localStorage.getItem('site_theme_colors');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Theme parsing error, reverting to default', e);
        }
    }
    // Backward compatibility for old simple theme color
    const oldTheme = localStorage.getItem('site_theme');
    if (oldTheme) {
        const theme = { ...DEFAULT_THEME };
        theme['--theme-color'] = oldTheme;
        theme['--circuit-color'] = oldTheme;
        return theme;
    }
    return { ...DEFAULT_THEME };
}

function saveThemeColors(colors) {
    localStorage.setItem('site_theme_colors', JSON.stringify(colors));
    if (colors['--theme-color']) {
        window.DataService.theme = colors['--theme-color'];
    }
}

function updateThemeInputs(colors) {
    for (const [key, value] of Object.entries(colors)) {
        const input = document.querySelector(`.theme-card input[data-var="${key}"]`);
        if (input) {
            input.value = value;
        }
    }
}

function resetToDefaultTheme() {
    applyThemeColors(DEFAULT_THEME);
    updateThemeInputs(DEFAULT_THEME);
    saveThemeColors(DEFAULT_THEME);
}

function revertToSavedTheme() {
    const saved = loadSavedThemeColors();
    applyThemeColors(saved);
    updateThemeInputs(saved);
}

// Initial Theme Loading immediately before DOM content loads
applyThemeColors(loadSavedThemeColors());

// --- XSS SECURITY UTILITIES ---
function escapeHTML(str) {
    return String(str ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function safeText(value) {
    return value == null ? "" : String(value);
}

function createEl(tag, options = {}) {
    const el = document.createElement(tag);

    if (options.className) el.className = options.className;
    if (options.text !== undefined) el.textContent = String(options.text);

    if (options.attrs) {
        for (const [key, value] of Object.entries(options.attrs)) {
            el.setAttribute(key, String(value));
        }
    }

    if (options.children) {
        options.children.forEach(child => {
            if (typeof child === "string") {
                el.append(document.createTextNode(child));
            } else if (child instanceof Node) {
                el.appendChild(child);
            }
        });
    }

    return el;
}

function clearEl(el) {
    if (el) el.replaceChildren();
}

function safeUrl(url) {
    try {
        const parsed = new URL(url, window.location.origin);
        if (["http:", "https:", "mailto:"].includes(parsed.protocol)) {
            return parsed.href;
        }
    } catch (_) {}
    return "#";
}

function normalizeInput(value, maxLength = 1000) {
    return String(value ?? "").trim().slice(0, maxLength);
}

function hidePreloader() {
    const preloader = document.getElementById("preloader");
    if (!preloader) {
        document.body.classList.add("boot-complete");
        return;
    }

    const barFill = document.getElementById("preloader-bar-fill");
    const percentEl = document.getElementById("preloader-percentage");
    const voltEl = document.getElementById("preloader-volt");
    const tempEl = document.getElementById("preloader-temp");

    const status1 = document.getElementById("status-1");
    const status2 = document.getElementById("status-2");
    const status3 = document.getElementById("status-3");
    const status4 = document.getElementById("status-4");
    const status5 = document.getElementById("status-5");

    const startTime = Date.now();
    const duration = 1800; // 1.8 seconds

    function update() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const percent = Math.floor(progress * 100);

        if (percentEl) percentEl.textContent = `${percent}%`;
        if (barFill) barFill.style.width = `${percent}%`;

        // Status indicator transitions based on progress percentage
        if (percent >= 20 && status1 && status1.classList.contains("waiting")) {
            status1.textContent = "[  OK  ]";
            status1.classList.replace("waiting", "success");
        }
        if (percent >= 45 && status2 && status2.classList.contains("waiting")) {
            status2.textContent = "[  OK  ]";
            status2.classList.replace("waiting", "success");
        }
        if (percent >= 65 && status3 && status3.classList.contains("waiting")) {
            status3.textContent = "[  OK  ]";
            status3.classList.replace("waiting", "success");
        }
        if (percent >= 85 && status4 && status4.classList.contains("waiting")) {
            status4.textContent = "[  OK  ]";
            status4.classList.replace("waiting", "success");
        }
        if (percent >= 100 && status5 && status5.classList.contains("waiting")) {
            status5.textContent = "[  OK  ]";
            status5.classList.replace("waiting", "success");
        }

        // Fluctuate V_CORE and increase TEMP
        if (voltEl) {
            const v = (5.00 + (Math.sin(elapsed / 100) * 0.04) + (Math.random() * 0.01)).toFixed(2);
            voltEl.textContent = `${v}V`;
        }
        if (tempEl) {
            const t = Math.floor(35 + (progress * 9) + (Math.random() * 0.5));
            tempEl.textContent = `${t}°C`;
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            setTimeout(() => {
                preloader.classList.add("hidden");
                document.body.classList.add("boot-complete");
                setTimeout(() => {
                    preloader.remove();
                }, 1300); // Wait for the 1.2s transition to finish
            }, 300);
        }
    }

    requestAnimationFrame(update);
}

document.addEventListener('DOMContentLoaded', async () => {

    const views = document.querySelectorAll('.view');
    const nav = document.getElementById('main-nav');
    let appData;
    try {
        appData = await window.DataService.getData();
    } catch (err) {
        console.error("Data loading error, falling back to local fallback:", err);
        appData = {
            hakkimda: "Elektrik Elektronik Mühendisliği öğrencisiyim. Teknolojiye, gömülü sistemlere ve devre tasarımına büyük bir ilgi duyuyorum. Yenilikçi projeler geliştirmek ve mühendislik alanında kendimi sürekli olarak yenilemek en büyük hedefim.",
            projeler: [],
            basarilar: [],
            cv: [],
            sertifikalar: []
        };
    }

    // Dinamik Terminal Animasyonu (İmleç Hatası Çözümü)
    document.querySelectorAll('.terminal-text').forEach(el => {
        const len = el.textContent.trim().length;
        el.style.setProperty('--term-width', `${len}ch`);
        el.style.animation = `typing 2s steps(${len}, end), blink-caret .75s step-end infinite`;
    });

    let isAdminLoggedIn = false;
    let authReady = false;
    let currentUser = null;

    // Temporary states for new CV sections (Skills, Languages, Interests)
    let tempSkills = [];
    let tempLanguages = [];
    let tempInterests = [];

    // ─────────────────────────────────────────────────────────────────────
    // ADMIN GÜVENLİK NOTU:
    // Bu dosyadaki admin route koruması yalnızca FRONTEND güvenliğidir.
    // Gerçek güvenlik Firestore Security Rules ile sağlanmalıdır.
    //
    // Önerilen Firestore Rules mantığı:
    //   - portfolio koleksiyonu: read → herkese açık, write → sadece admin email
    //   - messages koleksiyonu:  create → herkese açık, read/update/delete → sadece admin email
    //
    // Firebase Console → Firestore Database → Rules bölümünden ayarlayabilirsiniz.
    // ─────────────────────────────────────────────────────────────────────
    const ADMIN_EMAIL = "burakcan190757@hotmail.com";

    function isAdmin(user) {
        return user && user.email === ADMIN_EMAIL;
    }

    function canAccessAdmin() {
        return authReady && isAdmin(currentUser);
    }

    // Firebase Auth State Listener
    if (auth) {
        onAuthStateChanged(auth, (user) => {
            currentUser = user;
            authReady = true;

            if (isAdmin(user)) {
                isAdminLoggedIn = true;
                window.updateMessageBadge?.().catch(console.error);

                if (window.location.hash === "#admin-login") {
                    window.location.hash = "#admin";
                }
            } else {
                isAdminLoggedIn = false;
                const badge = document.getElementById("msg-badge");
                if (badge) {
                    badge.style.display = "none";
                    badge.textContent = "";
                }

                if (user && !isAdmin(user)) {
                    signOut(auth)
                        .then(() => {
                            showToast("Bu hesap admin yetkisine sahip değil.", "error");
                            window.location.hash = "#admin-login";
                        })
                        .catch(console.error);
                    return;
                }

                if (window.location.hash === "#admin") {
                    window.location.hash = "#admin-login";
                }
            }

            handleRoute();
        });
    } else {
        console.warn("Firebase Auth henüz yapılandırılmadı. Lütfen app.js başındaki firebaseConfig ayarlarını doldurun.");
    }

    // Oscilloscope State Variables
    let oscAnimationId = null;
    let oscIsInitialized = false;
    let oscIsActive = false;
    let oscRunning = true;
    let oscGridVisible = true;
    let oscGlowEnabled = true;
    let oscTime = 0;

    // RENDER FUNCTIONS
    function renderHakkimda() {
        document.getElementById('hakkimda-content').textContent = appData.hakkimda;
        setTimeout(initOscilloscope, 50);
    }

    // --- PERSISTENCE: OSCILLOSCOPE SETTINGS ---
    function saveOscilloscopeSettings() {
        const settings = {
            frequency: parseFloat(document.getElementById('scope-frequency')?.value || 10),
            amplitude: parseFloat(document.getElementById('scope-amplitude')?.value || 1.0),
            offset: parseFloat(document.getElementById('scope-offset')?.value || 0.0),
            waveform: document.getElementById('scope-waveform')?.value || 'sine',
            channel: document.getElementById('scope-channel')?.value || 'dual',
            timeDiv: document.getElementById('scope-time-div')?.value || '1',
            voltDiv: document.getElementById('scope-volt-div')?.value || '1',
            trigger: document.getElementById('scope-trigger')?.value || 'auto',
            coupling: document.getElementById('scope-coupling')?.value || 'dc',
            gridVisible: oscGridVisible,
            glowEnabled: oscGlowEnabled,
            running: oscRunning
        };
        localStorage.setItem('oscilloscope_settings', JSON.stringify(settings));
    }

    function loadOscilloscopeSettings() {
        const saved = localStorage.getItem('oscilloscope_settings');
        if (!saved) return;
        try {
            const settings = JSON.parse(saved);
            
            const freqSlider = document.getElementById('scope-frequency');
            const ampSlider = document.getElementById('scope-amplitude');
            const offsetSlider = document.getElementById('scope-offset');
            const waveSelect = document.getElementById('scope-waveform');
            const channelSelect = document.getElementById('scope-channel');
            const timeSelect = document.getElementById('scope-time-div');
            const voltSelect = document.getElementById('scope-volt-div');
            const triggerSelect = document.getElementById('scope-trigger');
            const couplingSelect = document.getElementById('scope-coupling');

            if (freqSlider && settings.frequency !== undefined) freqSlider.value = settings.frequency;
            if (ampSlider && settings.amplitude !== undefined) ampSlider.value = settings.amplitude;
            if (offsetSlider && settings.offset !== undefined) offsetSlider.value = settings.offset;
            if (waveSelect && settings.waveform !== undefined) waveSelect.value = settings.waveform;
            if (channelSelect && settings.channel !== undefined) channelSelect.value = settings.channel;
            if (timeSelect && settings.timeDiv !== undefined) timeSelect.value = settings.timeDiv;
            if (voltSelect && settings.voltDiv !== undefined) voltSelect.value = settings.voltDiv;
            if (triggerSelect && settings.trigger !== undefined) triggerSelect.value = settings.trigger;
            if (couplingSelect && settings.coupling !== undefined) couplingSelect.value = settings.coupling;

            if (settings.gridVisible !== undefined) oscGridVisible = settings.gridVisible;
            if (settings.glowEnabled !== undefined) oscGlowEnabled = settings.glowEnabled;
            if (settings.running !== undefined) oscRunning = settings.running;

            // Update UI Button active states
            const gridBtn = document.getElementById('scope-grid-toggle');
            if (gridBtn) gridBtn.classList.toggle('btn-active', oscGridVisible);
            
            const glowBtn = document.getElementById('scope-glow-toggle');
            if (glowBtn) glowBtn.classList.toggle('btn-active', oscGlowEnabled);

            const runStopBtn = document.getElementById('scope-run-stop');
            if (runStopBtn) {
                clearEl(runStopBtn);
                const icon = createEl('i', {
                    className: oscRunning ? 'fas fa-play' : 'fas fa-pause',
                    attrs: { 'aria-hidden': 'true' }
                });
                runStopBtn.append(icon, oscRunning ? ' Run' : ' Stop');
                if (oscRunning) {
                    runStopBtn.classList.add('btn-active');
                    runStopBtn.classList.remove('btn-stop');
                } else {
                    runStopBtn.classList.remove('btn-active');
                    runStopBtn.classList.add('btn-stop');
                }
            }

            // Sync text labels
            const freqValue = document.getElementById('scope-frequency-value');
            const freqLabel = document.getElementById('scope-frequency-label');
            if (freqValue && settings.frequency !== undefined) freqValue.textContent = `${settings.frequency} Hz`;
            if (freqLabel && settings.frequency !== undefined) freqLabel.textContent = `Freq: ${settings.frequency} Hz`;

            const ampValue = document.getElementById('scope-amplitude-value');
            const ampLabel = document.getElementById('scope-amplitude-label');
            if (ampValue && settings.amplitude !== undefined) ampValue.textContent = `${parseFloat(settings.amplitude).toFixed(1)}x`;
            if (ampLabel && settings.amplitude !== undefined) ampLabel.textContent = `Amp: ${parseFloat(settings.amplitude).toFixed(1)}x`;

            const offsetValue = document.getElementById('scope-offset-value');
            if (offsetValue && settings.offset !== undefined) offsetValue.textContent = parseFloat(settings.offset).toFixed(1);

            const timeLabel = document.getElementById('scope-time-label');
            if (timeLabel && settings.timeDiv !== undefined) timeLabel.textContent = `Time/Div: ${settings.timeDiv} ms`;

            const voltLabel = document.getElementById('scope-volt-label');
            if (voltLabel && settings.voltDiv !== undefined) voltLabel.textContent = `Volt/Div: ${settings.voltDiv} V`;

            const couplingLabel = document.getElementById('scope-coupling-label');
            if (couplingLabel && settings.coupling !== undefined) couplingLabel.textContent = `Coupling: ${settings.coupling.toUpperCase()}`;

            const triggerLabel = document.getElementById('scope-trigger-label');
            if (triggerLabel && settings.trigger !== undefined) triggerLabel.textContent = `Trigger: ${settings.trigger.charAt(0).toUpperCase() + settings.trigger.slice(1)}`;

        } catch (e) {
            console.error("Error loading oscilloscope settings:", e);
        }
    }

    // OSCILLOSCOPE INTERACTIVE CONTROLLER
    function initOscilloscope() {
        const canvas = document.getElementById('oscilloscope-canvas');
        if (!canvas) return;

        if (oscIsInitialized) {
            startOscilloscope();
            return;
        }

        // Restore settings from localStorage first
        loadOscilloscopeSettings();

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        // Sliders
        const freqSlider = document.getElementById('scope-frequency');
        const ampSlider = document.getElementById('scope-amplitude');
        const offsetSlider = document.getElementById('scope-offset');

        // Labels
        const freqValue = document.getElementById('scope-frequency-value');
        const freqLabel = document.getElementById('scope-frequency-label');
        const ampValue = document.getElementById('scope-amplitude-value');
        const ampLabel = document.getElementById('scope-amplitude-label');
        const offsetValue = document.getElementById('scope-offset-value');

        // Select elements
        const timeSelect = document.getElementById('scope-time-div');
        const voltSelect = document.getElementById('scope-volt-div');
        const couplingSelect = document.getElementById('scope-coupling');
        const triggerSelect = document.getElementById('scope-trigger');
        const waveSelect = document.getElementById('scope-waveform');
        const channelSelect = document.getElementById('scope-channel');

        // Dynamic update functions
        if (freqSlider) {
            freqSlider.addEventListener('input', (e) => {
                const val = e.target.value;
                if (freqValue) freqValue.textContent = `${val} Hz`;
                if (freqLabel) freqLabel.textContent = `Freq: ${val} Hz`;
                updateVppMeasurement();
                saveOscilloscopeSettings();
            });
        }

        if (ampSlider) {
            ampSlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value).toFixed(1);
                if (ampValue) ampValue.textContent = `${val}x`;
                if (ampLabel) ampLabel.textContent = `Amp: ${val}x`;
                updateVppMeasurement();
                saveOscilloscopeSettings();
            });
        }

        if (offsetSlider) {
            offsetSlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value).toFixed(1);
                if (offsetValue) offsetValue.textContent = val;
                saveOscilloscopeSettings();
            });
        }

        if (timeSelect) {
            timeSelect.addEventListener('change', (e) => {
                const label = document.getElementById('scope-time-label');
                if (label) label.textContent = `Time/Div: ${e.target.value} ms`;
                saveOscilloscopeSettings();
            });
        }

        if (voltSelect) {
            voltSelect.addEventListener('change', (e) => {
                const label = document.getElementById('scope-volt-label');
                if (label) label.textContent = `Volt/Div: ${e.target.value} V`;
                updateVppMeasurement();
                saveOscilloscopeSettings();
            });
        }

        if (couplingSelect) {
            couplingSelect.addEventListener('change', (e) => {
                const label = document.getElementById('scope-coupling-label');
                if (label) label.textContent = `Coupling: ${e.target.value.toUpperCase()}`;
                updateVppMeasurement();
                saveOscilloscopeSettings();
            });
        }

        if (triggerSelect) {
            triggerSelect.addEventListener('change', (e) => {
                const label = document.getElementById('scope-trigger-label');
                if (label) label.textContent = `Trigger: ${e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1)}`;
                saveOscilloscopeSettings();
            });
        }

        if (waveSelect) {
            waveSelect.addEventListener('change', () => {
                saveOscilloscopeSettings();
            });
        }

        if (channelSelect) {
            channelSelect.addEventListener('change', () => {
                saveOscilloscopeSettings();
            });
        }

        // Action Buttons
        const runStopBtn = document.getElementById('scope-run-stop');
        if (runStopBtn) {
            runStopBtn.onclick = toggleRunStop;
        }

        const resetBtn = document.getElementById('scope-reset');
        if (resetBtn) {
            resetBtn.onclick = resetOscilloscopeSettings;
        }

        const gridBtn = document.getElementById('scope-grid-toggle');
        if (gridBtn) {
            gridBtn.onclick = () => {
                oscGridVisible = !oscGridVisible;
                gridBtn.classList.toggle('btn-active', oscGridVisible);
                saveOscilloscopeSettings();
            };
        }

        const glowBtn = document.getElementById('scope-glow-toggle');
        if (glowBtn) {
            glowBtn.onclick = () => {
                oscGlowEnabled = !oscGlowEnabled;
                glowBtn.classList.toggle('btn-active', oscGlowEnabled);
                saveOscilloscopeSettings();
            };
        }

        function updateVppMeasurement() {
            const amp = parseFloat(ampSlider ? ampSlider.value : 1.0);
            const couplingVal = couplingSelect ? couplingSelect.value : 'dc';
            
            // Peak-to-Peak: 2 times the amplitude, GND sets signal height to 0
            let vppVal = 2.0 * amp;
            if (couplingVal === 'gnd') vppVal = 0.0;
            
            const vppLabel = document.getElementById('scope-vpp-label');
            if (vppLabel) vppLabel.textContent = `Vpp: ${vppVal.toFixed(1)} V`;
        }

        // Initialize state view labels
        updateVppMeasurement();

        oscIsInitialized = true;
        startOscilloscope();
    }

    // Responsive resize handler
    function handleOscilloscopeResize() {
        const c = document.getElementById('oscilloscope-canvas');
        if (!c) return;
        const dpr = window.devicePixelRatio || 1;
        const r = c.getBoundingClientRect();
        c.width = r.width * dpr;
        c.height = r.height * dpr;
        const context = c.getContext('2d');
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.scale(dpr, dpr);
    }

    function startOscilloscope() {
        const hash = window.location.hash.substring(1) || 'home';
        if (hash !== 'hakkimda') return;
        if (oscIsActive) return;

        oscIsActive = true;
        
        // Trigger resize once to fit perfectly
        handleOscilloscopeResize();
        
        window.removeEventListener('resize', handleOscilloscopeResize);
        window.addEventListener('resize', handleOscilloscopeResize);
        
        if (oscAnimationId) {
            cancelAnimationFrame(oscAnimationId);
        }
        drawOscilloscope();
    }

    function stopOscilloscope() {
        oscIsActive = false;
        if (oscAnimationId) {
            cancelAnimationFrame(oscAnimationId);
            oscAnimationId = null;
        }
        window.removeEventListener('resize', handleOscilloscopeResize);
    }

    function destroyOscilloscope() {
        stopOscilloscope();
        oscIsInitialized = false;
    }

    // High fidelity physical wave function calculator
    function generateWaveform(type, t, freq, amp, offset) {
        let val = 0;
        const angle = 2 * Math.PI * freq * t;
        
        switch (type) {
            case 'sine':
                val = Math.sin(angle);
                break;
            case 'square':
                val = Math.sin(angle) >= 0 ? 1 : -1;
                break;
            case 'triangle':
                val = (Math.asin(Math.sin(angle)) * (2 / Math.PI));
                break;
            case 'sawtooth':
                val = 2 * (t * freq - Math.floor(0.5 + t * freq));
                break;
            case 'noise':
                val = Math.sin(angle) + 0.45 * (Math.random() - 0.5);
                break;
            case 'pulse': {
                // Periodical heart pulse ECG simulation
                const cycle = (t * freq) % 1;
                if (cycle < 0.08) {
                    // P-wave
                    val = 0.15 * Math.sin(Math.PI * cycle / 0.08);
                } else if (cycle >= 0.1 && cycle < 0.13) {
                    // Q-drop
                    val = -0.2 * Math.sin(Math.PI * (cycle - 0.1) / 0.03);
                } else if (cycle >= 0.13 && cycle < 0.18) {
                    // R-spike
                    val = 1.0 * Math.sin(Math.PI * (cycle - 0.13) / 0.05);
                } else if (cycle >= 0.18 && cycle < 0.21) {
                    // S-drop
                    val = -0.35 * Math.sin(Math.PI * (cycle - 0.21) / 0.03);
                } else if (cycle >= 0.26 && cycle < 0.36) {
                    // T-wave
                    val = 0.3 * Math.sin(Math.PI * (cycle - 0.26) / 0.1);
                } else {
                    val = 0;
                }
                break;
            }
            case 'clock': {
                // Square wave clock pulse with subtle rounded bandwidth limits
                const cycle = (t * freq) % 1;
                val = cycle < 0.5 ? 1 : -1;
                const edge = 0.015;
                if (cycle < edge) {
                    val = -1 + (2 * cycle / edge);
                } else if (cycle >= 0.5 && cycle < 0.5 + edge) {
                    val = 1 - (2 * (cycle - 0.5) / edge);
                }
                break;
            }
            case 'random':
                // Absolute static chaos parazit
                val = Math.random() - 0.5;
                break;
            default:
                val = Math.sin(angle);
        }
        
        return val * amp + offset;
    }

    // High performance CRT sweep drawing routine
    function drawOscilloscope() {
        if (!oscIsActive) return;

        const canvas = document.getElementById('oscilloscope-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const width = canvas.width / dpr;
        const height = canvas.height / dpr;

        // Clear panel screen
        ctx.fillStyle = '#020908';
        ctx.fillRect(0, 0, width, height);

        // Render analog CRT grid
        if (oscGridVisible) {
            ctx.strokeStyle = 'rgba(0, 243, 255, 0.06)';
            ctx.lineWidth = 1;
            ctx.shadowBlur = 0;
            
            // Columns
            for (let i = 1; i < 10; i++) {
                const x = (width / 10) * i;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            }
            
            // Rows
            for (let i = 1; i < 8; i++) {
                const y = (height / 8) * i;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }

            // Central axes calibration line
            ctx.strokeStyle = 'rgba(0, 243, 255, 0.12)';
            ctx.beginPath();
            ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2);
            ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, height);
            ctx.stroke();

            // Division sub-ticks
            ctx.strokeStyle = 'rgba(0, 243, 255, 0.25)';
            ctx.beginPath();
            for (let x = 0; x < width; x += width / 50) {
                ctx.moveTo(x, height / 2 - 3);
                ctx.lineTo(x, height / 2 + 3);
            }
            for (let y = 0; y < height; y += height / 40) {
                ctx.moveTo(width / 2 - 3, y);
                ctx.lineTo(width / 2 + 3, y);
            }
            ctx.stroke();
        }

        // Live options fetch
        const waveform = document.getElementById('scope-waveform')?.value || 'sine';
        const channel = document.getElementById('scope-channel')?.value || 'dual';
        const freq = parseFloat(document.getElementById('scope-frequency')?.value || 10);
        const amp = parseFloat(document.getElementById('scope-amplitude')?.value || 1.0);
        const offset = parseFloat(document.getElementById('scope-offset')?.value || 0.0);
        const timeDiv = parseFloat(document.getElementById('scope-time-div')?.value || 1.0);
        const voltDiv = parseFloat(document.getElementById('scope-volt-div')?.value || 1.0);
        const coupling = document.getElementById('scope-coupling')?.value || 'dc';

        // Sweep speed constant mapping
        const timeScale = timeDiv * 0.035;

        // Apply neon emission settings
        if (oscGlowEnabled) {
            ctx.shadowBlur = 8;
        } else {
            ctx.shadowBlur = 0;
        }

        // Draw Channel 1 (Cyan Beam)
        if (channel === 'ch1' || channel === 'dual') {
            ctx.strokeStyle = '#00f3ff';
            ctx.shadowColor = '#00f3ff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            for (let x = 0; x < width; x++) {
                const t = (x / width) * timeScale + oscTime;
                let yVal = generateWaveform(waveform, t, freq, amp, offset);
                
                // Coupling filter checks
                if (coupling === 'ac') {
                    yVal -= offset; // Filter offset (DC block)
                } else if (coupling === 'gnd') {
                    yVal = 0;       // Ground reference line
                }
                
                const yScreen = (height / 2) - (yVal * (height / 6) / voltDiv);
                if (x === 0) ctx.moveTo(x, yScreen);
                else ctx.lineTo(x, yScreen);
            }
            ctx.stroke();
        }

        // Draw Channel 2 (Green Beam)
        if (channel === 'ch2' || channel === 'dual') {
            ctx.strokeStyle = '#00ff66';
            ctx.shadowColor = '#00ff66';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            for (let x = 0; x < width; x++) {
                // Secondary beam phase offset
                const t = (x / width) * timeScale + oscTime - (Math.PI / 4);
                
                // In dual mode, let CH2 run a slightly different wave type to show off dual display capabilities
                const ch2Waveform = waveform === 'sine' ? 'triangle' : 'sine';
                let yVal2 = generateWaveform(ch2Waveform, t, freq * 0.85, amp * 0.9, -offset * 0.5);
                
                if (coupling === 'ac') {
                    yVal2 -= (-offset * 0.5);
                } else if (coupling === 'gnd') {
                    yVal2 = 0;
                }
                
                const yScreen = (height / 2) - (yVal2 * (height / 6) / voltDiv);
                if (x === 0) ctx.moveTo(x, yScreen);
                else ctx.lineTo(x, yScreen);
            }
            ctx.stroke();
        }

        // Reset blur attributes
        ctx.shadowBlur = 0;

        // Flow signal sweep over timeline
        if (oscRunning) {
            oscTime += 0.0015 * (freq / 10);
        }

        oscAnimationId = requestAnimationFrame(drawOscilloscope);
    }

    // Toggle execution states
    function toggleRunStop() {
        oscRunning = !oscRunning;
        const btn = document.getElementById('scope-run-stop');
        if (btn) {
            clearEl(btn);
            const icon = createEl('i', {
                className: oscRunning ? 'fas fa-play' : 'fas fa-pause',
                attrs: { 'aria-hidden': 'true' }
            });
            btn.append(icon, oscRunning ? ' Run' : ' Stop');
            if (oscRunning) {
                btn.classList.add('btn-active');
                btn.classList.remove('btn-stop');
            } else {
                btn.classList.remove('btn-active');
                btn.classList.add('btn-stop');
            }
        }
        saveOscilloscopeSettings();
    }

    // Revert controls back to default configurations
    function resetOscilloscopeSettings() {
        const freqSlider = document.getElementById('scope-frequency');
        const ampSlider = document.getElementById('scope-amplitude');
        const offsetSlider = document.getElementById('scope-offset');
        const waveSelect = document.getElementById('scope-waveform');
        const channelSelect = document.getElementById('scope-channel');
        const timeSelect = document.getElementById('scope-time-div');
        const voltSelect = document.getElementById('scope-volt-div');
        const triggerSelect = document.getElementById('scope-trigger');
        const couplingSelect = document.getElementById('scope-coupling');

        if (freqSlider) freqSlider.value = 10;
        if (ampSlider) ampSlider.value = 1.0;
        if (offsetSlider) offsetSlider.value = 0.0;
        if (waveSelect) waveSelect.value = 'sine';
        if (channelSelect) channelSelect.value = 'dual';
        if (timeSelect) timeSelect.value = '1';
        if (voltSelect) voltSelect.value = '1';
        if (triggerSelect) triggerSelect.value = 'auto';
        if (couplingSelect) couplingSelect.value = 'dc';

        // Direct labels repaint
        const freqValue = document.getElementById('scope-frequency-value');
        const freqLabel = document.getElementById('scope-frequency-label');
        if (freqValue) freqValue.textContent = '10 Hz';
        if (freqLabel) freqLabel.textContent = 'Freq: 10 Hz';

        const ampValue = document.getElementById('scope-amplitude-value');
        const ampLabel = document.getElementById('scope-amplitude-label');
        if (ampValue) ampValue.textContent = '1.0x';
        if (ampLabel) ampLabel.textContent = 'Amp: 1.0x';

        const offsetValue = document.getElementById('scope-offset-value');
        if (offsetValue) offsetValue.textContent = '0.0';

        const timeLabel = document.getElementById('scope-time-label');
        if (timeLabel) timeLabel.textContent = 'Time/Div: 1 ms';

        const voltLabel = document.getElementById('scope-volt-label');
        if (voltLabel) voltLabel.textContent = 'Volt/Div: 1 V';

        const couplingLabel = document.getElementById('scope-coupling-label');
        if (couplingLabel) couplingLabel.textContent = 'Coupling: DC';

        const triggerLabel = document.getElementById('scope-trigger-label');
        if (triggerLabel) triggerLabel.textContent = 'Trigger: Auto';

        const vppLabel = document.getElementById('scope-vpp-label');
        if (vppLabel) vppLabel.textContent = 'Vpp: 2.0 V';

        if (!oscRunning) {
            toggleRunStop();
        }

        oscGridVisible = true;
        const gridBtn = document.getElementById('scope-grid-toggle');
        if (gridBtn) gridBtn.classList.add('btn-active');

        oscGlowEnabled = true;
        const glowBtn = document.getElementById('scope-glow-toggle');
        if (glowBtn) glowBtn.classList.add('btn-active');

        saveOscilloscopeSettings();
    }
    
    function renderProjeler() {
        const grid = document.getElementById('projeler-grid');
        clearEl(grid);
        if (!grid) return;
        (appData.projeler || []).forEach(p => {
            const card = createEl('div', { className: 'card' });

            const h3 = createEl('h3');
            const icon = createEl('i', {
                className: 'fas fa-microchip',
                attrs: { 'aria-hidden': 'true' }
            });
            h3.append(icon, ' ', document.createTextNode(safeText(p.title)));

            const desc = createEl('p', { text: p.desc });

            const techStack = createEl('div', { className: 'tech-stack' });
            (p.tech || []).forEach(t => {
                techStack.appendChild(createEl('span', {
                    className: 'tech-tag',
                    text: t
                }));
            });

            card.append(h3, desc, techStack);
            grid.appendChild(card);
        });
    }

    function renderBasarilar() {
        const grid = document.getElementById('basarilar-grid');
        if (!grid) return;
        clearEl(grid);
        
        const basarilarList = appData.basarilar || [];
        
        if (basarilarList.length === 0) {
            const emptyCard = createEl('div', { className: 'empty-basarilar' });
            
            const led = createEl('div', { className: 'empty-basarilar-led' });
            
            const icon = createEl('i', {
                className: 'fas fa-trophy empty-basarilar-icon',
                attrs: { 'aria-hidden': 'true' }
            });
            
            const title = createEl('h3', { 
                className: 'empty-basarilar-title',
                text: 'SYSTEM_LOG // NO_RECORD' 
            });
            
            const desc = createEl('p', { 
                className: 'empty-basarilar-desc',
                text: 'Sistem veritabanında henüz kayıtlı bir başarı veya ödül kaydı bulunamadı.' 
            });
            
            emptyCard.append(led, icon, title, desc);
            grid.appendChild(emptyCard);
            return;
        }

        basarilarList.forEach(b => {
            const card = createEl('div', { className: 'card' });

            const h3 = createEl('h3');
            const icon = createEl('i', {
                className: 'fas fa-trophy',
                attrs: { 'aria-hidden': 'true' }
            });
            h3.append(icon, ' ', document.createTextNode(safeText(b.title)));

            const desc = createEl('p', { text: b.desc });

            const techStack = createEl('div', { className: 'tech-stack' });
            techStack.appendChild(createEl('span', {
                className: 'tech-tag',
                text: b.year
            }));

            card.append(h3, desc, techStack);
            grid.appendChild(card);
        });
    }

    // Scroll Reveal for CV Page
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Reveal only once
            }
        });
    }, {
        threshold: 0.05,
        rootMargin: '0px 0px -40px 0px'
    });

    function initReveal() {
        const revealElements = document.querySelectorAll('.cv-reveal');
        revealElements.forEach(el => {
            el.classList.remove('visible');
            revealObserver.observe(el);
        });
    }

    // ── Single source for detailed CV: Firestore appData.detailedCV takes priority ──
    function ensureDetailedCV() {
        if (!appData.detailedCV) {
            try {
                appData.detailedCV = structuredClone(window.DetailedCVData);
            } catch (e) {
                appData.detailedCV = JSON.parse(JSON.stringify(window.DetailedCVData));
            }
        }
        if (!Array.isArray(appData.detailedCV.egitim)) {
            appData.detailedCV.egitim = [
                {
                    okul: 'Karadeniz Teknik Üniversitesi',
                    bolum: 'Elektrik Elektronik Mühendisliği',
                    derece: 'Lisans',
                    tarih: '2023 - Günümüz',
                    aciklama: 'Elektrik-elektronik mühendisliği alanında lisans eğitimi.'
                }
            ];
        }
        appData.detailedCV.yetenekler ||= [];
        appData.detailedCV.diller ||= [];
        appData.detailedCV.ilgiAlanlari ||= [];
    }

    function ensureDetailedCVData() {
        ensureDetailedCV();
        return appData.detailedCV;
    }

    function getDetailedCVData() {
        return appData.detailedCV || window.DetailedCVData;
    }

    function renderCV() {
        const cvData = getDetailedCVData();
        if (!cvData) return;

        // 1. CV Hero Header details
        const nameEl = document.getElementById('cv-hero-name');
        if (nameEl) nameEl.textContent = cvData.hero.name;

        const titleEl = document.getElementById('cv-hero-title');
        if (titleEl) {
            clearEl(titleEl);
            const icon = createEl('i', {
                className: 'fas fa-microchip',
                attrs: { 'aria-hidden': 'true' }
            });
            titleEl.append(icon, ' ', document.createTextNode(safeText(cvData.hero.title)));
        }

        const descEl = document.getElementById('cv-hero-desc');
        if (descEl) descEl.textContent = cvData.hero.desc;

        const btnDownload = document.getElementById('btn-cv-download');
        if (btnDownload) {
            const dlUrl = cvData.hero.downloadUrl;
            if (dlUrl && dlUrl !== '#') {
                btnDownload.href = safeUrl(dlUrl);
            } else {
                btnDownload.href = 'burakcan_ozay_cv.pdf';
            }
            btnDownload.setAttribute('download', '');
        }

        // Avatar logic (if avatar is provided, render it)
        const avatarContainer = document.querySelector('.cv-avatar');
        if (avatarContainer && cvData.hero.avatar) {
            clearEl(avatarContainer);
            const img = createEl('img', {
                attrs: {
                    src: safeUrl(cvData.hero.avatar),
                    alt: safeText(cvData.hero.name),
                    style: 'width:100%; height:100%; object-fit:cover; border-radius:4px;'
                }
            });
            avatarContainer.appendChild(img);
        }

        // 2. Kişisel Bilgiler
        const kisiselContent = document.getElementById('cv-kisisel-content');
        if (kisiselContent) {
            clearEl(kisiselContent);
            cvData.kisisel.forEach(k => {
                const item = createEl('div', { className: 'cv-kisisel-item' });
                
                const iconDiv = createEl('div', { className: 'cv-kisisel-icon' });
                const icon = createEl('i', { className: safeText(k.icon), attrs: { 'aria-hidden': 'true' } });
                iconDiv.appendChild(icon);

                const infoDiv = createEl('div', { className: 'cv-kisisel-info' });
                const labelSpan = createEl('span', { className: 'cv-kisisel-label', text: k.label });
                const valueSpan = createEl('span', { className: 'cv-kisisel-value' });

                if (k.link) {
                    const link = createEl('a', {
                        attrs: {
                            href: safeUrl(k.link),
                            target: '_blank',
                            rel: 'noopener noreferrer'
                        },
                        text: k.value
                    });
                    valueSpan.appendChild(link);
                } else {
                    valueSpan.textContent = k.value;
                }

                infoDiv.append(labelSpan, valueSpan);
                item.append(iconDiv, infoDiv);
                kisiselContent.appendChild(item);
            });
        }

        // 3. Eğitim Bilgileri — önce detailedCV.egitim, fallback olarak appData.cv
        const egitimContent = document.getElementById('cv-egitim-content');
        if (egitimContent) {
            clearEl(egitimContent);
            const egitimListesi = (cvData.egitim && cvData.egitim.length > 0) ? cvData.egitim : null;
            if (egitimListesi) {
                egitimListesi.forEach((c, idx) => {
                    const activeClass = idx === 0 ? 'cv-timeline-vertical-item active' : 'cv-timeline-vertical-item';
                    const item = createEl('div', { className: activeClass });

                    const dateDiv = createEl('div', { className: 'cv-timeline-date' });
                    const icon = createEl('i', { className: 'fas fa-calendar-alt', attrs: { 'aria-hidden': 'true' } });
                    dateDiv.append(icon, ' ', document.createTextNode(safeText(c.tarih || c.date || '')));

                    const titleDiv = createEl('div', { className: 'cv-timeline-title', text: safeText(c.okul || c.title || '') });
                    const descDiv = createEl('div', { className: 'cv-timeline-desc', text: safeText(c.aciklama || c.bolum || c.desc || '') });

                    item.append(dateDiv, titleDiv, descDiv);
                    egitimContent.appendChild(item);
                });
            } else if (appData.cv && appData.cv.length > 0) {
                appData.cv.forEach((c, idx) => {
                    const activeClass = idx === 0 ? 'cv-timeline-vertical-item active' : 'cv-timeline-vertical-item';
                    const item = createEl('div', { className: activeClass });

                    const dateDiv = createEl('div', { className: 'cv-timeline-date' });
                    const icon = createEl('i', { className: 'fas fa-calendar-alt', attrs: { 'aria-hidden': 'true' } });
                    dateDiv.append(icon, ' ', document.createTextNode(safeText(c.date)));

                    const titleDiv = createEl('div', { className: 'cv-timeline-title', text: c.title });
                    const descDiv = createEl('div', { className: 'cv-timeline-desc', text: c.desc });

                    item.append(dateDiv, titleDiv, descDiv);
                    egitimContent.appendChild(item);
                });
            } else {
                const empty = createEl('p', { className: 'cv-entry-desc', text: 'Eğitim bilgisi bulunamadı. Admin panelden ekleyebilirsiniz.' });
                egitimContent.appendChild(empty);
            }
        }

        // 4. Teknik Yetenekler
        const skillsContent = document.getElementById('cv-skills-content');
        if (skillsContent) {
            clearEl(skillsContent);
            const skillsList = cvData.yetenekler || [];
            skillsList.forEach(s => {
                const skill = createEl('div', { className: 'cv-skill' });

                const header = createEl('div', { className: 'cv-skill-header' });
                const nameSpan = createEl('span', { className: 'cv-skill-name', text: s.name });
                const percentSpan = createEl('span', { className: 'cv-skill-percent', text: `${s.level}%` });
                header.append(nameSpan, percentSpan);

                const barOuter = createEl('div', { className: 'cv-skill-bar-outer' });
                const barInner = createEl('div', {
                    className: 'cv-skill-bar-inner',
                    attrs: { style: `width: ${s.level}%` }
                });
                barOuter.appendChild(barInner);

                skill.append(header, barOuter);
                skillsContent.appendChild(skill);
            });
        }

        // 5. Proje Deneyimleri (Dynamically from appData.projeler, satisfying admin panel integration)
        const projelerContent = document.getElementById('cv-projeler-content');
        if (projelerContent) {
            clearEl(projelerContent);
            if (appData.projeler && appData.projeler.length > 0) {
                appData.projeler.forEach(p => {
                    const block = createEl('div', { className: 'cv-entry-block' });

                    const header = createEl('div', { className: 'cv-entry-header' });
                    const title = createEl('h4', { className: 'cv-entry-title', text: p.title });
                    const tagSpan = createEl('span', { className: 'cv-entry-tag' });
                    const icon = createEl('i', { className: 'fas fa-microchip', attrs: { 'aria-hidden': 'true' } });
                    tagSpan.append(icon, ' Proje');
                    header.append(title, tagSpan);

                    const desc = createEl('p', { className: 'cv-entry-desc', text: p.desc });

                    const techStack = createEl('div', {
                        className: 'tech-stack',
                        attrs: { style: 'margin-top: 0.5rem;' }
                    });
                    (p.tech || []).forEach(t => {
                        techStack.appendChild(createEl('span', { className: 'tech-tag', text: t }));
                    });

                    block.append(header, desc, techStack);
                    projelerContent.appendChild(block);
                });
            } else {
                const empty = createEl('p', { className: 'cv-entry-desc', text: 'Proje bilgisi bulunamadı. Admin panelden ekleyebilirsiniz.' });
                projelerContent.appendChild(empty);
            }
        }

        // 6. Deneyim / Çalışmalar (From DetailedCVData)
        const deneyimContent = document.getElementById('cv-deneyim-content');
        if (deneyimContent) {
            clearEl(deneyimContent);
            cvData.deneyimler.forEach(d => {
                const block = createEl('div', { className: 'cv-entry-block' });

                const header = createEl('div', { className: 'cv-entry-header' });
                const title = createEl('h4', { className: 'cv-entry-title', text: d.baslik });
                const tagSpan = createEl('span', { className: 'cv-entry-tag', text: d.tip });
                header.append(title, tagSpan);

                const meta = createEl('div', { className: 'cv-entry-meta' });
                const icon = createEl('i', { className: 'fas fa-clock', attrs: { 'aria-hidden': 'true' } });
                meta.append(icon, ' ', document.createTextNode(safeText(d.tarih)));

                const desc = createEl('p', { className: 'cv-entry-desc', text: d.aciklama });

                block.append(header, meta, desc);
                deneyimContent.appendChild(block);
            });
        }

        // 7. Sertifikalar (Dynamically from appData.sertifikalar, satisfying admin panel integration)
        const sertifikalarContent = document.getElementById('cv-sertifikalar-content');
        if (sertifikalarContent) {
            clearEl(sertifikalarContent);
            if (appData.sertifikalar && appData.sertifikalar.length > 0) {
                appData.sertifikalar.forEach(s => {
                    const block = createEl('div', { className: 'cv-entry-block' });

                    const header = createEl('div', { className: 'cv-entry-header' });
                    const title = createEl('h4', { className: 'cv-entry-title', text: s.title });
                    const tagSpan = createEl('span', { className: 'cv-entry-tag', text: s.issuer });
                    header.append(title, tagSpan);

                    const meta = createEl('div', { className: 'cv-entry-meta' });
                    const icon = createEl('i', { className: 'fas fa-award', attrs: { 'aria-hidden': 'true' } });
                    meta.append(icon, ' ', document.createTextNode(safeText(s.date)));

                    block.append(header, meta);
                    sertifikalarContent.appendChild(block);
                });
            } else {
                const empty = createEl('p', { className: 'cv-entry-desc', text: 'Sertifika bilgisi bulunamadı. Admin panelden ekleyebilirsiniz.' });
                sertifikalarContent.appendChild(empty);
            }
        }

        // 8. Diller
        const dillerContent = document.getElementById('cv-diller-content');
        if (dillerContent) {
            clearEl(dillerContent);
            const languagesList = cvData.diller || [];
            languagesList.forEach(d => {
                const item = createEl('div', { className: 'cv-dil-item' });

                const info = createEl('div', { className: 'cv-dil-info' });
                const nameSpan = createEl('span', { className: 'cv-dil-name', text: d.ad });
                const levelSpan = createEl('span', { className: 'cv-dil-level', text: d.label });
                info.append(nameSpan, levelSpan);

                const bar = createEl('div', { className: 'cv-dil-bar' });
                const barInner = createEl('div', {
                    className: 'cv-dil-bar-inner',
                    attrs: { style: `width: ${d.level}%` }
                });
                bar.appendChild(barInner);

                item.append(info, bar);
                dillerContent.appendChild(item);
            });
        }

        // 9. İlgi Alanları
        const ilgiContent = document.getElementById('cv-ilgi-content');
        if (ilgiContent) {
            clearEl(ilgiContent);
            const interestsList = cvData.ilgiAlanlari || [];
            interestsList.forEach(tag => {
                ilgiContent.appendChild(createEl('span', { className: 'cv-tag', text: tag }));
            });
        }

        // 10. CV Notları
        const notlarContent = document.getElementById('cv-notlar-content');
        if (notlarContent) {
            notlarContent.textContent = cvData.notlar;
        }
    }

    function renderSertifikalar() {
        const grid = document.getElementById('sertifikalar-grid');
        clearEl(grid);
        if (!grid) return;
        (appData.sertifikalar || []).forEach(s => {
            const card = createEl('div', { className: 'card' });

            const h3 = createEl('h3');
            const icon = createEl('i', { className: 'fas fa-certificate', attrs: { 'aria-hidden': 'true' } });
            h3.append(icon, ' ', document.createTextNode(safeText(s.title)));

            const pIssuer = createEl('p');
            const strongIssuer = createEl('strong', { text: 'Kurum: ' });
            pIssuer.append(strongIssuer, document.createTextNode(safeText(s.issuer)));

            const pDate = createEl('p');
            const strongDate = createEl('strong', { text: 'Tarih: ' });
            pDate.append(strongDate, document.createTextNode(safeText(s.date)));

            card.append(h3, pIssuer, pDate);
            grid.appendChild(card);
        });
    }

    function renderAll() {
        renderHakkimda();
        renderProjeler();
        renderBasarilar();
        renderCV();
        renderSertifikalar();
    }

    function renderAuthLoading() {
        views.forEach(v => {
            v.classList.remove('active', 'fade-in');
            v.style.display = 'none';
        });

        const adminView = document.getElementById("view-admin");
        if (!adminView) return;

        adminView.style.display = 'block';
        adminView.classList.add('active', 'fade-in');

        // Find or create the loading panel
        let loadingPanel = document.getElementById("admin-auth-loading");
        if (!loadingPanel) {
            loadingPanel = createEl("div", {
                className: "container auth-loading-panel",
                attrs: { id: "admin-auth-loading" }
            });
            const title = createEl("h2", { text: "AUTH CHECK..." });
            const desc = createEl("p", { text: "Admin yetkisi doğrulanıyor. Lütfen bekle." });
            loadingPanel.append(title, desc);
            adminView.appendChild(loadingPanel);
        }

        // Hide all other children of adminView
        Array.from(adminView.children).forEach(child => {
            if (child.id === "admin-auth-loading") {
                child.style.display = "block";
            } else {
                // Keep track of original display if not already stored
                if (!child.dataset.origDisplay) {
                    child.dataset.origDisplay = child.style.display || "block";
                }
                child.style.display = "none";
            }
        });
    }

    function renderAdmin() {
        if (!authReady || !isAdmin(currentUser)) {
            window.location.hash = '#admin-login';
            return;
        }

        views.forEach(v => {
            v.classList.remove('active', 'fade-in');
            v.style.display = 'none';
        });

        const adminView = document.getElementById("view-admin");
        if (adminView) {
            adminView.style.display = 'block';
            
            // Hide loading panel if it exists
            const loadingPanel = document.getElementById("admin-auth-loading");
            if (loadingPanel) {
                loadingPanel.style.display = "none";
            }

            // Restore all other children of adminView
            Array.from(adminView.children).forEach(child => {
                if (child.id !== "admin-auth-loading") {
                    child.style.display = child.dataset.origDisplay || "";
                }
            });

            void adminView.offsetWidth;
            adminView.classList.add('active', 'fade-in');
        }
        
        stopOscilloscope();
        nav.style.display = 'none';
        
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        
        initAdmin();
        
        window.scrollTo(0, 0);
    }

    function renderAdminLogin() {
        views.forEach(v => {
            v.classList.remove('active', 'fade-in');
            v.style.display = 'none';
        });

        const loginView = document.getElementById("view-admin-login");
        if (loginView) {
            loginView.style.display = 'flex';
            const emailInput    = document.getElementById('admin-email');
            const passwordInput = document.getElementById('admin-password');
            const errorMsg      = document.getElementById('login-error');
            if (emailInput)    emailInput.value = '';
            if (passwordInput) passwordInput.value = '';
            if (errorMsg)      errorMsg.style.display = 'none';

            void loginView.offsetWidth;
            loginView.classList.add('active', 'fade-in');
        }
        
        stopOscilloscope();
        nav.style.display = 'none';
        
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        
        renderAll();
        
        window.scrollTo(0, 0);
    }

    // ROUTING
    function handleRoute() {
        let hash = window.location.hash.substring(1) || 'home';

        if (!ADMIN_ENABLED && (hash === "admin" || hash === "admin-login")) {
            window.location.hash = "#home";
            showToast("Admin paneli geçici olarak kapalı.", "info");
            return;
        }

        if (hash === "admin") {
            if (!authReady) {
                renderAuthLoading();
                return;
            }

            if (!isAdmin(currentUser)) {
                window.location.hash = "#admin-login";
                showToast("Admin paneli için giriş yapmalısın.", "warning");
                return;
            }

            renderAdmin();
            return;
        }

        if (hash === "admin-login") {
            if (!authReady) {
                renderAuthLoading();
                return;
            }

            if (isAdmin(currentUser)) {
                window.location.hash = "#admin";
                return;
            }

            renderAdminLogin();
            return;
        }

        // Hide all views
        views.forEach(v => {
            v.classList.remove('active', 'fade-in');
            v.style.display = 'none';
        });

        // Show target view
        const targetView = document.getElementById(`view-${hash}`);
        if (targetView) {
            // Apply flex if it's home
            if (hash === 'home') {
                targetView.style.display = 'flex';
                const randomDirenc = Math.floor(Math.random() * 7) + 1;
                const heroBg = document.querySelector('.hero-bg-image');
                if (heroBg) {
                    heroBg.style.setProperty('background-image', `url(./direnc${randomDirenc}.png)`, 'important');
                }
            } else {
                targetView.style.display = 'block';
            }

            // Trigger reflow for animation
            void targetView.offsetWidth;
            targetView.classList.add('active', 'fade-in');
        }

        // Manage oscilloscope activity based on routing
        if (hash === 'hakkimda') {
            startOscilloscope();
        } else {
            stopOscilloscope();
        }

        // Manage Navbar
        if (hash === 'home') {
            nav.style.display = 'none';
        } else {
            nav.style.display = 'flex';
        }

        // Active link highlight
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[data-target="${hash}"]`);
        if (activeLink) activeLink.classList.add('active');

        // Always render regular data for other pages
        renderAll();
        
        if (hash === 'cv') {
            setTimeout(initReveal, 100);
        }
        
        window.scrollTo(0,0);
    }

    window.addEventListener('hashchange', handleRoute);
    try {
        handleRoute(); // initial call
    } catch (err) {
        console.error("Initial routing error:", err);
    } finally {
        hidePreloader();
    }

    // ADMIN LOGIN
    const adminLoginForm = document.getElementById('admin-login-form');
    const adminEmailInput = document.getElementById('admin-email');
    const adminPasswordInput = document.getElementById('admin-password');

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            checkLogin();
        });
    }

    if (adminPasswordInput) {
        adminPasswordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                checkLogin();
            }
        });
        
        // Kullanıcı yeni bir şey yazmaya başladığında hatayı gizle
        adminPasswordInput.addEventListener('input', () => {
            const errorMsg = document.getElementById('login-error');
            if (errorMsg) errorMsg.style.display = 'none';
        });
    }

    if (adminEmailInput) {
        adminEmailInput.addEventListener('input', () => {
            const errorMsg = document.getElementById('login-error');
            if (errorMsg) errorMsg.style.display = 'none';
        });
    }

    function checkLogin() {
        const email = adminEmailInput.value.trim();
        const pwd = adminPasswordInput.value;
        const errorMsg = document.getElementById('login-error');

        if (auth) {
            signInWithEmailAndPassword(auth, email, pwd)
                .then((userCredential) => {
                    errorMsg.style.display = 'none';

                    // ── Email doğrulaması: sadece whitelisted admin kabul edilsin ──
                    if (!isAdmin(userCredential.user)) {
                        // Firebase'de başka bir hesap giriş yaptı — hemen oturumu kapat
                        signOut(auth)
                            .then(() => {
                                showToast('Bu hesap admin yetkisine sahip değil.', 'error');
                            })
                            .catch(console.error);
                        errorMsg.textContent = 'HATA: Bu hesap admin yetkisine sahip değil!';
                        errorMsg.style.display = 'block';
                        return;
                    }

                    // Doğrulama başarılı — onAuthStateChanged yönlendirmeyi halleder
                    showToast('Kimlik doğrulandı. Hoş geldiniz!', 'success');
                })
                .catch((error) => {
                    console.error('Giriş hatası:', error.code);
                    let mesaj = 'Giriş başarısız oldu.';

                    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                        mesaj = 'E-posta veya şifre yanlış!';
                    } else if (error.code === 'auth/user-not-found') {
                        mesaj = 'Kayıtlı kullanıcı bulunamadı!';
                    } else if (error.code === 'auth/invalid-email') {
                        mesaj = 'Geçersiz e-posta adresi!';
                    } else if (error.code === 'auth/too-many-requests') {
                        mesaj = 'Çok fazla deneme yaptınız. Lütfen bekleyin.';
                    }

                    errorMsg.textContent = 'HATA: ' + mesaj;
                    errorMsg.style.display = 'block';
                });
        } else {
            errorMsg.textContent = "FIREBASE AYARLANMADI (App.js'yi kontrol edin)";
            errorMsg.style.display = 'block';
        }
    }

    document.getElementById('logout-btn').addEventListener('click', async () => {
        const badge = document.getElementById('msg-badge');
        if (badge) {
            badge.style.display = 'none';
            badge.textContent = '';
        }
        
        if (auth) {
            try {
                await signOut(auth);
                isAdminLoggedIn = false;
                currentUser = null;
                window.location.hash = '#admin-login';
                showToast('Admin oturumu kapatıldı.', 'info');
            } catch (error) {
                console.error("Çıkış hatası:", error);
            }
        } else {
            // Firebase yoksa test modunda çıkış
            isAdminLoggedIn = false;
            currentUser = null;
            window.location.hash = '#admin-login';
            showToast('Admin oturumu kapatıldı.', 'info');
            handleRoute();
        }
    });

    // ADMIN LOGIC
    function initAdmin() {
        if (!authReady || !isAdmin(currentUser)) {
            return;
        }
        document.getElementById('hakkimda-text').value = appData.hakkimda;
        updateThemeInputs(loadSavedThemeColors());

        ensureDetailedCV();
        const cvData = getDetailedCVData();
        tempSkills = typeof structuredClone === "function" ? structuredClone(cvData.yetenekler || []) : JSON.parse(JSON.stringify(cvData.yetenekler || []));
        tempLanguages = typeof structuredClone === "function" ? structuredClone(cvData.diller || []) : JSON.parse(JSON.stringify(cvData.diller || []));
        tempInterests = typeof structuredClone === "function" ? structuredClone(cvData.ilgiAlanlari || []) : JSON.parse(JSON.stringify(cvData.ilgiAlanlari || []));

        renderAdminLists();
        initAdminKisisel();
        initAdminTabs();

        // Setup slider live event listeners for Skills and Languages
        setupRangeSliders();

        if(window.renderAdminMessages) window.renderAdminMessages();
        if(window.updateMessageBadge) window.updateMessageBadge();
    }

    function setupRangeSliders() {
        const skillLvl = document.getElementById('skill-level');
        const skillLvlVal = document.getElementById('skill-level-value');
        if (skillLvl && skillLvlVal) {
            skillLvlVal.textContent = `${skillLvl.value}%`;
            skillLvl.addEventListener('input', (e) => {
                skillLvlVal.textContent = `${e.target.value}%`;
            });
        }
        const langLvl = document.getElementById('language-level');
        const langLvlVal = document.getElementById('language-level-value');
        if (langLvl && langLvlVal) {
            langLvlVal.textContent = `${langLvl.value}%`;
            langLvl.addEventListener('input', (e) => {
                langLvlVal.textContent = `${e.target.value}%`;
            });
        }
    }

    function renderAdminList(containerId, array, getTitle, editCallback, deleteCallback) {
        const container = document.getElementById(containerId);
        clearEl(container);
        if (!container) return;

        array.forEach((item, index) => {
            const div = createEl('div', { className: 'item-row' });
            
            const textDiv = createEl('div');
            const strong = createEl('strong', { className: 'theme-text', text: getTitle(item) });
            textDiv.appendChild(strong);
            
            const actionsDiv = createEl('div', { className: 'item-actions' });
            
            const btnEdit = createEl('button', { className: 'btn', text: 'Düzenle' });
            btnEdit.onclick = () => editCallback(index);
            
            const btnDel = createEl('button', { className: 'btn btn-danger', text: 'Sil' });
            btnDel.onclick = () => deleteCallback(index);

            actionsDiv.append(btnEdit, btnDel);
            div.append(textDiv, actionsDiv);
            container.appendChild(div);
        });
    }

    function renderAdminLists() {
        renderAdminList('list-projeler', appData.projeler || [], i => i.title, editProje, (idx) => deleteItem('projeler', idx));
        renderAdminList('list-basarilar', appData.basarilar || [], i => i.title, editBasari, (idx) => deleteItem('basarilar', idx));
        
        ensureDetailedCV();
        renderAdminList('list-cv', appData.detailedCV.deneyimler || [], i => i.baslik, editCV, async (idx) => {
            cyberConfirm('Bu deneyim kaydını silmek istediğine emin misin?', async () => {
                appData.detailedCV.deneyimler.splice(idx, 1);
                await saveGlobal();
                showToast('Kayıt başarıyla silindi.', 'success');
            }, () => showToast('Silme işlemi iptal edildi.', 'info'));
        });
        
        renderAdminList('list-sertifikalar', appData.sertifikalar || [], i => i.title, editSertifika, (idx) => deleteItem('sertifikalar', idx));
        renderAdminEgitimList();

        // Render CV expanded sections
        renderAdminSkillsEditor();
        renderAdminLanguagesEditor();
        renderAdminInterestsEditor();
    }

    async function saveGlobal() {
        await window.DataService.saveData(appData);
        renderAdminLists();
        renderAll();
    }

    // ─── ADMIN: TEKNİK YETENEKLER ADMİN (CRUD) ──────────────────────────────
    function renderAdminSkillsEditor() {
        const container = document.getElementById('list-skills');
        if (!container) return;
        clearEl(container);

        tempSkills.forEach((item, index) => {
            const div = createEl('div', { className: 'item-row' });
            
            const textDiv = createEl('div');
            const strong = createEl('strong', { className: 'theme-text', text: item.name });
            const span = createEl('span', { text: ` — Seviye: ${item.level}%`, attrs: { style: 'color: var(--text-secondary); margin-left: 5px;' } });
            textDiv.append(strong, span);
            
            const actionsDiv = createEl('div', { className: 'item-actions' });
            const btnEdit = createEl('button', { className: 'btn', text: 'Düzenle', attrs: { type: 'button' } });
            btnEdit.onclick = () => editSkill(index);
            const btnDel = createEl('button', { className: 'btn btn-danger', text: 'Sil', attrs: { type: 'button' } });
            btnDel.onclick = () => deleteSkill(index);

            actionsDiv.append(btnEdit, btnDel);
            div.append(textDiv, actionsDiv);
            container.appendChild(div);
        });
    }

    function editSkill(idx) {
        const item = tempSkills[idx];
        if (!item) return;
        document.getElementById('skill-id').value = idx;
        document.getElementById('skill-name').value = item.name;
        document.getElementById('skill-level').value = item.level;
        document.getElementById('skill-level-value').textContent = `${item.level}%`;
        setEditMode('form-skills', 'skill-edit-status', 'skill-submit-btn', 'skill-cancel', true);
        document.getElementById('skill-name').focus();
    }

    function deleteSkill(idx) {
        cyberConfirm('Bu yeteneği listeden çıkarmak istediğine emin misin?', () => {
            tempSkills.splice(idx, 1);
            renderAdminSkillsEditor();
            showToast('Yetenek listeden çıkarıldı. Değişiklikleri kaydetmek için "Teknik Yetenekleri Kaydet" butonuna basın.', 'info');
        });
    }

    const formSkills = document.getElementById('form-skills');
    if (formSkills) {
        formSkills.addEventListener('submit', (e) => {
            e.preventDefault();
            const idInput = document.getElementById('skill-id').value;
            const name = normalizeInput(document.getElementById('skill-name').value, 60);
            const levelVal = document.getElementById('skill-level').value;
            const level = Math.min(100, Math.max(0, Number(levelVal) || 0));

            if (!name) {
                showToast('Yetenek adı boş olamaz.', 'warning');
                return;
            }

            const item = { name, level };

            if (idInput !== '') {
                tempSkills[parseInt(idInput)] = item;
                showToast('Yetenek listede güncellendi.', 'success');
            } else {
                tempSkills.push(item);
                showToast('Yetenek listeye eklendi.', 'success');
            }

            formSkills.reset();
            document.getElementById('skill-id').value = '';
            document.getElementById('skill-level-value').textContent = '50%';
            setEditMode('form-skills', 'skill-edit-status', 'skill-submit-btn', 'skill-cancel', false);
            renderAdminSkillsEditor();
        });
    }

    const btnSkillCancel = document.getElementById('skill-cancel');
    if (btnSkillCancel) {
        btnSkillCancel.onclick = () => {
            if (formSkills) formSkills.reset();
            document.getElementById('skill-id').value = '';
            document.getElementById('skill-level-value').textContent = '50%';
            setEditMode('form-skills', 'skill-edit-status', 'skill-submit-btn', 'skill-cancel', false);
            showToast('Düzenleme iptal edildi.', 'info');
        };
    }

    const btnSaveSkills = document.getElementById('btn-save-skills');
    if (btnSaveSkills) {
        btnSaveSkills.addEventListener('click', async () => {
            ensureDetailedCV();
            appData.detailedCV.yetenekler = typeof structuredClone === "function" ? structuredClone(tempSkills) : JSON.parse(JSON.stringify(tempSkills));
            try {
                await window.DataService.saveData(appData);
                renderCV();
                showToast('Teknik yetenekler güncellendi.', 'success');
            } catch (err) {
                console.error("Yetenek kaydetme hatası:", err);
                showToast('Teknik yetenekler kaydedilemedi.', 'error');
            }
        });
    }

    // ─── ADMIN: DİLLER ADMİN (CRUD) ─────────────────────────────────────────
    function renderAdminLanguagesEditor() {
        const container = document.getElementById('list-languages');
        if (!container) return;
        clearEl(container);

        tempLanguages.forEach((item, index) => {
            const div = createEl('div', { className: 'item-row' });
            
            const textDiv = createEl('div');
            const strong = createEl('strong', { className: 'theme-text', text: item.ad });
            const span = createEl('span', { text: ` — Seviye: ${item.level}% (${item.label || ''})`, attrs: { style: 'color: var(--text-secondary); margin-left: 5px;' } });
            textDiv.append(strong, span);
            
            const actionsDiv = createEl('div', { className: 'item-actions' });
            const btnEdit = createEl('button', { className: 'btn', text: 'Düzenle', attrs: { type: 'button' } });
            btnEdit.onclick = () => editLanguage(index);
            const btnDel = createEl('button', { className: 'btn btn-danger', text: 'Sil', attrs: { type: 'button' } });
            btnDel.onclick = () => deleteLanguage(index);

            actionsDiv.append(btnEdit, btnDel);
            div.append(textDiv, actionsDiv);
            container.appendChild(div);
        });
    }

    function editLanguage(idx) {
        const item = tempLanguages[idx];
        if (!item) return;
        document.getElementById('language-id').value = idx;
        document.getElementById('language-ad').value = item.ad;
        document.getElementById('language-level').value = item.level;
        document.getElementById('language-level-value').textContent = `${item.level}%`;
        document.getElementById('language-label').value = item.label || '';
        setEditMode('form-languages', 'language-edit-status', 'language-submit-btn', 'language-cancel', true);
        document.getElementById('language-ad').focus();
    }

    function deleteLanguage(idx) {
        cyberConfirm('Bu dili listeden çıkarmak istediğine emin misin?', () => {
            tempLanguages.splice(idx, 1);
            renderAdminLanguagesEditor();
            showToast('Dil listeden çıkarıldı. Değişiklikleri kaydetmek için "Dilleri Kaydet" butonuna basın.', 'info');
        });
    }

    const formLanguages = document.getElementById('form-languages');
    if (formLanguages) {
        formLanguages.addEventListener('submit', (e) => {
            e.preventDefault();
            const idInput = document.getElementById('language-id').value;
            const ad = normalizeInput(document.getElementById('language-ad').value, 40);
            const levelVal = document.getElementById('language-level').value;
            const level = Math.min(100, Math.max(0, Number(levelVal) || 0));
            const label = normalizeInput(document.getElementById('language-label').value, 80);

            if (!ad) {
                showToast('Dil adı boş olamaz.', 'warning');
                return;
            }

            const item = { ad, level, label };

            if (idInput !== '') {
                tempLanguages[parseInt(idInput)] = item;
                showToast('Dil listede güncellendi.', 'success');
            } else {
                tempLanguages.push(item);
                showToast('Dil listeye eklendi.', 'success');
            }

            formLanguages.reset();
            document.getElementById('language-id').value = '';
            document.getElementById('language-level-value').textContent = '50%';
            setEditMode('form-languages', 'language-edit-status', 'language-submit-btn', 'language-cancel', false);
            renderAdminLanguagesEditor();
        });
    }

    const btnLanguageCancel = document.getElementById('language-cancel');
    if (btnLanguageCancel) {
        btnLanguageCancel.onclick = () => {
            if (formLanguages) formLanguages.reset();
            document.getElementById('language-id').value = '';
            document.getElementById('language-level-value').textContent = '50%';
            setEditMode('form-languages', 'language-edit-status', 'language-submit-btn', 'language-cancel', false);
            showToast('Düzenleme iptal edildi.', 'info');
        };
    }

    const btnSaveLanguages = document.getElementById('btn-save-languages');
    if (btnSaveLanguages) {
        btnSaveLanguages.addEventListener('click', async () => {
            ensureDetailedCV();
            appData.detailedCV.diller = typeof structuredClone === "function" ? structuredClone(tempLanguages) : JSON.parse(JSON.stringify(tempLanguages));
            try {
                await window.DataService.saveData(appData);
                renderCV();
                showToast('Dil bilgileri güncellendi.', 'success');
            } catch (err) {
                console.error("Dil kaydetme hatası:", err);
                showToast('Dil bilgileri kaydedilemedi.', 'error');
            }
        });
    }

    // ─── ADMIN: İLGİ ALANLARI ADMİN (CRUD) ──────────────────────────────────
    function renderAdminInterestsEditor() {
        const container = document.getElementById('list-interests');
        if (!container) return;
        clearEl(container);

        tempInterests.forEach((item, index) => {
            const div = createEl('div', { className: 'item-row' });
            
            const textDiv = createEl('div');
            const strong = createEl('strong', { className: 'theme-text', text: item });
            textDiv.appendChild(strong);
            
            const actionsDiv = createEl('div', { className: 'item-actions' });
            const btnDel = createEl('button', { className: 'btn btn-danger', text: 'Sil', attrs: { type: 'button' } });
            btnDel.onclick = () => deleteInterest(index);

            actionsDiv.appendChild(btnDel);
            div.append(textDiv, actionsDiv);
            container.appendChild(div);
        });
    }

    function deleteInterest(idx) {
        cyberConfirm('Bu ilgi alanını listeden çıkarmak istediğine emin misin?', () => {
            tempInterests.splice(idx, 1);
            renderAdminInterestsEditor();
            showToast('İlgi alanı listeden çıkarıldı. Değişiklikleri kaydetmek için "İlgi Alanlarını Kaydet" butonuna basın.', 'info');
        });
    }

    const formInterests = document.getElementById('form-interests');
    if (formInterests) {
        formInterests.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = normalizeInput(document.getElementById('interest-name').value, 80);

            if (!name) {
                showToast('İlgi alanı boş olamaz.', 'warning');
                return;
            }

            if (tempInterests.some(item => item.toLowerCase() === name.toLowerCase())) {
                showToast('Bu ilgi alanı zaten listede var.', 'warning');
                return;
            }

            tempInterests.push(name);
            showToast('İlgi alanı listeye eklendi.', 'success');

            formInterests.reset();
            renderAdminInterestsEditor();
        });
    }

    const btnSaveInterests = document.getElementById('btn-save-interests');
    if (btnSaveInterests) {
        btnSaveInterests.addEventListener('click', async () => {
            ensureDetailedCV();
            appData.detailedCV.ilgiAlanlari = typeof structuredClone === "function" ? structuredClone(tempInterests) : JSON.parse(JSON.stringify(tempInterests));
            try {
                await window.DataService.saveData(appData);
                renderCV();
                showToast('İlgi alanları güncellendi.', 'success');
            } catch (err) {
                console.error("İlgi alanı kaydetme hatası:", err);
                showToast('İlgi alanları kaydedilemedi.', 'error');
            }
        });
    }

    // ---- Cyber Confirm Modal ----
    let activeFocusElementBeforeModal = null;
    function cyberConfirm(text, onConfirm, onCancel) {
        const overlay = document.getElementById('confirm-modal-overlay');
        const textEl  = document.getElementById('confirm-modal-text');
        const btnOk   = document.getElementById('confirm-modal-confirm');
        const btnCx   = document.getElementById('confirm-modal-cancel');
        if (!overlay) { if (window.confirm(text)) onConfirm(); else if (onCancel) onCancel(); return; }
        if (textEl) textEl.textContent = text;
        
        activeFocusElementBeforeModal = document.activeElement;
        overlay.style.display = '';
        
        // Move focus to cancel button
        if (btnCx) btnCx.focus();
        
        const close = () => { 
            overlay.style.display = 'none'; 
            btnOk.onclick = null; 
            btnCx.onclick = null; 
            document.removeEventListener('keydown', handleModalKeys);
            if (activeFocusElementBeforeModal && typeof activeFocusElementBeforeModal.focus === 'function') {
                activeFocusElementBeforeModal.focus();
            }
        };
        
        const handleModalKeys = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                close();
                if (onCancel) onCancel();
            }
            if (e.key === 'Tab') {
                // Focus trap / lock inside confirm modal (only btnCx and btnOk are focusable elements inside modal)
                const focusable = [btnCx, btnOk].filter(Boolean);
                if (focusable.length > 0) {
                    const first = focusable[0];
                    const last = focusable[focusable.length - 1];
                    if (e.shiftKey) {
                        if (document.activeElement === first) {
                            e.preventDefault();
                            last.focus();
                        }
                    } else {
                        if (document.activeElement === last) {
                            e.preventDefault();
                            first.focus();
                        }
                    }
                }
            }
        };
        
        document.addEventListener('keydown', handleModalKeys);
        
        btnOk.onclick = () => { close(); onConfirm(); };
        btnCx.onclick = () => { close(); if (onCancel) onCancel(); };
        overlay.onclick = (e) => { if (e.target === overlay) { close(); if (onCancel) onCancel(); } };
    }

    async function deleteItem(collection, idx) {
        cyberConfirm(
            'Bu kayd\u0131 silmek istedi\u011fine emin misin?',
            async () => {
                if (!appData[collection]) appData[collection] = [];
                appData[collection].splice(idx, 1);
                await saveGlobal();
                showToast('Kay\u0131t ba\u015far\u0131yla silindi.', 'success');
            },
            () => showToast('Silme i\u015flemi iptal edildi.', 'info')
        );
    }

    // Forms Setup
    document.getElementById('form-hakkimda').addEventListener('submit', async (e) => {
        e.preventDefault();
        appData.hakkimda = document.getElementById('hakkimda-text').value;
        await saveGlobal();
        showToast('Hakkımda bilgisi başarıyla kaydedildi.', 'success');
    });

    // Real-time live color preview
    document.querySelectorAll('.theme-card input[type="color"]').forEach(input => {
        input.addEventListener('input', (e) => {
            const cssVar = e.target.dataset.var;
            const value = e.target.value;
            let cssValue = value;
            if (cssVar === '--card-bg') {
                cssValue = value + 'd9'; // 85% opacity
            } else if (cssVar === '--border-color') {
                cssValue = value + '1a'; // 10% opacity
            }
            document.documentElement.style.setProperty(cssVar, cssValue);
        });
    });

    // Save Theme Colors Button
    const btnSaveTheme = document.getElementById('btn-save-theme');
    if (btnSaveTheme) {
        btnSaveTheme.addEventListener('click', () => {
            const colors = {};
            document.querySelectorAll('.theme-card input[type="color"]').forEach(input => {
                colors[input.dataset.var] = input.value;
            });
            saveThemeColors(colors);
            showToast('Tema renkleri başarıyla kaydedildi.', 'success');
        });
    }

    // Revert to Last Saved Theme Colors Button
    const btnRevertTheme = document.getElementById('btn-revert-theme');
    if (btnRevertTheme) {
        btnRevertTheme.addEventListener('click', () => {
            revertToSavedTheme();
            showToast('Son kaydedilen renklere geri dönüldü.', 'info');
        });
    }

    // Reset to Default Theme Colors Button
    const btnDefaultTheme = document.getElementById('btn-default-theme');
    if (btnDefaultTheme) {
        btnDefaultTheme.addEventListener('click', () => {
            cyberConfirm(
                'T\u00fcm renk ayarlar\u0131n\u0131 varsay\u0131lan PCB/Elektrik temas\u0131na s\u0131f\u0131rlamak istedi\u011fine emin misin?',
                () => {
                    resetToDefaultTheme();
                    showToast('Varsay\u0131lan tema ba\u015far\u0131yla uyguland\u0131 ve kaydedildi.', 'success');
                },
                () => showToast('S\u0131f\u0131rlama iptal edildi.', 'info')
            );
        });
    }

    // --- Helper: form editing mode ---
    function setEditMode(formId, statusId, submitBtnId, cancelBtnId, active) {
        const status    = document.getElementById(statusId);
        const submitBtn = document.getElementById(submitBtnId);
        const cancelBtn = document.getElementById(cancelBtnId);
        if (status)    status.style.display    = active ? 'flex' : 'none';
        if (submitBtn) {
            clearEl(submitBtn);
            const icon = createEl('i', {
                className: active ? 'fas fa-pen-to-square' : 'fas fa-save',
                attrs: { 'aria-hidden': 'true' }
            });
            submitBtn.append(icon, active ? ' Güncelle' : ' Kaydet');
        }
        if (cancelBtn) cancelBtn.style.display  = active ? 'inline-flex' : 'none';
    }

    // Projeler
    const formProje = document.getElementById('form-projeler');
    formProje.addEventListener('submit', async (e) => {
        e.preventDefault();
        const idInput = document.getElementById('proje-id').value;
        const title   = document.getElementById('proje-title').value.trim();
        const desc    = document.getElementById('proje-desc').value.trim();
        const techRaw = document.getElementById('proje-tech').value.trim();
        const tech    = techRaw ? techRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
        if (!title || !desc) { showToast('L\u00fctfen zorunlu alanlar\u0131 doldurun.', 'warning'); return; }
        if (!appData.projeler) appData.projeler = [];
        if (idInput !== '') {
            appData.projeler[idInput] = { ...appData.projeler[idInput], title, desc, tech };
            await saveGlobal();
            showToast('Proje ba\u015far\u0131yla g\u00fcncellendi.', 'success');
        } else {
            appData.projeler.push({ id: Date.now(), title, desc, tech });
            await saveGlobal();
            showToast('Yeni proje ba\u015far\u0131yla eklendi.', 'success');
        }
        formProje.reset();
        document.getElementById('proje-id').value = '';
        setEditMode('form-projeler', 'proje-edit-status', 'proje-submit-btn', 'proje-cancel', false);
    });

    function editProje(idx) {
        const item = appData.projeler[idx];
        document.getElementById('proje-id').value    = idx;
        document.getElementById('proje-title').value = item.title;
        document.getElementById('proje-desc').value  = item.desc;
        document.getElementById('proje-tech').value  = (item.tech || []).join(', ');
        setEditMode('form-projeler', 'proje-edit-status', 'proje-submit-btn', 'proje-cancel', true);
        document.getElementById('proje-title').focus();
    }
    document.getElementById('proje-cancel').onclick = () => {
        formProje.reset();
        document.getElementById('proje-id').value = '';
        setEditMode('form-projeler', 'proje-edit-status', 'proje-submit-btn', 'proje-cancel', false);
        showToast('D\u00fczenleme iptal edildi.', 'info');
    };

    // Başarılar
    const formBasari = document.getElementById('form-basarilar');
    formBasari.addEventListener('submit', async (e) => {
        e.preventDefault();
        const idInput = document.getElementById('basari-id').value;
        const title   = document.getElementById('basari-title').value.trim();
        const desc    = document.getElementById('basari-desc').value.trim();
        const year    = document.getElementById('basari-year').value.trim();
        if (!title || !desc || !year) { showToast('L\u00fctfen zorunlu alanlar\u0131 doldurun.', 'warning'); return; }
        if (!appData.basarilar) appData.basarilar = [];
        if (idInput !== '') {
            appData.basarilar[idInput] = { ...appData.basarilar[idInput], title, desc, year };
            await saveGlobal();
            showToast('Ba\u015far\u0131 kayd\u0131 ba\u015far\u0131yla g\u00fcncellendi.', 'success');
        } else {
            appData.basarilar.push({ id: Date.now(), title, desc, year });
            await saveGlobal();
            showToast('Yeni ba\u015far\u0131 ba\u015far\u0131yla eklendi.', 'success');
        }
        formBasari.reset();
        document.getElementById('basari-id').value = '';
        setEditMode('form-basarilar', 'basari-edit-status', 'basari-submit-btn', 'basari-cancel', false);
    });

    function editBasari(idx) {
        const item = appData.basarilar[idx];
        document.getElementById('basari-id').value    = idx;
        document.getElementById('basari-title').value = item.title;
        document.getElementById('basari-desc').value  = item.desc;
        document.getElementById('basari-year').value  = item.year;
        setEditMode('form-basarilar', 'basari-edit-status', 'basari-submit-btn', 'basari-cancel', true);
        document.getElementById('basari-title').focus();
    }
    document.getElementById('basari-cancel').onclick = () => {
        formBasari.reset();
        document.getElementById('basari-id').value = '';
        setEditMode('form-basarilar', 'basari-edit-status', 'basari-submit-btn', 'basari-cancel', false);
        showToast('D\u00fczenleme iptal edildi.', 'info');
    };

    // CV
    const formCV = document.getElementById('form-cv');
    formCV.addEventListener('submit', async (e) => {
        e.preventDefault();
        ensureDetailedCV();
        if (!appData.detailedCV.deneyimler) appData.detailedCV.deneyimler = [];
        
        const idInput = document.getElementById('cv-id').value;
        const baslik  = document.getElementById('cv-title').value.trim();
        const tip     = document.getElementById('cv-tip').value.trim();
        const aciklama= document.getElementById('cv-desc').value.trim();
        const tarih   = document.getElementById('cv-date').value.trim();
        
        if (!baslik || !aciklama || !tarih || !tip) { showToast('L\u00fctfen zorunlu alanlar\u0131 doldurun.', 'warning'); return; }
        
        if (idInput !== '') {
            appData.detailedCV.deneyimler[idInput] = { ...appData.detailedCV.deneyimler[idInput], tip, baslik, aciklama, tarih };
            await saveGlobal();
            showToast('Deneyim bilgisi ba\u015far\u0131yla g\u00fcncellendi.', 'success');
        } else {
            appData.detailedCV.deneyimler.push({ tip, baslik, aciklama, tarih });
            await saveGlobal();
            showToast('Deneyim bilgisi ba\u015far\u0131yla eklendi.', 'success');
        }
        formCV.reset();
        document.getElementById('cv-id').value = '';
        setEditMode('form-cv', 'cv-edit-status', 'cv-submit-btn', 'cv-cancel', false);
    });

    function editCV(idx) {
        ensureDetailedCV();
        const item = appData.detailedCV.deneyimler[idx];
        if (!item) return;
        document.getElementById('cv-id').value    = idx;
        document.getElementById('cv-title').value = item.baslik || '';
        document.getElementById('cv-tip').value   = item.tip || '';
        document.getElementById('cv-desc').value  = item.aciklama || '';
        document.getElementById('cv-date').value  = item.tarih || '';
        setEditMode('form-cv', 'cv-edit-status', 'cv-submit-btn', 'cv-cancel', true);
        document.getElementById('cv-title').focus();
    }
    document.getElementById('cv-cancel').onclick = () => {
        formCV.reset();
        document.getElementById('cv-id').value = '';
        setEditMode('form-cv', 'cv-edit-status', 'cv-submit-btn', 'cv-cancel', false);
        showToast('D\u00fczenleme iptal edildi.', 'info');
    };

    // Sertifikalar
    const formSert = document.getElementById('form-sertifikalar');
    formSert.addEventListener('submit', async (e) => {
        e.preventDefault();
        const idInput = document.getElementById('sertifika-id').value;
        const title   = document.getElementById('sertifika-title').value.trim();
        const issuer  = document.getElementById('sertifika-issuer').value.trim();
        const date    = document.getElementById('sertifika-date').value.trim();
        if (!title || !issuer || !date) { showToast('L\u00fctfen zorunlu alanlar\u0131 doldurun.', 'warning'); return; }
        if (!appData.sertifikalar) appData.sertifikalar = [];
        if (idInput !== '') {
            appData.sertifikalar[idInput] = { ...appData.sertifikalar[idInput], title, issuer, date };
            await saveGlobal();
            showToast('Sertifika ba\u015far\u0131yla g\u00fcncellendi.', 'success');
        } else {
            appData.sertifikalar.push({ id: Date.now(), title, issuer, date });
            await saveGlobal();
            showToast('Yeni sertifika ba\u015far\u0131yla eklendi.', 'success');
        }
        formSert.reset();
        document.getElementById('sertifika-id').value = '';
        setEditMode('form-sertifikalar', 'sertifika-edit-status', 'sertifika-submit-btn', 'sertifika-cancel', false);
    });

    function editSertifika(idx) {
        const item = appData.sertifikalar[idx];
        document.getElementById('sertifika-id').value    = idx;
        document.getElementById('sertifika-title').value  = item.title;
        document.getElementById('sertifika-issuer').value = item.issuer;
        document.getElementById('sertifika-date').value   = item.date;
        setEditMode('form-sertifikalar', 'sertifika-edit-status', 'sertifika-submit-btn', 'sertifika-cancel', true);
        document.getElementById('sertifika-title').focus();
    }
    document.getElementById('sertifika-cancel').onclick = () => {
        formSert.reset();
        document.getElementById('sertifika-id').value = '';
        setEditMode('form-sertifikalar', 'sertifika-edit-status', 'sertifika-submit-btn', 'sertifika-cancel', false);
        showToast('Düzenleme iptal edildi.', 'info');
    };

    // ─── KİŞİSEL BİLGİLER ADMİN ─────────────────────────────────────────────

    function initAdminKisisel() {
        ensureDetailedCV();
        const cvData = getDetailedCVData();
        const kisisel = cvData.kisisel || [];

        const findByLabel = (label) => kisisel.find(k => k.label === label) || {};

        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val || '';
        };

        set('kisisel-adsoyad',        findByLabel('Ad Soyad').value);
        set('kisisel-bolum',          findByLabel('Bölüm').value);
        set('kisisel-universite',     findByLabel('Üniversite').value);
        set('kisisel-konum',          findByLabel('Konum').value);
        set('kisisel-eposta',         findByLabel('E-posta').value);
        set('kisisel-telefon',        findByLabel('Telefon').value);
        set('kisisel-linkedin-metin', findByLabel('LinkedIn').value);
        set('kisisel-linkedin-url',   findByLabel('LinkedIn').link);
        set('kisisel-github-metin',   findByLabel('GitHub').value);
        set('kisisel-github-url',     findByLabel('GitHub').link);
    }

    const btnSaveKisisel = document.getElementById('btn-save-kisisel');
    if (btnSaveKisisel) {
        btnSaveKisisel.addEventListener('click', async () => {
            ensureDetailedCV();

            const get = (id) => normalizeInput(document.getElementById(id)?.value || '', 300);
            const getUrl = (id) => {
                const raw = (document.getElementById(id)?.value || '').trim();
                if (!raw) return '';
                try {
                    const parsed = new URL(raw);
                    if (['http:', 'https:'].includes(parsed.protocol)) return parsed.href;
                } catch (_) {}
                return raw; // allow relative or typed strings as-is
            };

            const updated = [
                { label: 'Ad Soyad',   value: get('kisisel-adsoyad'),        icon: 'fas fa-user' },
                { label: 'Bölüm',      value: get('kisisel-bolum'),           icon: 'fas fa-graduation-cap' },
                { label: 'Üniversite', value: get('kisisel-universite'),      icon: 'fas fa-university' },
                { label: 'Konum',      value: get('kisisel-konum'),           icon: 'fas fa-map-marker-alt' },
                { label: 'E-posta',    value: get('kisisel-eposta'),          icon: 'fas fa-envelope' },
                { label: 'Telefon',    value: get('kisisel-telefon'),         icon: 'fas fa-phone' },
                { label: 'LinkedIn',   value: get('kisisel-linkedin-metin'),  icon: 'fab fa-linkedin', link: getUrl('kisisel-linkedin-url') },
                { label: 'GitHub',     value: get('kisisel-github-metin'),    icon: 'fab fa-github',   link: getUrl('kisisel-github-url') }
            ];

            appData.detailedCV.kisisel = updated;

            try {
                await window.DataService.saveData(appData);
                renderCV();
                showToast('Kişisel bilgiler güncellendi.', 'success');
            } catch (err) {
                console.error('Kişisel bilgi kayıt hatası:', err);
                showToast('Kişisel bilgiler kaydedilemedi.', 'error');
            }
        });
    }

    // ─── EĞİTİM BİLGİLERİ ADMİN (CRUD) ─────────────────────────────────────

    function renderAdminEgitimList() {
        ensureDetailedCV();
        const container = document.getElementById('list-egitim');
        if (!container) return;
        clearEl(container);

        const egitimList = appData.detailedCV.egitim || [];
        egitimList.forEach((item, index) => {
            const div = createEl('div', { className: 'item-row' });

            const textDiv = createEl('div');
            const strong = createEl('strong', { className: 'theme-text', text: item.okul || '' });
            const sub = createEl('span', {
                text: ` — ${item.bolum || ''} (${item.tarih || ''})`,
                attrs: { style: 'color: var(--text-secondary); font-size: 0.9rem;' }
            });
            textDiv.append(strong, sub);

            const actionsDiv = createEl('div', { className: 'item-actions' });
            const btnEdit = createEl('button', { className: 'btn', text: 'Düzenle' });
            btnEdit.onclick = () => editEgitim(index);
            const btnDel = createEl('button', { className: 'btn btn-danger', text: 'Sil' });
            btnDel.onclick = () => deleteEgitim(index);

            actionsDiv.append(btnEdit, btnDel);
            div.append(textDiv, actionsDiv);
            container.appendChild(div);
        });
    }

    function editEgitim(idx) {
        ensureDetailedCV();
        const item = appData.detailedCV.egitim[idx];
        if (!item) return;
        document.getElementById('egitim-id').value       = idx;
        document.getElementById('egitim-okul').value     = item.okul     || '';
        document.getElementById('egitim-bolum').value    = item.bolum    || '';
        document.getElementById('egitim-derece').value   = item.derece   || '';
        document.getElementById('egitim-tarih').value    = item.tarih    || '';
        document.getElementById('egitim-aciklama').value = item.aciklama || '';
        setEditMode('form-egitim', 'egitim-edit-status', 'egitim-submit-btn', 'egitim-cancel', true);
        document.getElementById('egitim-okul').focus();
    }

    async function deleteEgitim(idx) {
        cyberConfirm(
            'Bu eğitim kaydını silmek istediğine emin misin?',
            async () => {
                ensureDetailedCV();
                appData.detailedCV.egitim.splice(idx, 1);
                try {
                    await window.DataService.saveData(appData);
                    renderAdminEgitimList();
                    renderCV();
                    showToast('Eğitim kaydı silindi.', 'success');
                } catch (err) {
                    console.error('Eğitim silme hatası:', err);
                    showToast('Eğitim kaydı silinemedi.', 'error');
                }
            },
            () => showToast('Silme işlemi iptal edildi.', 'info')
        );
    }

    const formEgitim = document.getElementById('form-egitim');
    if (formEgitim) {
        formEgitim.addEventListener('submit', async (e) => {
            e.preventDefault();
            ensureDetailedCV();

            const idInput  = document.getElementById('egitim-id').value;
            const okul     = normalizeInput(document.getElementById('egitim-okul').value.trim(), 200);
            const bolum    = normalizeInput(document.getElementById('egitim-bolum').value.trim(), 200);
            const derece   = normalizeInput(document.getElementById('egitim-derece').value.trim(), 100);
            const tarih    = normalizeInput(document.getElementById('egitim-tarih').value.trim(), 100);
            const aciklama = normalizeInput(document.getElementById('egitim-aciklama').value.trim(), 500);

            if (!okul || !tarih) {
                showToast('Okul ve Tarih alanları zorunludur.', 'warning');
                return;
            }

            const record = { okul, bolum, derece, tarih, aciklama };

            if (idInput !== '') {
                appData.detailedCV.egitim[parseInt(idInput)] = record;
            } else {
                appData.detailedCV.egitim.push(record);
            }

            try {
                await window.DataService.saveData(appData);
                renderAdminEgitimList();
                renderCV();
                formEgitim.reset();
                document.getElementById('egitim-id').value = '';
                setEditMode('form-egitim', 'egitim-edit-status', 'egitim-submit-btn', 'egitim-cancel', false);
                showToast('Eğitim bilgileri güncellendi.', 'success');
            } catch (err) {
                console.error('Eğitim kayıt hatası:', err);
                showToast('Eğitim bilgileri kaydedilemedi.', 'error');
            }
        });
    }

    const btnEgitimCancel = document.getElementById('egitim-cancel');
    if (btnEgitimCancel) {
        btnEgitimCancel.onclick = () => {
            if (formEgitim) formEgitim.reset();
            document.getElementById('egitim-id').value = '';
            setEditMode('form-egitim', 'egitim-edit-status', 'egitim-submit-btn', 'egitim-cancel', false);
            showToast('Düzenleme iptal edildi.', 'info');
        };
    }

    // Admin Tabs Logic
    function initAdminTabs() {
        const tabs = document.querySelectorAll('.admin-tab');
        const panels = document.querySelectorAll('.admin-panel');

        if (!tabs.length || !panels.length) return;

        function activateAdminPanel(targetId) {
            tabs.forEach(tab => {
                const isActive = tab.dataset.target === targetId;
                tab.classList.toggle('active', isActive);
                tab.setAttribute('aria-selected', String(isActive));
            });

            panels.forEach(panel => {
                const isActive = panel.id === targetId;
                panel.classList.toggle('active', isActive);
                panel.hidden = !isActive;
            });
            
            if (targetId === 'panel-mesajlar' && window.renderAdminMessages) {
                window.renderAdminMessages();
            }
        }

        tabs.forEach(tab => {
            if (tab.dataset.tabReady === 'true') return;
            tab.dataset.tabReady = 'true';

            tab.addEventListener('click', () => {
                const targetId = tab.dataset.target;
                const targetPanel = document.getElementById(targetId);

                if (!targetId || !targetPanel) {
                    console.warn('Admin panel target bulunamadı:', targetId);
                    return;
                }

                activateAdminPanel(targetId);
            });
        });

        panels.forEach(panel => {
            panel.setAttribute('role', 'tabpanel');
        });

        const defaultTarget = document.querySelector('.admin-tab.active')?.dataset.target || tabs[0]?.dataset.target || 'panel-hakkimda';
        activateAdminPanel(defaultTarget);
    }

    // --- MESSAGING SYSTEM (FIRESTORE ONLY) ---
    async function saveContactMessage(message) {
        const { collection, addDoc, serverTimestamp } = window.firestoreFns || {};

        if (!window.firebaseDB || !collection || !addDoc || !serverTimestamp) {
            throw new Error("Firestore mesaj gönderme servisi hazır değil.");
        }

        const messageWithTimestamp = {
            ...message,
            createdAt: serverTimestamp()
        };

        await addDoc(collection(window.firebaseDB, "messages"), messageWithTimestamp);
    }

    async function getContactMessages() {
        if (!authReady || !isAdmin(currentUser)) {
            return [];
        }
        try {
            const { collection, getDocs, query, orderBy } = window.firestoreFns || {};
            if (!window.firebaseDB || !collection || !getDocs || !query || !orderBy) {
                throw new Error("Firestore mesaj okuma servisi hazır değil.");
            }
            const q = query(
                collection(window.firebaseDB, "messages"),
                orderBy("createdAt", "desc")
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(docSnap => ({
                firestoreId: docSnap.id,
                ...docSnap.data()
            }));
        } catch (err) {
            console.error("Firestore message fetch error:", err);
            showToast("Mesajlar Firestore'dan alınamadı.", "error");
            return [];
        }
    }

    async function deleteContactMessage(id) {
        if (!authReady || !isAdmin(currentUser)) return;
        try {
            const { doc, deleteDoc } = window.firestoreFns;
            await deleteDoc(doc(window.firebaseDB, "messages", id));
        } catch (err) {
            console.error("Firestore message delete error:", err);
            showToast("Mesaj silinemedi.", "error");
            throw err;
        }
    }

    async function updateContactMessageStatus(id, isRead) {
        if (!authReady || !isAdmin(currentUser)) return;
        try {
            const { doc, updateDoc } = window.firestoreFns;
            await updateDoc(doc(window.firebaseDB, "messages", id), { okunduDurumu: isRead });
        } catch (err) {
            console.error("Firestore message status update error:", err);
            showToast("Mesaj durumu güncellenemedi.", "error");
            throw err;
        }
    }

    window.clearOldLocalMessages = function() {
        localStorage.removeItem("contactMessages");
        localStorage.removeItem("messages");
        console.log("Eski localStorage mesajları temizlendi.");
    };

    // ---- escapeHTML utility ----
    function escapeHTML(str) {
        return String(str).replace(/[&<>'"]/g,
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
    }

    // ============================================================
    // TOAST NOTIFICATION SYSTEM
    // ============================================================
    const TOAST_ICONS = {
        success: 'fa-circle-check',
        error:   'fa-circle-xmark',
        warning: 'fa-triangle-exclamation',
        info:    'fa-circle-info'
    };
    const TOAST_TITLES = {
        success: 'BAŞARILI',
        error:   'HATA',
        warning: 'UYARI',
        info:    'BİLGİ'
    };

    function showToast(message, type = 'success', duration = 3500) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const allowedTypes = ["success", "error", "warning", "info"];
        if (!allowedTypes.includes(type)) type = "info";

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        // Screen reader notifications role assignment
        toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

        const iconClass = TOAST_ICONS[type] || TOAST_ICONS.info;
        const titleText = TOAST_TITLES[type] || 'BİLDİRİM';

        // Icon span
        const iconSpan = createEl('span', { className: 'toast-icon', attrs: { 'aria-hidden': 'true' } });
        const icon = createEl('i', { className: `fas ${iconClass}` });
        iconSpan.appendChild(icon);

        // Content div
        const contentDiv = createEl('div', { className: 'toast-content' });
        const titleDiv = createEl('div', { className: 'toast-title', text: titleText });
        const messageDiv = createEl('div', { className: 'toast-message', text: message });
        contentDiv.append(titleDiv, messageDiv);

        // Close button
        const closeBtn = createEl('button', { className: 'toast-close', attrs: { 'aria-label': 'Kapat' } });
        const closeIcon = createEl('i', { className: 'fas fa-xmark', attrs: { 'aria-hidden': 'true' } });
        closeBtn.appendChild(closeIcon);

        // Progress bar
        const progressDiv = createEl('div', {
            className: 'toast-progress',
            attrs: { style: `animation: toastProgress ${duration}ms linear forwards;` }
        });

        // Append all
        toast.append(iconSpan, contentDiv, closeBtn, progressDiv);
        container.appendChild(toast);

        // Trigger enter animation after paint
        requestAnimationFrame(() => {
            requestAnimationFrame(() => toast.classList.add('show'));
        });

        // Close button listener
        closeBtn.addEventListener('click', () => dismissToast(toast));

        // Auto-dismiss
        const timer = setTimeout(() => dismissToast(toast), duration);

        // Pause on hover
        toast.addEventListener('mouseenter', () => clearTimeout(timer));
        toast.addEventListener('mouseleave',  () => setTimeout(() => dismissToast(toast), 800));
    }

    function dismissToast(toast) {
        if (!toast || toast.dataset.dismissing) return;
        toast.dataset.dismissing = '1';
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 350);
    }

    window.copyToClipboard = function(text, kind) {
        navigator.clipboard.writeText(text).then(() => {
            if (kind === 'email') showToast('Email panoya kopyaland\u0131.', 'success');
            else if (kind === 'msg') showToast('Mesaj panoya kopyaland\u0131.', 'success');
            else showToast('Kopyaland\u0131!', 'success');
        }).catch(() => showToast('Kopyalama ba\u015far\u0131s\u0131z.', 'error'));
    }

    window.updateMessageBadge = async function() {
        if (!ADMIN_ENABLED) return;
        const badge = document.getElementById('msg-badge');
        if (!badge) return;
        if (!authReady || !isAdmin(currentUser)) {
            badge.style.display = 'none';
            badge.textContent = '';
            return;
        }
        try {
            const msgs = await getContactMessages();
            const unreadCount = Array.isArray(msgs) ? msgs.filter(m => !m.okunduDurumu).length : 0;
            if (unreadCount > 0) {
                badge.style.display = 'inline-block';
                badge.textContent = String(unreadCount);
            } else {
                badge.style.display = 'none';
                badge.textContent = '';
            }
        } catch (error) {
            console.error("Message badge update error:", error);
            badge.style.display = 'none';
            badge.textContent = '';
        }
    }

    window.deleteMessage = function(id) {
        cyberConfirm(
            'Bu mesaj\u0131 silmek istedi\u011fine emin misin?',
            async () => {
                await deleteContactMessage(id);
                if (window.renderAdminMessages) await window.renderAdminMessages();
                await window.updateMessageBadge();
                showToast('Mesaj silindi.', 'success');
            },
            () => showToast('Silme i\u015flemi iptal edildi.', 'info')
        );
    }

    window.markMessageAsRead = async function(id) {
        await updateContactMessageStatus(id, true);
        if (window.renderAdminMessages) await window.renderAdminMessages();
        await window.updateMessageBadge();
        showToast('Mesaj okundu olarak i\u015faretlendi.', 'success');
    }

    window.markMessageAsUnread = async function(id) {
        await updateContactMessageStatus(id, false);
        if (window.renderAdminMessages) await window.renderAdminMessages();
        await window.updateMessageBadge();
        showToast('Mesaj okunmad\u0131 olarak i\u015faretlendi.', 'info');
    }

    window.renderAdminMessages = async function() {
        const container = document.getElementById('admin-messages-list');
        if (!container) return;
        
        if (!authReady || !isAdmin(currentUser)) {
            container.textContent = '';
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'msg-empty-state';
            
            const iconDiv = document.createElement('div');
            iconDiv.className = 'msg-empty-icon';
            const icon = document.createElement('i');
            icon.className = 'fas fa-lock';
            iconDiv.appendChild(icon);
            
            const titleDiv = document.createElement('div');
            titleDiv.className = 'msg-empty-title';
            titleDiv.textContent = 'YETKİSİZ ERİŞİM';
            
            const descDiv = document.createElement('div');
            descDiv.className = 'msg-empty-desc';
            descDiv.textContent = 'Mesajları görüntülemek için admin girişi gerekli.';
            
            emptyDiv.appendChild(iconDiv);
            emptyDiv.appendChild(titleDiv);
            emptyDiv.appendChild(descDiv);
            container.appendChild(emptyDiv);
            return;
        }
        
        const msgs = await getContactMessages();
        
        // Clear container safely right before rendering to prevent race conditions
        container.textContent = '';

        if (!msgs || msgs.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'msg-empty-state';
            
            const iconDiv = document.createElement('div');
            iconDiv.className = 'msg-empty-icon';
            const icon = document.createElement('i');
            icon.className = 'fas fa-satellite-dish';
            iconDiv.appendChild(icon);
            
            const titleDiv = document.createElement('div');
            titleDiv.className = 'msg-empty-title';
            titleDiv.textContent = 'INBOX_EMPTY';
            
            const descDiv = document.createElement('div');
            descDiv.className = 'msg-empty-desc';
            descDiv.textContent = 'Mesaj bulunamadı veya Firestore\'dan alınamadı.';
            
            emptyDiv.appendChild(iconDiv);
            emptyDiv.appendChild(titleDiv);
            emptyDiv.appendChild(descDiv);
            container.appendChild(emptyDiv);
            return;
        }

        msgs.forEach(m => {
            const card = document.createElement('div');
            card.className = `message-card ${m.okunduDurumu ? 'read' : 'unread'}`;
            
            // Message Header
            const header = document.createElement('div');
            header.className = 'message-header';
            
            const h4 = document.createElement('h4');
            if (!m.okunduDurumu) {
                const unreadDot = document.createElement('span');
                unreadDot.className = 'msg-unread-dot';
                h4.appendChild(unreadDot);
            }
            h4.appendChild(document.createTextNode(' ' + (m.adSoyad || '') + ' '));
            
            const subjectTag = document.createElement('span');
            subjectTag.className = 'message-subject-tag';
            subjectTag.textContent = m.konu || '';
            h4.appendChild(subjectTag);
            
            const meta = document.createElement('div');
            meta.className = 'message-meta';
            const clockIcon = document.createElement('i');
            clockIcon.className = 'far fa-clock';
            meta.appendChild(clockIcon);
            meta.appendChild(document.createTextNode(' ' + (m.tarih || '') + ' ' + (m.saat || '')));
            
            header.appendChild(h4);
            header.appendChild(meta);
            
            // Email Line
            const emailLine = document.createElement('div');
            emailLine.className = 'message-email-line';
            const atIcon = document.createElement('i');
            atIcon.className = 'fas fa-at';
            emailLine.appendChild(atIcon);
            emailLine.appendChild(document.createTextNode(' ' + (m.email || '')));
            
            // Tech Info Line
            const techLine = document.createElement('div');
            techLine.className = 'message-email-line';
            techLine.style.fontSize = '0.75rem';
            techLine.style.opacity = '0.6';
            techLine.style.marginTop = '4px';
            const srcIcon = document.createElement('i');
            srcIcon.className = 'fas fa-network-wired';
            techLine.appendChild(srcIcon);
            techLine.appendChild(document.createTextNode(` Kaynak: ${m.source || 'Bilinmiyor'} | Dil: ${m.language || 'tr-TR'}`));
            
            if (m.userAgent) {
                const uaIcon = document.createElement('i');
                uaIcon.className = 'fas fa-laptop-code';
                uaIcon.style.marginLeft = '10px';
                techLine.appendChild(uaIcon);
                const shortUa = m.userAgent.length > 30 ? m.userAgent.substring(0, 30) + '...' : m.userAgent;
                techLine.appendChild(document.createTextNode(` UA: ${shortUa}`));
            }
            
            // Message Body
            const body = document.createElement('div');
            body.className = 'message-body';
            body.textContent = m.mesaj || '';
            
            // Actions
            const actions = document.createElement('div');
            actions.className = 'message-actions';
            
            // Read/Unread Button
            const toggleBtn = document.createElement('button');
            const targetId = m.firestoreId || m.id;
            if (m.okunduDurumu) {
                toggleBtn.className = 'btn';
                const eyeSlashIcon = document.createElement('i');
                eyeSlashIcon.className = 'fas fa-eye-slash';
                toggleBtn.appendChild(eyeSlashIcon);
                toggleBtn.appendChild(document.createTextNode(' Okunmad\u0131'));
                toggleBtn.addEventListener('click', () => markMessageAsUnread(targetId));
            } else {
                toggleBtn.className = 'btn btn-primary';
                const eyeIcon = document.createElement('i');
                eyeIcon.className = 'fas fa-eye';
                toggleBtn.appendChild(eyeIcon);
                toggleBtn.appendChild(document.createTextNode(' Okundu'));
                toggleBtn.addEventListener('click', () => markMessageAsRead(targetId));
            }
            
            // Copy Email Button
            const copyEmailBtn = document.createElement('button');
            copyEmailBtn.className = 'btn';
            const copyEmailIcon = document.createElement('i');
            copyEmailIcon.className = 'fas fa-at';
            copyEmailBtn.appendChild(copyEmailIcon);
            copyEmailBtn.appendChild(document.createTextNode(' Email Kopyala'));
            copyEmailBtn.addEventListener('click', () => copyToClipboard(m.email || '', 'email'));
            
            // Copy Message Button
            const copyMsgBtn = document.createElement('button');
            copyMsgBtn.className = 'btn';
            const copyMsgIcon = document.createElement('i');
            copyMsgIcon.className = 'fas fa-copy';
            copyMsgBtn.appendChild(copyMsgIcon);
            copyMsgBtn.appendChild(document.createTextNode(' Mesaj\u0131 Kopyala'));
            copyMsgBtn.addEventListener('click', () => copyToClipboard(m.mesaj || '', 'msg'));
            
            // Delete Button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger';
            const deleteIcon = document.createElement('i');
            deleteIcon.className = 'fas fa-trash';
            deleteBtn.appendChild(deleteIcon);
            deleteBtn.appendChild(document.createTextNode(' Sil'));
            deleteBtn.addEventListener('click', () => deleteMessage(targetId));
            
            actions.appendChild(toggleBtn);
            actions.appendChild(copyEmailBtn);
            actions.appendChild(copyMsgBtn);
            actions.appendChild(deleteBtn);
            
            card.appendChild(header);
            card.appendChild(emailLine);
            card.appendChild(techLine);
            card.appendChild(body);
            card.appendChild(actions);
            
            container.appendChild(card);
        });
    }

    // ─────────────────────────────────────────────────────────────────────
    // GÜVENLİK NOTU:
    // Frontend spam koruması tek başına tam güvenlik değildir.
    // Daha güçlü koruma için ileride Firebase App Check, reCAPTCHA veya Cloud Functions ile IP bazlı rate limit eklenmelidir.
    // ─────────────────────────────────────────────────────────────────────

    // Handle Contact Form Submit
    let contactFormOpenedAt = Date.now();
    const iletisimForm = document.getElementById('iletisim-form');
    if (iletisimForm) {
        iletisimForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // 1. Honeypot kontrolü
            const honeypot = document.getElementById('contact-website')?.value || "";
            if (honeypot.trim() !== "") {
                showToast("Mesaj gönderilemedi.", "error");
                return;
            }

            // 2. Form açılış zamanı kontrolü
            if (Date.now() - contactFormOpenedAt < 3000) {
                showToast("Lütfen formu göndermeden önce birkaç saniye bekle.", "warning");
                return;
            }

            // 3. 60 saniye cooldown kontrolü
            const lastSent = Number(localStorage.getItem("contact_last_sent_at") || 0);
            const nowTime = Date.now();
            if (nowTime - lastSent < 60000) {
                showToast("Çok hızlı mesaj gönderiyorsun. Lütfen biraz bekle.", "warning");
                return;
            }

            // 4. Günlük 5 mesaj limiti kontrolü
            const today = new Date().toISOString().slice(0, 10);
            const savedDate = localStorage.getItem("contact_daily_date");
            let dailyCount = Number(localStorage.getItem("contact_daily_count") || 0);
            if (savedDate !== today) {
                localStorage.setItem("contact_daily_date", today);
                localStorage.setItem("contact_daily_count", "0");
                dailyCount = 0;
            }
            if (dailyCount >= 5) {
                showToast("Bugünlük mesaj gönderme limitine ulaştın.", "warning");
                return;
            }

            const nameRaw = document.getElementById('contact-name').value;
            const emailRaw = document.getElementById('contact-email').value;
            const subjectRaw = document.getElementById('contact-subject').value;
            const messageRaw = document.getElementById('contact-message').value;

            const name = normalizeInput(nameRaw, 80);
            const email = normalizeInput(emailRaw, 120);
            const subject = normalizeInput(subjectRaw, 120);
            const message = normalizeInput(messageRaw, 2000);

            if (!name) {
                showToast('Lütfen adınızı ve soyadınızı girin.', 'error');
                return;
            }
            if (!email) {
                showToast('Lütfen email adresinizi girin.', 'error');
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showToast('Lütfen geçerli bir email adresi girin.', 'error');
                return;
            }
            if (!subject) {
                showToast('Lütfen bir konu girin.', 'error');
                return;
            }
            if (!message) {
                showToast('Lütfen mesajınızı yazın.', 'error');
                return;
            }
            if (message.length < 10) {
                showToast('Mesaj en az 10 karakter olmalıdır.', 'warning');
                return;
            }

            const submitButton = iletisimForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.dataset.originalText = submitButton.textContent;
                submitButton.textContent = "Sinyal gönderiliyor...";
            }

            try {
                const newMsg = {
                    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
                    adSoyad: name,
                    email: email.toLowerCase(),
                    konu: subject,
                    mesaj: message,
                    tarih: new Date().toLocaleDateString('tr-TR'),
                    saat: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                    okunduDurumu: false,
                    source: "contact-form",
                    userAgent: navigator.userAgent,
                    pageUrl: window.location.href,
                    language: navigator.language || "tr-TR",
                    createdAtClient: new Date().toISOString()
                };

                await saveContactMessage(newMsg);
                if (authReady && isAdmin(currentUser)) {
                    await window.updateMessageBadge(); 
                    if(window.renderAdminMessages) {
                        await window.renderAdminMessages(); 
                    }
                }

                localStorage.setItem("contact_last_sent_at", String(Date.now()));
                localStorage.setItem("contact_daily_count", String(dailyCount + 1));
                
                iletisimForm.reset();
                contactFormOpenedAt = Date.now();
                showToast('Sinyal başarıyla iletildi.', 'success');
            } catch (err) {
                console.error("Mesaj gönderim hatası:", err);
                showToast('Sinyal iletimi başarısız. Lütfen internet bağlantını kontrol edip tekrar dene.', 'error');
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = submitButton.dataset.originalText || "Gönder";
                }
            }
        });
    }

    // ─── Mobile Drawer Navigation ───────────────────────────────────────────
    const hamburger      = document.querySelector('.hamburger');
    const navLinks       = document.querySelector('.nav-links');
    const drawerOverlay  = document.getElementById('drawer-overlay');

    function openDrawer() {
        if (!navLinks) return;
        navLinks.classList.add('active');
        if (drawerOverlay) {
            drawerOverlay.classList.add('active');
            drawerOverlay.setAttribute('aria-hidden', 'false');
        }
        if (hamburger) {
            hamburger.classList.add('active');
            hamburger.setAttribute('aria-expanded', 'true');
        }
        document.body.classList.add('drawer-open');
    }

    function closeDrawer() {
        if (!navLinks) return;
        navLinks.classList.remove('active');
        if (drawerOverlay) {
            drawerOverlay.classList.remove('active');
            drawerOverlay.setAttribute('aria-hidden', 'true');
        }
        if (hamburger) {
            hamburger.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        }
        document.body.classList.remove('drawer-open');
    }

    function toggleDrawer() {
        if (navLinks && navLinks.classList.contains('active')) {
            closeDrawer();
        } else {
            openDrawer();
        }
    }

    if (hamburger) {
        hamburger.addEventListener('click', toggleDrawer);
    }

    if (drawerOverlay) {
        drawerOverlay.addEventListener('click', closeDrawer);
    }

    // Nav linklerine tıklayınca drawer kapansın
    document.querySelectorAll('.nav-link').forEach(l => {
        l.addEventListener('click', () => {
            closeDrawer();
        });
    });

    // ESC tuşuyla drawer kapansın
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks && navLinks.classList.contains('active')) {
            closeDrawer();
        }
    });

    // Ekran boyutu büyüdüğünde (desktop limitini aşınca) drawer'ı otomatik kapat
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && navLinks && navLinks.classList.contains('active')) {
            closeDrawer();
        }
    });
    // ─────────────────────────────────────────────────────────────────────────

    // --- GLOBAL KEYBOARD SHORTCUTS ---
    document.addEventListener('keydown', (e) => {
        // CTRL + SHIFT + A => ADMIN LOGIN sayfasına yönlendir
        // (Direkt #admin açılmaz; giriş yapılmamışsa korunan rotaya geçilemez)
        if (e.ctrlKey && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
            e.preventDefault();
            if (ADMIN_ENABLED) {
                window.location.hash = '#admin-login';
            } else {
                showToast("Admin paneli geçici olarak kapalı.", "info");
            }
        }
    });

    // --- SVG TRACE HOVER LOGIC ---
    const heroNodes = document.querySelectorAll('.hero-node');
    heroNodes.forEach(node => {
        node.addEventListener('mouseenter', () => {
            const targetId = node.getAttribute('data-target');
            if (targetId) {
                const traceGroup = document.getElementById(targetId);
                if (traceGroup) traceGroup.classList.add('active');
            }
        });
        node.addEventListener('mouseleave', () => {
            const targetId = node.getAttribute('data-target');
            if (targetId) {
                const traceGroup = document.getElementById(targetId);
                if (traceGroup) traceGroup.classList.remove('active');
            }
        });
    });

    // --- PAGE VISIBILITY PERFORMANCE CONTROL ---
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            stopOscilloscope();
        } else {
            const hash = window.location.hash.substring(1) || 'home';
            if (hash === 'hakkimda') {
                startOscilloscope();
            }
        }
    });

    // --- CYBER DIGITAL CLOCK CORE ---
    function initDigitalClock() {
        const timeEl = document.getElementById("digital-clock-time");
        const dateEl = document.getElementById("digital-clock-date");

        if (!timeEl || !dateEl) return;

        function updateClock() {
            const now = new Date();

            const time = now.toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            });

            const date = now.toLocaleDateString("tr-TR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                weekday: "long"
            });

            timeEl.textContent = time;
            dateEl.textContent = date;
        }

        updateClock();
        setInterval(updateClock, 1000);
    }

    // Initialize digital clock
    initDigitalClock();
});
