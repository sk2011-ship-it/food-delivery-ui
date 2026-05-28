# Project task log

Use this file to track **what was done**, **what’s in progress**, and **what’s next**. Update it as you go—short bullets are enough.

## Status legend

| Status | Meaning |
|--------|---------|
| Done | Completed and verified |
| In progress | Currently being worked on |
| Planned | Not started yet |
| Blocked | Waiting on dependency or decision |

---

## Completed

### 2026-03-30 (Monday)

| Area | Status | Notes |
|------|--------|--------|
| Project kickoff | Done | Main project started; base structure set up |
| Architecture | Done | Full system wired; project structure defined |
| Surfaces | Done | UI, admin, and user-side base structure |
| Authentication | Done | Basic authentication in place |

### 2026-03-31 (Tuesday)

| Area | Status | Notes |
|------|--------|--------|
| Admin – users | Done | Add / delete other users; admin UI for user management |
| Location theming | Done | Main user UI changes by **all 3 locations** |
| User UI | Done | User-facing UI updated |
| Admin APIs | Done | Implemented on admin side |
| User APIs | Done | Not implemented yet on user side (admin only for now) |
| Authentication | Done | Auth setup continued / refined |

### 2026-04-01 (Wednesday)

| Area | Status | Notes |
|------|--------|--------|
| Restaurants & menu | Done | Add flow with defined schema + backend/services |
| Multi-location | Done | Behaviour aligned across **all 3 locations** |
| Contact us | Done | Fixed / completed for **each location** |

### 2026-04-02 (Thursday)

| Area | Status | Notes |
|------|--------|--------|
| Admin UI | Done | General improvements |
| Featured restaurants | Done | System to show featured restaurants |
| Admin – restaurant & menu | Done | Responsive layouts for admin |

### 2026-04-03 (Friday)

 Area | Status | Notes |
|------|--------|--------|
| Featured Admin | Done | Created Feature Page for adding featured restaurants/dishes |
| Featured API | Done | Implemented location-based fetch for featured items |
| Location Logic | Done | Real-time sync of featured content by district (Newcastle/Kilkeel) |
| Menu User side | Done | Menu items from admin now visible on user storefront |



### 2026-04-04 (Saturday)

| Area | Status | Notes |
|------|--------|--------|
| Cart | Done | Implemented Add to Cart functionality with separate table |
| Checkout | Done | Built Checkout Page for reviewing items and placing orders |
| Order Flow | Done | Real-time flow: Owner accept/reject → Payment request → Kitchen prep → Delivery |
| Notifications | Done | Real-time status updates and rejection notifications for users |(supabse rls)
| Owner Dashboard | Done | Professional UI cleanup: removed redundant sections, improved settings & hours |
| Live Order Desk | Done | Added Live Order Management for Owner (Live, History, and Rejections) |

###2026-04-06 (monday)

| Area | Status | Notes |
|------|--------|--------|
 owner ui | done  | 
 menu settings  | done  | 
| Firebase | Done | Firebase setup for push notifications |
| Notifications | Done | Real-time status updates and rejection notifications for users |
| Heartbeat | Done | Heartbeat monitoring for user sessions |


###2026-04-07 (tuesday)

| Area | Status | Notes |
Stripe Payment Gateway Integration	|Completed	|Successfully implemented secure online payments using Stripe(Need keys) 
Delivery Charges Calculation (Dawnpatrick)	|Completed	|Integrated OSM distance-based calculation for accurate delivery fees
User Location Selection (Newspatric)	|Completed|Enabled users to select and update their location within the platf

###2026-04-08 (wednesday)

| Area | Status | Notes |
|------|--------|--------|
| Admin order| Done | admin can see all orders |
| Feedback | Done | user give the feedback it is saved as inactive after admin aaproval it can show ban/approval 
|Notification| not implemented | need keys to proceed further 

### 2026-05-28 (Thursday)

| Area | Status | Notes |
|------|--------|-------|
| Downpatrick Seeding | Done | Cleaned scraped data and seeded 229 real items into DB |
| Newcastle Scraper & Seeding | Done | Scraped 22 Newcastle restaurants and seeded 1,167 real menu items into DB |
| Kilkeel Scraper & Seeding | Done | Scraped 9 Kilkeel restaurants and seeded 566 real menu items into DB, truncating long fields to fit DB constraints |
| Production Build | Done | Verified clean compilation of the Next.js app with zero errors |


---

## Upcoming / backlog






## How to update

1. Add a new **date section** under **Completed** when you finish a day’s work (copy the table pattern).
2. Move items from **Upcoming** to **Completed** when shipped.
3. Adjust **Planned → In progress → Done** in the tables as you go.
4. Keep **Quick journal** one line per day if you like a casual log.

Last updated: 2026-05-28
