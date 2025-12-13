<!-- 8e007b8e-87b0-4376-a545-e32ad38b7288 cd76c09c-a8e3-471d-a2a0-6ede41ecc325 -->
# Zuperior Partners IB Portal - Frontend Implementation Plan

## Project Setup & Dependencies

### Install Required Packages

- `react-router-dom@latest` - Routing
- `react-icons` - Icons library
- `recharts` - Charts and graphs
- `framer-motion` - Smooth animations and transitions

### Folder Structure

```
client/
├── public/
│   └── ib_images/          # All portal images
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Layout.jsx
│   │   └── common/
│   │       ├── Card.jsx
│   │       ├── Button.jsx
│   │       ├── Badge.jsx
│   │       └── Table.jsx
│   ├── pages/
│   │   ├── auth/
│   │   │   └── Login.jsx
│   │   └── ib_users/
│   │       ├── Dashboard.jsx
│   │       ├── reports/
│   │       │   ├── Clients.jsx
│   │       │   ├── ClientAccounts.jsx
│   │       │   ├── RewardHistory.jsx
│   │       │   ├── ClientTransactions.jsx
│   │       │   ├── TransactionsPending.jsx
│   │       │   └── PerformanceStatistics.jsx
│   │       ├── Rebates.jsx
│   │       ├── payments/
│   │       │   ├── Withdrawal.jsx
│   │       │   ├── CryptoWallet.jsx
│   │       │   └── TransactionHistory.jsx
│   │       ├── promo/
│   │       │   ├── PromoMaterials.jsx
│   │       │   ├── RegistrationTools.jsx
│   │       │   ├── ZuperiorOverview.jsx
│   │       │   └── AdvertisingGuidelines.jsx
│   │       └── support/
│   │           ├── HelpCenter.jsx
│   │           ├── Contacts.jsx
│   │           └── Legal.jsx
│   ├── context/
│   │   └── AppContext.jsx
│   ├── App.jsx
│   └── main.jsx
```

## Brand Customization

- Primary color: `#6242a5`
- Brand name: "Zuperior Partners"
- Light theme with gradient accents using primary color
- Custom logo placement in header

## Core Components Implementation

### 1. Layout Components

#### Header (`components/layout/Header.jsx`)

- Brand logo "Zuperior Partners" (left)
- Bell notification icon (right)
- User profile icon with dropdown (right)
- Account settings & Sign out options
- Sticky on scroll
- Responsive: collapse to hamburger menu icon on mobile

#### Sidebar (`components/layout/Sidebar.jsx`)

- Collapsed by default
- Expand on hover (desktop) or click (mobile)
- Mobile: slide-in overlay from left with backdrop
- Smooth transitions using framer-motion
- Menu items with icons (React Icons):
  - Dashboard (home icon)
  - Reports (folder icon) - expandable submenu
    - Clients (with "New" badge)
    - Client accounts
    - Reward history
    - Client transactions
    - Transactions pending payment
    - Performance statistics
  - Rebates (discount icon)
  - Payments (wallet icon) - expandable submenu
    - Withdrawal
    - Crypto wallet
    - Transaction history
  - Promo (megaphone icon) - expandable submenu
    - Promo Materials
    - Registration tools
    - Zuperior overview
    - Advertising guidelines
  - Support (help icon) - expandable submenu
    - Help Center
    - Contacts
    - Legal
  - Language selector at bottom (globe icon)
  - Collapse toggle button at bottom

### 2. Common Components

#### Card Component (`components/common/Card.jsx`)

- Reusable container with shadow and rounded corners
- Optional header with icon
- Responsive padding

#### Button Component (`components/common/Button.jsx`)

- Primary (purple gradient), secondary, and outline variants
- Icon support
- Loading state
- Fully accessible

#### Badge Component (`components/common/Badge.jsx`)

- For "New", status indicators, partner levels
- Multiple color variants

#### Table Component (`components/common/Table.jsx`)

- Responsive table wrapper
- Mobile: horizontal scroll or card layout
- Sortable columns
- Filter support
- "No data" state

## Page Implementations

### Authentication

#### Login Page (`pages/auth/Login.jsx`)

- Simple centered form
- Email/password fields (not validated)
- "Continue" button navigates to "/" without checks
- Zuperior Partners branding
- Purple gradient background

