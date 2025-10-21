#!/bin/bash

# OSM Download and Convert Script
# This script downloads OpenStreetMap data and converts it to GeoJSON

set -e  # Exit on error

echo "=================================================="
echo "🗺️  OSM Data Download & Conversion Script"
echo "=================================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if osmium is installed
if ! command -v osmium &> /dev/null; then
    echo -e "${RED}❌ Error: osmium-tool is not installed${NC}"
    echo ""
    echo "Install it with:"
    echo "  macOS:   brew install osmium-tool"
    echo "  Ubuntu:  sudo apt-get install osmium-tool"
    echo "  Arch:    sudo pacman -S osmium-tool"
    exit 1
fi

echo -e "${GREEN}✅ osmium-tool found${NC}"
echo ""

# Show menu
echo "Select what to download:"
echo ""
echo "  1) 🇺🇸  Entire United States (~9 GB, takes hours)"
echo "  2) 🌴  California (~1.2 GB, ~30 min)"
echo "  3) 🗽  New York (~500 MB, ~15 min)"
echo "  4) 🌴  Florida (~600 MB, ~20 min)"
echo "  5) 🤠  Texas (~1.5 GB, ~45 min)"
echo "  6) 🏔️   Massachusetts (~150 MB, ~5 min) [RECOMMENDED FOR TESTING]"
echo "  7) 🔧  Custom URL (enter your own)"
echo ""
read -p "Enter your choice (1-7): " choice

case $choice in
    1)
        REGION_NAME="united-states"
        DOWNLOAD_URL="https://download.geofabrik.de/north-america/us-latest.osm.pbf"
        ;;
    2)
        REGION_NAME="california"
        DOWNLOAD_URL="https://download.geofabrik.de/north-america/us/california-latest.osm.pbf"
        ;;
    3)
        REGION_NAME="new-york"
        DOWNLOAD_URL="https://download.geofabrik.de/north-america/us/new-york-latest.osm.pbf"
        ;;
    4)
        REGION_NAME="florida"
        DOWNLOAD_URL="https://download.geofabrik.de/north-america/us/florida-latest.osm.pbf"
        ;;
    5)
        REGION_NAME="texas"
        DOWNLOAD_URL="https://download.geofabrik.de/north-america/us/texas-latest.osm.pbf"
        ;;
    6)
        REGION_NAME="massachusetts"
        DOWNLOAD_URL="https://download.geofabrik.de/north-america/us/massachusetts-latest.osm.pbf"
        ;;
    7)
        read -p "Enter the download URL: " DOWNLOAD_URL
        read -p "Enter a name for this region: " REGION_NAME
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

PBF_FILE="${REGION_NAME}-latest.osm.pbf"
GEOJSON_FILE="${REGION_NAME}-places.geojson"

echo ""
echo -e "${BLUE}📋 Configuration:${NC}"
echo "  Region: $REGION_NAME"
echo "  Download URL: $DOWNLOAD_URL"
echo "  PBF File: $PBF_FILE"
echo "  GeoJSON File: $GEOJSON_FILE"
echo ""

# Check disk space
AVAILABLE_SPACE_GB=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
echo -e "${BLUE}💾 Available disk space: ${AVAILABLE_SPACE_GB} GB${NC}"

if [ "$AVAILABLE_SPACE_GB" -lt 10 ]; then
    echo -e "${YELLOW}⚠️  Warning: Low disk space. You may need 20+ GB for large regions.${NC}"
    read -p "Continue anyway? (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
fi

echo ""
read -p "Start download and conversion? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "=================================================="
echo "⬇️  Phase 1: Downloading OSM Data"
echo "=================================================="
echo ""

if [ -f "$PBF_FILE" ]; then
    echo -e "${YELLOW}⚠️  File already exists: $PBF_FILE${NC}"
    read -p "Re-download? (y/N): " redownload
    if [[ $redownload =~ ^[Yy]$ ]]; then
        rm "$PBF_FILE"
        echo "Downloading..."
        wget -c "$DOWNLOAD_URL" -O "$PBF_FILE"
    else
        echo "Using existing file."
    fi
else
    echo "Downloading from: $DOWNLOAD_URL"
    echo "This may take a while..."
    wget -c "$DOWNLOAD_URL" -O "$PBF_FILE"
fi

echo ""
echo -e "${GREEN}✅ Download complete!${NC}"
PBF_SIZE_MB=$(du -m "$PBF_FILE" | cut -f1)
echo "   File size: ${PBF_SIZE_MB} MB"

echo ""
echo "=================================================="
echo "🔄 Phase 2: Converting to GeoJSON"
echo "=================================================="
echo ""
echo -e "${YELLOW}⚠️  This is CPU-intensive and may take a long time!${NC}"
echo "   Small regions: 5-15 minutes"
echo "   States: 30 minutes - 2 hours"
echo "   Entire US: 3-6 hours"
echo ""

CONVERT_START=$(date +%s)

echo "Converting..."
osmium export "$PBF_FILE" -o "$GEOJSON_FILE" --index-type=sparse_file_array

CONVERT_END=$(date +%s)
CONVERT_DURATION=$((CONVERT_END - CONVERT_START))
CONVERT_MINUTES=$((CONVERT_DURATION / 60))

echo ""
echo -e "${GREEN}✅ Conversion complete!${NC}"
echo "   Time taken: ${CONVERT_MINUTES} minutes"
GEOJSON_SIZE_MB=$(du -m "$GEOJSON_FILE" | cut -f1)
echo "   File size: ${GEOJSON_SIZE_MB} MB"

echo ""
echo "=================================================="
echo "🎉 All Done!"
echo "=================================================="
echo ""
echo -e "${GREEN}✅ Your GeoJSON file is ready: ${GEOJSON_FILE}${NC}"
echo ""
echo "Next steps:"
echo "  1. Import to MongoDB:"
echo "     deno run --allow-all scripts/import_osm_places.ts $GEOJSON_FILE"
echo ""
echo "  2. Or test with a sample first to estimate time"
echo ""
echo "Tip: You can delete the PBF file to save space:"
echo "     rm $PBF_FILE"
echo ""

