const CATEGORY_META = [
  {
    key: "live", label: "Live Performances", weight: 24, color: "#2aa7f0",
    icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="6" height="9" rx="3"/><path d="M4 10a6 6 0 0 0 12 0"/><line x1="10" y1="16" x2="10" y2="19"/><line x1="7" y1="19" x2="13" y2="19"/></svg>`,
  },
  {
    key: "studio", label: "Studio Sessions", weight: 16, color: "#4b8bd7",
    icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v-2a6 6 0 0 1 12 0v2"/><rect x="2" y="11" width="3" height="5" rx="1"/><rect x="15" y="11" width="3" height="5" rx="1"/></svg>`,
  },
  {
    key: "collab", label: "Collaborations", weight: 6, color: "#7a73ef",
    icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="6" r="3"/><path d="M1 18v-1a6 6 0 0 1 12 0v1"/><circle cx="15" cy="6" r="2.5"/><path d="M18 18v-1a4 4 0 0 0-3-3.87"/></svg>`,
  },
];

const YEARS = ["All Years", "2026", "2025", "2024", "2023"];
const QUARTERS = ["All Quarters", "Q1", "Q2", "Q3", "Q4"];
const CATEGORY_OPTIONS = ["All Categories", ...CATEGORY_META.map((item) => item.label)];

const firstNames = [
  "Milo", "Nova", "Juno", "Ari", "Lena", "Theo", "Romy", "Sage", "Ezra", "Ivy",
  "Zane", "Nina", "Orion", "Lyra", "Felix", "Mara", "Dorian", "Talia", "Reed", "Cleo",
  "Atlas", "Vera", "Kian", "Suri", "Elio", "Mina", "Luca", "Skye", "Noel", "Ayla",
];
const lastNames = [
  "Vesper", "Vale", "Mercer", "Lyric", "Sol", "Hart", "Monroe", "Sterling", "Lane", "Bloom",
  "Quill", "Kestrel", "Arden", "Morrow", "West", "Fable", "Pryce", "Hollis", "Rowe", "Sloane",
  "Ember", "Kade", "Haze", "Drake", "Bellamy", "Raine", "Ever", "Marin", "Winter", "Dune",
];
const roles = [
  "Lead Vocalist", "Producer", "Lead Guitarist", "Bass Artist", "Drummer", "Synth Composer",
  "Sound Designer", "Session Pianist", "Creative Director", "Tour Artist", "DJ", "Songwriter",
];
const collectives = [
  "Neon Harbor", "Velvet Echo", "Moonline", "Glass Anthem", "Solar Arcade", "North Chorus",
  "Static Bloom", "Low Tide Club", "Golden Signal", "Midnight Alley", "River Static", "Blue Current",
];
const activityTemplates = {
  live: [
    'Headlined the "{collective} Afterglow" set',
    'Performed a sunset showcase at Harbor Stage',
    'Played an unplugged rooftop session',
    'Opened the Midnight Circuit live program',
    'Led the closing set for Neon Weekender',
  ],
  studio: [
    'Recorded a masterclass session on arrangement basics',
    'Ran a guided rehearsal lab for rising artists',
    'Produced a studio workshop on vocal layering',
    'Hosted a writing room session for "{collective}"',
    'Recorded a behind-the-scenes session breakdown',
  ],
  collab: [
    'Joined a cross-collective collaboration showcase',
    'Mentored an emerging artist duo',
    'Co-created a live session with guest performers',
    'Partnered on a spotlight residency project',
    'Contributed to a collaborative community set',
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

const allMusicians = buildDataset(227);

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
  const ranked = allMusicians
    .map((musician) => withComputedStats(musician))
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

  for (const musician of visualOrder) {
    const template = document.querySelector("#podiumCardTemplate");
    const node = template.content.firstElementChild.cloneNode(true);
    node.classList.add(`rank-${musician.rank}`);

    node.querySelector(".podium-avatar").style.backgroundImage = musician.avatar;
    node.querySelector(".podium-badge").textContent = musician.rank;
    node.querySelector(".podium-name").textContent = musician.name;
    node.querySelector(".podium-role").textContent = `${musician.role} (${musician.collective})`;
    node.querySelector(".podium-score").textContent = musician.total;
    node.querySelector(".podium-block-rank").textContent = musician.rank;

    podiumRoot.appendChild(node);
  }
}

function renderList(ranked) {
  listRoot.textContent = "";

  if (!ranked.length) {
    return;
  }

  for (const musician of ranked) {
    const template = document.querySelector("#rowTemplate");
    const node = template.content.firstElementChild.cloneNode(true);
    const toggle = node.querySelector(".row-toggle");
    const details = node.querySelector(".row-details");

    node.querySelector(".row-rank").textContent = musician.rank;
    node.querySelector(".row-avatar").style.backgroundImage = musician.avatar;
    node.querySelector(".row-name").textContent = musician.name;
    node.querySelector(".row-role").textContent = `${musician.role} (${musician.collective})`;
    node.querySelector(".row-score").textContent = musician.total;

    const categoryWrap = node.querySelector(".row-categories");
    musician.visibleCategories.forEach((item) => {
      categoryWrap.appendChild(createMiniStat(item));
    });

    const activityBody = node.querySelector(".activity-body");
    musician.activities.slice(0, 7).forEach((item) => {
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

function withComputedStats(musician) {
  const selectedCategory =
    state.category === "All Categories"
      ? null
      : CATEGORY_META.find((item) => item.label === state.category)?.key;

  const breakdown = CATEGORY_META.map((category) => {
    const yearly = state.year === "All Years" ? Object.values(musician.stats) : [musician.stats[state.year]];
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
  const visibleCategories = visibleBreakdown.filter((item) => item.events > 0);

  return {
    ...musician,
    breakdown: visibleBreakdown,
    visibleCategories: visibleCategories.length ? visibleCategories : visibleBreakdown.slice(0, 1),
    total,
    activities: buildActivities(musician, breakdown),
  };
}

function matchesSearch(entry) {
  if (!state.search) return true;

  const haystack = `${entry.name} ${entry.role} ${entry.collective}`.toLowerCase();
  return haystack.includes(state.search);
}

function sortLeaderboard(a, b) {
  return b.total - a.total || a.name.localeCompare(b.name);
}

function buildDataset(count) {
  const musicians = [];

  for (let index = 0; index < count; index += 1) {
    const first = firstNames[index % firstNames.length];
    const last = lastNames[(index * 7) % lastNames.length];
    const role = roles[(index * 5) % roles.length];
    const collective = collectives[(index * 3) % collectives.length];
    const palette = palettes[index % palettes.length];
    musicians.push({
      id: index + 1,
      name: `${first} ${last}`,
      role,
      collective,
      avatar: avatarPortraitUrl(index, palette),
      stats: buildStats(index),
    });
  }

  return musicians;
}

function buildStats(seed) {
  const stats = {};
  const years = ["2026", "2025", "2024", "2023"];

  years.forEach((year, yearIndex) => {
    stats[year] = {};
    ["Q1", "Q2", "Q3", "Q4"].forEach((quarter, quarterIndex) => {
      const live = weightedCount(seed, yearIndex, quarterIndex, 7, 5);
      const studio = weightedCount(seed, yearIndex, quarterIndex, 11, 4);
      const collab = weightedCount(seed, yearIndex, quarterIndex, 13, 2);

      stats[year][quarter] = {
        live,
        studio,
        collab,
      };
    });
  });

  return stats;
}

function buildActivities(musician, breakdown) {
  const rows = [];

  Object.entries(musician.stats).forEach(([year, quarters]) => {
    Object.entries(quarters).forEach(([quarter, values], quarterIndex) => {
      CATEGORY_META.forEach((category, categoryIndex) => {
        const events = values[category.key];
        for (let i = 0; i < events; i += 1) {
          const points = category.weight;
          const templateSet = activityTemplates[category.key];
          const template = templateSet[(musician.id + i + quarterIndex + categoryIndex) % templateSet.length];
          const day = String(28 - ((musician.id + i * 3 + quarterIndex) % 19)).padStart(2, "0");
          const monthIndex = quarterToMonth(quarter) - ((i + categoryIndex) % 3);
          const month = monthLabel(Math.max(1, monthIndex));
          rows.push({
            title: template.replaceAll("{collective}", musician.collective),
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
  const accentTones = ["#f9fafb", "#e2e8f0", "#dbeafe", "#ede9fe"];
  const skin = skinTones[index % skinTones.length];
  const hair = hairTones[(index * 3) % hairTones.length];
  const shirt = shirtTones[(index * 5) % shirtTones.length];
  const accent = accentTones[(index * 7) % accentTones.length];
  const hairHeight = 18 + (index % 10);
  const shoulderInset = 62 + (index % 12);
  const faceY = 108 + (index % 6);
  const eyeY = faceY + 6;
  const mouthY = faceY + 28;

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
      <rect width="320" height="320" rx="160" fill="rgba(255,255,255,0.08)" />
      <ellipse cx="160" cy="82" rx="88" ry="36" fill="rgba(255,255,255,0.12)" />
      <path d="M${shoulderInset} 276c16-54 52-86 98-86 46 0 82 32 98 86" fill="${shirt}" />
      <circle cx="160" cy="${faceY}" r="52" fill="${skin}" />
      <path d="M110 ${faceY - 4}c6-${hairHeight} 28-38 50-38 30 0 57 14 62 42-16-12-34-18-63-18-22 0-36 4-49 14Z" fill="${hair}" />
      <path d="M111 ${faceY - 10}c12 10 28 14 49 14 26 0 46-8 60-18-6 24-4 46 5 63-10 2-18-6-22-15-8 8-22 13-37 13-17 0-31-6-40-17-4 11-10 17-19 18 8-18 9-38 4-58Z" fill="${hair}" opacity="0.22" />
      <circle cx="142" cy="${eyeY}" r="4" fill="#374151" />
      <circle cx="178" cy="${eyeY}" r="4" fill="#374151" />
      <path d="M145 ${mouthY}c8 8 22 8 30 0" stroke="#9a5b54" stroke-width="4" stroke-linecap="round" fill="none" />
      <path d="M96 278h128" stroke="${accent}" stroke-width="6" stroke-linecap="round" opacity="0.8" />
      <rect width="320" height="320" rx="160" fill="url(#shine)" />
    </svg>
  `;

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
