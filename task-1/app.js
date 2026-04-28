const CATEGORY_META = [
  {
    key: "education", label: "Education", weight: 16, color: "#0ea5e9",
    icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7.5 10 3l8 4.5-8 4.5-8-4.5Z"/><path d="M5 9.25v4.1c0 .6 2.24 2.15 5 2.15s5-1.55 5-2.15v-4.1"/><path d="M18 7.5v5"/></svg>`,
  },
  {
    key: "publicSpeaking", label: "Public Speaking", weight: 8, color: "#0ea5e9",
    icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="12" height="8" rx="1"/><path d="M10 11v5"/><path d="M6.5 18h7"/><path d="M5 6h10"/></svg>`,
  },
  {
    key: "universityPartnership", label: "University Partnership", weight: 6, color: "#0ea5e9",
    icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="7"/><path d="M7.25 8.5h.01"/><path d="M12.75 8.5h.01"/><path d="M7.5 12.25c.8 1.1 1.73 1.65 2.5 1.65s1.7-.55 2.5-1.65"/></svg>`,
  },
];

const YEARS = ["All Years", "2025"];
const QUARTERS = ["All Quarters", "Q1", "Q2", "Q3", "Q4"];
const CATEGORY_OPTIONS = ["All Categories", ...CATEGORY_META.map((item) => item.label)];

const firstNames = [
  "Arin", "Selan", "Tavik", "Neris", "Elan", "Mira", "Soren", "Liora", "Cael", "Veya",
  "Orin", "Talia", "Renza", "Kalen", "Ivara", "Darin", "Leona", "Sivan", "Narek", "Alira",
  "Jorin", "Maelis", "Tovan", "Ceryn", "Eldin", "Riona", "Velin", "Soraya", "Kaelin", "Nivra",
];
const lastNames = [
  "Varen", "Kest", "Morrow", "Selk", "Danev", "Istral", "Corvin", "Talor", "Neris", "Belor",
  "Sorell", "Kade", "Maren", "Velar", "Dorin", "Caldis", "Leth", "Varis", "Toren", "Mirel",
  "Eldor", "Sarin", "Kael", "Voren", "Neth", "Relis", "Tarin", "Voss", "Meren", "Solis",
];
const roles = [
  "Learning Specialist", "Program Mentor", "Workshop Lead", "Education Coordinator", "Knowledge Lead", "Community Facilitator",
  "Training Consultant", "Public Speaking Coach", "Partnership Specialist", "Curriculum Designer", "Program Manager", "Mentorship Lead",
];
const groups = [
  "North Hub", "Blue Orbit", "Atlas Unit", "Signal Group", "Horizon Cell", "Delta Circle",
  "Beacon Team", "River Point", "Nova Center", "Summit Desk", "Aurora Cluster", "Central Guild",
];
const activityTemplates = {
  education: [
    '[LAB] Mentoring session coordinated by "{group}"',
    '[LAB] Lecture series hosted by "{group}"',
    '[LAB] Workshop on practical foundations',
    '[LAB] Knowledge-sharing session for peer groups',
    '[LAB] Study session supported by "{group}"',
  ],
  publicSpeaking: [
    'Conference talk delivered with "{group}"',
    'Internal presentation hosted by "{group}"',
    'Community webinar session for "{group}"',
    'Public speaking workshop for guest attendees',
    'Stage presentation during the quarterly meetup',
  ],
  universityPartnership: [
    'University partnership session with "{group}"',
    'Campus outreach activity organized by "{group}"',
    'Student mentorship event hosted with partners',
    'University collaboration workshop with invited guests',
    'Partnership follow-up session for student groups',
  ],
};
const palettes = [
  ["#ffcf1e", "#ff8c42"],
  ["#2aa7f0", "#0066ff"],
  ["#9b5cff", "#5a6cff"],
  ["#12c998", "#0f8f72"],
  ["#ff6d8f", "#ffb347"],
  ["#5468ff", "#00b3ff"],
];

const state = {
  year: "All Years",
  quarter: "All Quarters",
  category: "All Categories",
  search: "",
};

const allEntries = buildDataset(227);

