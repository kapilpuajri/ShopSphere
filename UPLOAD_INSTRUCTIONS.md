# Upload Instructions for Google Drive

The project folder `24001602015_24001602028` has been prepared and is ready to upload.

## Quick Upload (Recommended)

### Option 1: Manual Upload via Web Interface
1. Go to https://drive.google.com/drive/folders/1BC_X8SxU-Xw8OL7x4-bGeb7YjptE7Xkm
2. Click "New" → "Folder upload"
3. Select the `24001602015_24001602028` folder from your Desktop/Ecommerce_project directory
4. Wait for upload to complete

### Option 2: Using Python Script (Automated)

**First-time setup:**
1. Go to https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Enable "Google Drive API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Choose "Desktop app" as application type
6. Download the credentials JSON file
7. Save it as `credentials.json` in the project root

**Upload:**
```bash
cd /Users/dikshachaudhri/Desktop/Ecommerce_project
source venv/bin/activate
python3 upload_to_drive.py
```

The script will open a browser for authentication (one-time only).

### Option 3: Using rclone (Command Line)

**First-time setup:**
```bash
rclone config
# Follow prompts:
# - Name: gdrive
# - Storage: Google Drive (15)
# - Authenticate via browser
```

**Upload:**
```bash
chmod +x upload_with_rclone.sh
./upload_with_rclone.sh
```

## What's Included

The folder `24001602015_24001602028` contains:
- All project files
- Backend (Spring Boot)
- Frontend (React/TypeScript)
- Configuration files
- Documentation
- Screenshots

**Excluded:**
- `node_modules` (as requested)
- `.git` directory
- Build artifacts that can be regenerated

## Zip File

A zip file `24001602015_24001602028.zip` has also been created for easy sharing.



