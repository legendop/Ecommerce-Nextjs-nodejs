# Database Structure

## Overview
PostgreSQL database for an E-commerce platform managed by Prisma ORM.

**Key Features:**
- Multi-auth support (Email, Phone, Google)
- Multi-payment gateway support (Razorpay, Stripe, PayU, etc.)
- Multi-shipping provider support (Shiprocket, Delhivery, etc.)
- Verified purchase reviews only
- Hierarchical categories
- Product → Listing (Color → Size) architecture

---

## Enums

| Enum | Values |
|------|--------|
| **Role** | `USER`, `ADMIN`, `MANAGER` |
| **AuthType** | `EMAIL`, `PHONE`, `GOOGLE` |
| **OrderStatus** | `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`, `RETURNED`, `REFUNDED` |
| **PaymentStatus** | `PENDING`, `CREATED`, `SUCCESS`, `FAILED`, `REFUNDED`, `PARTIALLY_REFUNDED` |
| **DiscountType** | `PERCENT`, `FLAT` |
| **FieldType** | `TEXT`, `EMAIL`, `PHONE`, `NUMBER`, `TEXTAREA`, `SELECT`, `RADIO`, `CHECKBOX`, `DATE`, `FILE`, `HIDDEN` |

---

## Tables

### Users & Authentication

#### `users`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK, Auto-increment |
| name | VARCHAR(120) | - |
| avatarUrl | TEXT | - |
| role | Role | DEFAULT 'USER' |
| isActive | BOOLEAN | DEFAULT true |
| createdAt | TIMESTAMP | DEFAULT now() |
| updatedAt | TIMESTAMP | Auto-update |

**Relations:** Has many `authMethods`, `addresses`, `cartItems`, `orders`, `reviews`, `formSubmissions`, `events`, `auditLogs`

#### `user_auth` (Multi-auth support)
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK, Auto-increment |
| userId | BIGINT | FK → users.id, CASCADE, Indexed |
| authType | AuthType | NOT NULL |
| identifier | VARCHAR(255) | NOT NULL |
| credential | TEXT | - |
| isVerified | BOOLEAN | DEFAULT false |
| createdAt | TIMESTAMP | DEFAULT now() |

**Constraints:** UNIQUE(authType, identifier)

#### `otp_verifications`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK, Auto-increment |
| identifier | VARCHAR(255) | NOT NULL, Indexed |
| otpCode | VARCHAR(10) | NOT NULL |
| expiresAt | TIMESTAMP | NOT NULL, Indexed |
| isUsed | BOOLEAN | DEFAULT false |
| createdAt | TIMESTAMP | DEFAULT now() |

---

### Category System (Hierarchical)

#### `categories`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK, Auto-increment |
| name | VARCHAR(150) | NOT NULL |
| slug | VARCHAR(160) | UNIQUE, NOT NULL |
| description | TEXT | - |
| cardImage | TEXT | - |
| bannerImage | TEXT | - |
| isActive | BOOLEAN | DEFAULT true, Indexed |
| sortOrder | INT | DEFAULT 0, Indexed |
| parentId | BIGINT | FK → categories.id, SET NULL, Indexed |
| createdAt | TIMESTAMP | DEFAULT now() |
| updatedAt | TIMESTAMP | Auto-update |

**Relations:** Self-referencing parent/children, Many-to-many with `products`

---

### Product System (Color Variant Level)

#### `products`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK, Auto-increment |
| name | VARCHAR(255) | NOT NULL |
| slug | VARCHAR(255) | UNIQUE, NOT NULL, Indexed |
| colorName | VARCHAR(100) | NOT NULL |
| description | TEXT | - |
| bulletPoints | JSONB | - |
| extraData | JSONB | - |
| isActive | BOOLEAN | DEFAULT true, Indexed |
| sortOrder | INT | DEFAULT 0, Indexed |
| createdAt | TIMESTAMP | DEFAULT now() |
| updatedAt | TIMESTAMP | Auto-update |

