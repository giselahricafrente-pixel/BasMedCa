let alarms = JSON.parse(localStorage.getItem('mediCareAlarms')) || [];

// DOM Elements
const pages = {
  hero: document.getElementById('heroPage'),
  dashboard: document.getElementById('dashboardPage'),
  featureDetail: document.getElementById('featureDetailPage'),
  about: document.getElementById('aboutPage')
};

const welcomeUser = document.getElementById('welcomeUser');
const featureDetailHeading = document.getElementById('featureDetailHeading');
const featureDetailHeadingTranslation = document.getElementById('featureDetailHeadingTranslation');

// Feature sections
const alarmsFeature = document.getElementById('alarmsFeature');
const dictionaryFeature = document.getElementById('dictionaryFeature');
const emergencyFeature = document.getElementById('emergencyFeature');

// Initialize the application
function init() {
  showPage('hero');  // Start on hero page
  alarms.forEach(alarm => {
    if (alarm.active) {
      setAlarmNotification(alarm);
    }
  });
}

// Page navigation
function showPage(pageName) {
  Object.values(pages).forEach(page => page.classList.remove('active'));
  pages[pageName].classList.add('active');

  if (pageName === 'dashboard') {
    updateWelcomeMessage();
  }
}

function updateWelcomeMessage() {
  welcomeUser.innerHTML = 'Hello! You are using BasMedCa as a guest. <span class="translation">(Kumusta! Agususar ka iti BasMedCa kas meysa a bisita.)</span>';
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('getStartedBtn').addEventListener('click', () => showPage('dashboard'));
  document.getElementById('homeNavBtn').addEventListener('click', (e) => {
    e.preventDefault();
    showPage('hero');
  });
  document.getElementById('dashboardNavBtn').addEventListener('click', (e) => {
    e.preventDefault();
    showPage('dashboard');
  });
  document.getElementById('aboutNavBtn').addEventListener('click', (e) => {
    e.preventDefault();
    showPage('about');
  });
  document.getElementById('exitAboutBtn').addEventListener('click', () => showPage('dashboard'));
  document.getElementById('exitFeatureBtn').addEventListener('click', () => {
    alarmsFeature.style.display = 'none';
    dictionaryFeature.style.display = 'none';
    emergencyFeature.style.display = 'none';
    showPage('dashboard');
  });

  document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('click', () => {
      const feature = card.getAttribute('data-feature');
      openFeature(feature);
    });
  });

  init();
});

// The rest of the functions (openFeature, initAlarms, initDictionary, initEmergency, renderEmergencyContacts) remain unchanged as they are not affected.

// Open Feature
function openFeature(feature) {
  // Hide all features first
  alarmsFeature.style.display = 'none';
  dictionaryFeature.style.display = 'none';
  emergencyFeature.style.display = 'none';

  showPage('featureDetail');
  let headingText = '';
  let headingTranslation = '';

  if (feature === 'alarms') {
    headingText = 'Medicine Alarms';
    headingTranslation = '(Pag-palagaip iti Oras ti Panagtumar)';
    alarmsFeature.style.display = 'block';
    initAlarms();
  } else if (feature === 'dictionary') {
    headingText = 'Medicine Dictionary';
    headingTranslation = '(Diksyonaryo ti Agas)';
    dictionaryFeature.style.display = 'block';
    initDictionary();
  } else if (feature === 'emergency') {
    headingText = 'Emergency Guide';
    headingTranslation = '(Bayabay para iti Saan nga Mapakpakadaan a Pasamak)';
    emergencyFeature.style.display = 'block';
    initEmergency();
  }

  featureDetailHeading.innerHTML = `${headingText} <span class="translation">${headingTranslation}</span>`;
  featureDetailHeadingTranslation.innerHTML = ''; // Clear if needed
}

