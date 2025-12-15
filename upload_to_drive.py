#!/usr/bin/env python3
"""
Script to upload folder to Google Drive
Requires: pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib
"""

import os
import sys
from pathlib import Path
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
import pickle

# Google Drive API scopes
SCOPES = ['https://www.googleapis.com/auth/drive.file']

# Folder ID from the Google Drive link
FOLDER_ID = '1BC_X8SxU-Xw8OL7x4-bGeb7YjptE7Xkm'

def get_credentials():
    """Get valid user credentials from storage or prompt user to authenticate."""
    creds = None
    token_file = 'token.pickle'
    credentials_file = 'credentials.json'
    
    # Load existing token if available
    if os.path.exists(token_file):
        with open(token_file, 'rb') as token:
            creds = pickle.load(token)
    
    # If there are no (valid) credentials available, let the user log in
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(credentials_file):
                print("ERROR: credentials.json file not found!")
                print("\nTo get credentials.json:")
                print("1. Go to https://console.cloud.google.com/")
                print("2. Create a new project or select existing one")
                print("3. Enable Google Drive API")
                print("4. Create OAuth 2.0 credentials (Desktop app)")
                print("5. Download credentials.json and place it in this directory")
                sys.exit(1)
            
            flow = InstalledAppFlow.from_client_secrets_file(credentials_file, SCOPES)
            creds = flow.run_local_server(port=0)
        
        # Save credentials for next run
        with open(token_file, 'wb') as token:
            pickle.dump(creds, token)
    
    return creds

def upload_folder_to_drive(folder_path, folder_name, parent_folder_id):
    """Upload a folder to Google Drive."""
    creds = get_credentials()
    service = build('drive', 'v3', credentials=creds)
    
    # Create folder in Google Drive
    folder_metadata = {
        'name': folder_name,
        'mimeType': 'application/vnd.google-apps.folder',
        'parents': [parent_folder_id]
    }
    
    folder = service.files().create(body=folder_metadata, fields='id').execute()
    folder_id = folder.get('id')
    print(f"✅ Created folder '{folder_name}' in Google Drive (ID: {folder_id})")
    
    # Upload all files in the folder
    folder_path_obj = Path(folder_path)
    uploaded_count = 0
    
    for root, dirs, files in os.walk(folder_path):
        # Skip hidden directories
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        
        for file in files:
            if file.startswith('.'):
                continue
                
            file_path = Path(root) / file
            relative_path = file_path.relative_to(folder_path_obj)
            
            # Determine parent folder structure
            if relative_path.parent == Path('.'):
                parent_id = folder_id
            else:
                # Create subfolder structure
                parent_id = folder_id
                for part in relative_path.parent.parts:
                    # Check if subfolder exists
                    query = f"name='{part}' and parents in '{parent_id}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
                    results = service.files().list(q=query, fields='files(id, name)').execute()
                    items = results.get('files', [])
                    
                    if items:
                        parent_id = items[0]['id']
                    else:
                        # Create subfolder
                        subfolder_metadata = {
                            'name': part,
                            'mimeType': 'application/vnd.google-apps.folder',
                            'parents': [parent_id]
                        }
                        subfolder = service.files().create(body=subfolder_metadata, fields='id').execute()
                        parent_id = subfolder.get('id')
            
            # Upload file
            file_metadata = {
                'name': file,
                'parents': [parent_id]
            }
            
            media = MediaFileUpload(str(file_path), resumable=True)
            uploaded_file = service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, name'
            ).execute()
            
            uploaded_count += 1
            print(f"  📄 Uploaded: {relative_path}")
    
    print(f"\n✅ Successfully uploaded {uploaded_count} files to Google Drive!")
    print(f"📁 Folder link: https://drive.google.com/drive/folders/{folder_id}")
    return folder_id

def main():
    folder_name = '24001602015_24001602028'
    folder_path = Path(__file__).parent / folder_name
    
    if not folder_path.exists():
        print(f"❌ Error: Folder '{folder_name}' not found!")
        sys.exit(1)
    
    print(f"🚀 Uploading folder '{folder_name}' to Google Drive...")
    print(f"📂 Source: {folder_path}")
    print(f"📁 Destination folder ID: {FOLDER_ID}\n")
    
    try:
        upload_folder_to_drive(str(folder_path), folder_name, FOLDER_ID)
    except Exception as e:
        print(f"❌ Error uploading: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()



