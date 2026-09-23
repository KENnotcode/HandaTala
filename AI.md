# HandaTala AI Development Instructions

## 1. Project Overview

You are building a **frontend prototype** for:

> **HandaTala – A Web-Based Canteen Food Ordering and Kitchen Queue Management System**

HandaTala is a modern canteen ordering and POS-style web application intended to reduce physical queues, simplify food ordering, help canteen staff manage orders, and provide a kitchen queue/order monitor.

This document is the primary instruction set for an AI coding agent working on the prototype.

The current phase is **prototype only**.

### Important prototype rule

**Do NOT create or require a real database yet.**

All application data must initially come from **static/mock data and client-side state**. However, the code must be structured so that a real backend and database can be connected later without rewriting the entire frontend.

The future database may be MongoDB, MariaDB, PostgreSQL, or another suitable database. Do not tightly couple the frontend to a specific database.

---

# 2. Source of Truth

The implementation should follow the HandaTala Software Requirements Specification (SRS), particularly these project goals:

- Customer-facing food ordering
- Daily menu browsing
- Food categories
- Search/filtering
- Food availability and stock indicators
- Digital cart
- Pre-order checkout
- Online payment gateway readiness
- Payment-at-order/counter option
- Receipt generation
- Order/tracking ID
- Order status tracking
- Admin login
- Admin inventory/food availability management
- Kitchen queue management
- Queue/order monitor
- Responsive mobile/tablet/desktop layouts
- Offline-friendly architecture
- Future database integration
- Future synchronization with a backend

The SRS identifies the main order statuses as:

1. `Preparing`
2. `Ready for Pickup`
3. `Completed`

The system is scoped to a **single-site/localized canteen**. Do not build multi-branch enterprise inventory or delivery rider logistics into this prototype.

---

# 3. Technology Stack

Use the following frontend technology stack.

## Required

- **ReactJS**
- **Tailwind CSS**
- JavaScript or TypeScript
- React Router for navigation
- Modern browser APIs where useful

## Recommended Supporting Libraries

The AI may use lightweight libraries when they clearly improve the prototype:

- `lucide-react` for icons
- `framer-motion` or `motion` for smooth animations
- `sonner` or another lightweight toast library
- `date-fns` for date/time formatting
- `recharts` for admin statistics if charts are needed

Avoid adding unnecessary dependencies.

The application should remain easy for students/developers to understand and maintain.

---

# 4. Core Design Goal

Build HandaTala as a **modern, polished, responsive canteen ecommerce/POS application**.

The website should feel like a real product prototype, not a basic school CRUD page.

The visual direction should include:

- Modern
- Clean
- Friendly
- Food-focused
- Fast
- Mobile-first
- Spacious layouts
- Rounded cards
- Clear visual hierarchy
- Smooth micro-interactions
- Strong CTA buttons
- High-quality food imagery/placeholders
- Clear availability indicators
- Minimal visual clutter

Do not make every element animated.

Animations should support usability rather than distract from ordering.

---

# 5. Three Main UIs

The application must have **three primary interfaces**.

## UI 1 – Customer Ordering Interface

This is the public/customer-facing application.

Customers should be able to:

- View the HandaTala landing page
- Browse today's menu
- Browse categories
- Search food
- Filter food
- View prices
- View stock/availability
- Add food to cart
- Change quantity
- Remove items
- Add optional order notes
- Review cart
- Checkout
- Select payment method
- Place order
- Receive an order/tracking number
- View order status
- View order summary/receipt

### Suggested customer routes

```text
/
/menu
/menu/:category
/cart
/checkout
/order/:trackingId
/orders
```

The customer should not need an account for the prototype unless account functionality is specifically required later.

---

# 6. Customer UI Structure

## Landing Page

Include:

- HandaTala branding
- Short tagline
- Hero section
- Today's featured food
- Popular items
- Food categories
- "Order Now" CTA
- Current canteen availability/status
- Simple explanation of how ordering works

Example tagline:

> **Order ahead. Skip the line. Enjoy your meal.**

Do not overfill the landing page with text.

## Menu

The menu should include:

- Search bar
- Category tabs/chips
- Food cards
- Food image
- Food name
- Short description
- Price
- Stock/availability
- Add button
- Sold-out state

Example categories:

```text
All
Meals
Rice Meals
Snacks
Drinks
Desserts
Today's Specials
```

These are prototype categories and may be changed easily through mock data.

---

# 7. Food Card Behavior

Each food card should support:

### Available

Show:

```text
Available
₱65.00

[ Add to Cart ]
```

### Low Stock

Show:

```text
Only 5 left
```

Use a noticeable but not alarming visual treatment.

### Sold Out

The card must:

- Remain visible
- Clearly say `Sold Out`
- Disable adding to cart
- Have reduced visual emphasis

Do not completely remove sold-out items because customers should still be able to see the menu.

---

# 8. Cart

The cart should support:

- Item list
- Food image
- Item name
- Price
- Quantity selector
- Remove button
- Item subtotal
- Optional notes
- Order subtotal
- Payment/service fee if applicable
- Total
- Checkout button