**Relations:** Has many `categories`, `images`, `listings`, `reviews`

#### `product_images`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK, Auto-increment |
| productId | BIGINT | FK → products.id, CASCADE, Indexed |
| imageUrl | TEXT | NOT NULL |
| sortOrder | INT | DEFAULT 0, Indexed |
| createdAt | TIMESTAMP | DEFAULT now() |

#### `product_categories` (Join Table)
| Column | Type | Constraints |
|--------|------|-------------|
| productId | BIGINT | FK → products.id, CASCADE, PK |
| categoryId | BIGINT | FK → categories.id, CASCADE, PK |

---

### Listing System (Size Level - Sellable Unit)

#### `listings`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK, Auto-increment |
| productId | BIGINT | FK → products.id, CASCADE, Indexed |
| size | VARCHAR(50) | - |
| sku | VARCHAR(120) | UNIQUE |
| price | DECIMAL(12,2) | NOT NULL |
| discountAmount | DECIMAL(12,2) | DEFAULT 0 |
| stock | INT | DEFAULT 0 |
| isActive | BOOLEAN | DEFAULT true, Indexed |
| createdAt | TIMESTAMP | DEFAULT now() |
| updatedAt | TIMESTAMP | Auto-update |

**Relations:** Has many `cartItems`, `orderItems`

---

### Address System

#### `addresses`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK, Auto-increment |
| userId | BIGINT | FK → users.id, CASCADE, Indexed |
| fullName | VARCHAR(120) | NOT NULL |
| phone | VARCHAR(15) | NOT NULL |
| line1 | TEXT | NOT NULL |
| line2 | TEXT | - |
| landmark | TEXT | - |
| city | VARCHAR(120) | NOT NULL |
| state | VARCHAR(120) | NOT NULL |
| pincode | VARCHAR(20) | NOT NULL |
| country | VARCHAR(80) | DEFAULT 'India' |
| isDefault | BOOLEAN | DEFAULT false |
| createdAt | TIMESTAMP | DEFAULT now() |
| updatedAt | TIMESTAMP | Auto-update |

---

### Cart System

#### `cart_items`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK, Auto-increment |
| userId | BIGINT | FK → users.id, CASCADE |
| listingId | BIGINT | FK → listings.id, Indexed |
| quantity | INT | NOT NULL, CHECK > 0 |
| createdAt | TIMESTAMP | DEFAULT now() |
| updatedAt | TIMESTAMP | Auto-update |

**Constraints:** UNIQUE(userId, listingId)

---

### Order System

#### `orders`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK, Auto-increment |
| orderNumber | VARCHAR(40) | UNIQUE, NOT NULL, Indexed |
| userId | BIGINT | FK → users.id, Indexed |
| subtotal | DECIMAL(12,2) | NOT NULL |
| discountAmount | DECIMAL(12,2) | DEFAULT 0 |
| deliveryCharge | DECIMAL(12,2) | DEFAULT 0 |
| totalAmount | DECIMAL(12,2) | NOT NULL |
| paymentStatus | PaymentStatus | DEFAULT 'PENDING', Indexed |
| orderStatus | OrderStatus | DEFAULT 'PENDING', Indexed |
| addressSnapshot | JSONB | NOT NULL |
| placedAt | TIMESTAMP | - |
| createdAt | TIMESTAMP | DEFAULT now(), Indexed |
| updatedAt | TIMESTAMP | Auto-update |

**Relations:** Has many `items`, `payments`, `shipments`

#### `order_items` (Snapshot Safe)
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK, Auto-increment |
| orderId | BIGINT | FK → orders.id, CASCADE, Indexed |
| listingId | BIGINT | FK → listings.id, Indexed |
| productSnapshot | JSONB | NOT NULL |
| unitPrice | DECIMAL(12,2) | NOT NULL |
| discountAmount | DECIMAL(12,2) | DEFAULT 0 |
| finalUnitPrice | DECIMAL(12,2) | NOT NULL |
| quantity | INT | NOT NULL, CHECK > 0 |
| totalAmount | DECIMAL(12,2) | NOT NULL |
| createdAt | TIMESTAMP | DEFAULT now() |