// === Medicine Alarms ===
function initAlarms() {
  const alarmList = document.getElementById('alarmList');
  const addAlarmBtn = document.getElementById('addAlarmBtn');
  let localAlarms = [...alarms];

  function renderAlarms() {
    alarmList.innerHTML = '';
    if (localAlarms.length === 0) {
      alarmList.innerHTML = '<p class="main-text-large" style="color:#333; text-align:center;">No alarms set. <span class="translation">(Awan ti alarma a na-set.)</span></p>';
      return;
    }
    localAlarms.forEach(alarm => {
      const div = document.createElement('div');
      div.className = 'alarm-item';

      div.innerHTML = `
        <div>
          <div class="alarm-time">${formatTime(alarm.alarmTime)}</div>
          <div class="alarm-medicine-info">${alarm.medicineName} - ${alarm.frequency} <span class="translation">(${alarm.medicineName} - ${alarm.frequency})</span></div>
        </div>
        <button class="deleteAlarmBtn" data-id="${alarm.id}"><i class="fas fa-trash-alt"></i></button>
      `;
      alarmList.appendChild(div);
    });

    // Delete listeners
    alarmList.querySelectorAll('.deleteAlarmBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        localAlarms = localAlarms.filter(a => a.id != id);
        alarms = localAlarms;
        localStorage.setItem('mediCareAlarms', JSON.stringify(alarms));
        renderAlarms();
      });
    });
  }

  function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  }

  // Alarm notification functions (unchanged from original)
  function setAlarmNotification(alarm) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') scheduleNotification(alarm);
      });
    } else if (Notification.permission === 'granted') {
      scheduleNotification(alarm);
    }
  }

  function scheduleNotification(alarm) {
    const now = new Date();
    const [alarmHours, alarmMinutes] = alarm.alarmTime.split(':');
    let alarmDateTime = new Date();
    alarmDateTime.setHours(parseInt(alarmHours), parseInt(alarmMinutes), 0, 0);

    if (alarmDateTime <= now) {
      alarmDateTime.setDate(alarmDateTime.getDate() + 1);
    }

    const timeout = alarmDateTime.getTime() - now.getTime();

    if (alarm.timeoutId) clearTimeout(alarm.timeoutId);

    alarm.timeoutId = setTimeout(() => {
      showNotification(alarm.medicineName);

      if (alarm.frequency === 'daily') {
        alarmDateTime.setDate(alarmDateTime.getDate() + 1);
        const updatedAlarm = { ...alarm, active: true };
        const alarmIndex = alarms.findIndex(a => a.id === alarm.id);
        if (alarmIndex > -1) {
          alarms[alarmIndex] = updatedAlarm;
          localStorage.setItem('mediCareAlarms', JSON.stringify(alarms));
        }
        setAlarmNotification(updatedAlarm);
      }
    }, timeout);
  }

  function playAlarmSound() {
    if (!window.AudioContext && !window.webkitAudioContext) return;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(1.0, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);
  }

  function showNotification(medicineName) {
    playAlarmSound();
    if (Notification.permission === 'granted') {
      new Notification('Medicine Reminder', {
        body: `Time to take your ${medicineName}! <span class="translation">(Oras ti panagtumar ti ${medicineName}!)</span>`,
        icon: 'https://via.placeholder.com/128x128?text=Pill'
      });
    } else {
      alert(`Time to take your ${medicineName}! <span class="translation">(Oras ti panagtumar ti ${medicineName}!)</span>`);
    }
  }

  addAlarmBtn.addEventListener('click', () => {
    const medicineNameInput = document.getElementById('medicineName');
    const alarmTimeInput = document.getElementById('alarmTime');
    const frequencySelect = document.getElementById('frequency');

    const medicineName = medicineNameInput.value.trim();
    const alarmTime = alarmTimeInput.value;
    const frequency = frequencySelect.value;

    if (!medicineName || !alarmTime) {
      alert('Please fill in all fields. <span class="translation">(Punan dagiti fields.)</span>');
      return;
    }

    const alarm = {
      id: Date.now(),
      medicineName,
      alarmTime,
      frequency,
      active: true,
      timeoutId: null
    };

    localAlarms.push(alarm);
    alarms = localAlarms;
    localStorage.setItem('mediCareAlarms', JSON.stringify(alarms));
    renderAlarms();
    setAlarmNotification(alarm);

    medicineNameInput.value = '';
    alarmTimeInput.value = '';
  });

  renderAlarms();
}

