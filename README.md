This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out the [Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Bug Tracker

This section documents all reported bugs, their root cause, and fix status.

### Fixed Bugs

| # | Area | Description | Root Cause | Fix |
|---|------|-------------|------------|-----|
| 1 | Admin Deletions | After 14-day period expires, badge shows "Deletion IN -3 Days" instead of "Deleted" | `daysLeft` was rendered unconditionally even when negative | Added `daysLeft <= 0` guard — shows red "PERMANENTLY DELETED" badge instead (`AdminDeletions.tsx`) |
| 2 | Owner Settings | Phone number field accepts letters and special symbols | Plain `<input>` with no type or validation | Changed to `type="tel"` with `onChange` filter stripping non-numeric characters (`OwnerSettings.tsx`) |
| 3 | Footer | Cookie Policy link goes nowhere (`href="#"`) | Link was a placeholder | Created `/cookie-policy` page and updated Footer link (`Footer.tsx`, `app/cookie-policy/page.tsx`) |
| 4 | Footer | Facebook icon links to a search page instead of the official page | URL was built as `facebook.com/search/top?q=<handle>` | Fixed to `facebook.com/<handle>` for both social icons and contact section (`Footer.tsx`) |
| 5 | Admin Menu | No pagination — all items shown at once | Component fetched up to 200 items with no page controls | Added client-side pagination (20 items/page) with prev/next controls and page counter (`AdminMenu.tsx`) |
| 6 | Owner History | Download button does nothing | Button had no `onClick` handler | Implemented CSV export of current order history view (`HistoryOrdersView.tsx`) |
| 7 | Admin Settings | Page uses hardcoded mock data; Save does a fake timeout | `useState` was seeded with static strings; `handleSave` only called `setTimeout` | Created `/api/admin/settings` (GET/POST) backed by site config; component now fetches on mount and saves via API (`AdminSettings.tsx`, `app/api/admin/settings/route.ts`) |
| 8 | Signup / Register | Name field accepts numbers and special characters | `validate()` only checked for empty string | Added regex validation: only letters, spaces, hyphens, apostrophes allowed; length 2–150 enforced (`register/page.tsx`) |
| 9 | Owner History | Total revenue includes cancelled orders | `SUM(totalAmount)` ran over all orders regardless of status | Changed to `SUM(CASE WHEN status = 'DELIVERED' THEN totalAmount ELSE 0 END)` (`api/owner/orders/route.ts`) |
| 10 | Owner Restaurants | Table shows "Owner" column which is always the logged-in user — redundant | Column was `ownerName` mapped from API | Replaced with "Contact" column showing `contactPhone` (`OwnerRestaurants.tsx`) |
| 11 | Owner Restaurants | No Edit or Delete buttons on restaurant rows | Component only rendered read-only table rows | Added Pencil (edit → navigates to Settings) and Trash2 (delete → calls `/api/owner/restaurants/:id/delete`) action buttons per row (`OwnerRestaurants.tsx`) |
| 12 | Owner Dashboard | Owner has no way to contact admin or request a new restaurant | No support page existed in the owner dashboard | Created Owner Support page with subject + message form that sends a SYSTEM notification to all admins (`app/dashboard/owner/support/page.tsx`, `OwnerSupport.tsx`, `api/owner/support/route.ts`, `DashboardSidebar.tsx`) |

### Open / Needs Runtime Verification

| # | Area | Description | Status |
|---|------|-------------|--------|
| 13 | Admin Notifications | Admin notification bar reported as not working | Code is implemented correctly — likely a runtime/FCM-config issue; needs environment testing |
| 14 | Signup toast | Toast shows the error message but doesn't scroll to or highlight the failing field | UX improvement — inline field errors are set but may not be visible without scrolling |
| 15 | Search UX | Briefly flashes "No results" before results load | 300ms debounce + loading state race condition; needs UX polish |
| 16 | Restaurant hours | Restaurant shows "Closed" in customer view despite 24hr Saturday setting | Needs runtime trace through hours-checking logic |
| 17 | Search indexing | Dish added to a restaurant does not appear in global search | Needs runtime test — possibly a cache or index lag |
| 18 | Search behaviour | Searching for a dish opens the restaurant page, not the dish itself | Needs click-handler trace in `CustomerSearch.tsx` |
| 19 | Search results | All 50 dishes from one restaurant are shown when searching | Needs API-level per-restaurant result cap |
| 20 | Owner Restaurants | Site URL column always empty — cannot be edited from Settings | `OwnerSettings.tsx` has no `site` URL field; schema has no `site` column either — needs product decision |
