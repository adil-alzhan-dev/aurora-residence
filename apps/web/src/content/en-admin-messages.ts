/**
 * Texts the API and the demo data store in English, shown in the reader's language.
 * The stored values never change; lib/admin/api-texts.ts recognises them and picks these texts.
 * Errors come with a code instead, and `api` holds the text for each code.
 */
export const messagesEn = {
  system: "System",
  sources: {
    "Contacts form": "Contacts form",
    "Residence page": "Residence page",
    "Residence page, Send request": "Residence page, Send request",
    "Floor plan, Enquire": "Floor plan, Enquire",
  } as Record<string, string>,
  /** One text per API error code (lib/admin/api-texts.ts); screens may say more in their own words. */
  api: {
    badRequest: "The request was not accepted. Check the values and try again.",
    unauthorized: "Your session has ended. Sign in again.",
    forbidden: "You do not have access to this action.",
    notFound: "Nothing was found at this address. It may have been removed.",
    conflict: "Someone changed this a moment ago. Check the current state and try again.",
    payloadTooLarge: "The text is too long to save. Shorten it and try again.",
    rateLimited: "Too many requests. Wait a minute and try again.",
    internalError: "Something went wrong on the server. Try again in a minute.",
    serviceUnavailable: "The server is temporarily unavailable. Try again in a minute.",
    validationFailed: "Some values are not valid. Check them and try again.",
    nothingToUpdate: "Nothing has changed, so there is nothing to save.",
    invalidCredentials: "Wrong email or password.",
    loginLocked: "Sign-in is paused after too many failed attempts. Try again later.",
    sessionExpired: "Your session has expired. Sign in again.",
    residenceNotFound: "There is no residence {number}.",
    enquiryNotFound: "The enquiry no longer exists.",
    residenceSold: "Residence {number} is sold.",
    residenceReserved: "Residence {number} is already reserved.",
    noActiveReservation: "Residence {number} has no active reservation.",
    enquiryHasNoResidence: "The enquiry has no residence yet: link it to {number} first.",
    enquiryResidenceMismatch: "The enquiry is about another residence, not {number}.",
    enquiryClosed: "The enquiry is closed: set it back to In progress first.",
    enquiryResidenceExists: "The enquiry already has a residence.",
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
