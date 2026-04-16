## Change Log

- Added `public/ideal-stay-logo.png` from the supplied asset and created `src/components/BrandLogo.tsx` to centralize branding.
- Replaced old text/icon branding in `src/components/AppNavigation.tsx`, `src/components/HostLayout.tsx`, `src/pages/AdminDashboard.tsx`, and `src/pages/SignupPage.tsx`.
- Updated `src/App.tsx` loading state and `index.html` favicon links so the logo shows consistently across the site and browser chrome.
- Removed the redundant amber breakage-deposit callout from `src/components/ListingDetail.tsx` and kept the single summary-row version in the booking panel.
- Removed pre-enquiry breakage-deposit visibility from `src/components/ListingDetail.tsx` and `src/components/PropertyCard.tsx` so the deposit is not broadcast on public listing surfaces.
- Restored breakage-deposit visibility inside the date-selected booking summary in `src/components/ListingDetail.tsx`, showing it only after dates are chosen and including it in the displayed pre-enquiry total.
- Added a durable listing-availability ledger in `encore/catalog` so manual host blocks, approved enquiry holds, and booked stays are tracked separately instead of being flattened into one fragile `blocked_dates` array.
- Tightened `encore/booking/api.ts` so booking creation and enquiry approval now fail closed on overlapping availability instead of relying on client-side honesty.
- Updated `src/types.ts`, `src/lib/domain-mappers.ts`, and `src/pages/HostAvailability.tsx` so the host calendar distinguishes manual blocks from approved-payment holds and confirmed stays.
- Added a shared frontend availability helper in `src/lib/listing-availability.ts` and switched `src/pages/ExploreView.tsx` plus `src/components/ListingDetail.tsx` to use end-exclusive stay overlap checks so booked nights are filtered out consistently without mis-handling checkout days.
- Rebuilt `src/pages/HostEnquiries.tsx` into a stronger host operations screen with workflow buckets, summary metrics, aging cues, clearer payment-tracking context, and proper host feedback on approve/decline/confirm actions.
- Added host inquiry workflow helpers in `src/lib/inquiry-state.ts` plus tests in `tests/inquiry-state.test.ts` so enquiry categorization and sorting stay consistent instead of living as page-local guesswork.
- Added durable feature documentation in `docs/booking-and-enquiry-workflow.md` and updated `README.md` so the availability ledger and host enquiry workflow are documented outside the session log.