---

### Multi-Payment Support

#### `payments` (Multiple attempts per order)
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK, Auto-increment |
| orderId | BIGINT | FK → orders.id, CASCADE, Indexed |
| provider | VARCHAR(50) | NOT NULL (razorpay\|stripe\|payu) |
| providerOrderId | VARCHAR(255) | - |
| providerPaymentId | VARCHAR(255) | Indexed |
| providerSignature | TEXT | - |
| amount | DECIMAL(12,2) | NOT NULL |
| currency | VARCHAR(10) | DEFAULT 'INR' |
| status | PaymentStatus | DEFAULT 'CREATED' |
| rawResponse | JSONB | - |
| createdAt | TIMESTAMP | DEFAULT now() |
| updatedAt | TIMESTAMP | Auto-update |

---

### Multi-Shipping Support

#### `shipments` (Multiple providers per order)
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK, Auto-increment |
| orderId | BIGINT | FK → orders.id, CASCADE, Indexed |
| provider | VARCHAR(50) | NOT NULL (shiprocket\|delhivery) |
| providerOrderId | VARCHAR(255) | - |
| trackingId | VARCHAR(255) | Indexed |
| trackingUrl | TEXT | - |
| shipmentStatus | VARCHAR(50) | DEFAULT 'CREATED', Indexed |
| rawResponse | JSONB | - |
| createdAt | TIMESTAMP | DEFAULT now() |
| updatedAt | TIMESTAMP | Auto-update |

---

### Review System (Verified Purchase)

#### `reviews`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK, Auto-increment |
| productId | BIGINT | FK → products.id, CASCADE, Indexed |
| userId | BIGINT | FK → users.id, CASCADE, Indexed |
| orderId | BIGINT | Indexed |
| rating | INT | NOT NULL |
| title | VARCHAR(255) | - |
| comment | TEXT | - |
| images | JSONB | Array of image URLs |
| isVerified | BOOLEAN | DEFAULT false, Indexed |
| isHelpful | INT | DEFAULT 0 |
| createdAt | TIMESTAMP | DEFAULT now() |
| updatedAt | TIMESTAMP | Auto-update |

**Constraints:** UNIQUE(productId, userId, orderId)

---

### Coupon System

#### `coupons`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK, Auto-increment |
| code | VARCHAR(50) | UNIQUE, NOT NULL |
| discountType | DiscountType | NOT NULL |
| discountValue | DECIMAL(10,2) | NOT NULL |
| maxDiscount | DECIMAL(10,2) | - |
| minOrderAmount | DECIMAL(10,2) | - |
| usageLimit | INT | - |
| usageCount | Int | DEFAULT 0 |
| expiresAt | TIMESTAMP | - |
| isActive | BOOLEAN | DEFAULT true |
| createdAt | TIMESTAMP | DEFAULT now() |
| updatedAt | TIMESTAMP | Auto-update |

---

### Analytics Tables

#### `visits`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK, Auto-increment |
| ipAddress | VARCHAR(45) | - |
| userAgent | TEXT | - |
| path | TEXT | Indexed |
| referrer | TEXT | - |
| createdAt | TIMESTAMP | DEFAULT now(), Indexed |

#### `events`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK, Auto-increment |
| userId | BIGINT | FK → users.id, SET NULL, Indexed |
| eventType | VARCHAR(100) | NOT NULL, Indexed |
| entityType | VARCHAR(100) | - |
| entityId | BIGINT | - |
| meta | JSONB | - |
| ipAddress | VARCHAR(45) | - |
| createdAt | TIMESTAMP | DEFAULT now(), Indexed |

---

### Dynamic Form System

