# Frontend Issues, API Mismatches & Missing Routes

**Generated:** 2026-03-02

---

## Table of Contents

1. [Critical API Issues](#1-critical-api-issues)
2. [API Mismatches (BE vs FE)](#2-api-mismatches-be-vs-fe)
3. [Missing Frontend Services](#3-missing-frontend-services)
4. [Missing Frontend Pages](#4-missing-frontend-pages)
5. [Type Mismatches](#5-type-mismatches)
6. [Route Coverage Matrix](#6-route-coverage-matrix)

---

## 1. Critical API Issues

### 1.1 Base URL Configuration
- **Issue:** Frontend uses `/api` but backend uses `/api/v1`
- **File:** `frontend/src/services/api.ts` (line 6), `frontend/src/lib/api.ts` (line 5)
- **Current:** `baseURL: '/api'`
- **Should be:** `baseURL: '/api/v1'`
- **Impact:** All API calls fail with 404

### 1.2 Auth Service - Wrong Parameter Name
- **Issue:** Service sends `phone` but API expects `identifier`
- **File:** `frontend/src/services/auth.service.ts` (lines 21, 29)
- **Current:** `{ phone }`
- **Should be:** `{ identifier: phone, authType: 'PHONE' }`
- **Impact:** OTP send/verify fails

### 1.3 Auth Service - Wrong Me Endpoint
- **Issue:** Service calls `/auth/me` but API has `/auth/profile`
- **File:** `frontend/src/services/auth.service.ts` (line 37)
- **Current:** `/auth/me`
- **Should be:** `/auth/profile`

### 1.4 Product Service - Wrong Product Detail Endpoint
- **Issue:** Service calls `/products/${slug}` but API uses `/products/details/${slug}`
- **File:** `frontend/src/services/product.service.ts` (line 40)
- **Current:** `/products/${slug}`
- **Should be:** `/products/details/${slug}`

### 1.5 Cart Service - Missing Auth Endpoints
- **Issue:** Cart service only has validate endpoint, missing authenticated cart operations
- **File:** `frontend/src/services/cart.service.ts`
- **Missing:** getCart, addToCart, updateCartItem, removeFromCart, clearCart, syncCart

### 1.6 Order Service - Wrong Endpoints
- **Issue:** Multiple endpoint mismatches
- **File:** `frontend/src/services/order.service.ts`
- **List orders:** `/orders` → should be `/orders/my`
- **Admin orders:** `/admin/orders` → should be `/orders/admin/all`
- **Update status:** `/admin/orders/${id}/status` → should be `/orders/admin/${id}/status`

### 1.7 Payment Service - Wrong Endpoints
- **Issue:** Payment endpoints don't match backend
- **File:** `frontend/src/services/payment.service.ts`
- **Create:** `/payments/razorpay/create` → should be `/payments/create`
- **Verify:** `/payments/razorpay/verify` → should be `/payments/verify`
- **Missing:** getPaymentStatus

### 1.8 lib/api.ts - Auth Endpoints Wrong
- **File:** `frontend/src/lib/api.ts` (lines 43-48)
- **sendOtp:** Missing `authType` parameter
- **verifyOtp:** Missing `authType` parameter
- **getMe:** Wrong endpoint `/auth/me` → `/auth/profile`
- **updateProfile:** Correct endpoint but missing email handling

---

## 2. API Mismatches (BE vs FE)

### 2.1 Address Service Missing
- **Issue:** No address service in `frontend/src/services/`
- **BE Endpoints:**
  - `GET /addresses` - List all
  - `GET /addresses/:id` - Get single
  - `POST /addresses` - Create
  - `PATCH /addresses/:id` - Update
  - `DELETE /addresses/:id` - Delete
- **Note:** BE requires `name` and `phone` fields in create/update

### 2.2 Listings Service Missing
- **Issue:** No listings service for admin operations
- **BE Endpoints:**
  - `GET /listings/admin/all`
  - `GET /listings/admin/:id`
  - `POST /listings/admin`
  - `PATCH /listings/admin/:id`
  - `PATCH /listings/admin/:id/stock`
  - `POST /listings/admin/bulk-stock`
  - `DELETE /listings/admin/:id`

### 2.3 Reviews Service Missing
- **Issue:** No reviews service
- **BE Endpoints:**
  - `GET /reviews/product/:productId` (public)
  - `GET /reviews/my-reviews` (auth)
  - `POST /reviews` (auth)
  - `PATCH /reviews/:id` (auth)
  - `DELETE /reviews/:id` (auth)
  - `POST /reviews/:id/helpful` (public)
  - Admin endpoints for verify/delete

### 2.4 Shipments Service Missing
- **Issue:** No shipments service
- **BE Endpoints:**
  - `GET /shipments/order/:orderId`
  - Admin shipment management endpoints

### 2.5 Forms Service Partial
- **File:** `frontend/src/lib/api.ts` (lines 138-143)
- **Has:** get, submit
- **Missing:** Admin form management (create, update, delete, fields management)

### 2.6 Users Service Incomplete
- **File:** `frontend/src/lib/api.ts` (lines 123-127)
- **Has:** list only
- **Missing:** get user, update role, deactivate

### 2.7 Coupons Service Incomplete
- **File:** `frontend/src/lib/api.ts` (lines 115-121)
- **Has:** validate, list, create
- **Missing:** update, delete

### 2.8 Settings Service Partial
- **File:** `frontend/src/lib/api.ts` (lines 145-154)
- **Has:** getPublic, getAll, update, bulkUpdate, delete
- **Note:** Check if endpoints match (should be correct)

### 2.9 Analytics Service - Endpoints Don't Exist
- **File:** `frontend/src/lib/api.ts` (lines 129-136)
- **Issue:** Frontend expects `/analytics/visit`, `/analytics/admin/dashboard`
- **BE Reality:** No analytics routes exist in backend
- **Status:** NEEDS BE IMPLEMENTATION

### 2.10 Delivery Service Missing
- **Issue:** No delivery service file
- **BE Endpoints:**
  - `POST /delivery/check` (public)
  - `GET /delivery/settings` (admin)
  - `PATCH /delivery/settings` (admin)
  - Shipment tracking endpoints

---

## 3. Missing Frontend Services

| Service | Status | Priority |
|---------|--------|----------|
| address.service.ts | MISSING | HIGH |
| listings.service.ts | MISSING | HIGH |
| reviews.service.ts | MISSING | MEDIUM |
| shipments.service.ts | MISSING | MEDIUM |
| delivery.service.ts | MISSING | MEDIUM |
| users.service.ts (admin) | INCOMPLETE | MEDIUM |
| analytics.service.ts | ORPHANED (BE doesn't exist) | LOW |

---

## 4. Missing Frontend Pages

### 4.1 User Pages Missing
| Page | Route | BE Support | Status |
|------|-------|------------|--------|
| Orders List | `/account/orders` | YES | MISSING |
| Order Detail | `/account/orders/[id]` | YES | MISSING |
| Profile | `/account/profile` | YES | MISSING |
| Reviews | `/account/reviews` | YES | MISSING |

### 4.2 Admin Pages Missing/Incomplete
| Page | Route | BE Support | Status |
|------|-------|------------|--------|
| Listings Management | `/admin/listings` | YES | MISSING |
| Reviews Management | `/admin/reviews` | YES | EXISTS but check integration |
| Shipments Management | `/admin/shipments` | YES | MISSING |
| Coupons Management | `/admin/coupons` | YES | MISSING |
| Users Management | `/admin/users` | YES | EXISTS (customers page) |
| Forms Management | `/admin/forms` | YES | MISSING |

### 4.3 Public Pages Missing
| Page | Route | BE Support | Status |
|------|-------|------------|--------|
| Contact/Form Pages | `/forms/[slug]` | YES | MISSING |

---

## 5. Type Mismatches

### 5.1 CartItem Type Mismatch
- **File:** `frontend/src/types/index.ts` (lines 67-75)
- **Issue:** Type is for response but used for request
- **Request needs:** `productId`, `quantity`, `size?`, `color?`
- **Response has:** `productId`, `name`, `price`, `quantity`, `stock`, `imageUrl`, `total`

### 5.2 Order CreateRequest Mismatch
- **File:** `frontend/src/services/order.service.ts` (lines 19-28)
- **Frontend:** `{ addressId, items: [{ itemId, quantity }], paymentMethod, couponCode, deliveryCharge }`
- **Backend:** `{ items: [{ listingId, quantity }], addressSnapshot: object }`
- **Issue:** Completely different structure

### 5.3 Address Type Missing Fields
- **File:** `frontend/src/types/index.ts` (lines 77-92)
- **Missing in type:** `fullName` (mapped from name in BE)
- **Optional fields that are required in BE:** `phone`, `city`, `state`, `pincode`

### 5.4 ProductItem Type
- **File:** `frontend/src/types/index.ts` (lines 21-31)
- **Issue:** Uses `catalogId` but BE uses `productId`

### 5.5 Category Type Mismatch
- **File:** `frontend/src/types/index.ts` (lines 9-19)
- **Frontend:** `imageUrl?: string`
- **Backend:** `cardImage`, `bannerImage` (separate fields)

---

## 6. Route Coverage Matrix

### 6.1 Backend Routes vs Frontend Implementation

| Backend Route | Method | Frontend Status | Service File |
|--------------|--------|-----------------|--------------|
| **AUTH** |
| `/auth/send-otp` | POST | BROKEN | auth.service.ts |
| `/auth/verify-otp` | POST | BROKEN | auth.service.ts |
| `/auth/profile` | GET | WRONG ENDPOINT | auth.service.ts |
| `/auth/profile` | PATCH | OK | auth.service.ts |
| `/auth/admin/users` | GET | MISSING | - |
| `/auth/admin/users/:id/role` | PATCH | MISSING | - |
| **PRODUCTS** |
| `/products` | GET | OK | product.service.ts |
| `/products/details/:slug` | GET | WRONG ENDPOINT | product.service.ts |
| `/products/admin/all` | GET | MISSING | - |
| `/products/admin/:id` | GET | MISSING | - |
| `/products/admin` | POST | PARTIAL (lib/api.ts) | lib/api.ts |
| `/products/admin/:id` | PATCH | PARTIAL (lib/api.ts) | lib/api.ts |
| `/products/admin/:id` | DELETE | PARTIAL (lib/api.ts) | lib/api.ts |
| `/products/admin/:id/toggle` | PATCH | MISSING | - |
| **CATEGORIES** |
| `/categories` | GET | OK | product.service.ts |
| `/categories/:slug` | GET | OK | product.service.ts |
| `/categories/admin/*` | ALL | PARTIAL (lib/api.ts) | lib/api.ts |
| **LISTINGS** |
| `/listings/:id` | GET | MISSING | - |
| `/listings/product/:slug` | GET | MISSING | - |
| `/listings/admin/*` | ALL | MISSING | - |
| **CART** |
| `/cart/validate` | POST | OK | cart.service.ts |
| `/cart` | GET | MISSING | - |
| `/cart` | POST | MISSING | - |
| `/cart/:id` | PATCH | MISSING | - |
| `/cart/:id` | DELETE | MISSING | - |
| `/cart` | DELETE | MISSING | - |
| **ORDERS** |
| `/orders/my` | GET | WRONG ENDPOINT | order.service.ts |
| `/orders/:id` | GET | OK | order.service.ts |
| `/orders` | POST | BROKEN (wrong structure) | order.service.ts |
| `/orders/admin/*` | ALL | WRONG ENDPOINTS | order.service.ts |
| **ADDRESSES** |
| `/addresses/*` | ALL | MISSING SERVICE | - |
| **PAYMENTS** |
| `/payments/create` | POST | WRONG ENDPOINT | payment.service.ts |
| `/payments/verify` | POST | WRONG ENDPOINT | payment.service.ts |
| `/payments/:id/status` | GET | MISSING | - |
| `/payments/admin/all` | GET | MISSING | - |
| **REVIEWS** |
| `/reviews/*` | ALL | MISSING SERVICE | - |
| **SHIPMENTS** |
| `/shipments/*` | ALL | MISSING SERVICE | - |
| **COUPONS** |
| `/coupons/validate` | POST | OK | lib/api.ts |
| `/coupons` | GET | OK | lib/api.ts |
| `/coupons` | POST | OK | lib/api.ts |
| `/coupons/:id` | PATCH | MISSING | - |
| `/coupons/:id` | DELETE | MISSING | - |
| **USERS** |
| `/users/*` | ALL | PARTIAL | lib/api.ts |
| **SETTINGS** |
| `/settings/public` | GET | OK | lib/api.ts |
| `/settings/*` | ALL | OK | lib/api.ts |
| **FORMS** |
| `/forms/:slug` | GET | OK | lib/api.ts |
| `/forms/:slug/submit` | POST | OK | lib/api.ts |
| `/forms/admin/*` | ALL | MISSING | - |
| **DELIVERY** |
| `/delivery/check` | POST | MISSING | - |
| `/delivery/*` | ADMIN | MISSING | - |

---

## 7. Fix Priority Order

### CRITICAL (Fix First)
1. **Base URL** - `/api` → `/api/v1` (services/api.ts, lib/api.ts)
2. **Auth OTP** - Add `authType: 'PHONE'` parameter
3. **Auth Profile** - Change `/auth/me` → `/auth/profile`
4. **Product Details** - Change `/products/${slug}` → `/products/details/${slug}`
5. **Orders List** - Change `/orders` → `/orders/my`

### HIGH PRIORITY
6. Create `address.service.ts` with all endpoints
7. Create `listings.service.ts` for admin
8. Fix Order create structure to match BE
9. Fix Payment endpoints
10. Add missing cart operations

### MEDIUM PRIORITY
11. Create `reviews.service.ts`
12. Create `shipments.service.ts`
13. Create `delivery.service.ts`
14. Complete `users.service.ts`
15. Add missing coupon operations

### LOW PRIORITY
16. Create missing admin pages
17. Create missing user account pages
18. Remove or implement analytics endpoints
19. Create form management pages

---

## 8. Testing Checklist

### User Flow
- [ ] Register/Login with OTP
- [ ] Browse products
- [ ] View product details
- [ ] Add to cart
- [ ] View cart
- [ ] Update cart quantities
- [ ] Checkout with address
- [ ] Payment
- [ ] View orders
- [ ] Add review

### Admin Flow
- [ ] View dashboard
- [ ] Manage categories
- [ ] Manage products
- [ ] Manage listings
- [ ] Manage orders
- [ ] Manage customers
- [ ] Manage reviews
- [ ] Manage coupons
- [ ] Manage settings

---

## 9. Files to Modify (Summary)

### Services
- `frontend/src/services/api.ts` - Fix baseURL
- `frontend/src/services/auth.service.ts` - Fix endpoints & params
- `frontend/src/services/product.service.ts` - Fix product details endpoint
- `frontend/src/services/order.service.ts` - Fix endpoints & structure
- `frontend/src/services/payment.service.ts` - Fix endpoints
- `frontend/src/services/cart.service.ts` - Add missing operations

### Create New Services
- `frontend/src/services/address.service.ts` - NEW
- `frontend/src/services/listings.service.ts` - NEW
- `frontend/src/services/reviews.service.ts` - NEW
- `frontend/src/services/shipments.service.ts` - NEW
- `frontend/src/services/delivery.service.ts` - NEW
- `frontend/src/services/users.service.ts` - NEW (complete admin)

### lib/api.ts
- Fix auth endpoints
- Fix product endpoints
- Add missing operations

### Types
- `frontend/src/types/index.ts` - Fix mismatches

---

*This document should be updated as fixes are applied.*