### IB Users Pages

#### Dashboard (`pages/ib_users/Dashboard.jsx`)

Based on images 2-5:

- Balance card with total profit
- Partner link section (copy link, QR code buttons)
- Knowledge base link card
- Commission levels card:
  - 20% Standard
  - 17% Pro
  - Fixed per lot
  - Commission calculator link
- Qualification criteria (0/2) with countdown
  - Trading volume progress bar (0/15 mln USD)
  - Active clients progress bar (0/1)
- Loyalty Program section:
  - Toggle between billion/million USD
  - 3 Targets with progress:
    - Target 1: 500M USD Lifetime Trading Volume
    - Target 2: Trading volume > 20% of qualifying lifetime
    - Target 3: 10 active clients in 3 months
  - Rewards ladder (800 bln to 0.5 bln) with prize images
  - Learn More button
- Quick reports section:
  - Profit chart
  - Registrations count
  - Date range picker
- Clients section (table with filters)

#### Reports Pages

**Clients** (`pages/ib_users/reports/Clients.jsx` - Image 6):

- Summary cards: 0 Clients, 0.0000 Volume (lots), 0.0000 Volume (Min. USD), 0.0000 Rewards
- Filters with badge count
- Sort dropdown (Client ID default)
- Table columns: Client ID, Sign-up date, Status, Client progress, Rewards, Comment, Rebates
- Empty state: "No data" with icon

**Client Accounts** (`pages/ib_users/reports/ClientAccounts.jsx` - Image 7):

- Summary cards: 0 Level 1 Clients, 0 Clients' accounts, 0.0000 Volume (lots), 0.0000 Volume (Min. USD), 0.00 Profit (USD)
- Filters, Allocation check button
- Sort by: Last trading date
- Table columns: Client account, Profit, Volume (Min. USD, Lots), Client ID, Partner code, Comment, Sign-up date, Last trading date, Country
- Empty state

**Reward History** (`pages/ib_users/reports/RewardHistory.jsx` - Image 8):

- Summary cards: 0.00 Profit (USD), 0.0000 Volume (lots), 0.0000 Volume (Min. USD)
- Filters with badge
- Sort by: Payment date
- Table columns: Payment date, Order in MT, Partner code, Client country, Client ID, Client account, Client account type, Volume (Min. USD, Lots), Profit
- Empty state

**Client Transactions** (`pages/ib_users/reports/ClientTransactions.jsx` - Image 9):

- Summary cards: 0.00 Profit (USD), 0.0000 Volume (lots), 0.0000 Volume (Min. USD), 0 Transactions
- Filters
- Sort by: Date
- Table columns: Client account, Date, Instrument, Spread, Volume (Min. USD, Lots), Profit
- Empty state

**Transactions Pending Payment** (`pages/ib_users/reports/TransactionsPending.jsx` - Image 10):

- Info banner: "Reward for these transactions will be paid within 24 hours"
- Summary cards: 0.0000 Volume (lots), 0.0000 Volume (Min. USD), 0 Pending transactions count
- Filters button
- Sort by: Pending transactions count
- Table columns: Client account, Pending transactions count, Volume (Min. USD, Lots)
- Empty state

**Performance Statistics** (`pages/ib_users/reports/PerformanceStatistics.jsx` - Image 11):

- Toggle: "Switch to new performance report"
- Group by selector (Date selected) with +Add option
- Filters
- Settings icon
- Table columns: Date, Registrations, First-time deposits
- Data row example: "16 Oct 2025" with "0" values
- Pagination: Items per page dropdown, page navigation

#### Rebates Page (`pages/ib_users/Rebates.jsx` - Image 12):

- Hero section: "Attract clients"
- Description: "Bring your first referred client to get a reward from their trades and set a rebate for them"
- Empty state card

#### Payments Pages

**Withdrawal** (`pages/ib_users/payments/Withdrawal.jsx` - Image 13):

- Tabs: Withdrawal (active), Crypto wallet, Transaction history
- Info card: "There is no partner account yet"
- Message: "Please wait till you have registration by your link"

**Crypto Wallet** (`pages/ib_users/payments/CryptoWallet.jsx` - Image 14):

