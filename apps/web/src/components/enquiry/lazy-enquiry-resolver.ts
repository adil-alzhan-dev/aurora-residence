import type { Resolver } from "react-hook-form";

import type { EnquiryErrors, EnquiryValues } from "./enquiry-schema";

/** Type of the form's root error when the validation script did not load; nothing was sent. */
export const VALIDATION_UNLOADED = "validationUnloaded";

/**
 * The enquiry forms validate with zod, loaded on the first check (the first field the visitor
 * leaves): the form is on the page from the start, its validation is not part of the first screen.
 * A failed load is not kept, so the next check fetches the script again.
 */
export function lazyEnquiryResolver(errors: EnquiryErrors): Resolver<EnquiryValues> {
  let resolver: Promise<Resolver<EnquiryValues>> | undefined;
  return async (values, context, options) => {
    const loading = (resolver ??= import("./enquiry-schema").then(({ enquiryResolver }) => enquiryResolver(errors)));
    let resolve: Resolver<EnquiryValues>;
    try {
      resolve = await loading;
    } catch {
      if (resolver === loading) resolver = undefined;
      return { values: {}, errors: { root: { type: VALIDATION_UNLOADED } } };
    }
    return resolve(values, context, options);
  };
}
