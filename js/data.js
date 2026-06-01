// ============================================================
// 1. Tema Varsayılanı
// ============================================================
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

// ============================================================
// 2. Detaylı CV Verisi (Storage'dan ÖNCE tanımlanıyor)
// ============================================================
window.DetailedCVData = {
    hero: {
        name: "Burakcan Özay",
        title: "Elektrik Elektronik Mühendisliği Öğrencisi",
        desc: "Gömülü sistemler, analog/dijital devre tasarımı ve C/C++ mikrodenetleyici programlama alanlarında kendimi geliştirmekteyim. Laboratuvar çalışmalarında ve otonom sistem projelerinde aktif rol alarak mühendislik teorisini pratiğe dönüştürmeyi hedefliyorum.",
        avatar: "",      // Boş bırakılırsa varsayılan ikon gösterilir
        downloadUrl: "burakcan_ozay_cv.pdf" // CV PDF indirme linki
    },
    kisisel: [
        { label: "Ad Soyad",    value: "Burakcan Özay",                       icon: "fas fa-user"           },
        { label: "Bölüm",       value: "Elektrik Elektronik Mühendisliği",    icon: "fas fa-graduation-cap" },
        { label: "Üniversite",  value: "Karadeniz Teknik Üniversitesi",       icon: "fas fa-university"     },
        { label: "Konum",       value: "Trabzon / Türkiye",                   icon: "fas fa-map-marker-alt" },
        { label: "E-posta",     value: "burakcan5775@gmail.com",              icon: "fas fa-envelope",  link: "mailto:burakcan5775@gmail.com"           },
        { label: "LinkedIn",    value: "linkedin.com/in/burakcanozay",        icon: "fab fa-linkedin",  link: "https://linkedin.com/in/burakcanozay"   },
        { label: "GitHub",      value: "github.com/burakcanozay",             icon: "fab fa-github",    link: "https://github.com/burakcanozay"        }
    ],
    egitim: [
        {
            okul: "Karadeniz Teknik Üniversitesi",
            bolum: "Elektrik Elektronik Mühendisliği",
            derece: "Lisans",
            tarih: "2023 - Günümüz",
            aciklama: "Elektrik-Elektronik Mühendisliği alanında lisans eğitimi."
        }
    ],
    yetenekler: [
        { name: "Proteus",                    level: 85 },
        { name: "Arduino",                    level: 90 },
        { name: "Tinkercad",                  level: 80 },
        { name: "C / C++",                    level: 75 },
        { name: "HTML / CSS / JavaScript",    level: 65 },
        { name: "Node.js",                    level: 70 },
        { name: "Devre Analizi",              level: 85 },
        { name: "Gömülü Sistemler",           level: 80 },
        { name: "Sensör Entegrasyonu",        level: 85 },
        { name: "PCB / Devre Tasarımı",       level: 75 }
    ],
    deneyimler: [
        {
            tip: "Staj",
            baslik: "Gömülü Sistem Stajyeri",
            aciklama: "STM32 mikrodenetleyiciler ile sensör veri okuma ve UART protokolü üzerinden haberleşme geliştirilmesi.",
            tarih: "Temmuz 2025 - Ağustos 2025"
        },
        {
            tip: "Laboratuvar Çalışması",
            baslik: "Elektrik Devreleri Lab Asistanlığı",
            aciklama: "Temel devre elemanlarının analizi, osiloskop ve sinyal jeneratörü kullanım rehberlerinin oluşturulması.",
            tarih: "2024 - 2025"
        },
        {
            tip: "Kişisel Çalışmalar",
            baslik: "Otonom Lab Labirent Çözücü Robot",
            aciklama: "Arduino Nano tabanlı kızılötesi sensör dizilimiyle labirent çözme algoritması entegre edilmiş otonom robot tasarımı.",
            tarih: "2024"
        },
        {
            tip: "Kulüp / Ekip Çalışmaları",
            baslik: "IEEE Gömülü Sistemler Takım Üyesi",
            aciklama: "Takım bünyesinde insansız hava aracı (İHA) aviyonik sistemlerinin tasarımı ve test süreçlerinin yürütülmesi.",
            tarih: "2023 - 2024"
        }
    ],
    diller: [
        { ad: "Türkçe",    level: 100, label: "Ana Dil (Native)"                      },
        { ad: "İngilizce", level: 75,  label: "B2 - Orta Üstü (Upper-Intermediate)"   }
    ],
    ilgiAlanlari: [
        "Elektronik Devre Tasarımı",
        "Arduino & STM32",
        "Gömülü Sistem Yazılımları",
        "Yenilenebilir Enerji",
        "Mobil Robotik",
        "Web Geliştirme (Front-end)"
    ]
};

// ============================================================
// 3. Güvenli derin kopya yardımcısı
// ============================================================
function cloneDetailedCVData() {
    return typeof structuredClone === "function"
        ? structuredClone(window.DetailedCVData)
        : JSON.parse(JSON.stringify(window.DetailedCVData));
}