Use a responsive cart drawer or dedicated cart page.

On mobile, prioritize a bottom/floating cart CTA when appropriate.

Example:

```text
3 items
Total: ₱185.00

[ View Cart ]
```

---

# 9. Checkout

Checkout should be simple.

Include:

### Order Summary

```text
Chicken Rice Meal x 2
Iced Tea x 1

Subtotal: ₱150
Total: ₱150
```

### Payment Methods

At minimum support these prototype options:

```text
Pay Online
Pay at Counter
```

`Pay Online` represents the future PayMongo integration.

`Pay at Counter` represents payment when ordering/picking up at the canteen counter.

The payment UI must be designed so a real gateway can be connected later.

---

# 10. Payment Gateway Architecture

Do NOT implement a fake production payment gateway.

Create a payment abstraction/interface instead.

For example:

```text
services/
  paymentService.js
  providers/
    paymongoProvider.js
```

The frontend should be able to call something conceptually similar to:

```js
paymentService.createPayment(order)
```

or:

```js
paymentService.initializeCheckout(order)
```

The current prototype can return a mocked payment result.

Example:

```js
{
  success: true,
  paymentMethod: "online",
  paymentStatus: "pending",
  reference: "MOCK-PAY-10001"
}
```

When a real backend is added later, this service should call the backend rather than directly exposing secret payment credentials in React.

### Critical security rule

**Never put PayMongo secret keys in React frontend code.**

Future payment flow should be:

```text
React
  ↓
Backend API
  ↓
PayMongo
  ↓
Backend webhook/status update
  ↓
React
```

---

# 11. Order Creation

When the customer places an order, generate a prototype tracking ID.

Example:

```text
HT-2026-00124
```

The order should contain information similar to:

```js
{
  id: "order-00124",
  trackingId: "HT-2026-00124",
  items: [...],
  subtotal: 150,
  total: 150,
  paymentMethod: "online",
  paymentStatus: "pending",
  orderStatus: "Preparing",
  customerName: "Guest Customer",
  notes: "",
  createdAt: "...",
  updatedAt: "..."
}
```

Keep the structure database-friendly.

---

# 12. Order Status

Use these statuses from the SRS:

```text
Preparing
Ready for Pickup
Completed
```

Optional internal prototype states may include:

```text
Pending Payment
Cancelled
```

But do not replace the main SRS statuses.

The customer tracking page should visually display progress:

```text
Order Placed
    ↓
Preparing
    ↓
Ready for Pickup
    ↓
Completed
```

Example UI:

```text
Order #HT-2026-00124

✓ Order Received
✓ Preparing
○ Ready for Pickup
○ Completed
```

Use animation when a status changes.

---

# 13. UI 2 – Admin Dashboard

The admin UI is for authorized canteen staff.

Admin capabilities should include:

- Admin login
- Dashboard
- Food/menu management
- Stock management
- Availability management
- Order overview
- Basic POS/walk-in order entry
- Operational statistics

Suggested routes:

```text
/admin/login
/admin
/admin/menu
/admin/inventory
/admin/orders
/admin/pos
```

---

# 14. Admin Login

For the prototype, use a **mock login**.

Do not create real authentication yet.

Example prototype credentials can be stored in a clearly labeled mock configuration file or environment variables.

Example:

```text
Email: admin@handatala.test
Password: admin123
```

The credentials are only for demonstration.

The UI should still behave as if authentication exists.

After login:

```text
Admin Login
     ↓
Admin Dashboard
```

Protect admin routes using frontend route guards.

Example concept:

```jsx
<ProtectedRoute>
  <AdminDashboard />
</ProtectedRoute>
```

Clearly separate:

```text
Customer
Admin
Queue Monitor
```

---

# 15. Admin Dashboard

Show useful operational information.

Example cards:

```text
Today's Orders       42
Preparing             8
Ready for Pickup      5
Completed            29
Low Stock             4
Sold Out              3
```

These values are static/mock data initially.

Do not create meaningless charts just to fill space.

---

# 16. Admin Inventory Management

The admin must be able to manage food availability in the prototype.

For each food item show:

```text
Food Name
Category
Price
Stock
Availability
Status
Actions
```

Example:

```text
Chicken Rice Meal
Rice Meals
₱65
Stock: 12

[ Available ]
[ Edit ]
```

Admin actions:

- Increase stock
- Decrease stock
- Set stock quantity
- Mark available
- Mark sold out
- Edit food information
- Add food
- Hide/deactivate food
- Restore food

When stock reaches:

```text
0
```

the item should automatically become:

```text
Sold Out
```

unless the admin explicitly overrides availability.

---

# 17. Inventory Behavior

The prototype should maintain consistent state.

Example:

```text
Chicken Rice Meal
Stock = 10
```

Customer orders 2.

The prototype state becomes:

```text
Stock = 8
```

The customer menu should then show:

```text
8 available
```

The admin dashboard should also show:

```text
8
```

This should happen through shared application state.

Do not duplicate stock values separately across unrelated components.

---

# 18. UI 3 – Kitchen Queue / Order Monitor

