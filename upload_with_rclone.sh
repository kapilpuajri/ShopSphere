#!/bin/bash

# Script to upload folder to Google Drive using rclone
# First time setup: rclone config (follow prompts to connect Google Drive)

FOLDER_NAME="24001602015_24001602028"
DRIVE_FOLDER_ID="1BC_X8SxU-Xw8OL7x4-bGeb7YjptE7Xkm"

echo "🚀 Uploading folder to Google Drive using rclone..."
echo ""

# Check if rclone is installed
if ! command -v rclone &> /dev/null; then
    echo "❌ rclone is not installed. Installing..."
    brew install rclone
fi

# Check if rclone is configured
if ! rclone listremotes | grep -q "gdrive:"; then
    echo "⚠️  rclone is not configured for Google Drive."
    echo ""
    echo "Setting up rclone for Google Drive..."
    echo "1. Run: rclone config"
    echo "2. Select 'n' for new remote"
    echo "3. Name it 'gdrive'"
    echo "4. Select '15' for Google Drive"
    echo "5. Follow the prompts to authenticate"
    echo ""
    read -p "Press Enter to start rclone configuration..."
    rclone config
fi

# Upload the folder
echo "📤 Uploading folder '$FOLDER_NAME' to Google Drive..."
echo ""

# Use rclone copy to upload the folder
rclone copy "$FOLDER_NAME" "gdrive:$FOLDER_NAME" --drive-shared-with-me --progress

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Upload completed successfully!"
    echo "📁 Folder is available at: https://drive.google.com/drive/folders/$DRIVE_FOLDER_ID"
else
    echo ""
    echo "❌ Upload failed. Please check the error messages above."
    exit 1
fi



