# Screenshot Guide for ShopSphere Project File

This guide will help you add screenshots to complete your project documentation.

## Required Screenshots

You need to capture the following screenshots from your running ShopSphere application:

### 1. Homepage (`screenshots/homepage.png`)
- **What to capture**: The main homepage showing:
  - Header with logo and navigation
  - Hero section/banner
  - Product categories
  - Featured products carousel
  - Search bar

**How to capture:**
1. Start your ShopSphere application
2. Navigate to the homepage (http://localhost:3000)
3. Take a full-page screenshot
4. Save as `screenshots/homepage.png`

### 2. Product Listing Page (`screenshots/products.png`)
- **What to capture**: The products page showing:
  - Product grid layout
  - Filters sidebar (if visible)
  - Sort options
  - Multiple product cards with images

**How to capture:**
1. Navigate to Products page
2. Ensure multiple products are visible
3. Take a full-page screenshot
4. Save as `screenshots/products.png`

### 3. Product Detail Page (`screenshots/product-detail.png`)
- **What to capture**: A product detail page showing:
  - Product images gallery
  - Product name, price, description
  - Add to cart button
  - Reviews section
  - Recommendations section

**How to capture:**
1. Click on any product
2. Scroll to show all sections
3. Take a full-page screenshot
4. Save as `screenshots/product-detail.png`

### 4. Shopping Cart (`screenshots/cart.png`)
- **What to capture**: The shopping cart page showing:
  - Cart items with images
  - Quantity controls
  - Price summary
  - Checkout button
  - Cart recommendations (if visible)

**How to capture:**
1. Add some products to cart
2. Navigate to Cart page
3. Take a full-page screenshot
4. Save as `screenshots/cart.png`

### 5. Checkout Page (`screenshots/checkout.png`)
- **What to capture**: The checkout page showing:
  - Shipping address form
  - Payment method selection
  - Order summary
  - Place order button

**How to capture:**
1. Go to checkout from cart
2. Fill in address form (you can blur sensitive info)
3. Take a full-page screenshot
4. Save as `screenshots/checkout.png`

### 6. Order History (`screenshots/orders.png`)
- **What to capture**: The orders page showing:
  - List of past orders
  - Order status indicators
  - Order details
  - Status timeline (if visible)

**How to capture:**
1. Navigate to Orders page
2. Ensure at least one order is visible
3. Take a full-page screenshot
4. Save as `screenshots/orders.png`

### 7. User Profile (`screenshots/profile.png`)
- **What to capture**: The user profile page showing:
  - User information
  - Account settings
  - Profile picture (if applicable)
  - Edit options

**How to capture:**
1. Navigate to Profile page
2. Take a full-page screenshot
3. Save as `screenshots/profile.png`

## How to Take Screenshots

### On macOS:
1. **Full Page Screenshot**: 
   - Press `Cmd + Shift + 4`
   - Press `Spacebar` to capture a window
   - Click on the browser window
   - Or use `Cmd + Shift + 3` for full screen

2. **Using Browser Extensions**:
   - Install "Full Page Screen Capture" extension for Chrome/Firefox
   - Click the extension icon
   - Save the screenshot

3. **Using Developer Tools**:
   - Open DevTools (F12 or Cmd+Option+I)
   - Press `Cmd + Shift + P` (Mac) or `Ctrl + Shift + P` (Windows)
   - Type "Capture full size screenshot"
   - Save the image

### On Windows:
1. Use `Win + Shift + S` for Snipping Tool
2. Select "Full screen" or "Window" mode
3. Save the screenshot

### Using Browser:
1. **Chrome/Edge**: 
   - Install "GoFullPage" extension
   - Click extension icon
   - Download screenshot

2. **Firefox**:
   - Install "FireShot" extension
   - Click "Capture entire page"
   - Save image

## Screenshot Best Practices

1. **Resolution**: Use high resolution (at least 1920x1080)
2. **Format**: Save as PNG for best quality
3. **Naming**: Use exact filenames as specified
4. **Content**: Ensure UI is fully loaded before capturing
5. **Privacy**: Blur any sensitive information if needed
6. **Consistency**: Use same browser and zoom level for all screenshots

## After Adding Screenshots

Once you've added all screenshots to the `screenshots/` directory:

1. Run the PDF generation script:
   ```bash
   ./generate_pdf.sh
   ```

2. Or manually convert:
   ```bash
   pandoc ShopSphere_Project_File_Enhanced.md -o ShopSphere_Project_File.pdf --pdf-engine=pdflatex
   ```

3. The PDF will include all screenshots automatically!

## Troubleshooting

**Screenshots not showing in PDF?**
- Ensure screenshots are in PNG format
- Check file paths are correct
- Verify image files are not corrupted

**PDF generation fails?**
- Install LaTeX: `brew install --cask basictex`
- Or use HTML version and print to PDF from browser
- Or use the HTML file directly

**Need help?**
- Check the `generate_pdf.sh` script for alternative methods
- Open `ShopSphere_Project_File.html` in browser and print to PDF