const yearFilter = document.querySelector("#yearFilter");
const quarterFilter = document.querySelector("#quarterFilter");
const categoryFilter = document.querySelector("#categoryFilter");
const searchInput = document.querySelector("#searchInput");
const searchClear = document.querySelector("#searchClear");
const searchWrap = document.querySelector(".search-wrap");
const podiumRoot = document.querySelector("#podiumRoot");
const listRoot = document.querySelector("#listRoot");
const summary = document.querySelector("#summary");
const dropdowns = {
  year: document.querySelector('[data-filter="year"]'),
  quarter: document.querySelector('[data-filter="quarter"]'),
  category: document.querySelector('[data-filter="category"]'),
};

populateDropdown(dropdowns.year, YEARS, state.year);
populateDropdown(dropdowns.quarter, QUARTERS, state.quarter);
populateDropdown(dropdowns.category, CATEGORY_OPTIONS, state.category);

wireDropdown(dropdowns.year, "year", YEARS);
wireDropdown(dropdowns.quarter, "quarter", QUARTERS);
wireDropdown(dropdowns.category, "category", CATEGORY_OPTIONS);

document.addEventListener("click", (event) => {
  if (!event.target.closest(".dropdown-wrap")) {
    closeAllDropdowns();
  }
});

searchInput.addEventListener("input", (event) => {
  state.search = event.target.value.trim().toLowerCase();
  syncSearchUi();
  render();
});

searchClear.addEventListener("click", () => {
  searchInput.value = "";
  state.search = "";
  syncSearchUi();
  render();
  searchInput.focus();
});

syncSearchUi();

render();

function render() {
  const ranked = allEntries
    .map((entry) => withComputedStats(entry))
    .filter((entry) => entry.total > 0)
    .filter(matchesSearch)
    .sort(sortLeaderboard)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  renderSummary(ranked);
  renderPodium(ranked.slice(0, 3));
  renderList(ranked);
}

function renderSummary(ranked) {
  summary.textContent = "";

  if (ranked.length) {
    summary.hidden = true;
    return;
  }

  summary.hidden = false;
  summary.innerHTML = `
    <div class="empty-state-banner" role="status" aria-live="polite">
      <span class="empty-state-icon" aria-hidden="true">i</span>
      <span class="empty-state-message">No activities found matching the current filters.</span>
    </div>
  `;
}

function renderPodium(topThree) {
  podiumRoot.textContent = "";
  if (!topThree.length) return;

  const visualOrder = [1, 0, 2]
    .map((index) => topThree[index])
    .filter(Boolean);

  for (const entry of visualOrder) {
    const template = document.querySelector("#podiumCardTemplate");
    const node = template.content.firstElementChild.cloneNode(true);
    node.classList.add(`rank-${entry.rank}`);

    node.querySelector(".podium-avatar").style.backgroundImage = entry.avatar;
    node.querySelector(".podium-badge").textContent = entry.rank;
    node.querySelector(".podium-name").textContent = entry.name;
    node.querySelector(".podium-role").textContent = `${entry.role} (${entry.group})`;
    node.querySelector(".podium-score").textContent = entry.total;
    node.querySelector(".podium-block-rank").textContent = entry.rank;

    podiumRoot.appendChild(node);
  }
}

function renderList(ranked) {
  listRoot.textContent = "";

  if (!ranked.length) {
    return;
  }

  for (const entry of ranked) {
    const template = document.querySelector("#rowTemplate");
    const node = template.content.firstElementChild.cloneNode(true);
    const toggle = node.querySelector(".row-toggle");
    const details = node.querySelector(".row-details");

    node.querySelector(".row-rank").textContent = entry.rank;
    node.querySelector(".row-avatar").style.backgroundImage = entry.avatar;
    node.querySelector(".row-name").textContent = entry.name;
    node.querySelector(".row-role").textContent = `${entry.role} (${entry.group})`;
    node.querySelector(".row-score").textContent = entry.total;

    const categoryWrap = node.querySelector(".row-categories");
    entry.visibleCategories.forEach((item) => {
      categoryWrap.appendChild(createMiniStat(item));
    });

    const activityBody = node.querySelector(".activity-body");
    entry.activities.slice(0, 7).forEach((item) => {
      activityBody.appendChild(createActivityRow(item));
    });

    toggle.addEventListener("click", () => {
      const isExpanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!isExpanded));
      toggle.setAttribute("aria-label", isExpanded ? "Expand" : "Collapse");
      details.hidden = isExpanded;
      node.classList.toggle("is-expanded", !isExpanded);
    });

    listRoot.appendChild(node);
  }
}