- Tabs: Withdrawal, Crypto wallet (active), Transaction history
- Total balance: 0.00 USD
- Sub-tabs: Accounts, External wallets
- Account name dropdown
- Crypto accounts list:
  - Bitcoin (BTC): 0.00000000 BTC (≈ 0.00 USD) - Withdrawal & Transfer buttons
  - Ether (ETH): 0.00000000 ETH (≈ 0.00 USD)
  - Tether (USDT ERC20): 0.00 USDT (≈ 0.00 USD)
  - Tether (USDT TRC20): 0.00 USDT (≈ 0.00 USD)
  - Tronix (TRX): 0.000000 TRX (≈ 0.00 USD)

**Transaction History** (`pages/ib_users/payments/TransactionHistory.jsx` - Image 15):

- Tabs: Withdrawal, Crypto wallet, Transaction history (active)
- Filters: Last 7 days, All transaction types, All statuses, All accounts
- Empty state: "No transaction matches your filters" with Reset filters button

#### Promo Pages

**Promo Materials** (`pages/ib_users/promo/PromoMaterials.jsx` - Image 16):

- Tabs: Categories, Banners (8,076 items), Videos (883 items), Landings (94 items), GIFs (30 items), Logos (4 items)
- Categories view (active):
  - Category cards with images and descriptions:

    1. "Choose from a variety of metals" - Banners (3), Videos (1)
    2. "Trade with enhanced stop-out protection" - Banners (4), Videos (4)
    3. "Experience next-level trading with Zuperior" - Banners (11), Videos (1)

- Grid layout, responsive

**Registration Tools** (`pages/ib_users/promo/RegistrationTools.jsx` - Image 17):

- Tabs: Links (active), Campaigns
- Description: "You can configure your codes, links and campaigns binding here"
- Partner code section:
  - Description with link to registration page
  - Domain selector: one.Zuperioroneli.com
  - Note: "Can be used only for client registering on Zuperior website"
  - Partner code display: "i4qglwamoc" with Copy button
- Web link section:
  - Target page selector: Main page
  - Language selector: English
  - Note: "This link can be used in all countries"
  - Main web link display with Copy button
- Mobile link section:
  - Mobile OS selector: All
  - Note: "This link can be used in all countries except: China"
  - Mobile link display with Copy button

**Zuperior Overview** & **Advertising Guidelines**: Simple content pages with text and links

#### Support Pages

**Support** (`pages/ib_users/support/HelpCenter.jsx` - Image 18):

- Language availability table with columns:
  - Language
  - Accessibility (color-coded: Available now / Not available now)
  - Your Local time
- Languages listed: English, Chinese, Thai, Vietnamese, Arabic, Bengali, French, Urdu, Hindi, Bahasa Indonesia, Japanese, Korean, Portuguese, Russian, Spanish
- Contact options:
  - Phone: +357 25 030 959
  - Send email button

**Legal** (`pages/ib_users/support/Legal.jsx` - Image 19):

- Links section:
  - Partnership Agreement
  - General Business Terms
  - Security Instructions
  - Knowledge Base
  - Privacy Policy
  - Risk Disclosure and Warning Notice
  - Preventing Money Laundering
- Company information:
  - Vanvest Limited registration details
  - Zuperior brand authorization
  - Risk warning about CFDs
  - PCI DSS compliance statement
  - Email: support@Zuperior.vu
  - Copyright: © 2008 - 2025 Zuperior

## Responsive Design Strategy

### Breakpoints (Tailwind defaults)

- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px

### Mobile (< 768px)

- Hamburger menu in header
- Sidebar as overlay with backdrop
- Stack cards vertically
- Tables convert to card view or horizontal scroll
- Hide secondary information
- Bottom padding for mobile safe areas

### Tablet (768px - 1024px)

- Collapsible sidebar (persistent but narrow)
- 2-column grid for cards
- Tables with horizontal scroll if needed
- Compact spacing

### Desktop (> 1024px)

- Full sidebar with hover expansion
- Multi-column layouts
- Full tables with all columns
- Optimal spacing and padding

## Styling & Animations

### Colors

- Primary: `#6242a5`
- Primary gradient: `linear-gradient(135deg, #6242a5 0%, #8b6ec8 100%)`
- Background: `#f8f9fa` (light gray)
- Card background: `#ffffff`
- Text primary: `#1a1a1a`
- Text secondary: `#6c757d`
- Border: `#e0e0e0`
- Success: `#28a745`
- Warning: `#ffc107`
- Danger: `#dc3545`
- Info: `#17a2b8`

