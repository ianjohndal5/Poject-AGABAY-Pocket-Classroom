#!/usr/bin/env python3
"""
Quick test script to check if classroom folder and files are accessible
Run this on the Raspberry Pi to diagnose classroom folder issues
"""

import os

CLASSROOM_FOLDER = 'classroom'
script_dir = os.path.dirname(os.path.abspath(__file__))
classroom_path = os.path.join(script_dir, CLASSROOM_FOLDER)

print("=" * 50)
print("Classroom Folder Diagnostic")
print("=" * 50)
print(f"Script directory: {script_dir}")
print(f"Classroom folder path: {classroom_path}")
print(f"Classroom folder exists: {os.path.exists(classroom_path)}")

if os.path.exists(classroom_path):
    print(f"Classroom folder is directory: {os.path.isdir(classroom_path)}")
    try:
        files = os.listdir(classroom_path)
        print(f"Files in classroom folder: {len(files)}")
        for filename in files:
            file_path = os.path.join(classroom_path, filename)
            if os.path.isfile(file_path):
                size = os.path.getsize(file_path)
                print(f"  - {filename} ({size} bytes)")
            else:
                print(f"  - {filename} (not a file)")
    except Exception as e:
        print(f"Error listing files: {e}")
else:
    print("\n⚠️  Classroom folder does not exist!")
    print(f"Creating it now...")
    try:
        os.makedirs(classroom_path, exist_ok=True)
        print(f"✅ Created: {classroom_path}")
    except Exception as e:
        print(f"❌ Error creating folder: {e}")

print("=" * 50)