This is a dedicated display for the kitchen or order monitor.

It should be optimized for:

- Desktop monitor
- Tablet
- Large display
- Touch interaction
- Quick scanning

Suggested route:

```text
/queue
```

The queue monitor should display active orders in a Kanban/card layout.

Example:

```text
PREPARING
────────────────

#124
Chicken Rice Meal x2
Iced Tea x1

[ Mark Ready ]

────────────────

#125
Burger Meal x1

[ Mark Ready ]
```

Then:

```text
READY FOR PICKUP
────────────────

#121
Pancit Canton x1

[ Mark Completed ]
```

Completed orders may be moved out of the active queue.

---

# 19. Kitchen Queue Behavior

When a customer places an order:

```text
Customer Checkout
      ↓
Order Created
      ↓
Queue Monitor
      ↓
Preparing
      ↓
Ready for Pickup
      ↓
Completed
```

The prototype should update the queue UI automatically using shared application state.

A future backend can replace this with:

```text
WebSocket
or
Server-Sent Events
or
Polling
```

Do not hard-code the queue to a single page component.

Create an order state/service abstraction.

---

# 20. Order Monitor Design

The queue monitor should prioritize readability.

Use:

- Large order numbers
- Large text
- Clear status colors
- Large buttons
- Food item quantities
- Order time
- Elapsed time where useful
- Optional customer name
- Order notes

Example:

```text
ORDER #124

2x Chicken Rice Meal
1x Iced Tea

Note:
Less spicy

Placed 10:42 AM

[ READY FOR PICKUP ]
```

The queue should be usable from a distance.

---

# 21. POS Functionality

Because HandaTala is also intended to function as a POS-style system, add a **POS section inside the Admin UI** rather than creating a fourth primary UI.

Route:

```text
/admin/pos
```

This can be used by staff to create walk-in/counter orders.

The POS should allow staff to:

- Select food items
- Add items to a cart
- Change quantity
- Review total
- Select payment method
- Submit the order
- Send the order to the kitchen queue

Example payment choices:

```text
Cash
Online
```

This gives HandaTala a useful bridge between:

```text
Pre-order customer
+
Walk-in customer
```

without creating another major application interface.

---

# 22. Data Architecture

Even though there is no database, structure the code as if a backend will eventually exist.

Use layers such as:

```text
src/
├── data/
│   ├── mockMenu.js
│   ├── mockOrders.js
│   ├── mockUsers.js
│   └── mockInventory.js
│
├── services/
│   ├── menuService.js
│   ├── orderService.js
│   ├── inventoryService.js
│   ├── paymentService.js
│   └── authService.js
│
├── store/
│   └── ...
│
├── components/
├── pages/
├── layouts/
├── hooks/
├── utils/
└── ...
```

The exact folder names may vary, but the separation of concerns must remain.

---

# 23. Mock Data Rule

All prototype data should be centralized.

Do NOT scatter objects such as:

```js
{
  name: "Chicken Rice Meal",
  price: 65
}
```

throughout UI components.

Instead use:

```js
mockMenuItems
```

or another centralized mock data source.

Components should consume the data through services/hooks.

---

# 24. Future Database Integration

The frontend should not directly assume MongoDB, MariaDB, or another database.

Use an API/service layer.

Prototype:

```text
React
  ↓
Service Layer
  ↓
Mock Data
```

Future production:

```text
React
  ↓
Service Layer
  ↓
REST API / WebSocket
  ↓
Node.js / Express Backend
  ↓
Database
```

This makes database replacement easier.

---

# 25. Recommended Future Backend Structure

Do not build this backend now, but design the frontend to support something similar later:

```text
Frontend
React + Tailwind
      |
      | REST / WebSocket
      ↓
Backend
Node.js + Express
      |
      ├── Authentication
      ├── Menu API
      ├── Inventory API
      ├── Order API
      ├── Payment API
      └── Queue API
      |
      ↓
Database
MongoDB / MariaDB / PostgreSQL
```

The SRS currently identifies MariaDB as the centralized relational database, while MongoDB is also a possible future choice. The prototype must therefore remain database-agnostic.

---

# 26. Suggested Data Models

Design mock objects using future database-friendly structures.

## User

```js
{
  id: "user-001",
  name: "Admin User",
  email: "admin@handatala.test",
  role: "admin"
}
```

Possible future roles:

```text
customer
admin
kitchen
```

## Menu Item

```js
{
  id: "food-001",
  name: "Chicken Rice Meal",
  description: "Grilled chicken served with steamed rice.",
  category: "Rice Meals",
  price: 65,
  image: "/images/chicken-rice.jpg",
  stock: 12,
  isAvailable: true,
  isFeatured: true,
  preparationTime: 10
}
```

## Order

```js
{
  id: "order-001",
  trackingId: "HT-2026-00124",
  customerId: null,
  customerName: "Guest Customer",
  items: [
    {
      menuItemId: "food-001",
      name: "Chicken Rice Meal",
      quantity: 2,
      unitPrice: 65,
      subtotal: 130
    }
  ],
  subtotal: 130,
  total: 130,
  paymentMethod: "online",
  paymentStatus: "pending",
  orderStatus: "Preparing",
  notes: "",
  createdAt: "...",
  updatedAt: "..."
}
```