#### `forms`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK, Auto-increment |
| name | VARCHAR(120) | NOT NULL |
| slug | VARCHAR(160) | UNIQUE, NOT NULL |
| description | TEXT | - |
| isActive | BOOLEAN | DEFAULT true |
| submitText | VARCHAR(50) | DEFAULT 'Submit' |
| successMessage | TEXT | - |
| createdAt | TIMESTAMP | DEFAULT now() |
| updatedAt | TIMESTAMP | Auto-update |

#### `form_fields`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK, Auto-increment |
| formId | BIGINT | FK → forms.id, CASCADE, Indexed |
| label | VARCHAR(255) | NOT NULL |
| fieldKey | VARCHAR(100) | NOT NULL, PK composite |
| fieldType | FieldType | NOT NULL |
| isRequired | BOOLEAN | DEFAULT false |
| placeholder | VARCHAR(255) | - |
| helpText | TEXT | - |
| options | JSONB | - |
| validation | JSONB | - |
| defaultValue | TEXT | - |
| sortOrder | INT | DEFAULT 0 |
| createdAt | TIMESTAMP | DEFAULT now() |

**Constraints:** UNIQUE(formId, fieldKey)

#### `form_submissions`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK, Auto-increment |
| formId | BIGINT | FK → forms.id, CASCADE, Indexed |
| userId | BIGINT | FK → users.id, SET NULL, Indexed |
| data | JSONB | NOT NULL |
| ipAddress | VARCHAR(45) | - |
| userAgent | TEXT | - |
| createdAt | TIMESTAMP | DEFAULT now(), Indexed |

---

### Settings & Audit

#### `settings`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK, Auto-increment |
| key | VARCHAR(100) | UNIQUE, NOT NULL |
| value | TEXT | NOT NULL |
| type | VARCHAR(20) | DEFAULT 'string' |
| description | TEXT | - |
| isPublic | BOOLEAN | DEFAULT false |
| updatedAt | TIMESTAMP | Auto-update |

#### `audit_logs`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK, Auto-increment |
| userId | BIGINT | FK → users.id, SET NULL, Indexed |
| action | VARCHAR(255) | NOT NULL |
| entityType | VARCHAR(100) | NOT NULL, Indexed |
| entityId | BIGINT | Indexed (composite) |
| oldValues | JSONB | - |
| newValues | JSONB | - |
| ipAddress | VARCHAR(45) | - |
| userAgent | TEXT | - |
| createdAt | TIMESTAMP | DEFAULT now(), Indexed |

---

## Entity Relationship Summary

```
users
 ├── user_auth (EMAIL|PHONE|GOOGLE)
 ├── addresses
 ├── cart_items → listings
 ├── orders
 │    ├── order_items (with product_snapshot)
 │    ├── payments (razorpay|stripe|payu - multiple attempts)
 │    └── shipments (shiprocket|delhivery - multiple providers)
 └── reviews (verified purchase only)

categories (hierarchical)
 └── product_categories
      └── products
           ├── product_images
           ├── listings (size/SKU level)
           └── reviews
```

---

## API Structure

### Modules
```
src/modules/
├── auth/           # Multi-auth (Email, Phone, Google)
├── users/          # User management
├── categories/     # Category CRUD + hierarchy
├── products/       # Product CRUD + images
├── listings/       # Listing CRUD + stock
├── cart/           # Cart management
├── orders/         # Order lifecycle
├── payments/       # Multi-gateway payments
├── shipments/      # Multi-provider shipping
├── reviews/        # Verified reviews
├── addresses/      # User addresses
├── coupons/        # Discount coupons
├── forms/          # Dynamic forms
├── analytics/      # Visits & events
└── settings/       # Site settings

src/integrations/
├── payments/
│   ├── razorpay/
│   ├── stripe/
│   └── payu/
└── shipping/
    ├── shiprocket/
    └── delhivery/
```

---

## File Location
- **Prisma Schema:** `backend/prisma/schema.prisma`