### Animations (framer-motion)

- Sidebar slide-in/out: 300ms ease
- Dropdown menus: 200ms ease
- Page transitions: fade + slide (150ms)
- Hover effects: scale(1.02), 200ms
- Loading states: spin or pulse
- Smooth scroll behavior: `scroll-behavior: smooth`

### Transitions

- All interactive elements: smooth transitions
- Button hover: background color, transform
- Card hover: slight elevation
- Link hover: color change

## Context API Setup

### AppContext (`context/AppContext.jsx`)

- Sidebar state (open/closed, active menu)
- User data (mock for now)
- Theme preferences
- Language selection
- Loading states
- Notification management

## Routing Setup (`App.jsx`)

```javascript
Routes:
/ → Login (if not authenticated)
/ → Dashboard (if authenticated)
/reports/clients
/reports/client-accounts
/reports/reward-history
/reports/client-transactions
/reports/transactions-pending
/reports/performance-statistics
/rebates
/payments/withdrawal
/payments/crypto-wallet
/payments/transaction-history
/promo/materials
/promo/registration-tools
/promo/Zuperior-overview
/promo/advertising-guidelines
/support
/support/contacts
/support/legal
```

## Implementation Order

1. Install dependencies and setup routing
2. Create AppContext with state management
3. Build layout components (Header, Sidebar, Layout)
4. Create common/reusable components (Card, Button, Badge, Table)
5. Build Login page with dummy authentication
6. Implement Dashboard page with all sections
7. Build all Reports pages
8. Implement Rebates page
9. Build all Payments pages
10. Create all Promo pages
11. Implement Support pages
12. Add animations and transitions
13. Test responsiveness across all breakpoints
14. Polish and optimize

## Key Features

- **Smooth scrolling**: CSS `scroll-behavior: smooth`
- **Transitions**: Framer Motion for page transitions, sidebar animations
- **Lazy loading**: React.lazy for code splitting
- **Accessibility**: ARIA labels, keyboard navigation, focus management
- **Performance**: Memoization, virtual scrolling for large tables (if needed)
- **Mobile-first**: Build mobile first, then scale up
- **Touch-friendly**: Larger tap targets on mobile (min 44x44px)

## Assets Management

- Logo: `/public/ib_images/logo.png`
- Icons: React Icons (imported as needed)
- Promotional images: `/public/ib_images/promo/`
- Reward images: `/public/ib_images/rewards/`
- Use placeholder images initially if assets not available

### To-dos

- [ ] Install react-router-dom, react-icons, recharts, and framer-motion packages
- [ ] Create AppContext for state management (sidebar, user, theme, language)
- [ ] Build Header component with logo, notifications, and user menu
- [ ] Build Sidebar component with all menus, submenus, collapsible behavior, and mobile overlay
- [ ] Create Layout wrapper component that combines Header and Sidebar
- [ ] Build reusable components: Card, Button, Badge, Table
- [ ] Setup React Router in App.jsx with all routes defined
- [ ] Create Login page with dummy authentication
- [ ] Build Dashboard page with balance, partner link, commissions, qualification, loyalty program, and quick reports
- [ ] Create Clients report page with table and filters
- [ ] Create Client Accounts report page
- [ ] Create Reward History report page
- [ ] Create Client Transactions report page
- [ ] Create Transactions Pending Payment page
- [ ] Create Performance Statistics page with table and grouping
- [ ] Build Rebates page with empty state
- [ ] Create Withdrawal page with empty state
- [ ] Create Crypto Wallet page with account listings
- [ ] Create Transaction History page with filters
- [ ] Build Promo Materials page with tabs and category cards
- [ ] Create Registration Tools page with partner codes and links
- [ ] Create Zuperior Overview page (content page)
- [ ] Create Advertising Guidelines page (content page)
- [ ] Build Support/Help Center page with language availability table
- [ ] Create Contacts support page
- [ ] Create Legal page with links and company information
- [ ] Add framer-motion animations for sidebar, page transitions, and smooth scrolling
- [ ] Test and refine responsive design across all breakpoints (mobile to 2xl)
- [ ] Final polish: accessibility, performance optimization, and code cleanup