/** The phone exactly as it goes to the API, so the length check in the form matches the API's limit of 25. */
export const toFullPhone = (code: string, phone: string) => `${code} ${phone.trim().replace(/\s+/g, " ")}`;
