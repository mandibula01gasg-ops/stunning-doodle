# Design Guidelines: Açaí E-commerce Site

## Design Approach

**Reference-Based Approach**: Drawing from successful e-commerce platforms (Shopify, iFood, Rappi) and food delivery services, adapted for Brazilian market expectations and açaí product showcase.

**Key Design Principles**:
- Visual appetite appeal through high-quality product imagery
- Streamlined purchase flow optimized for mobile-first Brazilian users
- Trust-building elements for payment confidence (especially PIX)
- Playful yet professional tone matching the açaí lifestyle brand

## Typography System

**Primary Font**: Poppins (via Google Fonts CDN)
- Headings: 600-700 weight
- Body: 400-500 weight
- CTA Buttons: 600 weight

**Type Scale**:
- Hero/Display: text-5xl to text-6xl (mobile to desktop)
- Section Headers: text-3xl to text-4xl
- Product Names: text-xl to text-2xl
- Body Text: text-base to text-lg
- Labels/Meta: text-sm
- Fine Print: text-xs

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, and 24
- Component padding: p-4 to p-8
- Section spacing: py-12 to py-24
- Grid gaps: gap-4 to gap-8
- Button padding: px-6 py-3 to px-8 py-4

**Container Strategy**:
- Full-width hero and promotional sections
- Content: max-w-7xl mx-auto px-4
- Product grids: max-w-6xl
- Checkout flow: max-w-2xl for focused experience

## Core Layout Structure

### Header/Navigation
- Sticky header with logo, cart icon (with item count badge), and navigation
- Cart preview dropdown on hover/click
- Mobile: Hamburger menu with slide-out drawer
- Height: h-16 to h-20

### Hero Section
**Image Required**: YES - Large hero image featuring açaí bowl
- Full-width hero: min-h-[500px] to min-h-[600px]
- Overlay with gradient for text readability
- CTA buttons with backdrop-blur-sm effect
- Headline + subheadline + dual CTAs ("Ver Cardápio" and "Fazer Pedido")
- Trust indicators: "Entrega Rápida" | "Pagamento Seguro" | "Açaí Natural"

### Product Catalog
**Layout**: Grid-based product display
- Desktop: grid-cols-3 lg:grid-cols-4
- Tablet: grid-cols-2
- Mobile: grid-cols-1
- Each card: aspect-square product image, name, description (2 lines max), price, "Adicionar" button

**Product Card Structure**:
- Rounded corners: rounded-xl to rounded-2xl
- Product image: aspect-square with object-cover
- Hover effect: subtle scale transform (scale-105)
- Price: Bold, prominent display
- Quick add button always visible (not just on hover)

### Shopping Cart
**Sidebar Cart** (recommended over modal):
- Slide-in from right: fixed right-0 with w-full sm:w-96
- List of items with image thumbnail, name, quantity controls, price
- Subtotal calculation
- "Finalizar Pedido" prominent CTA
- Empty state with encouraging message and browse CTA

### Checkout Flow
**Multi-step or Single Page**: Single-page checkout with clear sections
1. **Dados de Entrega**: Name, phone, full address with CEP lookup
2. **Resumo do Pedido**: Cart review with edit capability
3. **Forma de Pagamento**: Card selector (PIX or Cartão)
4. **Finalizar**: Large confirmation button

**Payment Method Cards**:
- Two prominent cards side-by-side (mobile: stacked)
- Each card shows icon, method name, brief description
- Selected state with border highlight and checkmark
- PIX card: Shows QR code and "Copiar código PIX" after selection
- Credit card: Reveals Stripe payment form inline

### Order Confirmation Page
- Success icon/animation (checkmark or celebration)
- Order number prominently displayed
- Payment status and instructions (especially for PIX with countdown timer)
- Order summary
- Delivery estimate
- CTA to WhatsApp/contact support

## Component Library

### Buttons
**Primary CTA**:
- Rounded: rounded-full or rounded-lg
- Padding: px-8 py-4
- Font: text-base to text-lg, font-semibold
- Shadow: shadow-lg
- Hover: transform scale-105, shadow-xl

**Secondary**:
- Border variant with transparent background
- Same size as primary

**Icon Buttons**:
- Cart, menu, favorites: p-2 to p-3
- Icons: w-6 h-6

### Cards
**Product Cards**:
- Border: border with subtle shadow
- Padding: p-4 to p-6
- Rounded: rounded-xl

**Info Cards** (payment methods, delivery options):
- Selectable state with border-2
- Icon at top
- Title + description
- Padding: p-6

### Forms
**Input Fields**:
- Height: h-12 to h-14
- Padding: px-4
- Rounded: rounded-lg
- Border: border-2 for focus state
- Label: text-sm font-medium, mb-2

**Quantity Selectors**:
- Button group: minus, number display, plus
- Rounded group: rounded-full
- Size: h-10 with matching width buttons

### Icons
**Library**: Heroicons (via CDN)
- Shopping cart, plus/minus, check, X, user, location, credit card, QR code
- Size: w-5 h-5 for inline, w-6 h-6 for standalone

### Trust Elements
**Badges**: 
- Small pills with icons showing "Pagamento Seguro", "Entrega Garantida", "100% Natural"
- Placement: Below hero, in footer, near checkout

**Social Proof**:
- Customer count: "Mais de X pedidos realizados"
- Star ratings on products (if applicable)

## Animations

**Use Sparingly**:
- Cart item addition: Brief scale animation
- Checkout step transitions: Subtle fade
- Success state: Checkmark draw animation
- NO scroll-triggered animations
- NO complex parallax effects

## Images

### Required Images:
1. **Hero Image**: High-quality açaí bowl with toppings, vibrant and appetizing (full-width, 1920x1080)
2. **Product Images**: Individual açaí bowls/combos, consistent styling, square format (600x600 minimum)
3. **Trust Icons**: Payment method logos (PIX, Visa, Mastercard, etc.)
4. **Category Images**: If using category navigation (optional)

**Image Treatment**:
- Consistent lighting and background for products
- Hero: Gradient overlay for text contrast
- All images: rounded corners matching card style
- Lazy loading for performance

## Mobile Optimization

**Critical Mobile Patterns**:
- Sticky "Ver Carrinho" bottom bar on product pages
- Simplified navigation with bottom tab bar option
- Larger touch targets: min-h-12 for buttons
- Collapsible sections in checkout
- One-tap phone number and address inputs
- PIX QR code optimized for mobile scanning

## Brazilian Market Specifics

**PIX Integration UX**:
- Clear "Pagar com PIX" option with instant payment messaging
- QR Code display with zoom capability
- "Copiar código" button with success feedback
- 15-minute payment timer with countdown
- Clear instructions: "Abra seu app do banco → PIX → Ler QR Code"

**Delivery Form**:
- CEP lookup with auto-fill
- Clear delivery zone messaging
- Minimum order value display if applicable
- Delivery time estimates

**Trust Messaging**:
- "Pagamento 100% seguro"
- WhatsApp contact prominently displayed
- Instagram social proof link

This design creates a modern, appetizing, and conversion-optimized açaí e-commerce experience tailored for Brazilian customers with seamless PIX and credit card payment flows.