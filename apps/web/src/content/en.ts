export const en = {
  meta: {
    title: "Aurora Residence",
    description:
      "Sixty-six residences on eleven floors above an old-growth park. Aurora Residence by Meridian Group.",
  },
  a11y: {
    skipToContent: "Skip to content",
    home: "Aurora Residence, home",
    mainNavigation: "Main",
    footerNavigation: "Footer",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    menu: "Menu",
    language: "Language",
    currency: "Currency",
    timeOfDay: "Time of day",
  },
  nav: {
    about: "About",
    residences: "Residences",
    gallery: "Gallery",
    location: "Location",
    progress: "Progress",
    contacts: "Contacts",
  },
  settings: {
    language: "Language",
    currency: "Currency",
    languages: { en: "EN", ru: "RU" },
    currencies: { usd: "USD", eur: "EUR", kzt: "KZT" },
  },
  contacts: {
    phone: "+1 (555) 010-2040",
    email: "sales@aurora-residence.com",
    hours: "Mon-Sat, 10:00-19:00",
    salesOfficeHours: "Sales office, Mon-Sat, 10:00-19:00",
  },
  actions: {
    enquire: "Enquire",
  },
  hero: {
    overline: "Aurora Residence by Meridian Group",
    title: "Residences above the park",
    subtitle: "Sixty-six residences on eleven floors, with an old-growth park across the street.",
    cta: "Choose your residence",
    scrollCue: "Scroll to explore",
    seeTheHouse: "See the house",
    day: "Day",
    evening: "Evening",
    renderDayAlt: "Aurora Residence in daylight: an eleven-storey travertine facade with bronze fins above the park",
    renderEveningAlt: "Aurora Residence at dusk with lit windows and a warm sky",
  },
  stats: {
    label: "Aurora Residence in numbers",
    items: [
      { value: 11, suffix: "", label: "Floors" },
      { value: 66, suffix: "", label: "Residences" },
      { value: 3, suffix: " min", label: "Walk to the park" },
      { text: "Q4 2027", label: "Completion" },
    ] as StatItem[],
  },
  about: {
    overline: "The project",
    title: "Quiet architecture with the park as its garden",
    lead: "Aurora Residence is a single eleven-storey house by Meridian Group: sixty-six residences, a travertine-clad facade with bronze fins, and a landscaped courtyard that opens onto the park.",
    text: "Every residence has full-height glazing and a deep balcony, so the light and the trees are part of the room. Studios to three-bedroom homes, with penthouses on the top floor.",
    facts: [
      { value: "3.2 m", label: "Ceiling height" },
      { value: "38-164 m²", label: "Residence sizes" },
      { value: "6", label: "Homes per floor" },
    ],
    cta: "Discover the residences",
    imageAlt: "Living room of a three-bedroom residence with floor-to-ceiling windows facing the park",
    caption: "Living room, three-bedroom residence. Architectural render.",
  },
  advantages: {
    overline: "Why Aurora",
    title: "Designed for a slower kind of city life",
    lead: "Four things we refused to compromise on, from the first sketch to the last door handle.",
    items: [
      {
        id: "park",
        title: "The park, three minutes away",
        text: "Old-growth linden and oak, quiet paths and a lake, a three-minute walk from the lobby.",
      },
      {
        id: "glass",
        title: "Floor-to-ceiling glass",
        text: "Ceilings of 3.2 metres and full-height windows bring in light from morning to evening.",
      },
      {
        id: "courtyard",
        title: "A courtyard without cars",
        text: "A landscaped garden with water features and lit paths. Parking stays underground.",
      },
      {
        id: "concierge",
        title: "Concierge, day and night",
        text: "A staffed lobby, private storage and secure access to every floor and the garage.",
      },
    ] as AdvantageItem[],
  },
  footer: {
    tagline: "Eleven floors of quiet architecture above the park. A Meridian Group residence.",
    residencesTitle: "Residences",
    chooseOnFacade: "Choose on facade",
    floorGrid: "Floor grid",
    allResidences: "All residences",
    projectTitle: "Project",
    salesOfficeTitle: "Sales office",
    copyright: "© 2026 Meridian Group. Fictional project for portfolio.",
    privacy: "Privacy policy",
  },
  status: {
    available: "Available",
    reserved: "Reserved",
    sold: "Sold",
  },
};

export type StatItem = { value: number; suffix: string; label: string } | { text: string; label: string };

export type AdvantageItem = {
  id: "park" | "glass" | "courtyard" | "concierge";
  title: string;
  text: string;
};

export type Dictionary = typeof en;
