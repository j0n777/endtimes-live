#!/bin/bash

# Configuration
PROJECT_DIR="/home/docker-sites/endtimesmonitor"
CONTAINER_NAME="endtimesmonitor"
WEB_ROOT="/usr/share/nginx/html"

# Navigate to project
cd "$PROJECT_DIR" || exit 1

# Generate Sitemap
echo "Starting Sitemap Generation..."
# Using local npx to ensure we use project dependencies
npx tsx scripts/generate-sitemap.ts

if [ $? -eq 0 ]; then
    echo "Sitemap generated locally."
    
    # Deploy to Container
    echo "Deploying to container: $CONTAINER_NAME..."
    docker cp public/sitemap.xml "$CONTAINER_NAME:$WEB_ROOT/sitemap.xml"
    
    if [ $? -eq 0 ]; then
        echo "✅ SUCCESS: Sitemap updated in container."
    else
        echo "❌ ERROR: Failed to copy sitemap to container."
        exit 1
    fi
else
    echo "❌ ERROR: Sitemap generation failed."
    exit 1
fi
