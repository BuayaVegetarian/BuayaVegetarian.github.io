#!/bin/bash
# Get Railway deployment URL

echo "Getting Railway backend URL..."
railway link
railway status

# Show deployment URL
echo ""
echo "Your backend URL should be visible in Railway dashboard:"
echo "1. Go to railway.app dashboard"
echo "2. Select your santan-demo project"
echo "3. Look for 'Domains' or 'Public URL' section"
echo "4. Copy the URL"
