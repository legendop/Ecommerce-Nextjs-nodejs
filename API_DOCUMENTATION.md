# Ecommerce Platform API Documentation

**Base URL:** `http://localhost:5000/api/v1/v1`

**Authentication:** Bearer Token (JWT) via `Authorization: Bearer <token>` header or Cookie

---

## Table of Contents

1. [Public Routes (No Authentication)](#1-public-routes-no-authentication)
2. [Authentication Routes](#2-authentication-routes)
3. [User Routes (Authentication Required)](#3-user-routes-authentication-required)
4. [Admin Routes (Manager/Admin Required)](#4-admin-routes-manageradmin-required)

---

## 1. Public Routes (No Authentication)

### 1.1 Health Check

#### Check API Health
```bash
curl -X GET http://localhost:5000/api/v1/health
```

---

### 1.2 Products (Public)

#### List Products (with filters)
```bash
# Fetch all products
curl -X GET "http://localhost:5000/api/v1/products"

# Fetch with filters
curl -X GET "http://localhost:5000/api/v1/products?category=electronics&minPrice=100&maxPrice=1000&sortBy=price&order=asc"
```

#### Get Product Details
```bash
curl -X GET "http://localhost:5000/api/v1/products/details/my-product-slug"
```

---

### 1.3 Categories (Public)

#### List All Active Categories
```bash
curl -X GET http://localhost:5000/api/v1/categories
```

#### Get Category by Slug
```bash
curl -X GET "http://localhost:5000/api/v1/categories/electronics"
```

---

### 1.4 Listings (Public)

#### Get Single Listing
```bash
curl -X GET "http://localhost:5000/api/v1/listings/123"
```

#### Get Listings by Product Slug
```bash
curl -X GET "http://localhost:5000/api/v1/listings/product/my-product-slug"
```

---

### 1.5 Reviews (Public)

#### Get Product Reviews
```bash
curl -X GET "http://localhost:5000/api/v1/reviews/product/123"
```

#### Mark Review Helpful
```bash
curl -X POST "http://localhost:5000/api/v1/reviews/456/helpful"
```

---

### 1.6 Cart (Partially Public)

#### Validate Cart (Public)
```bash
curl -X POST http://localhost:5000/api/v1/cart/validate \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "123",
        "quantity": 2
      }
    ]
  }'
```

---

### 1.7 Forms (Public)

#### Get Form by Slug
```bash
curl -X GET "http://localhost:5000/api/v1/forms/contact-us"
```

#### Submit Form
```bash
curl -X POST "http://localhost:5000/api/v1/forms/contact-us/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Hello!"
  }'
```

---

### 1.8 Delivery (Public)

#### Check Delivery Availability
```bash
curl -X POST http://localhost:5000/api/v1/delivery/check \
  -H "Content-Type: application/json" \
  -d '{
    "pincode": "110001"
  }'
```

---

### 1.9 Settings (Public)

#### Get Public Settings
```bash
curl -X GET http://localhost:5000/api/v1/settings/public
```

---

### 1.10 Shipments (Webhook - Public)

#### Shipment Webhook
```bash
curl -X POST "http://localhost:5000/api/v1/shipments/webhook/shiprocket" \
  -H "Content-Type: application/json" \
  -d '{
    "tracking_id": "TRK123",
    "status": "delivered"
  }'
```

---

### 1.11 Payments (Webhook - Public)

#### Payment Webhook
```bash
curl -X POST "http://localhost:5000/api/v1/payments/webhook/razorpay" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "payment.captured",
    "payload": {}
  }'
```

---

## 2. Authentication Routes

### 2.1 OTP Authentication Flow

#### Step 1: Send OTP
```bash
curl -X POST http://localhost:5000/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "9876543210",
    "authType": "PHONE"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "OTP sent successfully",
    "expiresIn": 300
  }
}
```

#### Step 2: Verify OTP
```bash
curl -X POST http://localhost:5000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "9876543210",
    "otp": "123456",
    "authType": "PHONE"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "1",
      "name": "John Doe",
      "phone": "9876543210",
      "role": "USER"
    }
  }
}
```

---

## 3. User Routes (Authentication Required)

**Note:** All following routes require Bearer token in header:
```
Authorization: Bearer <your_jwt_token>
```

---

### 3.1 User Profile

#### Get Current User Profile
```bash
curl -X GET http://localhost:5000/api/v1/auth/profile \
  -H "Authorization: Bearer <token>"
```

#### Update Profile
```bash
curl -X PATCH http://localhost:5000/api/v1/auth/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Updated",
    "avatarUrl": "https://example.com/avatar.jpg"
  }'
```

#### Fetch Updated Profile
```bash
curl -X GET http://localhost:5000/api/v1/auth/profile \
  -H "Authorization: Bearer <token>"
```

---

### 3.2 Addresses

#### Create Address
```bash
curl -X POST http://localhost:5000/api/v1/addresses \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "line1": "123 Main Street",
    "line2": "Apt 4B",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "latitude": 19.076,
    "longitude": 72.8777
  }'
```

#### List All Addresses
```bash
curl -X GET http://localhost:5000/api/v1/addresses \
  -H "Authorization: Bearer <token>"
```

#### Get Single Address
```bash
curl -X GET "http://localhost:5000/api/v1/addresses/123" \
  -H "Authorization: Bearer <token>"
```

#### Update Address
```bash
curl -X PATCH "http://localhost:5000/api/v1/addresses/123" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "line1": "456 New Street",
    "city": "Delhi"
  }'
```

#### Fetch Updated Address
```bash
curl -X GET "http://localhost:5000/api/v1/addresses/123" \
  -H "Authorization: Bearer <token>"
```

#### Delete Address
```bash
curl -X DELETE "http://localhost:5000/api/v1/addresses/123" \
  -H "Authorization: Bearer <token>"
```

#### Fetch After Delete
```bash
curl -X GET http://localhost:5000/api/v1/addresses \
  -H "Authorization: Bearer <token>"
```

---

### 3.3 Cart (Authenticated)

#### Get My Cart
```bash
curl -X GET http://localhost:5000/api/v1/cart \
  -H "Authorization: Bearer <token>"
```

#### Add to Cart
```bash
curl -X POST http://localhost:5000/api/v1/cart \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "prod_123",
    "quantity": 2
  }'
```

#### Fetch Cart After Add
```bash
curl -X GET http://localhost:5000/api/v1/cart \
  -H "Authorization: Bearer <token>"
```

#### Update Cart Item
```bash
curl -X PATCH "http://localhost:5000/api/v1/cart/456" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 5
  }'
```

#### Fetch Cart After Update
```bash
curl -X GET http://localhost:5000/api/v1/cart \
  -H "Authorization: Bearer <token>"
```

#### Remove Item from Cart
```bash
curl -X DELETE "http://localhost:5000/api/v1/cart/456" \
  -H "Authorization: Bearer <token>"
```

#### Fetch Cart After Remove
```bash
curl -X GET http://localhost:5000/api/v1/cart \
  -H "Authorization: Bearer <token>"
```

#### Clear Cart
```bash
curl -X DELETE http://localhost:5000/api/v1/cart \
  -H "Authorization: Bearer <token>"
```

#### Fetch Empty Cart
```bash
curl -X GET http://localhost:5000/api/v1/cart \
  -H "Authorization: Bearer <token>"
```

---

### 3.4 Orders

#### Create Order
```bash
curl -X POST http://localhost:5000/api/v1/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "listingId": "listing_123",
        "quantity": 2
      }
    ],
    "addressSnapshot": {
      "line1": "123 Main Street",
      "city": "Mumbai",
      "pincode": "400001"
    }
  }'
```

#### Get My Orders
```bash
curl -X GET http://localhost:5000/api/v1/orders/my \
  -H "Authorization: Bearer <token>"
```

#### Get Single Order
```bash
curl -X GET "http://localhost:5000/api/v1/orders/789" \
  -H "Authorization: Bearer <token>"
```

---

### 3.5 Payments

#### Create Payment
```bash
curl -X POST http://localhost:5000/api/v1/payments/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order_123",
    "provider": "razorpay"
  }'
```

#### Verify Payment
```bash
curl -X POST http://localhost:5000/api/v1/payments/verify \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "pay_123",
    "orderId": "order_123",
    "signature": "signature_string"
  }'
```

#### Get Payment Status
```bash
curl -X GET "http://localhost:5000/api/v1/payments/pay_123/status" \
  -H "Authorization: Bearer <token>"
```

---

### 3.6 Reviews (Authenticated)

#### Get My Reviews
```bash
curl -X GET http://localhost:5000/api/v1/reviews/my-reviews \
  -H "Authorization: Bearer <token>"
```

#### Create Review
```bash
curl -X POST http://localhost:5000/api/v1/reviews \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 123,
    "orderId": 456,
    "rating": 5,
    "title": "Great product!",
    "comment": "Really loved using this product.",
    "images": ["https://example.com/img1.jpg"]
  }'
```

#### Fetch My Reviews After Create
```bash
curl -X GET http://localhost:5000/api/v1/reviews/my-reviews \
  -H "Authorization: Bearer <token>"
```

#### Update Review
```bash
curl -X PATCH "http://localhost:5000/api/v1/reviews/789" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 4,
    "comment": "Updated review comment"
  }'
```

#### Fetch Updated Review
```bash
curl -X GET http://localhost:5000/api/v1/reviews/my-reviews \
  -H "Authorization: Bearer <token>"
```

#### Delete Review
```bash
curl -X DELETE "http://localhost:5000/api/v1/reviews/789" \
  -H "Authorization: Bearer <token>"
```

#### Fetch After Delete
```bash
curl -X GET http://localhost:5000/api/v1/reviews/my-reviews \
  -H "Authorization: Bearer <token>"
```

---

### 3.7 Shipments (User)

#### Get Order Shipments
```bash
curl -X GET "http://localhost:5000/api/v1/shipments/order/123" \
  -H "Authorization: Bearer <token>"
```

---

### 3.8 Coupons (Public Validation, Admin Management)

#### Validate Coupon
```bash
curl -X POST http://localhost:5000/api/v1/coupons/validate \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SAVE20",
    "orderAmount": 1000
  }'
```

---

## 4. Admin Routes (Manager/Admin Required)

**Note:** All admin routes require:
- Bearer token in header
- User role must be `MANAGER` or `ADMIN`

---

### 4.1 Auth Admin

#### List All Users (Manager+)
```bash
curl -X GET http://localhost:5000/api/v1/auth/admin/users \
  -H "Authorization: Bearer <admin_token>"
```

#### Update User Role (Manager+)
```bash
curl -X PATCH "http://localhost:5000/api/v1/auth/admin/users/123/role" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "MANAGER"
  }'
```

---

### 4.2 Users Admin

#### List All Users (Admin Only)
```bash
curl -X GET http://localhost:5000/api/v1/users \
  -H "Authorization: Bearer <admin_token>"
```

#### Get Single User
```bash
curl -X GET "http://localhost:5000/api/v1/users/123" \
  -H "Authorization: Bearer <admin_token>"
```

#### Update User
```bash
curl -X PATCH "http://localhost:5000/api/v1/users/123" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "ADMIN",
    "isActive": true
  }'
```

#### Fetch Updated User
```bash
curl -X GET "http://localhost:5000/api/v1/users/123" \
  -H "Authorization: Bearer <admin_token>"
```

#### Deactivate User
```bash
curl -X DELETE "http://localhost:5000/api/v1/users/123" \
  -H "Authorization: Bearer <admin_token>"
```

#### Fetch After Deactivate
```bash
curl -X GET http://localhost:5000/api/v1/users \
  -H "Authorization: Bearer <admin_token>"
```

---

### 4.3 Products Admin

#### List All Products (Admin)
```bash
curl -X GET http://localhost:5000/api/v1/products/admin/all \
  -H "Authorization: Bearer <admin_token>"
```

#### Get Single Product (Admin)
```bash
curl -X GET "http://localhost:5000/api/v1/products/admin/123" \
  -H "Authorization: Bearer <admin_token>"
```

#### Create Product
```bash
curl -X POST http://localhost:5000/api/v1/products/admin \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Product",
    "slug": "new-product",
    "description": "Product description",
    "colorName": "Blue",
    "colorCode": "#0000FF",
    "gender": "Unisex",
    "categoryIds": [1, 2],
    "images": [
      {"imageUrl": "https://example.com/img1.jpg", "sortOrder": 1}
    ],
    "listings": [
      {"size": "M", "price": 999, "stock": 100}
    ],
    "isActive": true,
    "sortOrder": 1
  }'
```

#### Fetch After Create
```bash
curl -X GET http://localhost:5000/api/v1/products/admin/all \
  -H "Authorization: Bearer <admin_token>"
```

#### Update Product
```bash
curl -X PATCH "http://localhost:5000/api/v1/products/admin/123" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Product Name",
    "price": 1299
  }'
```

#### Fetch Updated Product
```bash
curl -X GET "http://localhost:5000/api/v1/products/admin/123" \
  -H "Authorization: Bearer <admin_token>"
```

#### Toggle Product Status
```bash
curl -X PATCH "http://localhost:5000/api/v1/products/admin/123/toggle" \
  -H "Authorization: Bearer <admin_token>"
```

#### Fetch After Toggle
```bash
curl -X GET "http://localhost:5000/api/v1/products/admin/123" \
  -H "Authorization: Bearer <admin_token>"
```

#### Delete Product
```bash
curl -X DELETE "http://localhost:5000/api/v1/products/admin/123" \
  -H "Authorization: Bearer <admin_token>"
```

#### Fetch After Delete
```bash
curl -X GET http://localhost:5000/api/v1/products/admin/all \
  -H "Authorization: Bearer <admin_token>"
```

---

### 4.4 Categories Admin

#### List All Categories (Admin)
```bash
curl -X GET http://localhost:5000/api/v1/categories/admin/all \
  -H "Authorization: Bearer <admin_token>"
```

#### Get Single Category (Admin)
```bash
curl -X GET "http://localhost:5000/api/v1/categories/admin/123" \
  -H "Authorization: Bearer <admin_token>"
```

#### Create Category
```bash
curl -X POST http://localhost:5000/api/v1/categories/admin \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Category",
    "slug": "new-category",
    "description": "Category description",
    "cardImage": "https://example.com/card.jpg",
    "bannerImage": "https://example.com/banner.jpg",
    "parentId": null,
    "sortOrder": 1
  }'
```

#### Fetch After Create
```bash
curl -X GET http://localhost:5000/api/v1/categories/admin/all \
  -H "Authorization: Bearer <admin_token>"
```

#### Update Category
```bash
curl -X PATCH "http://localhost:5000/api/v1/categories/admin/123" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Category",
    "isActive": true
  }'
```

#### Fetch Updated Category
```bash
curl -X GET "http://localhost:5000/api/v1/categories/admin/123" \
  -H "Authorization: Bearer <admin_token>"
```

#### Reorder Category Products
```bash
curl -X POST "http://localhost:5000/api/v1/categories/admin/123/reorder" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productOrders": [
      {"productId": "prod_1", "sortOrder": 1},
      {"productId": "prod_2", "sortOrder": 2}
    ]
  }'
```

#### Delete Category
```bash
curl -X DELETE "http://localhost:5000/api/v1/categories/admin/123" \
  -H "Authorization: Bearer <admin_token>"
```

#### Fetch After Delete
```bash
curl -X GET http://localhost:5000/api/v1/categories/admin/all \
  -H "Authorization: Bearer <admin_token>"
```

---

### 4.5 Listings Admin

#### List All Listings (Admin)
```bash
curl -X GET http://localhost:5000/api/v1/listings/admin/all \
  -H "Authorization: Bearer <admin_token>"
```

#### Get Single Listing (Admin)
```bash
curl -X GET "http://localhost:5000/api/v1/listings/admin/123" \
  -H "Authorization: Bearer <admin_token>"
```

#### Create Listing
```bash
curl -X POST http://localhost:5000/api/v1/listings/admin \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "prod_123",
    "skuCode": "SKU-001",
    "size": "L",
    "price": 999,
    "maxPrice": 1299,
    "discountPercent": 23,
    "stock": 100,
    "isActive": true
  }'
```

#### Fetch After Create
```bash
curl -X GET http://localhost:5000/api/v1/listings/admin/all \
  -H "Authorization: Bearer <admin_token>"
```

#### Update Listing
```bash
curl -X PATCH "http://localhost:5000/api/v1/listings/admin/123" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 899,
    "stock": 150
  }'
```

#### Fetch Updated Listing
```bash
curl -X GET "http://localhost:5000/api/v1/listings/admin/123" \
  -H "Authorization: Bearer <admin_token>"
```

#### Update Stock
```bash
curl -X PATCH "http://localhost:5000/api/v1/listings/admin/123/stock" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "stock": 200
  }'
```

#### Bulk Update Stock
```bash
curl -X POST http://localhost:5000/api/v1/listings/admin/bulk-stock \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "updates": [
      {"listingId": "list_1", "stock": 50},
      {"listingId": "list_2", "stock": 75}
    ]
  }'
```

#### Toggle Listing Status
```bash
curl -X PATCH "http://localhost:5000/api/v1/listings/admin/123/toggle" \
  -H "Authorization: Bearer <admin_token>"
```

#### Fetch After Toggle
```bash
curl -X GET "http://localhost:5000/api/v1/listings/admin/123" \
  -H "Authorization: Bearer <admin_token>"
```

#### Delete Listing
```bash
curl -X DELETE "http://localhost:5000/api/v1/listings/admin/123" \
  -H "Authorization: Bearer <admin_token>"
```

#### Fetch After Delete
```bash
curl -X GET http://localhost:5000/api/v1/listings/admin/all \
  -H "Authorization: Bearer <admin_token>"
```

---

### 4.6 Orders Admin

#### List All Orders (Admin)
```bash
curl -X GET http://localhost:5000/api/v1/orders/admin/all \
  -H "Authorization: Bearer <admin_token>"
```

#### Get Single Order (Admin)
```bash
curl -X GET "http://localhost:5000/api/v1/orders/admin/123" \
  -H "Authorization: Bearer <admin_token>"
```

#### Update Order Status
```bash
curl -X PATCH "http://localhost:5000/api/v1/orders/admin/123/status" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderStatus": "SHIPPED"
  }'
```

#### Fetch Updated Order
```bash
curl -X GET "http://localhost:5000/api/v1/orders/admin/123" \
  -H "Authorization: Bearer <admin_token>"
```

#### Cancel Order
```bash
curl -X PATCH "http://localhost:5000/api/v1/orders/admin/123/cancel" \
  -H "Authorization: Bearer <admin_token>"
```

#### Fetch After Cancel
```bash
curl -X GET "http://localhost:5000/api/v1/orders/admin/123" \
  -H "Authorization: Bearer <admin_token>"
```

---

### 4.7 Payments Admin

#### List All Payments (Admin)
```bash
curl -X GET http://localhost:5000/api/v1/payments/admin/all \
  -H "Authorization: Bearer <admin_token>"
```

---

### 4.8 Reviews Admin

#### List All Reviews (Admin)
```bash
curl -X GET http://localhost:5000/api/v1/reviews/admin/all \
  -H "Authorization: Bearer <admin_token>"
```

#### Get Single Review (Admin)
```bash
curl -X GET "http://localhost:5000/api/v1/reviews/admin/123" \
  -H "Authorization: Bearer <admin_token>"
```

#### Verify Review
```bash
curl -X PATCH "http://localhost:5000/api/v1/reviews/admin/123/verify" \
  -H "Authorization: Bearer <admin_token>"
```

#### Fetch After Verify
```bash
curl -X GET "http://localhost:5000/api/v1/reviews/admin/123" \
  -H "Authorization: Bearer <admin_token>"
```

#### Admin Delete Review
```bash
curl -X DELETE "http://localhost:5000/api/v1/reviews/admin/123" \
  -H "Authorization: Bearer <admin_token>"
```

#### Fetch After Delete
```bash
curl -X GET http://localhost:5000/api/v1/reviews/admin/all \
  -H "Authorization: Bearer <admin_token>"
```

---

### 4.9 Coupons Admin

#### List All Coupons (Admin)
```bash
curl -X GET http://localhost:5000/api/v1/coupons \
  -H "Authorization: Bearer <admin_token>"
```

#### Create Coupon
```bash
curl -X POST http://localhost:5000/api/v1/coupons \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SAVE20",
    "discountType": "PERCENT",
    "discountValue": 20,
    "minOrderAmount": 500,
    "maxDiscount": 200,
    "validFrom": "2024-01-01",
    "validUntil": "2024-12-31",
    "usageLimit": 100
  }'
```

#### Fetch After Create
```bash
curl -X GET http://localhost:5000/api/v1/coupons \
  -H "Authorization: Bearer <admin_token>"
```

#### Update Coupon
```bash
curl -X PATCH "http://localhost:5000/api/v1/coupons/123" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "discountValue": 25,
    "isActive": true
  }'
```

#### Fetch Updated Coupon
```bash
curl -X GET http://localhost:5000/api/v1/coupons \
  -H "Authorization: Bearer <admin_token>"
```

#### Delete Coupon
```bash
curl -X DELETE "http://localhost:5000/api/v1/coupons/123" \
  -H "Authorization: Bearer <admin_token>"
```

#### Fetch After Delete
```bash
curl -X GET http://localhost:5000/api/v1/coupons \
  -H "Authorization: Bearer <admin_token>"
```

---

### 4.10 Settings Admin

#### Get All Settings (Admin)
```bash
curl -X GET http://localhost:5000/api/v1/settings \
  -H "Authorization: Bearer <admin_token>"
```

#### Update Setting
```bash
curl -X PUT "http://localhost:5000/api/v1/settings/site_name" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "My Ecommerce Store",
    "type": "string",
    "isPublic": true
  }'
```

#### Fetch After Update
```bash
curl -X GET http://localhost:5000/api/v1/settings \
  -H "Authorization: Bearer <admin_token>"
```

#### Bulk Update Settings
```bash
curl -X POST http://localhost:5000/api/v1/settings/bulk \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "site_name": "New Store Name",
    "contact_email": "support@example.com"
  }'
```

#### Delete Setting
```bash
curl -X DELETE "http://localhost:5000/api/v1/settings/custom_setting" \
  -H "Authorization: Bearer <admin_token>"
```

#### Fetch After Delete
```bash
curl -X GET http://localhost:5000/api/v1/settings \
  -H "Authorization: Bearer <admin_token>"
```

---

### 4.11 Forms Admin

#### List All Forms (Admin)
```bash
curl -X GET http://localhost:5000/api/v1/forms/admin/all \
  -H "Authorization: Bearer <admin_token>"
```

#### Get Single Form (Admin)
```bash
curl -X GET "http://localhost:5000/api/v1/forms/admin/123" \
  -H "Authorization: Bearer <admin_token>"
```

#### Create Form
```bash
curl -X POST http://localhost:5000/api/v1/forms/admin \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Contact Form",
    "slug": "contact-form"
  }'
```

#### Fetch After Create
```bash
curl -X GET http://localhost:5000/api/v1/forms/admin/all \
  -H "Authorization: Bearer <admin_token>"
```

#### Update Form
```bash
curl -X PATCH "http://localhost:5000/api/v1/forms/admin/123" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Contact Form",
    "isActive": true
  }'
```

#### Fetch Updated Form
```bash
curl -X GET "http://localhost:5000/api/v1/forms/admin/123" \
  -H "Authorization: Bearer <admin_token>"
```

#### Add Form Field
```bash
curl -X POST "http://localhost:5000/api/v1/forms/admin/123/fields" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Full Name",
    "fieldKey": "full_name",
    "fieldType": "TEXT",
    "isRequired": true,
    "sortOrder": 1
  }'
```

#### Delete Form Field
```bash
curl -X DELETE "http://localhost:5000/api/v1/forms/admin/fields/456" \
  -H "Authorization: Bearer <admin_token>"
```

#### Delete Form
```bash
curl -X DELETE "http://localhost:5000/api/v1/forms/admin/123" \
  -H "Authorization: Bearer <admin_token>"
```

#### Fetch After Delete
```bash
curl -X GET http://localhost:5000/api/v1/forms/admin/all \
  -H "Authorization: Bearer <admin_token>"
```

---

### 4.12 Shipments Admin

#### List All Shipments (Admin)
```bash
curl -X GET http://localhost:5000/api/v1/shipments/admin/all \
  -H "Authorization: Bearer <admin_token>"
```

#### Get Single Shipment (Admin)
```bash
curl -X GET "http://localhost:5000/api/v1/shipments/admin/123" \
  -H "Authorization: Bearer <admin_token>"
```

#### Create Shipment
```bash
curl -X POST http://localhost:5000/api/v1/shipments/admin \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order_123",
    "provider": "shiprocket",
    "trackingId": "TRK123456",
    "trackingUrl": "https://track.example.com/TRK123456",
    "shipmentStatus": "picked_up"
  }'
```

#### Fetch After Create
```bash
curl -X GET http://localhost:5000/api/v1/shipments/admin/all \
  -H "Authorization: Bearer <admin_token>"
```

#### Update Shipment Status
```bash
curl -X PATCH "http://localhost:5000/api/v1/shipments/admin/123/status" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "shipmentStatus": "in_transit",
    "trackingId": "TRK123456",
    "trackingUrl": "https://track.example.com/TRK123456"
  }'
```

#### Fetch Updated Shipment
```bash
curl -X GET "http://localhost:5000/api/v1/shipments/admin/123" \
  -H "Authorization: Bearer <admin_token>"
```

#### Delete Shipment
```bash
curl -X DELETE "http://localhost:5000/api/v1/shipments/admin/123" \
  -H "Authorization: Bearer <admin_token>"
```

#### Fetch After Delete
```bash
curl -X GET http://localhost:5000/api/v1/shipments/admin/all \
  -H "Authorization: Bearer <admin_token>"
```

---

### 4.13 Delivery Admin

#### Get Delivery Settings (Admin)
```bash
curl -X GET http://localhost:5000/api/v1/delivery/settings \
  -H "Authorization: Bearer <admin_token>"
```

#### Update Delivery Settings
```bash
curl -X PATCH http://localhost:5000/api/v1/delivery/settings \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "defaultProvider": "shiprocket",
    "freeDeliveryThreshold": 500,
    "deliveryCharge": 50
  }'
```

#### Fetch Updated Settings
```bash
curl -X GET http://localhost:5000/api/v1/delivery/settings \
  -H "Authorization: Bearer <admin_token>"
```

#### Create Shipment (Delivery Module)
```bash
curl -X POST "http://localhost:5000/api/v1/delivery/shipments/order_123" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "shiprocket",
    "weight": 1.5,
    "dimensions": {
      "length": 10,
      "width": 8,
      "height": 5
    }
  }'
```

#### Track Shipment
```bash
curl -X GET "http://localhost:5000/api/v1/delivery/shipments/order_123/track" \
  -H "Authorization: Bearer <admin_token>"
```

---

## Quick Reference

### Authentication Levels

| Level | Required Role | Routes |
|-------|---------------|--------|
| Public | None | Products (view), Categories (view), Auth (send/verify OTP) |
| User | USER, MANAGER, ADMIN | Profile, Cart, Orders, Addresses, Reviews, Payments |
| Manager | MANAGER, ADMIN | Product/Category/Listing Admin, Orders Admin, Shipments Admin |
| Admin | ADMIN only | Users Admin, Coupons Admin, Settings Admin |

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

### Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```