Store item snapshots such as `name` and `unitPrice` inside the order. This is useful because menu information may change after an order is placed.

## Payment

```js
{
  id: "payment-001",
  orderId: "order-001",
  method: "online",
  provider: "paymongo",
  status: "pending",
  reference: "MOCK-PAY-001",
  amount: 130,
  createdAt: "..."
}
```

## Inventory

```js
{
  id: "inventory-001",
  menuItemId: "food-001",
  stock: 12,
  lowStockThreshold: 5,
  isAvailable: true,
  updatedAt: "..."
}
```

---

# 27. State Management

Use centralized state for shared prototype data.

At minimum, shared state should cover:

```text
Cart
Menu items
Inventory
Orders
Authentication
Queue
```

The implementation may use:

- React Context
- Zustand
- another lightweight state solution

Do not introduce Redux unless the project genuinely needs it.

---

# 28. Important State Relationships

The prototype must demonstrate the relationship between the three UIs.

Example:

```text
Customer
adds Chicken Rice Meal
        ↓
Cart
        ↓
Checkout
        ↓
Order Created
        ↓
Admin / Queue Monitor
        ↓
Preparing
        ↓
Ready for Pickup
        ↓
Completed
        ↓
Customer Tracking
```

Inventory:

```text
Initial Stock: 10
        ↓
Customer orders 2
        ↓
Stock: 8
        ↓
Customer menu: 8 available
        ↓
Admin inventory: 8
```

All of this can happen entirely with mock/client-side state during the prototype phase.

---

# 29. Offline-First Preparation

The SRS describes an offline-first architecture using:

- IndexedDB
- Dexie.js
- Service Workers
- Background synchronization

The current prototype does not need a complete production synchronization system.

However, structure the application so offline support can be added later.

Recommended future structure:

```text
services/
  syncService.js
  offlineOrderService.js
```

Avoid assumptions that every action always requires an immediate server response.

The application should gracefully handle a future state such as:

```text
Online
Offline
Syncing
Synced
Sync Failed
```

A small connection indicator can be included in the prototype if useful.

---

# 30. Responsive Design

The application must work well on:

### Mobile

Approximately:

```text
320px+
```

### Tablet

Approximately:

```text
768px+
```

### Desktop

Approximately:

```text
1024px+
```

Do not design desktop first and simply shrink it.

Use Tailwind's responsive utilities intentionally.

Example:

```text
Mobile:
1-column menu

Tablet:
2-column menu

Desktop:
3-4 column menu
```

The kitchen monitor can use a wider layout.

---

# 31. Animation Requirements

Use modern, smooth animations.

Recommended interactions:

### Page transitions

Subtle fade/slide.

### Food cards

Small hover/lift animation on desktop.

### Add to cart

Visual feedback when an item is added.

### Cart

Smooth drawer open/close.

### Order tracking

Animated progress state.

### Queue

Smooth movement when orders change status.

### Admin

Subtle card transitions.

Use animation durations that feel fast and natural.

Avoid excessive:

- bouncing
- spinning
- parallax
- large page movement
- distracting background animation

Animations must not make the application slower or harder to use.

---

# 32. Accessibility

The prototype should follow basic accessibility practices.

Include:

- Semantic HTML
- Keyboard navigation
- Visible focus states
- Sufficient text contrast
- Labels for form controls
- Accessible buttons
- `alt` text for food images
- Do not rely only on color to communicate status

Example:

Do not show only:

```text
red = sold out
```

Also show:

```text
Sold Out
```

---

# 33. Error and Empty States

The application must have realistic states.

Examples:

### Empty cart

```text
Your cart is empty.

Browse today's menu and add something you like.

[ Browse Menu ]
```

### Search has no result

```text
No meals found.
Try another search or category.
```

### Sold out

```text
Sold Out
```

### Failed order

```text
We couldn't place your order.

Please try again.
```

### Offline

```text
You're currently offline.
Some changes will sync when connection returns.
```

These states should be designed, not left as browser errors.

---

# 34. Loading States

Use skeleton loaders or subtle loading indicators for future API-ready components.

Do not show unnecessary loading screens for static mock data.

For example, service functions can simulate a short delay only when it helps demonstrate the intended future behavior.

Avoid fake delays everywhere.

---

# 35. Notifications

Use toast notifications for actions such as:

```text
Added to cart
Item removed
Order placed
Inventory updated
Order marked ready
Order completed
Login successful
```

Do not use browser `alert()` for normal interactions.

---

# 36. Navigation

Customer navigation should be simple.

Possible mobile navigation:

```text
Home
Menu
Orders
Cart
```

Admin navigation:

```text
Dashboard
Orders
Inventory
POS
Queue
```

Queue monitor should have a distraction-free display.

---

# 37. Visual Design Suggestions

Use a food-oriented color system.

Suggested design direction:

- Warm primary color
- Neutral background
- Dark text
- Green/success for available/ready
- Red/destructive for sold out
- Amber/warning for low stock

Do not overuse colors.

Use consistent design tokens for:

```text
Primary
Secondary
Background
Surface
Text
Muted
Success
Warning
Danger
Border
```

---

# 38. Component Architecture

Create reusable components instead of putting everything in page files.

Suggested components:

```text
components/
├── ui/
│   ├── Button
│   ├── Badge
│   ├── Card
│   ├── Input
│   ├── Modal
│   ├── Drawer
│   ├── Skeleton
│   └── EmptyState
│
├── menu/
│   ├── FoodCard
│   ├── CategoryTabs
│   ├── MenuGrid
│   └── SearchBar
│
├── cart/
│   ├── CartDrawer
│   ├── CartItem
│   └── CartSummary
│
├── order/
│   ├── OrderCard
│   ├── OrderStatus
│   ├── OrderTimeline
│   └── Receipt
│
├── admin/
│   ├── AdminSidebar
│   ├── InventoryTable
│   ├── InventoryCard
│   ├── OrderTable
│   └── DashboardStat
│
└── queue/
    ├── QueueBoard
    ├── QueueColumn
    └── QueueOrderCard
```

The exact structure can change if a better architecture is used.

---

# 39. Routing Architecture

Use clear route separation.

Example:

```text
/
├── Customer
│   ├── /
│   ├── /menu
│   ├── /cart
│   ├── /checkout
│   └── /order/:trackingId
│
├── Admin
│   ├── /admin/login
│   ├── /admin
│   ├── /admin/menu
│   ├── /admin/inventory
│   ├── /admin/orders
│   └── /admin/pos
│
└── Queue
    └── /queue
```

Use layouts where appropriate.

---

# 40. Mock Authentication

The prototype can use:

```js
localStorage
```

for mock admin authentication.

Example:

```text
adminAuthenticated = true
```

This is acceptable only for the prototype.

Add comments explaining that production authentication must be handled by the backend.

Never describe localStorage authentication as secure authentication.

---

# 41. Future Authentication

The architecture should eventually support:

```text
React
 ↓
Auth API
 ↓
Backend
 ↓
Session/JWT
```

Possible future features:

- Admin login
- Kitchen staff login
- Role-based permissions
- Session expiration
- Logout
- Password hashing
- Secure cookies/token handling

Do not implement password hashing in the frontend.

---

# 42. Security Rules

Even though this is a prototype:

- Do not store secrets in source code.
- Do not store payment gateway secret keys in React.
- Do not claim frontend route guards are real security.
- Do not trust client-side prices in a future production system.
- Do not trust client-side stock values in a future production system.
- Do not expose database credentials.
- Keep payment integration behind a backend when implemented.

---

# 43. API-Ready Design

Even without a backend, service methods should look like future API calls.

Example:

```js
menuService.getMenuItems()
orderService.createOrder(order)
orderService.getOrder(trackingId)
orderService.updateOrderStatus(orderId, status)
inventoryService.getInventory()
inventoryService.updateStock(itemId, quantity)
paymentService.initializePayment(order)
authService.login(credentials)
```

For now, these services can operate on mock data.

Later they can become:

```js
fetch("/api/menu")
fetch("/api/orders")
fetch("/api/inventory")
```

without requiring major component changes.

---

# 44. API Contract Preparation

When creating mock services, use predictable return structures.

Example:

```js
{
  success: true,
  data: [...],
  error: null
}
```

For errors:

```js
{
  success: false,
  data: null,
  error: {
    code: "ITEM_SOLD_OUT",
    message: "This item is currently sold out."
  }
}
```

This prepares the frontend for real API responses.

---

# 45. Future API Endpoints

Do not implement these yet unless explicitly requested.

Possible future endpoints:

```text
GET    /api/menu
GET    /api/menu/:id

POST   /api/orders
GET    /api/orders/:trackingId
PATCH  /api/orders/:id/status

GET    /api/inventory
PATCH  /api/inventory/:id

POST   /api/auth/login
POST   /api/auth/logout

POST   /api/payments/checkout
GET    /api/payments/:id

GET    /api/admin/dashboard
```

The exact API can change when the backend is designed.

---

# 46. Payment Status vs Order Status

Keep these separate.

### Order Status

```text
Preparing
Ready for Pickup
Completed
```

### Payment Status

```text
Pending
Paid
Failed
Refunded
```

Do not use one status field for both.

Example:

```js
{
  orderStatus: "Preparing",
  paymentStatus: "Paid"
}
```

---

# 47. Inventory vs Availability

Keep these concepts separate where possible.

Example:

```js
stock: 0
isAvailable: false
```

An item can also be manually unavailable even if stock exists:

```js
stock: 10
isAvailable: false
```

This can represent:

- Kitchen temporarily unavailable
- Item removed from today's menu
- Ingredient issue
- Admin manually disabled item

---

# 48. Order History

The customer should be able to see recently placed orders in the prototype.

Possible route:

```text
/orders
```

Show:

```text
Order #HT-2026-00124
₱150
Preparing
```

