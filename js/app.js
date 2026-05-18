import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-analytics.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAmDAEtdDeUrv1bx5j3pRzqGIPvm4DhDK0",
    authDomain: "burakcanozay.firebaseapp.com",
    projectId: "burakcanozay",
    storageBucket: "burakcanozay.firebasestorage.app",
    messagingSenderId: "649821426691",
    appId: "1:649821426691:web:5039b949d97ede82e76a36",
    measurementId: "G-P54JNDYGFC"
};

let app, auth, analytics;
// Firebase başlatılıyor...
app = initializeApp(firebaseConfig);
auth = getAuth(app);
analytics = getAnalytics(app);

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

document.addEventListener('DOMContentLoaded', async () => {

    const views = document.querySelectorAll('.view');
    const nav = document.getElementById('main-nav');
    let appData = await window.DataService.getData();

    // Dinamik Terminal Animasyonu (İmleç Hatası Çözümü)
    document.querySelectorAll('.terminal-text').forEach(el => {
        const len = el.textContent.trim().length;
        el.style.setProperty('--term-width', `${len}ch`);
        el.style.animation = `typing 2s steps(${len}, end), blink-caret .75s step-end infinite`;
    });

    let isAdminLoggedIn = false;

    // Firebase Auth State Listener
    if (auth) {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                isAdminLoggedIn = true;
                if (window.location.hash === '#admin-login') {
                    window.location.hash = '#admin';
                }
            } else {
                isAdminLoggedIn = false;
                if (window.location.hash === '#admin') {
                    window.location.hash = '#admin-login';
                }
            }
            handleRoute(); // Auth durumu değiştiğinde görünümü güncelle
        });
    } else {
        console.warn("Firebase Auth henüz yapılandırılmadı. Lütfen app.js başındaki firebaseConfig ayarlarını doldurun.");
    }

    // Oscilloscope State Variables
    let oscAnimationId = null;
    let oscRunning = true;
    let oscGridVisible = true;
    let oscGlowEnabled = true;
    let oscTime = 0;

    // RENDER FUNCTIONS
    function renderHakkimda() {
        document.getElementById('hakkimda-content').textContent = appData.hakkimda;
        setTimeout(initOscilloscope, 50);
    }

    // OSCILLOSCOPE INTERACTIVE CONTROLLER
    function initOscilloscope() {
        const canvas = document.getElementById('oscilloscope-canvas');
        if (!canvas) return;

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

        // Dynamic update functions
        if (freqSlider) {
            freqSlider.addEventListener('input', (e) => {
                const val = e.target.value;
                if (freqValue) freqValue.textContent = `${val} Hz`;
                if (freqLabel) freqLabel.textContent = `Freq: ${val} Hz`;
                updateVppMeasurement();
            });
        }

        if (ampSlider) {
            ampSlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value).toFixed(1);
                if (ampValue) ampValue.textContent = `${val}x`;
                if (ampLabel) ampLabel.textContent = `Amp: ${val}x`;
                updateVppMeasurement();
            });
        }

        if (offsetSlider) {
            offsetSlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value).toFixed(1);
                if (offsetValue) offsetValue.textContent = val;
            });
        }

        if (timeSelect) {
            timeSelect.addEventListener('change', (e) => {
                const label = document.getElementById('scope-time-label');
                if (label) label.textContent = `Time/Div: ${e.target.value} ms`;
            });
        }

        if (voltSelect) {
            voltSelect.addEventListener('change', (e) => {
                const label = document.getElementById('scope-volt-label');
                if (label) label.textContent = `Volt/Div: ${e.target.value} V`;
                updateVppMeasurement();
            });
        }

        if (couplingSelect) {
            couplingSelect.addEventListener('change', (e) => {
                const label = document.getElementById('scope-coupling-label');
                if (label) label.textContent = `Coupling: ${e.target.value.toUpperCase()}`;
                updateVppMeasurement();
            });
        }

        if (triggerSelect) {
            triggerSelect.addEventListener('change', (e) => {
                const label = document.getElementById('scope-trigger-label');
                if (label) label.textContent = `Trigger: ${e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1)}`;
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
            };
        }

        const glowBtn = document.getElementById('scope-glow-toggle');
        if (glowBtn) {
            glowBtn.onclick = () => {
                oscGlowEnabled = !oscGlowEnabled;
                glowBtn.classList.toggle('btn-active', oscGlowEnabled);
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

        // Responsive resize
        const handleResize = () => {
            const c = document.getElementById('oscilloscope-canvas');
            if (!c) return;
            const r = c.getBoundingClientRect();
            c.width = r.width * dpr;
            c.height = r.height * dpr;
            const context = c.getContext('2d');
            context.setTransform(1, 0, 0, 1, 0, 0);
            context.scale(dpr, dpr);
        };
        window.removeEventListener('resize', handleResize);
        window.addEventListener('resize', handleResize);

        // Cancel previous anim loop
        if (oscAnimationId) {
            cancelAnimationFrame(oscAnimationId);
        }
        drawOscilloscope();
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
            if (oscRunning) {
                btn.innerHTML = '<i class="fas fa-play"></i> Run';
                btn.classList.add('btn-active');
                btn.classList.remove('btn-stop');
            } else {
                btn.innerHTML = '<i class="fas fa-pause"></i> Stop';
                btn.classList.remove('btn-active');
                btn.classList.add('btn-stop');
            }
        }
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
    }
    
    function renderProjeler() {
        const grid = document.getElementById('projeler-grid');
        grid.innerHTML = '';
        appData.projeler.forEach(p => {
            const techs = p.tech.map(t => `<span class="tech-tag">${t}</span>`).join('');
            grid.innerHTML += `<div class="card"><h3><i class="fas fa-microchip"></i> ${p.title}</h3><p>${p.desc}</p><div class="tech-stack">${techs}</div></div>`;
        });
    }

    function renderBasarilar() {
        const grid = document.getElementById('basarilar-grid');
        grid.innerHTML = '';
        appData.basarilar.forEach(b => {
            grid.innerHTML += `<div class="card"><h3><i class="fas fa-trophy"></i> ${b.title}</h3><p>${b.desc}</p><div class="tech-stack"><span class="tech-tag">${b.year}</span></div></div>`;
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

    function renderCV() {
        const cvData = window.DetailedCVData;
        if (!cvData) return;

        // 1. CV Hero Header details
        const nameEl = document.getElementById('cv-hero-name');
        if (nameEl) nameEl.textContent = cvData.hero.name;

        const titleEl = document.getElementById('cv-hero-title');
        if (titleEl) titleEl.innerHTML = `<i class="fas fa-microchip"></i> ${cvData.hero.title}`;

        const descEl = document.getElementById('cv-hero-desc');
        if (descEl) descEl.textContent = cvData.hero.desc;

        const btnDownload = document.getElementById('btn-cv-download');
        if (btnDownload) {
            btnDownload.href = cvData.hero.downloadUrl || '#';
        }

        // Avatar logic (if avatar is provided, render it)
        const avatarContainer = document.querySelector('.cv-avatar');
        if (avatarContainer && cvData.hero.avatar) {
            avatarContainer.innerHTML = `<img src="${cvData.hero.avatar}" alt="${cvData.hero.name}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;">`;
        }

        // 2. Kişisel Bilgiler
        const kisiselContent = document.getElementById('cv-kisisel-content');
        if (kisiselContent) {
            kisiselContent.innerHTML = '';
            cvData.kisisel.forEach(k => {
                kisiselContent.innerHTML += `
                    <div class="cv-kisisel-item">
                        <div class="cv-kisisel-icon"><i class="${k.icon}"></i></div>
                        <div class="cv-kisisel-info">
                            <span class="cv-kisisel-label">${k.label}</span>
                            <span class="cv-kisisel-value">${k.link ? `<a href="${k.link}" target="_blank">${k.value}</a>` : k.value}</span>
                        </div>
                    </div>
                `;
            });
        }

        // 3. Eğitim Bilgileri (Dynamically from appData.cv, satisfying admin panel integration)
        const egitimContent = document.getElementById('cv-egitim-content');
        if (egitimContent) {
            egitimContent.innerHTML = '';
            if (appData.cv && appData.cv.length > 0) {
                appData.cv.forEach((c, idx) => {
                    const activeClass = idx === 0 ? 'active' : '';
                    egitimContent.innerHTML += `
                        <div class="cv-timeline-vertical-item ${activeClass}">
                            <div class="cv-timeline-date"><i class="fas fa-calendar-alt"></i> ${c.date}</div>
                            <div class="cv-timeline-title">${c.title}</div>
                            <div class="cv-timeline-desc">${c.desc}</div>
                        </div>
                    `;
                });
            } else {
                egitimContent.innerHTML = '<p class="cv-entry-desc">Eğitim bilgisi bulunamadı. Admin panelden ekleyebilirsiniz.</p>';
            }
        }

        // 4. Teknik Yetenekler
        const skillsContent = document.getElementById('cv-skills-content');
        if (skillsContent) {
            skillsContent.innerHTML = '';
            cvData.yetenekler.forEach(s => {
                skillsContent.innerHTML += `
                    <div class="cv-skill">
                        <div class="cv-skill-header">
                            <span class="cv-skill-name">${s.name}</span>
                            <span class="cv-skill-percent">${s.level}%</span>
                        </div>
                        <div class="cv-skill-bar-outer">
                            <div class="cv-skill-bar-inner" style="width: ${s.level}%"></div>
                        </div>
                    </div>
                `;
            });
        }

        // 5. Proje Deneyimleri (Dynamically from appData.projeler, satisfying admin panel integration)
        const projelerContent = document.getElementById('cv-projeler-content');
        if (projelerContent) {
            projelerContent.innerHTML = '';
            if (appData.projeler && appData.projeler.length > 0) {
                appData.projeler.forEach(p => {
                    const techs = p.tech.map(t => `<span class="tech-tag">${t}</span>`).join('');
                    projelerContent.innerHTML += `
                        <div class="cv-entry-block">
                            <div class="cv-entry-header">
                                <h4 class="cv-entry-title">${p.title}</h4>
                                <span class="cv-entry-tag"><i class="fas fa-microchip"></i> Proje</span>
                            </div>
                            <p class="cv-entry-desc">${p.desc}</p>
                            <div class="tech-stack" style="margin-top: 0.5rem;">
                                ${techs}
                            </div>
                        </div>
                    `;
                });
            } else {
                projelerContent.innerHTML = '<p class="cv-entry-desc">Proje bilgisi bulunamadı. Admin panelden ekleyebilirsiniz.</p>';
            }
        }

        // 6. Deneyim / Çalışmalar (From DetailedCVData)
        const deneyimContent = document.getElementById('cv-deneyim-content');
        if (deneyimContent) {
            deneyimContent.innerHTML = '';
            cvData.deneyimler.forEach(d => {
                deneyimContent.innerHTML += `
                    <div class="cv-entry-block">
                        <div class="cv-entry-header">
                            <h4 class="cv-entry-title">${d.baslik}</h4>
                            <span class="cv-entry-tag">${d.tip}</span>
                        </div>
                        <div class="cv-entry-meta"><i class="fas fa-clock"></i> ${d.tarih}</div>
                        <p class="cv-entry-desc">${d.aciklama}</p>
                    </div>
                `;
            });
        }

        // 7. Sertifikalar (Dynamically from appData.sertifikalar, satisfying admin panel integration)
        const sertifikalarContent = document.getElementById('cv-sertifikalar-content');
        if (sertifikalarContent) {
            sertifikalarContent.innerHTML = '';
            if (appData.sertifikalar && appData.sertifikalar.length > 0) {
                appData.sertifikalar.forEach(s => {
                    sertifikalarContent.innerHTML += `
                        <div class="cv-entry-block">
                            <div class="cv-entry-header">
                                <h4 class="cv-entry-title">${s.title}</h4>
                                <span class="cv-entry-tag">${s.issuer}</span>
                            </div>
                            <div class="cv-entry-meta"><i class="fas fa-award"></i> ${s.date}</div>
                        </div>
                    `;
                });
            } else {
                sertifikalarContent.innerHTML = '<p class="cv-entry-desc">Sertifika bilgisi bulunamadı. Admin panelden ekleyebilirsiniz.</p>';
            }
        }

        // 8. Diller
        const dillerContent = document.getElementById('cv-diller-content');
        if (dillerContent) {
            dillerContent.innerHTML = '';
            cvData.diller.forEach(d => {
                dillerContent.innerHTML += `
                    <div class="cv-dil-item">
                        <div class="cv-dil-info">
                            <span class="cv-dil-name">${d.ad}</span>
                            <span class="cv-dil-level">${d.label}</span>
                        </div>
                        <div class="cv-dil-bar">
                            <div class="cv-dil-bar-inner" style="width: ${d.level}%"></div>
                        </div>
                    </div>
                `;
            });
        }

        // 9. İlgi Alanları
        const ilgiContent = document.getElementById('cv-ilgi-content');
        if (ilgiContent) {
            ilgiContent.innerHTML = '';
            cvData.ilgiAlanlari.forEach(tag => {
                ilgiContent.innerHTML += `<span class="cv-tag">${tag}</span>`;
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
        grid.innerHTML = '';
        appData.sertifikalar.forEach(s => {
            grid.innerHTML += `<div class="card"><h3><i class="fas fa-certificate"></i> ${s.title}</h3><p><strong>Kurum:</strong> ${s.issuer}</p><p><strong>Tarih:</strong> ${s.date}</p></div>`;
        });
    }

    function renderAll() {
        renderHakkimda();
        renderProjeler();
        renderBasarilar();
        renderCV();
        renderSertifikalar();
    }

    // ROUTING
    function handleRoute() {
        let hash = window.location.hash.substring(1) || 'home';
        
        if (hash === 'admin' && !isAdminLoggedIn) {
            hash = 'admin-login';
        }

        // Hide all views
        views.forEach(v => {
            v.classList.remove('active', 'fade-in');
            v.style.display = 'none';
        });

        // Auto-suspend oscilloscope canvas loop to preserve CPU when leaving Hakkımda view
        if (oscAnimationId) {
            cancelAnimationFrame(oscAnimationId);
            oscAnimationId = null;
        }

        // Show target view
        const targetView = document.getElementById(`view-${hash}`);
        if (targetView) {
            // Apply flex if it's home or admin-login
            if (hash === 'home' || hash === 'admin-login') {
                targetView.style.display = 'flex';
                if (hash === 'home') {
                    const randomDirenc = Math.floor(Math.random() * 8) + 1;
                    const heroBg = document.querySelector('.hero-bg-image');
                    if (heroBg) {
                        heroBg.style.setProperty('background-image', `url(./direnc${randomDirenc}.png)`, 'important');
                    }
                }
            } else {
                targetView.style.display = 'block';
            }
            
            // Trigger reflow for animation
            void targetView.offsetWidth;
            targetView.classList.add('active', 'fade-in');
        }

        // Manage Navbar
        if (hash === 'home' || hash === 'admin-login' || hash === 'admin') {
            nav.style.display = 'none';
        } else {
            nav.style.display = 'flex';
        }

        // Active link highlight
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[data-target="${hash}"]`);
        if (activeLink) activeLink.classList.add('active');

        // Load specific data if entering admin
        if (hash === 'admin') {
            initAdmin();
        } else {
            renderAll();
        }
        
        if (hash === 'cv') {
            setTimeout(initReveal, 100);
        }
        
        window.scrollTo(0,0);
    }

    window.addEventListener('hashchange', handleRoute);
    handleRoute(); // initial call

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
        const email = adminEmailInput.value;
        const pwd = adminPasswordInput.value;
        const errorMsg = document.getElementById('login-error');
        
        if (auth) {
            signInWithEmailAndPassword(auth, email, pwd)
                .then((userCredential) => {
                    errorMsg.style.display = 'none';
                    // onAuthStateChanged event'i tetiklenip sayfayı yönlendirecek
                })
                .catch((error) => {
                    console.error("Giriş hatası:", error.code);
                    let mesaj = "Giriş başarısız oldu.";
                    
                    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                        mesaj = "E-posta veya şifre yanlış!";
                    } else if (error.code === 'auth/user-not-found') {
                        mesaj = "Kayıtlı kullanıcı bulunamadı!";
                    } else if (error.code === 'auth/invalid-email') {
                        mesaj = "Geçersiz e-posta adresi!";
                    } else if (error.code === 'auth/too-many-requests') {
                        mesaj = "Çok fazla deneme yaptınız. Lütfen bekleyin.";
                    }
                    
                    errorMsg.textContent = "HATA: " + mesaj;
                    errorMsg.style.display = 'block';
                });
        } else {
            errorMsg.textContent = "FIREBASE AYARLANMADI (App.js'yi kontrol edin)";
            errorMsg.style.display = 'block';
            
            // Geliştirme aşamasında Firebase ayarlamadan test etmek isterseniz 
            // alttaki satırların yorumunu kaldırarak geçici giriş yapabilirsiniz:
            // isAdminLoggedIn = true; window.location.hash = '#admin'; handleRoute();
        }
    }

    document.getElementById('logout-btn').addEventListener('click', () => {
        if (auth) {
            signOut(auth).then(() => {
                window.location.hash = '#home';
            }).catch((error) => {
                console.error("Çıkış hatası:", error);
            });
        } else {
            // Firebase yoksa test modunda çıkış
            isAdminLoggedIn = false;
            window.location.hash = '#home';
            handleRoute();
        }
    });

    // ADMIN LOGIC
    function initAdmin() {
        document.getElementById('hakkimda-text').value = appData.hakkimda;
        updateThemeInputs(loadSavedThemeColors());
        renderAdminLists();
        if(window.renderAdminMessages) window.renderAdminMessages();
        if(window.updateMessageBadge) window.updateMessageBadge();
    }

    function renderAdminList(containerId, array, renderItem, editCallback, deleteCallback) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        array.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'item-row';
            div.innerHTML = `<div>${renderItem(item)}</div><div class="item-actions"></div>`;
            
            const btnEdit = document.createElement('button');
            btnEdit.className = 'btn';
            btnEdit.innerText = 'Düzenle';
            btnEdit.onclick = () => editCallback(index);
            
            const btnDel = document.createElement('button');
            btnDel.className = 'btn btn-danger';
            btnDel.innerText = 'Sil';
            btnDel.onclick = () => deleteCallback(index);

            div.querySelector('.item-actions').append(btnEdit, btnDel);
            container.appendChild(div);
        });
    }

    function renderAdminLists() {
        renderAdminList('list-projeler', appData.projeler, i => `<strong class="theme-text">${i.title}</strong>`, editProje, (idx) => deleteItem('projeler', idx));
        renderAdminList('list-basarilar', appData.basarilar, i => `<strong class="theme-text">${i.title}</strong>`, editBasari, (idx) => deleteItem('basarilar', idx));
        renderAdminList('list-cv', appData.cv, i => `<strong class="theme-text">${i.title}</strong>`, editCV, (idx) => deleteItem('cv', idx));
        renderAdminList('list-sertifikalar', appData.sertifikalar, i => `<strong class="theme-text">${i.title}</strong>`, editSertifika, (idx) => deleteItem('sertifikalar', idx));
    }

    async function saveGlobal() {
        await window.DataService.saveData(appData);
        renderAdminLists();
    }

    async function deleteItem(collection, idx) {
        if(confirm('Silmek istediğinize emin misiniz?')) {
            appData[collection].splice(idx, 1);
            await saveGlobal();
        }
    }

    // Forms Setup
    document.getElementById('form-hakkimda').addEventListener('submit', async (e) => {
        e.preventDefault();
        appData.hakkimda = document.getElementById('hakkimda-text').value;
        await saveGlobal();
        alert('Kaydedildi');
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
            alert('Renkler başarıyla kaydedildi!');
        });
    }

    // Revert to Last Saved Theme Colors Button
    const btnRevertTheme = document.getElementById('btn-revert-theme');
    if (btnRevertTheme) {
        btnRevertTheme.addEventListener('click', () => {
            revertToSavedTheme();
            alert('Son kaydedilen renklere geri dönüldü.');
        });
    }

    // Reset to Default Theme Colors Button
    const btnDefaultTheme = document.getElementById('btn-default-theme');
    if (btnDefaultTheme) {
        btnDefaultTheme.addEventListener('click', () => {
            if (confirm('Tüm renk ayarlarını varsayılan PCB/Elektrik temasına sıfırlamak istiyor musunuz?')) {
                resetToDefaultTheme();
                alert('Varsayılan tema başarıyla uygulandı ve kaydedildi.');
            }
        });
    }

    // Projeler
    const formProje = document.getElementById('form-projeler');
    formProje.addEventListener('submit', async (e) => {
        e.preventDefault();
        const idInput = document.getElementById('proje-id').value;
        const title = document.getElementById('proje-title').value;
        const desc = document.getElementById('proje-desc').value;
        const tech = document.getElementById('proje-tech').value.split(',').map(s=>s.trim());
        
        if (idInput !== '') {
            appData.projeler[idInput] = { ...appData.projeler[idInput], title, desc, tech };
        } else {
            appData.projeler.push({ id: Date.now(), title, desc, tech });
        }
        await saveGlobal();
        formProje.reset();
        document.getElementById('proje-id').value = '';
        document.getElementById('proje-cancel').style.display = 'none';
    });

    function editProje(idx) {
        const item = appData.projeler[idx];
        document.getElementById('proje-id').value = idx;
        document.getElementById('proje-title').value = item.title;
        document.getElementById('proje-desc').value = item.desc;
        document.getElementById('proje-tech').value = item.tech.join(', ');
        document.getElementById('proje-cancel').style.display = 'inline-block';
    }
    document.getElementById('proje-cancel').onclick = () => { formProje.reset(); document.getElementById('proje-id').value = ''; document.getElementById('proje-cancel').style.display = 'none'; };

    // Başarılar
    const formBasari = document.getElementById('form-basarilar');
    formBasari.addEventListener('submit', async (e) => {
        e.preventDefault();
        const idInput = document.getElementById('basari-id').value;
        const title = document.getElementById('basari-title').value;
        const desc = document.getElementById('basari-desc').value;
        const year = document.getElementById('basari-year').value;
        
        if (idInput !== '') {
            appData.basarilar[idInput] = { ...appData.basarilar[idInput], title, desc, year };
        } else {
            appData.basarilar.push({ id: Date.now(), title, desc, year });
        }
        await saveGlobal();
        formBasari.reset();
        document.getElementById('basari-id').value = '';
        document.getElementById('basari-cancel').style.display = 'none';
    });

    function editBasari(idx) {
        const item = appData.basarilar[idx];
        document.getElementById('basari-id').value = idx;
        document.getElementById('basari-title').value = item.title;
        document.getElementById('basari-desc').value = item.desc;
        document.getElementById('basari-year').value = item.year;
        document.getElementById('basari-cancel').style.display = 'inline-block';
    }
    document.getElementById('basari-cancel').onclick = () => { formBasari.reset(); document.getElementById('basari-id').value = ''; document.getElementById('basari-cancel').style.display = 'none'; };

    // CV
    const formCV = document.getElementById('form-cv');
    formCV.addEventListener('submit', async (e) => {
        e.preventDefault();
        const idInput = document.getElementById('cv-id').value;
        const title = document.getElementById('cv-title').value;
        const desc = document.getElementById('cv-desc').value;
        const date = document.getElementById('cv-date').value;
        
        if (idInput !== '') {
            appData.cv[idInput] = { ...appData.cv[idInput], title, desc, date };
        } else {
            appData.cv.push({ id: Date.now(), title, desc, date });
        }
        await saveGlobal();
        formCV.reset();
        document.getElementById('cv-id').value = '';
        document.getElementById('cv-cancel').style.display = 'none';
    });

    function editCV(idx) {
        const item = appData.cv[idx];
        document.getElementById('cv-id').value = idx;
        document.getElementById('cv-title').value = item.title;
        document.getElementById('cv-desc').value = item.desc;
        document.getElementById('cv-date').value = item.date;
        document.getElementById('cv-cancel').style.display = 'inline-block';
    }
    document.getElementById('cv-cancel').onclick = () => { formCV.reset(); document.getElementById('cv-id').value = ''; document.getElementById('cv-cancel').style.display = 'none'; };

    // Sertifikalar
    const formSert = document.getElementById('form-sertifikalar');
    formSert.addEventListener('submit', async (e) => {
        e.preventDefault();
        const idInput = document.getElementById('sertifika-id').value;
        const title = document.getElementById('sertifika-title').value;
        const issuer = document.getElementById('sertifika-issuer').value;
        const date = document.getElementById('sertifika-date').value;
        
        if (idInput !== '') {
            appData.sertifikalar[idInput] = { ...appData.sertifikalar[idInput], title, issuer, date };
        } else {
            appData.sertifikalar.push({ id: Date.now(), title, issuer, date });
        }
        await saveGlobal();
        formSert.reset();
        document.getElementById('sertifika-id').value = '';
        document.getElementById('sertifika-cancel').style.display = 'none';
    });

    function editSertifika(idx) {
        const item = appData.sertifikalar[idx];
        document.getElementById('sertifika-id').value = idx;
        document.getElementById('sertifika-title').value = item.title;
        document.getElementById('sertifika-issuer').value = item.issuer;
        document.getElementById('sertifika-date').value = item.date;
        document.getElementById('sertifika-cancel').style.display = 'inline-block';
    }
    document.getElementById('sertifika-cancel').onclick = () => { formSert.reset(); document.getElementById('sertifika-id').value = ''; document.getElementById('sertifika-cancel').style.display = 'none'; };

    // Admin Tabs Logic
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.target).classList.add('active');
        });
    });

    // --- MESSAGING SYSTEM ---
    
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> <span>${escapeHTML(message)}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    window.copyToClipboard = function(text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Kopyalandı!', 'success');
        }).catch(err => {
            showToast('Kopyalama başarısız', 'error');
        });
    }

    function getContactMessages() {
        const msgs = localStorage.getItem('portfolioMessages');
        return msgs ? JSON.parse(msgs) : [];
    }

    function saveContactMessage(msg) {
        const msgs = getContactMessages();
        msgs.unshift(msg); // Add to beginning
        localStorage.setItem('portfolioMessages', JSON.stringify(msgs));
    }

    window.updateMessageBadge = function() {
        const badge = document.getElementById('msg-badge');
        if (!badge) return;
        const unreadCount = getContactMessages().filter(m => !m.okunduDurumu).length;
        if (unreadCount > 0) {
            badge.style.display = 'inline-block';
            badge.textContent = unreadCount;
        } else {
            badge.style.display = 'none';
        }
    }

    window.deleteMessage = function(id) {
        if(confirm('Mesajı silmek istediğinize emin misiniz?')) {
            let msgs = getContactMessages();
            msgs = msgs.filter(m => m.id !== id);
            localStorage.setItem('portfolioMessages', JSON.stringify(msgs));
            if(window.renderAdminMessages) window.renderAdminMessages();
            window.updateMessageBadge();
            showToast('Mesaj silindi', 'success');
        }
    }

    window.markMessageAsRead = function(id) {
        let msgs = getContactMessages();
        const msg = msgs.find(m => m.id === id);
        if(msg) {
            msg.okunduDurumu = true;
            localStorage.setItem('portfolioMessages', JSON.stringify(msgs));
            if(window.renderAdminMessages) window.renderAdminMessages();
            window.updateMessageBadge();
        }
    }

    window.markMessageAsUnread = function(id) {
        let msgs = getContactMessages();
        const msg = msgs.find(m => m.id === id);
        if(msg) {
            msg.okunduDurumu = false;
            localStorage.setItem('portfolioMessages', JSON.stringify(msgs));
            if(window.renderAdminMessages) window.renderAdminMessages();
            window.updateMessageBadge();
        }
    }

    window.renderAdminMessages = function() {
        const container = document.getElementById('admin-messages-list');
        if (!container) return;
        const msgs = getContactMessages();
        
        if (msgs.length === 0) {
            container.innerHTML = '<p class="theme-text">Henüz gelen bir sinyal yok.</p>';
            return;
        }

        container.innerHTML = msgs.map(m => `
            <div class="message-card ${m.okunduDurumu ? 'read' : 'unread'}">
                <div class="message-header">
                    <h4>${escapeHTML(m.adSoyad)} <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: normal; margin-left: 10px;">${escapeHTML(m.konu)}</span></h4>
                    <div class="message-meta">
                        <i class="far fa-clock"></i> ${escapeHTML(m.tarih)} - ${escapeHTML(m.saat)}
                    </div>
                </div>
                <div class="message-body">${escapeHTML(m.mesaj)}</div>
                <div class="message-actions">
                    ${m.okunduDurumu ? 
                        `<button class="btn" onclick="markMessageAsUnread(${m.id})"><i class="fas fa-eye-slash"></i> Okunmadı İşaretle</button>` : 
                        `<button class="btn btn-primary" onclick="markMessageAsRead(${m.id})"><i class="fas fa-eye"></i> Okundu İşaretle</button>`
                    }
                    <button class="btn" onclick="copyToClipboard('${escapeHTML(m.email).replace(/'/g, "\\'")}')"><i class="fas fa-at"></i> Email Kopyala</button>
                    <button class="btn" onclick="copyToClipboard('${escapeHTML(m.mesaj).replace(/'/g, "\\'").replace(/\n/g, '\\n')}')"><i class="fas fa-copy"></i> Mesajı Kopyala</button>
                    <button class="btn btn-danger" onclick="deleteMessage(${m.id})"><i class="fas fa-trash"></i> Sil</button>
                </div>
            </div>
        `).join('');
    }

    // Handle Contact Form Submit
    const iletisimForm = document.getElementById('iletisim-form');
    if (iletisimForm) {
        iletisimForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('contact-name').value.trim();
            const email = document.getElementById('contact-email').value.trim();
            const subject = document.getElementById('contact-subject').value.trim();
            const message = document.getElementById('contact-message').value.trim();

            if (!name || !email || !subject || !message) {
                showToast('Lütfen tüm alanları doldurun.', 'error');
                return;
            }
            if (message.length < 10) {
                showToast('Mesajınız en az 10 karakter olmalıdır.', 'error');
                return;
            }

            const now = new Date();
            const newMsg = {
                id: Date.now(),
                adSoyad: name,
                email: email,
                konu: subject,
                mesaj: message,
                tarih: now.toLocaleDateString('tr-TR'),
                saat: now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                okunduDurumu: false
            };

            saveContactMessage(newMsg);
            window.updateMessageBadge(); 
            if(window.renderAdminMessages) {
                window.renderAdminMessages(); 
            }
            
            iletisimForm.reset();
            showToast('Sinyal başarıyla iletildi!', 'success');
        });
    }

    // Initialize badge
    window.updateMessageBadge();

    // Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if(hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
    document.querySelectorAll('.nav-link').forEach(l => {
        l.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });

    // --- GLOBAL KEYBOARD SHORTCUTS ---
    document.addEventListener('keydown', (e) => {
        // CTRL + SHIFT + A => ADMIN PANEL
        if (e.ctrlKey && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
            e.preventDefault();
            window.location.hash = '#admin';
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
});
