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
                    return docSnap.data();
                } else {
                    // Veri yoksa defaultData oluşturulsun ve Firestore'a kaydedilsin
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
                return JSON.parse(localData);
            }
        } else {
            // Local provider
            let data = localStorage.getItem('portfolioData');
            if (!data) {
                localStorage.setItem('portfolioData', JSON.stringify(defaultData));
                return defaultData;
            }
            return JSON.parse(data);
        }
    },

    async saveData(data) {
        if (this.provider === 'firestore') {
            try {
                const db = window.firebaseDB;
                const { doc, setDoc } = window.firestoreFns || {};
                if (!db || !doc || !setDoc) {
                    throw new Error("Firestore is not initialized yet. Falling back to local storage.");
                }
                const docRef = doc(db, "portfolio", "main");
                await setDoc(docRef, data);
            } catch (err) {
                console.error("Firestore write error, falling back to localStorage:", err);
                localStorage.setItem('portfolioData', JSON.stringify(data));
            }
        } else {
            localStorage.setItem('portfolioData', JSON.stringify(data));
        }
    }
};

window.DataService = Storage;

// Rich CV Data Structure - Modular and Easy to Customize
window.DetailedCVData = {
    hero: {
        name: "Burakcan Özay",
        title: "Elektrik Elektronik Mühendisliği Öğrencisi",
        desc: "Gömülü sistemler, analog/dijital devre tasarımı ve C/C++ mikrodenetleyici programlama alanlarında kendimi geliştirmekteyim. Laboratuvar çalışmalarında ve otonom sistem projelerinde aktif rol alarak mühendislik teorisini pratiğe dönüştürmeyi hedefliyorum.",
        avatar: "", // Boş bırakılırsa varsayılan ikon gösterilir
        downloadUrl: "#", // CV PDF İndirme linki buraya eklenebilir
    },
    kisisel: [
        { label: "Ad Soyad", value: "Burakcan Özay", icon: "fas fa-user" },
        { label: "Bölüm", value: "Elektrik Elektronik Mühendisliği", icon: "fas fa-graduation-cap" },
        { label: "Üniversite", value: "Karadeniz Teknik Üniversitesi", icon: "fas fa-university" },
        { label: "Konum", value: "Trabzon / Türkiye", icon: "fas fa-map-marker-alt" },
        { label: "E-posta", value: "burakcanozay@example.com", icon: "fas fa-envelope" },
        { label: "Telefon", value: "+90 555 555 55 55", icon: "fas fa-phone" },
        { label: "LinkedIn", value: "linkedin.com/in/burakcanozay", icon: "fab fa-linkedin", link: "https://linkedin.com/in/burakcanozay" },
        { label: "GitHub", value: "github.com/burakcanozay", icon: "fab fa-github", link: "https://github.com/burakcanozay" }
    ],
    yetenekler: [
        { name: "Proteus", level: 85 },
        { name: "Arduino", level: 90 },
        { name: "Tinkercad", level: 80 },
        { name: "C / C++", level: 75 },
        { name: "HTML / CSS / JavaScript", level: 65 },
        { name: "Node.js", level: 70 },
        { name: "Devre Analizi", level: 85 },
        { name: "Gömülü Sistemler", level: 80 },
        { name: "Sensör Entegrasyonu", level: 85 },
        { name: "PCB / Devre Tasarımı", level: 75 }
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
        { ad: "Türkçe", level: 100, label: "Ana Dil (Native)" },
        { ad: "İngilizce", level: 75, label: "B2 - Orta Üstü (Upper-Intermediate)" }
    ],
    ilgiAlanlari: [
        "Elektronik Devre Tasarımı",
        "Arduino & STM32",
        "Gömülü Sistem Yazılımları",
        "Yenilenebilir Enerji",
        "Mobil Robotik",
        "Web Geliştirme (Front-end)"
    ],
    notlar: "Sistem Notu: Bu dijital CV kontrol paneli, Elektrik-Elektronik mühendisliğinde donanım (hardware) ve gömülü yazılım (firmware) birikimini bir araya getiren bir vizyonla tasarlanmıştır. Sistem güncellemeleri ve ek modüller düzenli olarak entegre edilmektedir."
};

