import type { Resolver } from "react-hook-form";

import type { EnquiryErrors, EnquiryValues } from "./enquiry-schema";

/**
 * The enquiry forms validate with zod, loaded on the first check (the first field the visitor
 * leaves): the form is on the page from the start, its validation is not part of the first screen.
 */
export function lazyEnquiryResolver(errors: EnquiryErrors): Resolver<EnquiryValues> {
  let resolver: Promise<Resolver<EnquiryValues>> | undefined;
  return (values, context, options) => {
    resolver ??= import("./enquiry-schema").then(({ enquiryResolver }) => enquiryResolver(errors));
    return resolver.then((resolve) => resolve(values, context, options));
  };
}