Clicking an order opens its tracking page.

For a guest prototype, history may be stored locally.

---

# 49. Receipt

After checkout, show a digital receipt containing:

```text
HandaTala

Order #HT-2026-00124

Chicken Rice Meal x2
Iced Tea x1

Subtotal: ₱150
Total: ₱150

Payment: Online
Status: Paid/Pending

Thank you!
```

Add a print/download action if practical.

The receipt should be visually clean and printable.

---

# 50. Order Notes

Customers should be able to add simple notes.

Examples:

```text
Less spicy
No onions
Extra sauce
```

The kitchen queue must display important notes.

Do not allow unlimited complex instructions in the prototype.

---

# 51. Search and Filtering

Menu search should support:

- Food name
- Category

Optional filters:

- Available only
- Price range
- Featured
- Popular

Keep filtering fast and simple.

---

# 52. Demo Data

Create enough mock data to make the application feel real.

Recommended:

```text
15–25 food items
5–7 categories
8–12 sample orders
Several low-stock items
Several sold-out items
Several completed orders
Several active orders
```

Include a realistic mix.

Avoid using the same food item for every example.

---

# 53. Suggested Prototype Menu

Example items:

```text
Chicken Rice Meal
Pork Adobo Rice
Beef Tapa Rice
Chicken BBQ Meal
Pancit Canton
Siomai Rice
Fish Fillet Meal
Burger Steak
French Fries
Cheese Burger
Tuna Sandwich
Lumpia
Banana Cue
Turon
Iced Tea
Calamansi Juice
Bottled Water
Milk Tea
Halo-Halo
Chocolate Cake
```

Prices and availability are mock data.

Clearly treat them as sample/demo values.

---

# 54. Admin Inventory Demo

Include different states:

```text
Chicken Rice Meal
Stock: 25
Available

Pork Adobo
Stock: 4
Low Stock

Beef Tapa
Stock: 0
Sold Out

Halo-Halo
Stock: 8
Available

Milk Tea
Stock: 0
Unavailable
```

This makes the admin UI easier to demonstrate.

---

# 55. Queue Demo Data

Include orders in different states.

Example:

```text
Preparing
#124
#125
#126

Ready for Pickup
#121
#122

Completed
#117
#118
#119
```

When the user interacts with the prototype, these should change dynamically.

---

# 56. Admin Actions Must Affect Other UIs

A key prototype requirement is demonstrating shared system behavior.

For example:

Admin changes:

```text
Beef Tapa
Available → Sold Out
```

Customer menu should immediately reflect:

```text
Sold Out
```

Admin changes:

```text
Stock 5 → 10
```

Customer menu should reflect the updated availability.

Queue changes:

```text
Preparing → Ready for Pickup
```

Customer tracking should reflect:

```text
Ready for Pickup
```

This is one of the most important parts of the prototype.

---

# 57. Do Not Build Fake Screens Only

Avoid creating three disconnected dashboards that only look good.

The prototype must demonstrate an actual application flow.

At minimum, this complete flow must work:

```text
Customer browses
      ↓
Adds food
      ↓
Cart
      ↓
Checkout
      ↓
Selects payment
      ↓
Places order
      ↓
Tracking ID generated
      ↓
Order appears in queue
      ↓
Admin/Kitchen marks Preparing
      ↓
Ready for Pickup
      ↓
Completed
      ↓
Customer sees updated status
```

Inventory must also update when an order is placed.

---

# 58. Suggested Homepage Experience

The homepage should quickly communicate:

```text
HANDATALA

Order ahead.
Skip the line.

[ Order Now ]

Today's Specials
[ Food Cards ]

Browse by Category
[ Categories ]

How It Works
1. Choose
2. Pay
3. Pick Up
```

Keep the page visually strong and concise.

---

# 59. Recommended Extra Features

The following features are recommended because they fit the SRS and improve the prototype.

## A. Estimated Preparation Time

Show:

```text
Estimated preparation: 10–15 min
```

This is useful for customers and the kitchen.

## B. Order Number Display

Use both:

```text
Tracking ID: HT-2026-00124
Queue Number: 124
```

The shorter queue number is easier to recognize on a kitchen monitor.

## C. Canteen Open/Closed Status

Show:

```text
● Open
Orders accepted until 4:30 PM
```

or:

```text
● Closed
Ordering opens at 7:00 AM
```

The admin should eventually be able to control this.

## D. Low Stock Warning

Admin should see:

```text
Low Stock
4 items need attention
```

This is useful for daily operations.

## E. Daily Menu Toggle

Allow admins to mark:

```text
Available Today
```

This is better than permanently deleting menu items.

## F. Order Priority

The kitchen queue can sort by:

```text
Oldest first
```

with an optional priority marker for urgent/manual cases.

Do not overcomplicate this in the first prototype.

## G. Kitchen Sound/Visual Notification

When a new order arrives, the queue monitor can show a subtle animation or optional sound indicator.

Do not force sound automatically because browsers may block autoplay.

## H. Customer Order History

Useful for repeat customers and demonstration.

## I. Printable Receipt

Useful for POS/counter operation.