// ============================================================
// 4. Storage modülü
// ============================================================
const Storage = {
    provider: 'firestore', // 'firestore' veya 'local'

    get theme() {
        return localStorage.getItem('site_theme') || '#00f3ff';
    },
    set theme(color) {
        localStorage.setItem('site_theme', color);
    },

    async getData() {
        const defaultData = {
            hakkimda: "Elektrik Elektronik Mühendisliği öğrencisiyim. Teknolojiye, gömülü sistemlere ve devre tasarımına büyük bir ilgi duyuyorum. Yenilikçi projeler geliştirmek ve mühendislik alanında kendimi sürekli olarak yenilemek en büyük hedefim.",
            projeler: [
                { id: 1, title: "Akıllı Ev Sistemi", desc: "Arduino ve ESP8266 kullanarak geliştirilmiş otomasyon.", tech: ["Arduino", "C++", "IoT"] }
            ],
            basarilar: [
                { id: 1, title: "TÜBİTAK Proje Yarışması Finalisti", desc: "Otonom sistem ile finale kalındı.", year: "2025" }
            ],
            cv: [
                { id: 1, title: "Elektrik Elektronik Mühendisliği", desc: "Üniversite - Lisans Eğitimi", date: "2023 - Günümüz" }
            ],
            sertifikalar: [
                { id: 1, title: "Gömülü Sistemler ve C Programlama", issuer: "Udemy", date: "2024" }
            ],
            detailedCV: cloneDetailedCVData(),
            themeColors: DEFAULT_THEME
        };

        if (this.provider === 'firestore') {
            try {
                const db = window.firebaseDB;
                const { doc, getDoc, setDoc } = window.firestoreFns || {};
                if (!db || !doc || !getDoc || !setDoc) {
                    throw new Error("Firestore is not initialized yet. Falling back to local storage.");
                }
                const docRef = doc(db, "portfolio", "main");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const filled = _backfillDetailedCV(data);
                    // Update firestore if detailedCV was missing
                    if (!data.detailedCV) {
                        await setDoc(docRef, { detailedCV: filled.detailedCV }, { merge: true });
                    }
                    return filled;
                } else {
                    await setDoc(docRef, defaultData);
                    return defaultData;
                }
            } catch (err) {
                console.error("Firestore read error, falling back to localStorage:", err);
                let localData = localStorage.getItem('portfolioData');
                if (!localData) {
                    localStorage.setItem('portfolioData', JSON.stringify(defaultData));
                    return defaultData;
                }
                const parsed = JSON.parse(localData);
                return _backfillDetailedCV(parsed);
            }
        } else {
            let localData = localStorage.getItem('portfolioData');
            if (!localData) {
                localStorage.setItem('portfolioData', JSON.stringify(defaultData));
                return defaultData;
            }
            const parsed = JSON.parse(localData);
            return _backfillDetailedCV(parsed);
        }
    },

    async saveData(data) {
        if (!data.detailedCV) {
            data.detailedCV = cloneDetailedCVData();
        }

        if (this.provider === 'firestore') {
            try {
                const db = window.firebaseDB;
                const { doc, setDoc } = window.firestoreFns || {};

                if (!db || !doc || !setDoc) {
                    throw new Error("Firestore başlatılmamış. Firebase yapılandırmasını kontrol et.");
                }

                const docRef = doc(db, "portfolio", "main");
                await setDoc(docRef, data);
                return true;
            } catch (err) {
                console.error("Firestore write error:", err);

                // Firestore Rules / izin hatası özel mesajı
                if (
                    err.code === 'permission-denied' ||
                    err.message?.includes('permission') ||
                    err.message?.includes('PERMISSION_DENIED')
                ) {
                    const rulesErr = new Error(
                        "Firestore yazma izni yok. Admin hesabınla giriş yaptığından emin ol."
                    );
                    rulesErr.code = 'permission-denied';
                    throw rulesErr;
                }

                // Diğer Firestore hataları — localStorage'a DÜŞME, hatayı fırlat
                throw err;
            }
        } else {
            // local provider: localStorage kullanımı normal
            localStorage.setItem('portfolioData', JSON.stringify(data));
            return true;
        }
    }
};

// ============================================================
// 5. Dahili: eksik detailedCV alanlarını tamamlayan yardımcı
// ============================================================
function _backfillDetailedCV(data) {
    const clone = cloneDetailedCVData();

    if (!data.detailedCV) {
        data.detailedCV = clone;
    } else {
        data.detailedCV.hero          = data.detailedCV.hero          || clone.hero;
        data.detailedCV.kisisel       = data.detailedCV.kisisel       || clone.kisisel;
        data.detailedCV.egitim        = data.detailedCV.egitim        || clone.egitim        || [];
        data.detailedCV.yetenekler    = data.detailedCV.yetenekler    || clone.yetenekler    || [];
        data.detailedCV.deneyimler    = data.detailedCV.deneyimler    || clone.deneyimler    || [];
        data.detailedCV.diller        = data.detailedCV.diller        || clone.diller        || [];
        data.detailedCV.ilgiAlanlari  = data.detailedCV.ilgiAlanlari  || clone.ilgiAlanlari  || [];
    }

    // Auto-migration for old data
    if (data.detailedCV.kisisel && Array.isArray(data.detailedCV.kisisel)) {
        // Remove phone number
        data.detailedCV.kisisel = data.detailedCV.kisisel.filter(item => item.label !== "Telefon");
        
        // Update email
        data.detailedCV.kisisel = data.detailedCV.kisisel.map(item => {
            if (item.label === "E-posta") {
                if (item.value === "burakcanozay@example.com") {
                    item.value = "burakcan5775@gmail.com";
                }
                item.link = "mailto:burakcan5775@gmail.com";
            }
            return item;
        });
    }

    return data;
}

// ============================================================
// 6. Global erişim
// ============================================================
window.DataService = Storage;