function createMiniStat(item) {
  const wrapper = document.createElement("div");
  wrapper.className = "mini-stat";
  wrapper.dataset.tooltip = item.label;
  wrapper.innerHTML = `
    <span class="mini-stat-icon" style="color:${item.color}">${item.icon}</span>
    <span class="mini-stat-value">${item.events}</span>
  `;
  return wrapper;
}

function createActivityRow(item) {
  const wrapper = document.createElement("tr");
  const pillClass = item.categoryLabel.includes(" ") ? "activity-pill activity-pill--multiline" : "activity-pill";
  wrapper.innerHTML = `
    <td class="activity-name">${item.title}</td>
    <td><span class="${pillClass}">${item.categoryLabel}</span></td>
    <td class="activity-date">${item.dateLabel}</td>
    <td class="activity-points">+${item.points}</td>
  `;
  return wrapper;
}

function populateDropdown(wrapper, values, selectedValue) {
  const trigger = wrapper.querySelector(".dropdown-trigger");
  const label = trigger.querySelector(".dropdown-label");
  const menu = wrapper.querySelector(".dropdown-menu");

  label.textContent = selectedValue;
  menu.innerHTML = "";

  values.forEach((value) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "dropdown-option";
    if (value === selectedValue) option.classList.add("is-selected");
    option.textContent = value;
    option.dataset.value = value;
    menu.appendChild(option);
  });
}

function wireDropdown(wrapper, key, values) {
  const trigger = wrapper.querySelector(".dropdown-trigger");
  const menu = wrapper.querySelector(".dropdown-menu");

  trigger.addEventListener("click", () => {
    const isOpen = wrapper.classList.contains("is-open");
    closeAllDropdowns();
    if (!isOpen) {
      wrapper.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
      menu.hidden = false;
    }
  });

  menu.addEventListener("click", (event) => {
    const option = event.target.closest(".dropdown-option");
    if (!option) return;

    state[key] = option.dataset.value;
    closeAllDropdowns();
    populateDropdown(wrapper, values, state[key]);
    render();
  });
}

function closeAllDropdowns() {
  Object.values(dropdowns).forEach((wrapper) => {
    wrapper.classList.remove("is-open");
    wrapper.querySelector(".dropdown-trigger").setAttribute("aria-expanded", "false");
    wrapper.querySelector(".dropdown-menu").hidden = true;
  });
}

function syncSearchUi() {
  const hasValue = searchInput.value.length > 0;
  searchWrap.classList.toggle("has-value", hasValue);
  searchClear.hidden = !hasValue;
}

function withComputedStats(entry) {
  const selectedCategory =
    state.category === "All Categories"
      ? null
      : CATEGORY_META.find((item) => item.label === state.category)?.key;

  const breakdown = CATEGORY_META.map((category) => {
    const yearly = state.year === "All Years" ? Object.values(entry.stats) : [entry.stats[state.year]];
    let events = 0;

    yearly.forEach((year) => {
      if (!year) return;

      if (state.quarter === "All Quarters") {
        Object.values(year).forEach((quarter) => {
          events += quarter?.[category.key] ?? 0;
        });
      } else {
        events += year[state.quarter]?.[category.key] ?? 0;
      }
    });

    return {
      ...category,
      events,
      points: events * category.weight,
    };
  });

  const visibleBreakdown = selectedCategory
    ? breakdown.filter((item) => item.key === selectedCategory)
    : breakdown;

  const total = visibleBreakdown.reduce((sum, item) => sum + item.points, 0);
  const visibleCategories = visibleBreakdown
    .filter((item) => item.events > 0)
    .sort((a, b) => b.events - a.events || b.points - a.points)
    .slice(0, selectedCategory ? 1 : 2);

  return {
    ...entry,
    breakdown: visibleBreakdown,
    visibleCategories,
    total,
    activities: buildActivities(entry, selectedCategory),
  };
}

function matchesSearch(entry) {
  if (!state.search) return true;

  const haystack = `${entry.name} ${entry.role} ${entry.group}`.toLowerCase();
  return haystack.includes(state.search);
}

function sortLeaderboard(a, b) {
  return b.total - a.total || a.name.localeCompare(b.name);
}