## J. Dashboard Analytics

Simple metrics:

```text
Today's Sales
Orders Today
Average Order Value
Top Selling Items
Low Stock Items
```

Use mock values in the prototype.

Do not build complicated analytics yet.

---

# 60. Features to Avoid for the First Prototype

Do not overbuild the first version.

Avoid:

- Delivery rider tracking
- Multi-branch management
- Complex accounting
- Payroll
- Supplier management
- Advanced loyalty programs
- Complex coupon engines
- Full customer profiles
- Social login
- Real payment processing without backend
- Production authentication
- Real database
- Real-time WebSocket infrastructure
- Enterprise reporting

These can be added later.

---

# 61. Recommended Project Structure

A reasonable structure is:

```text
src/
├── assets/
├── components/
│   ├── ui/
│   ├── customer/
│   ├── admin/
│   ├── queue/
│   └── shared/
│
├── data/
│   ├── mockMenu.js
│   ├── mockOrders.js
│   ├── mockUsers.js
│   └── mockInventory.js
│
├── layouts/
│   ├── CustomerLayout.jsx
│   ├── AdminLayout.jsx
│   └── QueueLayout.jsx
│
├── pages/
│   ├── customer/
│   ├── admin/
│   └── queue/
│
├── services/
│   ├── menuService.js
│   ├── orderService.js
│   ├── inventoryService.js
│   ├── paymentService.js
│   └── authService.js
│
├── store/
│   ├── cartStore.js
│   ├── orderStore.js
│   └── appStore.js
│
├── hooks/
├── utils/
├── routes/
├── App.jsx
├── main.jsx
└── index.css
```

This is a guideline, not a rigid requirement.

---

# 62. Code Quality Rules

The AI must:

- Keep components reasonably small.
- Reuse components.
- Avoid duplicate logic.
- Avoid hardcoded data inside presentation components.
- Use meaningful names.
- Keep service logic separate from UI logic.
- Keep mock data centralized.
- Use constants for statuses.
- Avoid deeply nested components.
- Avoid unnecessary dependencies.
- Avoid giant files.
- Add comments only where they clarify architecture or future integration.

---

# 63. Status Constants

Avoid repeating raw strings throughout the application.

Prefer:

```js
export const ORDER_STATUS = {
  PREPARING: "Preparing",
  READY: "Ready for Pickup",
  COMPLETED: "Completed",
};
```

Similarly:

```js
export const PAYMENT_STATUS = {
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};
```

This makes future backend integration easier.

---

# 64. Environment Variables

The prototype may include:

```text
.env.example
```

Do not put real secrets inside it.

Possible future variables:

```env
VITE_API_URL=
VITE_PAYMENT_PUBLIC_KEY=
```

Do not put:

```env
PAYMONGO_SECRET_KEY=
DATABASE_PASSWORD=
MONGODB_URI=
```

in frontend runtime code.

These belong to the future backend.

---

# 65. Payment Gateway Readiness

The UI should make it easy to connect PayMongo later.

Prototype:

```text
Select Online Payment
        ↓
Mock payment service
        ↓
Payment pending/success
        ↓
Order created
```

Future:

```text
Select Online Payment
        ↓
Backend
        ↓
PayMongo Checkout
        ↓
Payment
        ↓
Webhook
        ↓
Backend updates payment
        ↓
Order confirmed
```

Do not fake a real PayMongo transaction.

---

# 66. Offline Readiness

The prototype can use local state/localStorage for demonstration.

Future architecture:

```text
IndexedDB
   ↓
Offline order
   ↓
Pending Sync
   ↓
Internet returns
   ↓
Sync Service
   ↓
Backend
```

The AI should avoid designing components that cannot work with asynchronous data.

---

# 67. Testing Expectations

At minimum test:

### Customer

- Browse menu
- Search
- Filter
- Add item
- Increase quantity
- Decrease quantity
- Remove item
- Checkout
- Select payment method
- Place order
- View tracking

### Admin

- Login
- Logout
- View dashboard
- Change stock
- Mark item sold out
- Mark item available
- Add/edit menu item
- View orders
- Create POS order

### Queue

- View orders
- Move order to Ready for Pickup
- Move order to Completed

### Integration between UIs

- Customer order appears in queue
- Customer order reduces stock
- Queue status updates customer tracking
- Admin stock changes customer menu

---

# 68. Final Acceptance Criteria for the Prototype

The prototype is considered complete when all of the following work:

- [ ] Customer can browse a realistic menu.
- [ ] Customer can search/filter food.
- [ ] Customer can see stock/availability.
- [ ] Customer can add food to cart.
- [ ] Customer can edit cart quantities.
- [ ] Customer can checkout.
- [ ] Customer can choose online payment or pay at counter.
- [ ] Payment integration is represented through a clean service abstraction.
- [ ] Customer receives a tracking/order number.
- [ ] Customer can track order status.
- [ ] Admin login works using mock credentials.
- [ ] Admin dashboard works.
- [ ] Admin can change stock.
- [ ] Admin can mark food sold out/available.
- [ ] Admin can add/edit menu items.
- [ ] Admin can view orders.
- [ ] Admin has a POS/walk-in ordering section.
- [ ] Queue monitor displays active orders.
- [ ] Queue monitor can update order status.
- [ ] Customer tracking reflects queue status changes.
- [ ] Inventory changes affect customer availability.
- [ ] Application is responsive on mobile.
- [ ] Application is responsive on tablet.
- [ ] Application works on desktop.
- [ ] Animations are smooth and purposeful.
- [ ] Empty/loading/error states exist.
- [ ] Mock data is centralized.
- [ ] Services are separated from UI components.
- [ ] No real database is required.
- [ ] No secret keys are exposed.
- [ ] Future backend/API integration can be added without rewriting the UI.

---

# 69. AI Implementation Rules

When modifying or generating code for HandaTala, follow these rules:

1. **Do not introduce a database unless explicitly requested.**
2. **Use static/mock data for the current prototype.**
3. **Keep all mock data centralized.**
4. **Use a service layer so the mock data can later be replaced with APIs.**
5. **Do not hard-code business logic into UI components when it can be shared.**
6. **Keep customer, admin, and queue interfaces visually distinct.**
7. **Make all three interfaces functional, not just visual mockups.**
8. **Make inventory, orders, cart, and queue state interact with each other.**
9. **Do not implement real payment processing without a backend.**
10. **Never expose payment secrets in frontend code.**
11. **Keep the application responsive.**
12. **Use smooth but restrained animations.**
13. **Use accessible controls and semantic HTML.**
14. **Do not over-engineer the prototype.**
15. **Prefer maintainable code over clever code.**
16. **If a requirement is unclear, preserve the existing SRS behavior rather than inventing a completely different feature.**
17. **If adding a feature, keep it compatible with the current HandaTala architecture.**
18. **Do not replace ReactJS or Tailwind CSS with another frontend framework.**
19. **Do not create unnecessary backend files in the frontend prototype.**
20. **Clearly mark future integrations with comments such as `TODO: BACKEND INTEGRATION` where appropriate.**

---

# 70. Development Priority

Build in this order:

## Phase 1 – Foundation

- React setup
- Tailwind setup
- Routing
- Global styling
- Mock data
- Shared state
- Base UI components

## Phase 2 – Customer

- Landing page
- Menu
- Categories
- Search
- Food cards
- Cart
- Checkout
- Payment selection
- Receipt
- Order tracking

## Phase 3 – Admin

- Admin login
- Dashboard
- Inventory
- Menu management
- Orders
- POS

## Phase 4 – Queue

- Queue monitor
- Preparing
- Ready for Pickup
- Completed
- Queue animations

## Phase 5 – Integration

Connect:

```text
Customer
↔ Cart
↔ Orders
↔ Inventory
↔ Queue
↔ Admin
```

## Phase 6 – Polish

- Responsive improvements
- Animations
- Loading states
- Empty states
- Error states
- Accessibility
- Visual consistency
- Demo data

## Phase 7 – Future Backend Preparation

Document where to connect:

```text
API
Database
Authentication
Payment Gateway
WebSocket/Realtime
IndexedDB Sync
```

Do not implement these unless explicitly requested.

---

# 71. Definition of Done

Before declaring the prototype finished, verify the complete demo flow:

```text
1. Open HandaTala
2. Browse menu
3. Add food
4. Open cart
5. Checkout
6. Select payment
7. Place order
8. Receive tracking number
9. Open queue monitor
10. See the new order
11. Move it to Ready for Pickup
12. Open customer tracking
13. Confirm status changed
14. Move order to Completed
15. Confirm customer sees Completed
16. Open Admin
17. Confirm inventory was reduced
18. Change another item to Sold Out
19. Confirm customer menu shows Sold Out
20. Open Admin POS
21. Create a walk-in order
22. Confirm it appears in the queue
```

If these steps work, the prototype demonstrates the core HandaTala concept.

---

# 72. Important Note About the Database

The SRS currently describes **MariaDB** as the centralized database, while MongoDB is being considered for the future.

Do not force the prototype to choose between them.

The correct approach for this phase is:

```text
React + Tailwind
       ↓
Service / State Layer
       ↓
Static Mock Data
```

Later:

```text
React + Tailwind
       ↓
Service / API Layer
       ↓
Node.js / Express
       ↓
Chosen Database
```

This keeps the prototype flexible.

---

# 73. Final Instruction

Build HandaTala as a **functional, modern frontend prototype**, not merely a collection of static screens.

The three major interfaces must work together:

```text
CUSTOMER
   ↓
ORDER
   ↓
KITCHEN QUEUE
   ↓
ORDER STATUS
   ↓
CUSTOMER

ADMIN
   ↓
INVENTORY
   ↓
CUSTOMER AVAILABILITY
```

The prototype must be visually polished, responsive, easy to demonstrate, and architecturally prepared for future:

- Database integration
- Backend API
- Authentication
- PayMongo payment integration
- Real-time queue updates
- IndexedDB/offline synchronization

**Current implementation constraint: no real database and no real payment processing.**
