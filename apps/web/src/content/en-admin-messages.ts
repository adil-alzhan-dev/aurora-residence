/**
 * Texts the API and the demo data store in English, shown in the reader's language.
 * The stored values never change; lib/admin/api-texts.ts recognises them and picks these texts.
 */
export const messagesEn = {
  system: "System",
  sources: {
    "Contacts form": "Contacts form",
    "Residence page": "Residence page",
    "Residence page, Send request": "Residence page, Send request",
    "Floor plan, Enquire": "Floor plan, Enquire",
  } as Record<string, string>,
  api: {
    enquiryNoResidence: "The enquiry has no residence yet: link it to {number} first.",
    enquiryOtherResidence: "The enquiry is about residence {other}, not {number}.",
    enquiryClosed: "The enquiry is closed: set it back to In progress first.",
    enquiryNotFound: "The enquiry no longer exists.",
    residenceNotFound: "There is no residence {number}.",
    noActiveReservation: "Residence {number} has no active reservation.",
    notAvailable: "Residence {number} is no longer available.",
    changedMeanwhile: "Residence {number} was changed a moment ago.",
    reserveFromEnquiry: "Residence {number} can be reserved only from an enquiry.",
  },
  notes: {
    received: "Enquiry received from the site, residence {number} stays Available",
    receivedWithStatus: "Enquiry received from the site, residence {number} is {status}, status not changed",
    receivedGeneral: "Enquiry received from the site, no residence selected",
    reserved: "Reserved for 7 days",
    reservedFor: "Reserved for 7 days, enquiry from {name}",
    expired: "Reservation ended after 7 days without a deal",
    released: "Reservation released by manager",
    backOnSale: "Back on sale",
    sold: "Contract signed",
    reservedForEnquiry: "Residence reserved for this enquiry",
    linked: "Residence {number} linked to the enquiry",
    salesStart: "Sales start, listed at {price}",
    known: {
      "Summer price list": "Summer price list",
      "Autumn price list": "Autumn price list",
      "Not buying: chose another project": "Not buying: chose another project",
      "Not buying this year": "Not buying this year",
      "Price list sent, no further interest": "Price list sent, no further interest",
      "Reservation ended without a deal": "Reservation ended without a deal",
    } as Record<string, string>,
  },
};