function buildDataset(count) {
  const entries = [];

  for (let index = 0; index < count; index += 1) {
    const first = firstNames[index % firstNames.length];
    const last = lastNames[(index * 7) % lastNames.length];
    const role = roles[(index * 5) % roles.length];
    const group = groups[(index * 3) % groups.length];
    const palette = palettes[index % palettes.length];
    entries.push({
      id: index + 1,
      name: `${first} ${last}`,
      role,
      group,
      avatar: avatarPortraitUrl(index, palette),
      stats: buildStats(index),
    });
  }

  return entries;
}

function buildStats(seed) {
  const stats = {};
  const years = ["2025"];
  const profile = seed % 6;

  years.forEach((year, yearIndex) => {
    stats[year] = {};
    ["Q1", "Q2", "Q3", "Q4"].forEach((quarter, quarterIndex) => {
      let education = weightedCount(seed, yearIndex, quarterIndex, 7, 5);
      let publicSpeaking = weightedCount(seed, yearIndex, quarterIndex, 11, 4);
      let universityPartnership = weightedCount(seed, yearIndex, quarterIndex, 13, 2);

      if (profile === 0) {
        education = Math.max(1, education + 1);
        publicSpeaking = Math.max(0, publicSpeaking - 2);
        universityPartnership = 0;
      } else if (profile === 1) {
        education = 0;
        publicSpeaking = Math.max(1, publicSpeaking + 1);
        universityPartnership = Math.max(0, universityPartnership - 1);
      } else if (profile === 2) {
        education = Math.max(0, education - 2);
        publicSpeaking = Math.max(1, publicSpeaking);
        universityPartnership = 0;
      } else if (profile === 3) {
        education = Math.max(1, education);
        publicSpeaking = 0;
        universityPartnership = Math.max(0, universityPartnership - 1);
      } else if (profile === 4) {
        education = 0;
        publicSpeaking = Math.max(0, publicSpeaking - 2);
        universityPartnership = Math.max(1, universityPartnership);
      } else {
        education = Math.max(1, education);
        publicSpeaking = Math.max(0, publicSpeaking - 1);
        universityPartnership = 0;
      }

      stats[year][quarter] = {
        education,
        publicSpeaking,
        universityPartnership,
      };
    });
  });

  return stats;
}

function buildActivities(entry, selectedCategory) {
  const rows = [];
  const yearsToUse = state.year === "All Years" ? Object.entries(entry.stats) : [[state.year, entry.stats[state.year]]];

  yearsToUse.forEach(([year, quarters]) => {
    if (!quarters) return;

    Object.entries(quarters).forEach(([quarter, values], quarterIndex) => {
      if (state.quarter !== "All Quarters" && quarter !== state.quarter) {
        return;
      }

      CATEGORY_META.forEach((category, categoryIndex) => {
        if (selectedCategory && category.key !== selectedCategory) {
          return;
        }

          const events = values[category.key];
        for (let i = 0; i < events; i += 1) {
          const points = category.weight;
          const templateSet = activityTemplates[category.key];
          const template = templateSet[(entry.id + i + quarterIndex + categoryIndex) % templateSet.length];
          const day = String(28 - ((entry.id + i * 3 + quarterIndex) % 19)).padStart(2, "0");
          const monthIndex = quarterToMonth(quarter) - ((i + categoryIndex) % 3);
          const month = monthLabel(Math.max(1, monthIndex));
          rows.push({
            title: template.replaceAll("{group}", entry.group),
            categoryLabel: category.label,
            dateLabel: `${day}-${month}-${year}`,
            points,
            sortKey: Number(`${year}${String(monthIndex).padStart(2, "0")}${day}`),
          });
        }
      });
    });
  });

  return rows.sort((a, b) => b.sortKey - a.sortKey);
}

function quarterToMonth(quarter) {
  return { Q1: 3, Q2: 6, Q3: 9, Q4: 12 }[quarter] ?? 1;
}

function monthLabel(month) {
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][month - 1];
}

function weightedCount(seed, yearIndex, quarterIndex, factor, max) {
  const base = Math.max(0, 14 - Math.floor(seed / 17));
  const roll = seeded(seed * factor + yearIndex * 19 + quarterIndex * 23);
  const normalized = Math.max(0, Math.min(max, Math.round((base * roll) / 2.5 - yearIndex)));
  return normalized;
}

