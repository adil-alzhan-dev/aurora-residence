import type { Currency, EnquiryStatus, Locale } from '../../src/generated/prisma/enums.js';

const RESIDENCE_PAGE = 'Residence page, Send request';
const FLOOR_PLAN = 'Floor plan, Enquire';
const CONTACTS_FORM = 'Contacts form';

/**
 * Dates are written as in the mockups ("today" = Oct 4) and shifted to the
 * real calendar by the demo clock at seed time.
 */
export interface EnquirySeed {
  receivedAt: string;
  name: string;
  phone: string;
  residence: string;
  status: EnquiryStatus;
  locale: Locale;
  currency: Currency;
  source: string;
  comment: string;
  managerNote?: string;
  takenAt?: string;
  noteAddedAt?: string;
  reservedAt?: string;
  releasedAt?: string;
  closedAt?: string;
  closeNote?: string;
}

export const ENQUIRIES: EnquirySeed[] = [
  {
    receivedAt: 'Oct 4, 11:48', name: 'Jonas Weber', phone: '+1 (555) 017-3390', residence: '9.03',
    status: 'NEW', locale: 'EN', currency: 'EUR', source: FLOOR_PLAN,
    comment: 'Good morning. Is 9.03 still available and can it be bought with a mortgage from a European bank?',
  },
  {
    receivedAt: 'Oct 4, 10:15', name: 'Amira Haddad', phone: '+1 (555) 012-8846', residence: '4.06',
    status: 'NEW', locale: 'RU', currency: 'KZT', source: RESIDENCE_PAGE,
    comment: 'Здравствуйте! Интересует 4.06. Можно ли посмотреть квартиру в выходные и какой срок сдачи дома?',
  },
  {
    receivedAt: 'Oct 4, 09:02', name: 'Elena Marsh', phone: '+1 (555) 014-2271', residence: '7.03',
    status: 'IN_PROGRESS', locale: 'EN', currency: 'USD', source: RESIDENCE_PAGE,
    comment:
      'Hello! We are a family of three and like residence 7.03 with the park view. Is the 0% instalment plan for 24 months available for it? We could visit the show flat this week.',
    managerNote:
      'Called at 09:30. Decided on 7.03, wants the 24-month plan with 30% down. Show flat visit on Tuesday at 11:00. Asked to hold the residence for a week: reserve now.',
    takenAt: 'Oct 4, 09:31', noteAddedAt: 'Oct 4, 09:35',
  },
  {
    receivedAt: 'Oct 3, 18:40', name: 'Lucas Moreau', phone: '+1 (555) 019-5512', residence: '2.06',
    status: 'IN_PROGRESS', locale: 'EN', currency: 'EUR', source: FLOOR_PLAN,
    comment: 'We need three bedrooms on a lower floor for my parents. Does 2.06 have a separate storage room?',
    takenAt: 'Oct 3, 19:05', reservedAt: 'Oct 3, 19:40',
  },
  {
    receivedAt: 'Oct 3, 14:05', name: 'Sofia Lindqvist', phone: '+1 (555) 011-7064', residence: '3.03',
    status: 'IN_PROGRESS', locale: 'RU', currency: 'EUR', source: RESIDENCE_PAGE,
    comment: 'Добрый день. Рассматриваю 3.03 для себя и дочери. Пришлите, пожалуйста, планировку с размерами комнат.',
    takenAt: 'Oct 3, 14:40', reservedAt: 'Oct 3, 15:10',
  },
  {
    receivedAt: 'Oct 3, 11:30', name: 'Daniel Okafor', phone: '+1 (555) 016-2407', residence: '6.05',
    status: 'NEW', locale: 'EN', currency: 'USD', source: CONTACTS_FORM,
    comment: 'Looking at 6.05 as an investment. What rental yield do similar residences in the area show?',
  },
  {
    receivedAt: 'Oct 2, 16:22', name: 'Hana Sato', phone: '+1 (555) 013-9158', residence: '5.05',
    status: 'IN_PROGRESS', locale: 'EN', currency: 'USD', source: FLOOR_PLAN,
    comment: 'Is underground parking included with 5.05, or is a parking space sold separately?',
    takenAt: 'Oct 2, 16:50', reservedAt: 'Oct 2, 17:25',
  },
  {
    receivedAt: 'Oct 2, 10:10', name: 'Marco Bellini', phone: '+1 (555) 018-4473', residence: '10.06',
    status: 'CLOSED', locale: 'EN', currency: 'EUR', source: RESIDENCE_PAGE,
    comment: 'Interested in 10.06. Is there any discount for a full payment upfront?',
    managerNote: 'Chose a residence with a larger terrace in another project. Asked to keep him posted on new releases.',
    takenAt: 'Oct 2, 11:00', closedAt: 'Oct 3, 12:30', closeNote: 'Not buying: chose another project',
  },
  {
    receivedAt: 'Oct 1, 17:45', name: 'Olivia Grant', phone: '+1 (555) 015-6620', residence: '8.04',
    status: 'IN_PROGRESS', locale: 'RU', currency: 'KZT', source: FLOOR_PLAN,
    comment: 'Здравствуйте. Хотим 8.04 с видом на парк. Можно ли оплатить часть суммы в тенге?',
    takenAt: 'Oct 1, 18:10', reservedAt: 'Oct 1, 18:45',
  },
  {
    receivedAt: 'Oct 1, 12:00', name: 'Arjun Mehta', phone: '+1 (555) 012-3381', residence: '7.04',
    status: 'IN_PROGRESS', locale: 'EN', currency: 'USD', source: RESIDENCE_PAGE,
    comment: 'We are relocating in spring. Could you share the handover date and the finishing specification for 7.04?',
    takenAt: 'Oct 1, 12:30', reservedAt: 'Oct 1, 13:05',
  },
  {
    receivedAt: 'Sep 30, 15:30', name: 'Chloe Dubois', phone: '+1 (555) 014-7795', residence: '9.04',
    status: 'IN_PROGRESS', locale: 'EN', currency: 'EUR', source: FLOOR_PLAN,
    comment: 'Hi, I would like to see 9.04 in the evening to check the light. Is Thursday after 18:00 possible?',
    takenAt: 'Sep 30, 16:00', reservedAt: 'Sep 30, 16:35',
  },
  {
    receivedAt: 'Sep 29, 13:15', name: 'Mateo Alvarez', phone: '+1 (555) 017-0938', residence: '10.05',
    status: 'IN_PROGRESS', locale: 'EN', currency: 'USD', source: CONTACTS_FORM,
    comment: 'Please call me about 10.05. I would like the 36-month plan with 20% down.',
    takenAt: 'Sep 29, 13:50', reservedAt: 'Sep 29, 14:20',
  },
  {
    receivedAt: 'Sep 28, 10:40', name: 'Nora Kim', phone: '+1 (555) 011-2259', residence: '11.03',
    status: 'IN_PROGRESS', locale: 'RU', currency: 'KZT', source: RESIDENCE_PAGE,
    comment: 'Интересует 11.03 на верхнем этаже. Будет ли видно парк поверх соседних домов?',
    takenAt: 'Sep 28, 11:15', reservedAt: 'Sep 28, 11:40',
  },
  {
    receivedAt: 'Sep 27, 09:50', name: "Liam O'Connor", phone: '+1 (555) 019-8016', residence: '1.02',
    status: 'CLOSED', locale: 'EN', currency: 'USD', source: FLOOR_PLAN,
    comment: 'Is 1.02 suitable for a small home office? I work remotely and need a quiet room.',
    managerNote: 'Mortgage pre-approval fell through. Will come back next year.',
    takenAt: 'Sep 27, 10:30', closedAt: 'Sep 29, 16:00', closeNote: 'Not buying this year',
  },
  {
    receivedAt: 'Sep 26, 16:05', name: 'Zara Ahmed', phone: '+1 (555) 016-5543', residence: '6.03',
    status: 'CLOSED', locale: 'RU', currency: 'USD', source: CONTACTS_FORM,
    comment: 'Сравниваю несколько проектов. Пришлите прайс на двухкомнатные квартиры, пожалуйста.',
    managerNote: 'Only comparing prices, not planning to buy this year. Price list sent by email.',
    takenAt: 'Sep 26, 17:00', closedAt: 'Sep 27, 11:20', closeNote: 'Price list sent, no further interest',
  },
  {
    receivedAt: 'Aug 11, 14:40', name: 'Henrik Larsen', phone: '+1 (555) 018-6624', residence: '7.03',
    status: 'CLOSED', locale: 'EN', currency: 'EUR', source: RESIDENCE_PAGE,
    comment: 'We like 7.03 but need about a week to decide as a family. Could you hold it for us?',
    managerNote:
      'Reserved 7.03 for a week, the family chose a larger residence in another project. Reservation ended without a deal.',
    takenAt: 'Aug 11, 15:05', reservedAt: 'Aug 11, 15:20', releasedAt: 'Aug 18, 15:20',
    closedAt: 'Aug 18, 16:10', closeNote: 'Reservation ended without a deal',
  },
];

export function enquiryEmail(name: string): string {
  const [first, ...rest] = name.toLowerCase().split(' ');
  const clean = (part: string) => part.replace(/[^a-z]/g, '');
  return `${clean(first)}.${clean(rest.join(''))}@example.com`;
}
