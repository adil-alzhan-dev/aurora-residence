import { residencesEn } from "./en-residences";

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
  residencePicker: {
    overline: "Choose your residence",
    title: "Find your floor right on the facade",
    lead: "Hover over the house to see what is free on each floor, then open the plan. Availability updates live, the moment a residence is reserved.",
    leadTouch:
      "Tap a floor on the house to see what is free, then open the plan. Availability updates live, the moment a residence is reserved.",
    viewsLabel: "Ways to choose",
    views: { facade: "Facade", grid: "Floor grid", list: "List" },
    facadeAlt: "Aurora Residence at dusk: eleven floors of lit windows above the courtyard garden",
    floorsLabel: "Floors of the house",
    floor: "Floor {floor}",
    availableOf: "{available} of {total} available",
    soldOut: "Sold out",
    fromPrice: "from {price}",
    noData: "Availability is being updated",
    noMatches: "No matching residences",
    openPlan: "open the plan",
    hintPointer: "Click a floor to open its plan",
    hintTouch: "Tap a floor to select it",
    legendTitle: "Live availability",
    cta: "Open the interactive facade",
    ctaFloor: "Open floor {floor}",
  },
  gallery: {
    overline: "Gallery",
    title: "Light in every room",
    lead: "Architectural renders of the residences and the view from the upper floors. Final finishes may vary.",
    items: [
      {
        id: "view",
        caption: "Sunset over the park, view from the ninth floor",
        alt: "Sunset over the park and the lake, seen through a floor-to-ceiling window on the ninth floor",
      },
      {
        id: "bedroom",
        caption: "Main bedroom at first light",
        alt: "Main bedroom with a travertine wall and a window onto the park at sunrise",
      },
      {
        id: "living",
        caption: "Living room with a corner window",
        alt: "Living room with a corner window, a low sofa and a dining table by the glass",
      },
    ] as GalleryItem[],
    carouselLabel: "Gallery images",
    swipeHint: "Swipe to see more",
    openImage: "Open image: {caption}",
    viewerLabel: "Image viewer",
    close: "Close",
    previous: "Previous image",
    next: "Next image",
  },
  location: {
    overline: "Location",
    title: "Everything within a short walk",
    lead: "A quiet residential street between the park and the business district. Schools, shops and the metro are minutes away on foot.",
    places: [
      { id: "park", name: "Park", mapName: "Park", minutes: 3 },
      { id: "school", name: "School", mapName: "School", minutes: 6 },
      { id: "metro", name: "Metro station", mapName: "Metro", minutes: 8 },
      { id: "mall", name: "Shopping mall", mapName: "Mall", minutes: 12 },
      { id: "business", name: "Business center", mapName: "Business center", minutes: 15 },
    ] as PlaceItem[],
    walk: "{minutes} min walk",
    mapMinutes: "{minutes} min",
    mapLabel: "Map of the neighbourhood with walking times from Aurora Residence",
    home: "Aurora Residence",
    entrance: "Main entrance",
    north: "N",
    scale: "200 m",
    dragHint: "Drag to move the map",
  },
  progress: {
    overline: "Construction progress",
    title: "On schedule for Q4 2027",
    lead: "Updated every month with photos from the site. Last update: October 2026.",
    currentStage: 2,
    currentPercent: 60,
    stages: [
      { number: "01", period: "Q2 2025", title: "Foundations", text: "Piling, foundation slab and two levels of underground parking." },
      { number: "02", period: "Q2 2026", title: "Structure", text: "Eleven floors and the roof are topped out. The frame is complete." },
      {
        number: "03",
        period: "Q4 2026 - Q2 2027",
        title: "Facade and engineering",
        text: "Travertine cladding, bronze fins, glazing, lifts and building systems.",
      },
      {
        number: "04",
        period: "Q4 2027",
        title: "Interiors and handover",
        text: "Common areas, courtyard landscaping, inspection and key handover.",
      },
    ],
    stageMeta: "Stage {number}  ·  {period}",
    completed: "Completed",
    inProgress: "In progress, {percent}%",
    planned: "Planned",
  },
  enquiry: {
    overline: "Private viewing",
    title: "Visit the sales gallery",
    lead: "Leave your details and a sales manager will call you back within one working day to arrange a viewing or send you floor plans and prices.",
    phoneTitle: "Phone",
    emailTitle: "Email",
    emailNote: "Reply within a day",
    galleryTitle: "Sales gallery",
    galleryPlace: "At the main entrance",
    galleryNote: "Viewings by appointment",
    formTitle: "Request a call back",
    name: "Name",
    namePlaceholder: "Your name",
    phone: "Phone",
    countryCode: "Country code",
    codePlaceholder: "Code",
    phoneNumber: "Phone number",
    email: "Email",
    emailPlaceholder: "name@example.com",
    website: "Website",
    submit: "Request a call back",
    consent: "By sending the form you agree to the processing of personal data under our privacy policy.",
    errors: {
      name: "Enter your name",
      code: "Choose a country code",
      phone: "Enter a phone number with 7 to 15 digits including the code",
      email: "Enter a valid email address",
    },
    notConnected:
      "Thank you. Online requests open very soon; until then, please call +1 (555) 010-2040 or write to sales@aurora-residence.com.",
    countries: [
      ["+1", "United States, Canada"],
      ["+44", "United Kingdom"],
      ["+49", "Germany"],
      ["+33", "France"],
      ["+34", "Spain"],
      ["+39", "Italy"],
      ["+31", "Netherlands"],
      ["+41", "Switzerland"],
      ["+48", "Poland"],
      ["+90", "Turkey"],
      ["+971", "United Arab Emirates"],
      ["+972", "Israel"],
      ["+7", "Kazakhstan, Russia"],
      ["+998", "Uzbekistan"],
      ["+996", "Kyrgyzstan"],
      ["+995", "Georgia"],
      ["+374", "Armenia"],
      ["+994", "Azerbaijan"],
      ["+86", "China"],
      ["+91", "India"],
      ["+65", "Singapore"],
      ["+61", "Australia"],
    ] as [string, string][],
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
  ...residencesEn,
};

export type StatItem = { value: number; suffix: string; label: string } | { text: string; label: string };

export type AdvantageItem = {
  id: "park" | "glass" | "courtyard" | "concierge";
  title: string;
  text: string;
};

export type GalleryItem = { id: "view" | "bedroom" | "living"; caption: string; alt: string };

export type PlaceItem = {
  id: "park" | "school" | "metro" | "mall" | "business";
  name: string;
  mapName: string;
  minutes: number;
};

export type Dictionary = typeof en;