function seeded(value) {
  const x = Math.sin(value * 999) * 10000;
  return x - Math.floor(x);
}

function avatarPortraitUrl(index, palette) {
  const [start, end] = palette;
  const skinTones = ["#f5d7be", "#f1c7a3", "#e9b98f", "#dca77e"];
  const hairTones = ["#22304d", "#4b3621", "#6b4f3a", "#1f2937", "#6b7280"];
  const shirtTones = ["#274c77", "#1f6f8b", "#3a506b", "#284b63", "#385170"];
  const accentTones = ["#f8fafc", "#e2e8f0", "#dbeafe", "#ede9fe"];
  const skin = skinTones[index % skinTones.length];
  const hair = hairTones[(index * 3) % hairTones.length];
  const shirt = shirtTones[(index * 5) % shirtTones.length];
  const accent = accentTones[(index * 7) % accentTones.length];
  const hairHeight = 18 + (index % 10);
  const shoulderInset = 62 + (index % 12);
  const faceY = 108 + (index % 6);
  const eyeY = faceY + 6;
  const mouthY = faceY + 28;
  const tie = index % 2 === 0 ? "#cbd5e1" : "#f8fafc";
  const jacket = shirtTones[(index * 11) % shirtTones.length];

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${start}" />
          <stop offset="100%" stop-color="${end}" />
        </linearGradient>
        <linearGradient id="shine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.32)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <rect width="320" height="320" rx="160" fill="url(#bg)" />
      <rect width="320" height="320" rx="160" fill="rgba(255,255,255,0.06)" />
      <ellipse cx="160" cy="72" rx="96" ry="42" fill="rgba(255,255,255,0.14)" />
      <circle cx="235" cy="74" r="34" fill="rgba(255,255,255,0.12)" />
      <path d="M${shoulderInset} 280c14-52 51-84 98-84 47 0 84 32 98 84" fill="${jacket}" />
      <path d="M118 280c10-34 24-52 42-58h0c18 8 32 24 42 58" fill="${shirt}" opacity="0.9" />
      <path d="M160 214l-14 66h28z" fill="${tie}" opacity="0.95" />
      <circle cx="160" cy="${faceY}" r="52" fill="${skin}" />
      <path d="M110 ${faceY - 4}c6-${hairHeight} 28-38 50-38 30 0 57 14 62 42-16-12-34-18-63-18-22 0-36 4-49 14Z" fill="${hair}" />
      <path d="M111 ${faceY - 10}c12 10 28 14 49 14 26 0 46-8 60-18-6 24-4 46 5 63-10 2-18-6-22-15-8 8-22 13-37 13-17 0-31-6-40-17-4 11-10 17-19 18 8-18 9-38 4-58Z" fill="${hair}" opacity="0.22" />
      <path d="M138 ${faceY + 18}c7 6 37 6 44 0" stroke="#b16d66" stroke-width="2" opacity="0.2" fill="none" />
      <circle cx="142" cy="${eyeY}" r="4" fill="#374151" />
      <circle cx="178" cy="${eyeY}" r="4" fill="#374151" />
      <path d="M134 ${eyeY - 10}c5-4 11-6 16-5" stroke="${hair}" stroke-width="3" stroke-linecap="round" opacity="0.7" fill="none" />
      <path d="M170 ${eyeY - 10}c5-1 11 1 16 5" stroke="${hair}" stroke-width="3" stroke-linecap="round" opacity="0.7" fill="none" />
      <path d="M159 ${eyeY + 6}c-2 7-2 13 2 18" stroke="#9a5b54" stroke-width="2" stroke-linecap="round" opacity="0.35" fill="none" />
      <path d="M145 ${mouthY}c8 8 22 8 30 0" stroke="#9a5b54" stroke-width="4" stroke-linecap="round" fill="none" />
      <path d="M116 226c10 14 25 22 44 22 18 0 33-8 44-22" stroke="${accent}" stroke-width="5" stroke-linecap="round" opacity="0.8" fill="none" />
      <path d="M108 278h104" stroke="${accent}" stroke-width="6" stroke-linecap="round" opacity="0.8" />
      <rect width="320" height="320" rx="160" fill="url(#shine)" />
    </svg>
  `;

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
