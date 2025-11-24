#!/bin/bash

# Script to generate PDF from ShopSphere Project File
# This script provides multiple methods to convert the markdown to PDF

echo "ShopSphere Project File PDF Generator"
echo "======================================"
echo ""

# Check if pandoc is installed
if ! command -v pandoc &> /dev/null; then
    echo "Error: pandoc is not installed."
    echo "Install it with: brew install pandoc"
    exit 1
fi

# Method 1: Try with pdflatex (requires LaTeX)
if command -v pdflatex &> /dev/null; then
    echo "Method 1: Converting using pdflatex..."
    pandoc ShopSphere_Project_File_Enhanced.md -o ShopSphere_Project_File.pdf \
        --pdf-engine=pdflatex \
        -V geometry:margin=1in \
        -V fontsize=11pt \
        --toc \
        --number-sections
    if [ $? -eq 0 ]; then
        echo "✓ PDF generated successfully using pdflatex!"
        exit 0
    fi
fi

# Method 2: Try with xelatex
if command -v xelatex &> /dev/null; then
    echo "Method 2: Converting using xelatex..."
    pandoc ShopSphere_Project_File_Enhanced.md -o ShopSphere_Project_File.pdf \
        --pdf-engine=xelatex \
        -V geometry:margin=1in \
        -V fontsize=11pt \
        --toc \
        --number-sections
    if [ $? -eq 0 ]; then
        echo "✓ PDF generated successfully using xelatex!"
        exit 0
    fi
fi

# Method 3: Generate HTML first (always works)
echo "Method 3: Generating HTML version..."
pandoc ShopSphere_Project_File_Enhanced.md -o ShopSphere_Project_File.html \
    --standalone \
    --toc \
    --number-sections \
    --css=https://cdn.jsdelivr.net/npm/water.css@2/out/water.css

if [ $? -eq 0 ]; then
    echo "✓ HTML generated successfully!"
    echo ""
    echo "To convert HTML to PDF, you can:"
    echo "1. Open ShopSphere_Project_File.html in a browser"
    echo "2. Print to PDF (Cmd+P → Save as PDF)"
    echo ""
    echo "Or install a tool like:"
    echo "  - wkhtmltopdf: brew install wkhtmltopdf"
    echo "  - weasyprint: pip install weasyprint"
    echo ""
    echo "Then run:"
    echo "  wkhtmltopdf ShopSphere_Project_File.html ShopSphere_Project_File.pdf"
    echo "  OR"
    echo "  weasyprint ShopSphere_Project_File.html ShopSphere_Project_File.pdf"
fi

echo ""
echo "Note: To add screenshots, place them in the screenshots/ directory:"
echo "  - screenshots/homepage.png"
echo "  - screenshots/products.png"
echo "  - screenshots/product-detail.png"
echo "  - screenshots/cart.png"
echo "  - screenshots/checkout.png"
echo "  - screenshots/orders.png"
echo "  - screenshots/profile.png"