// === Medicine Dictionary ===
function initDictionary() {
  const medicines = [
    {
      category: 'Pain Relievers',
      categoryTranslation: '(Pampababa ti Sakit)',
      items: [
        { name: 'Ibuprofen', description: 'Helps with pain, fever, and swelling. Good for headaches and muscle aches.', descriptionTranslation: '(Makatulong iti sakit, gurigor, ken panagngelngel. Maayo para iti sakit ti bungo ken sakit ti muscle.)' },
        { name: 'Acetaminophen', description: 'Reduces pain and fever. Common for colds, flu, and general aches.', descriptionTranslation: '(Pabassiten ti sakit ken gurigor. Kadawyan para iti sipon, trangkaso, ken sabsabali a sakit.)' },
        { name: 'Aspirin', description: 'Used for pain, fever, and swelling. Can also help prevent blood clots (ask a doctor).', descriptionTranslation: '(Usaren para iti sakit, gurigor, ken panagngelngel. Makatulong met a manglapped iti panagbekkel ti dara (agsaludsod iti doktor).)' },
        { name: 'Alaxan', description: 'Relieves body pain and inflammation from its source. Take as directed.', descriptionTranslation: '(Makatulong a mangpalpak ti sakit ti bagi ken inflammation. Agtumar kas imbilin.)' },
        { name: 'Bioflu', description: ''}
      ]
    },
    {
      category: 'Blood Pressure Medications',
      categoryTranslation: '(Agas para iti Alta Presyon)',
      items: [
        { name: 'Lisinopril', description: 'Helps relax blood vessels to lower high blood pressure. Take as directed by your doctor.', descriptionTranslation: '(Makatulong a mangpalukneng kadagiti urat ti dara tapno pabassiten ti alta presyon. Agtumar kas imbilin ti doktor.)' },
        { name: 'Amlodipine', description: 'Works by relaxing blood vessels, making it easier for your heart to pump blood. Used for high blood pressure and chest pain.', descriptionTranslation: '(Agtrabaho babaen ti panangpalukneng kadagiti urat ti dara, a mangpalaka iti panagbomba ti puso iti dara. Usaren para iti alta presyon ken sakit ti barukong.)' },
        { name: 'Losartan', description: 'Helps relax blood vessels to lower high blood pressure. Important to take regularly.', descriptionTranslation: '(Makatulong a mangpalukneng kadagiti urat ti dara tapno pabassiten ti alta presyon. Importante a regular nga agtumar.)' },
        { name: 'Calcibloc', description: 'Helps to lower blood pressure and treat heart problems. Consult a doctor for detailed usage.', descriptionTranslation: '(Makatulong a pabassiten ti presyon ti dara ken mangagas kadagiti problema ti puso. Agsaludsod iti doktor para iti naimbag a panagusar.)' }
      ]
    },
    {
      category: 'Diabetes Medications',
      categoryTranslation: '(Agas para iti Diabetes)',
      items: [
        { name: 'Metformin', description: 'Helps your body use insulin better and lowers sugar made by your liver. For type 2 diabetes.', descriptionTranslation: '(Makatulong iti bagim a nasaysayaat nga usaren ti insulin ken pabassiten ti asukar nga aramiden ti ataymo. Para iti type 2 diabetes.)' },
        { name: 'Insulin', description: 'A hormone that helps sugar get into your cells for energy. Used for both type 1 and some type 2 diabetes.', descriptionTranslation: '(Maysa a hormone a makatulong iti asukar a sumrek kadagiti selulam para iti enerhiya. Usaren para iti type 1 ken dadduma a type 2 diabetes.)' },
        { name: 'Gliclazide', description: 'Helps control blood sugar levels for people with type 2 diabetes. Do not skip meals while taking it. Consult a doctor for detailed usage.', descriptionTranslation: '(Makatulong a mangkontrol ti blood sugar levels para kadagiti tao nga adda type 2 diabetes. Saan a laktawan ti makan agraman no agtumar. Agsaludsod iti doktor para iti naimbag a panagusar.)' }
      ]
    },
    {
      category: 'Antibiotics',
      categoryTranslation: '(Antibiotiko)',
      items: [
        { name: 'Amoxicillin', description: 'Fights bacterial infections like ear infections, strep throat, and pneumonia. Finish the full course even if you feel better.', descriptionTranslation: '(Manglaban kadagiti impeksyon ti bakterya kas iti impeksyon ti lapayag, strep throat, ken pneumonia. Tapusen ti intero a kurso uray no nasaysayaat ti riknam.)' },
        { name: 'Azithromycin', description: 'Treats various bacterial infections, including some respiratory and skin infections. Take as prescribed.', descriptionTranslation: '(Mangagas kadagiti nadumaduma a impeksyon ti bakterya, agraman dagiti impeksyon ti panaganges ken kudil. Agtumar kas nareseta.)' }
      ]
    },
    {
      category: 'Antacids',
      categoryTranslation: '(Antasid)',
      items: [
        { name: 'Omeprazole', description: 'Reduces the amount of acid your stomach makes. Used for heartburn and acid reflux.', descriptionTranslation: '(Pabassiten ti kaadu ti asido nga aramiden ti tiyanmo. Usaren para iti heartburn ken acid reflux.)' },
        { name: 'Ranitidine', description: 'Lowers stomach acid. Helps with heartburn and ulcers. Note: Check with your doctor as it may be recalled in some regions.', descriptionTranslation: '(Pabassiten ti asido ti tiyan. Makatulong iti heartburn ken ulser. Pauna: Agsaludsod iti doktor no naala manen kadagiti dadduma a rehion.)' },
        { name: 'Maalox', description: 'Relieves heartburn, acid indigestion, and stomach pain. Neutralizes stomach acid. Take after meals and not with other medicines.', descriptionTranslation: '(Makatulong a mangpalpak ti heartburn, acid indigestion, ken sakit ti tiyan. Neutralizes ti asido ti tiyan. Agtumar babaen ti makan ken saan a same time iti sabsabali a agas.)' }
      ]
    },
    {
      category: 'Vitamins',
      categoryTranslation: '(Bitamina)',
      items: [
        { name: 'Mutilem', description: 'A multivitamin supplement to support overall health. Consult a doctor for detailed usage.', descriptionTranslation: '(Maysa a multivitamin supplement a mangsuporta iti overall health. Agsaludsod iti doktor para iti naimbag a panagusar.)' },
        { name: 'Vitamin B-Complex', description: 'Supports energy production and nerve health. Common for fatigue and stress relief. Consult a doctor for detailed usage.', descriptionTranslation: '(Mangsuporta iti energy production ken nerve health. Kadawyan para iti panagpangpangawa ken stress relief. Agsaludsod iti doktor para iti naimbag a panagusar.)' }
      ]
    },
    {
      category: 'Gout',
      categoryTranslation: '(Agas para iti Gout)',
      items: [
        { name: 'Allopurinol', description: 'Reduces uric acid levels to prevent gout attacks. Take as prescribed by a doctor.', descriptionTranslation: '(Pabassiten ti uric acid levels tapno manglapped iti gout attacks. Agtumar kas nareseta ti doktor.)' }
      ]
    },
    {
      category: 'Anti-Vertigo',
      categoryTranslation: '(Agas para iti Anti-Vertigo)',
      items: [
        { name: 'Betahistine', description: 'Helps reduce dizziness and vertigo symptoms. Consult a doctor for detailed usage.', descriptionTranslation: '(Makatulong a pabassiten ti dizziness ken vertigo symptoms. Agsaludsod iti doktor para iti naimbag a panagusar.)' },
        { name: 'Cinnarizine', description: 'Treats motion sickness and vertigo. Take before travel if needed. Consult a doctor for detailed usage.', descriptionTranslation: '(Mangagas iti motion sickness ken vertigo. Agtumar a mangrugi no needed para iti travel. Agsaludsod iti doktor para iti naimbag a panagusar.)' },
        { name: 'Bonamine', description: 'Prevents nausea and vertigo, especially from motion. Consult a doctor for detailed usage.', descriptionTranslation: '(Manglapped iti nausea ken vertigo, agraman iti motion. Agsaludsod iti doktor para iti naimbag a panagusar.)' }
      ]
    }
  ];

  const medicineList = document.getElementById('medicineList');
  const medicineSearch = document.getElementById('medicineSearch');

  function renderMedicines(filter = '') {
    medicineList.innerHTML = '';
    const lowerFilter = filter.toLowerCase();
    let foundAny = false;

    if (lowerFilter.length < 2) {
      medicineList.innerHTML = '<p class="main-text-large" style="color:#333; text-align:center; padding:20px 0;">Start typing to search for medicines. <span class="translation">(Mangrugi nga ag-type tapno agbiruk ti agas.)</span></p>';
      return;
    }

    medicines.forEach(category => {
      const filteredItems = category.items.filter(item =>
        item.name.toLowerCase().includes(lowerFilter) ||
        item.description.toLowerCase().includes(lowerFilter) ||
        item.descriptionTranslation.toLowerCase().includes(lowerFilter)
      );

      if (filteredItems.length > 0) {
        foundAny = true;
        const catDiv = document.createElement('div');
        catDiv.className = 'medicine-category';

        const header = document.createElement('div');
        header.className = 'category-header';
        header.innerHTML = `
          <span>${category.category} <span class="translation">${category.categoryTranslation}</span></span>
          <span><i class="fas fa-chevron-down"></i></span>
        `;

        const content = document.createElement('div');
        content.className = 'category-content';

        filteredItems.forEach(item => {
          const medDiv = document.createElement('div');
          medDiv.className = 'medicine-item';

          medDiv.innerHTML = `
            <h4>${item.name} <span class="translation">(${item.name})</span></h4>
            <p class="step-text">${item.description}</p>
            <p class="step-translation">${item.descriptionTranslation}</p>
          `;

          content.appendChild(medDiv);
        });

        catDiv.appendChild(header);
        catDiv.appendChild(content);
        medicineList.appendChild(catDiv);
      }
    });

    if (!foundAny && lowerFilter.length >= 2) {
      medicineList.innerHTML = '<p class="main-text-large" style="color:#333; text-align:center; padding:20px 0;">No medicines found matching your search. <span class="translation">(Awan ti agas a kapada ti inaramid mo a panagbiruk.)</span></p>';
    }
  }

  medicineSearch.addEventListener('input', () => {
    renderMedicines(medicineSearch.value);
  });

  renderMedicines(); // Initial render
}

// === Emergency Guide (Step-by-Step) ===
function initEmergency() {
  const emergencies = [
    {
      title: 'Dizziness or Lightheadedness',
      titleTranslation: '(Panagulaw)',
      keywords: ['Dizziness', 'Maulaw', 'Lightheadedness', 'Agkakapsut'],
      steps: [
        { text: 'Sit still or lie down right away.', translation: '(Agtugaw wenno agidda a sigud.)'},
        { text: 'Drink water or juice slowly.', translation: '(Innayaden nga uminom ti danum wenno juice.)'},
        { text: 'Take deep, steady breaths.', translation: '(Aganges ti nauneg ken nainnayad.)'},
        { text: 'Rest until you feel stable before standing again.', translation: '(Aginana aginggana mayat ti rikna sakbay a tumakder manen.)'}
      ]
    },
    {
      title: 'Fever or Flu',
      titleTranslation: '(Gurigor)',
      keywords: ['Trangkaso', 'Gurigor', 'Fever', 'Flu'],
      steps: [
        { text: 'Take temperature and note it down.', translation: '(Alaen ti temparatura ti bagi ken tandaanan.)'},
        { text: 'Drink or eat plenty of fluid like water or soup.', translation: '(Mangan wenno umigop ti addu a danom wennu digo.)'},
        { text: 'Take paracetamol if fever is high.', translation: '(Agtumar ti paracetamol nu nangato ti gurigor.)'},
        { text: 'Rest in a cool, quiet room and monitor your condition.', translation: '(Aginana ayanti nalamiis ken naulimek a lugar ken bantayan ti rikriknaem.)'}
      ]
    },
    {
      title: 'Allergic Reaction',
      titleTranslation: '(Reaksyon ti Allergy)',
      keywords: ['allergy', 'reaction', 'anaphylaxis', 'hives', 'swelling'],
      steps: [
        { text: 'If you have an EpiPen, use it immediately in the thigh.', translation: '(No adda EpiPen, usarem a dagus iti thigh.)'},
        { text: 'Call emergency services right away for serious reactions.', translation: '(Agtwag emergency services a dagus para kadagiti nakaro a reaksyon.)'},
        { text: 'Watch for itchy bumps (hives), swelling, trouble breathing, or dizziness.', translation: '(Bantayan dagiti agkagat a butlig (hives), panagburay, narigat a panaganges, wenno panaglanglang.)'},
        { text: 'Keep the person calm and lying down if possible.', translation: '(Agtalinaed ti tao ken aginana no mabalin.)'}
      ]
    },
    {
      title: 'Scrapes or Cuts',
      titleTranslation: '(Sugat)',
      keywords: ['sugat', 'wound', 'cut', 'blood'],
      steps: [
        { text: 'Wash hands thoroughly.', translation: '(Bugwan a nasayaat ti im-ima.)'},
        { text: 'Clean the wound gently with soap and water.', translation: '(Agusar ti sabon ken danom ken innayaden nga dalusan iti sugat.)'},
        { text: 'Apply antiseptic or alcohol-free wound ointment.', translation: '(Agusar ti antiseptic wenno wound ointemnt nga awan ti alcohol.)' },
        { text: 'Cover with a clean bandage and change daily..', translation: '(Agusar ti nadalus nga bandage a pangtakkob ti sugat ken suktan nga innaldaw.)'}
      ]
    },
    {
      title: 'Indigestion',
      titleTranslation: '(Sakit ti Buksit)',
      keywords: ['Indigestion', 'Stomach Pain', 'Sakit ti Tiyan'],
      steps: [
        { text: 'Stop eating for a few hours. Let your stomach rest.', translation: '(Isardeng ti mangan ti mano nga oras tapno paginanaen ti tiyan).)'},
        { text: 'Sip water slowly to stay hydrated.', translation: '(Innayaden nga uminom ti danum.)'},
        { text: 'Eat bland food like rice, banana, or crackers.', translation: '(Mangan ti natatamnay nga makan kasla inapoy, saba, wennu biskwit.)'},
        { text: 'Take antacid if needed and avoid greasy or spicy foods.', translation: '(Agtumar ti para sakit ti tiyan ken lik-likan ti mangan ti namantika ken naadat nga mak-makan.)' }
      ]
    },
    {
      title: 'Small Burns (1st Degree Only)',
      titleTranslation: '(Nasinit)',
      keywords: ['burns', 'nasinit', 'heat', 'scald'],
      steps: [
        { text: 'Cool the burnt area with cool (not icy cold) running water for 10-15 minutes.', translation: '(Palamiisen ti nasinit nga parte ti bagi, agusar iti agtar-taray ken nalamis ngem haan nga agyel-yelo nga danum. Aramiden detuy ti 10-15 a minuto.)'},
        { text: 'Gently pat dry with a clean towel.', translation: '(Innayaden nga punasan ti nadalus a lupot.)'},
        { text: 'Apply aloe vera gel or burn cream.', translation: '(Agusar ti aloe vera gel wennu burn cream.)'},
        { text: 'Leave it loosely covered to heal.', translation: '(Baybay-an a nalukay ti pannakabungon na.)'}
      ]
    },
    {
      title: 'Joint Pain',
      titleTranslation: '(Joint Pain)',
      keywords: ['nasakit', 'joint', 'arthritis', 'nasakit nga joints'],
      steps: [
        { text: 'Stop moving the sore area and rest.', translation: '(Pagina-naen wennu haan nga gargarawen iti nasakit a parte.)'},
        { text: 'Wrap with a bandage or lightly compress.', translation: '(Bungunen ti bandage wennu piriten a nalag-an.)'},
        { text: 'Apply ice for 15-20 minutes every hour.', translation: '(Ikkan ti yelo iti uneg ti 15-20 nga minuto kada oras.)'},
        { text: 'Keep it elevated above heart level to reduce swelling.', translation: '(Italinaed nga nangat-ngato ngem ti puso tapno haan nga lumteg.)'}
      ]
    }
  ];

  const emergencyList = document.getElementById('emergencyList');
  const emergencySearch = document.getElementById('emergencySearch');

  function renderEmergencies(filter = '') {
    emergencyList.innerHTML = '';
    const lowerFilter = filter.toLowerCase();
    let foundAny = false;

    if (lowerFilter.length < 2) {
      emergencyList.innerHTML = '<p class="main-text-large" style="color:#333; text-align:center; padding:20px 0;">Start typing to search for emergency guides. <span class="translation">(Mangrugi nga ag-type tapno agbiruk ti bayabay para iti Saan nga Mapakpakadaan a Pasamak.)</span></p>';
      return;
    }

    emergencies.forEach(emergency => {
      // Enhanced matching: title, translation, keywords, or any step text/translation
      const matchesTitle = emergency.title.toLowerCase().includes(lowerFilter) ||
                           emergency.titleTranslation.toLowerCase().includes(lowerFilter);
      const matchesKeywords = emergency.keywords.some(k => k.toLowerCase().includes(lowerFilter));
      const matchesSteps = emergency.steps.some(step =>
        step.text.toLowerCase().includes(lowerFilter) ||
        step.translation.toLowerCase().includes(lowerFilter)
      );
      if (!matchesTitle && !matchesKeywords && !matchesSteps) return;

      foundAny = true;
      const card = document.createElement('div');
      card.className = 'emergency-card';

      const title = document.createElement('h3');
      title.innerHTML = `
        ${emergency.title} <span class="translation">${emergency.titleTranslation}</span>
        <span><i class="fas fa-chevron-down"></i></span>
      `;

      const stepsDiv = document.createElement('div');
      stepsDiv.className = 'emergency-steps';

      const ol = document.createElement('ol');
      emergency.steps.forEach((step, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
          <span class="step-text">${step.text}</span>
          <span class="step-translation">${step.translation}</span>
          ${step.image ? `<img src="${step.image}" alt="Step ${index + 1} for ${emergency.title}: ${step.text.substring(0, 50)}..." class="step-image">` : ''}
        `;
        ol.appendChild(li);
      });

      stepsDiv.appendChild(ol);
      card.appendChild(title);
      card.appendChild(stepsDiv);
      emergencyList.appendChild(card);
    });

    if (!foundAny && lowerFilter.length >= 2) {
      emergencyList.innerHTML = '<p class="main-text-large" style="color:#333; text-align:center; padding:20px 0;">No emergencies found matching your search. <span class="translation">(Awan ti emerhensya a kapada ti inaramid mo a panagbiruk.)</span></p>';
    }
  }

  emergencySearch.addEventListener('input', () => {
    renderEmergencies(emergencySearch.value);
  });

  renderEmergencies(); // Initial call to show "Start typing..." message
}

// === Emergency Hotlines Bar (Updated with Translation Consistency) ===
function renderEmergencyContacts() {
  const hotlines = [
    { name: 'FNLGHTC', number: '0966-612-2623 or 0919-328-1763' },
    { name: 'MHO', number: '0905-799-2922' },
    { name: 'MPS (Police)', number: '0998-598-7730' },
  ];

  const hotlinesContentDiv = document.getElementById('hotlinesContent');
  const emergencyHotlinesToggle = document.getElementById('emergencyHotlinesToggle');
  const emergencyFooter = document.getElementById('emergencyFooter');
  const activePage = document.querySelector('.page.active');

  if (!hotlinesContentDiv || !emergencyHotlinesToggle) return;

  // Clear existing content and event listeners
  hotlinesContentDiv.innerHTML = '';
  const existingListener = emergencyHotlinesToggle._toggleListener;
  if (existingListener) {
    emergencyHotlinesToggle.removeEventListener('click', existingListener);
    emergencyHotlinesToggle.removeEventListener('keydown', existingListener);
  }

  // Render hotline items with translations
  hotlines.forEach(contact => {
    const contactDiv = document.createElement('div');
    contactDiv.className = 'contact-item';
    contactDiv.title = `Call ${contact.name}`;
    contactDiv.setAttribute('role', 'button');

    contactDiv.innerHTML = `
      <strong>${contact.name}</strong>
      <a href="tel:${contact.number}" aria-label="Call ${contact.name} at ${contact.number}">${contact.number}</a>
      <span class="translation">(Agtwag ${contact.name})</span>
    `;

    contactDiv.addEventListener('click', (e) => {
      if (e.target.tagName !== 'A') {
        window.location.href = `tel:${contact.number}`;
      }
    });

    hotlinesContentDiv.appendChild(contactDiv);
  });

  // Calculate dynamic max-height
  function calculateMaxHeight() {
    hotlinesContentDiv.style.maxHeight = 'none';
    const height = hotlinesContentDiv.scrollHeight + 20;
    hotlinesContentDiv.style.maxHeight = '0px';
    return height + 'px';
  }

  // Toggle function
  function toggleHotlines(e) {
    if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') {
      return;
    }
    e.preventDefault();

    const isExpanded = hotlinesContentDiv.getAttribute('aria-hidden') === 'false';
    const maxHeight = calculateMaxHeight();

    if (isExpanded) {
      // Close
      hotlinesContentDiv.style.maxHeight = '0px';
      hotlinesContentDiv.setAttribute('aria-hidden', 'true');
      emergencyHotlinesToggle.setAttribute('aria-expanded', 'false');
      emergencyFooter.style.paddingBottom = '10px';
      document.body.classList.remove('footer-expanded');
    } else {
      // Open
      hotlinesContentDiv.style.maxHeight = maxHeight;
      hotlinesContentDiv.setAttribute('aria-hidden', 'false');
      emergencyHotlinesToggle.setAttribute('aria-expanded', 'true');
      emergencyFooter.style.paddingBottom = '120px';
      document.body.classList.add('footer-expanded');
    }
  }

  // Attach event listeners
  emergencyHotlinesToggle.addEventListener('click', toggleHotlines);
  emergencyHotlinesToggle.addEventListener('keydown', toggleHotlines);
  emergencyHotlinesToggle._toggleListener = toggleHotlines;

  // Initial state: closed
  hotlinesContentDiv.style.maxHeight = '0px';
  hotlinesContentDiv.setAttribute('aria-hidden', 'true');
  emergencyHotlinesToggle.setAttribute('aria-expanded', 'false');
}

// Final initialization (already called in DOMContentLoaded, but ensure hotlines render on load)
document.addEventListener('DOMContentLoaded', () => {
  renderEmergencyContacts();
});

