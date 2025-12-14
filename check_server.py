#!/usr/bin/env python3
"""
Quick script to test if the server API endpoints are working
Run this on the Raspberry Pi to diagnose server issues
"""

import requests
import json

SERVER_URL = "http://localhost:3000"

print("=" * 50)
print("Server API Test")
print("=" * 50)

# Test 1: Check if server is responding
print("\n1. Testing server response...")
try:
    response = requests.get(f"{SERVER_URL}/")
    print(f"   Status: {response.status_code}")
    print(f"   Content-Type: {response.headers.get('Content-Type', 'N/A')}")
    if response.status_code == 200:
        print("   ✅ Server is responding")
        if 'text/html' in response.headers.get('Content-Type', ''):
            print("   ✅ HTML content type is correct")
        else:
            print(f"   ⚠️  Unexpected content type: {response.headers.get('Content-Type')}")
    else:
        print(f"   ❌ Server returned error: {response.status_code}")
except Exception as e:
    print(f"   ❌ Error connecting to server: {e}")

# Test 2: Check viewer count API
print("\n2. Testing viewer count API...")
try:
    response = requests.get(f"{SERVER_URL}/api/viewers")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Viewer count: {data.get('count', 0)}")
    else:
        print(f"   ❌ Error: {response.status_code}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 3: Check classroom files API
print("\n3. Testing classroom files API...")
try:
    response = requests.get(f"{SERVER_URL}/api/classroom/files")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Found {len(data)} file(s) in classroom folder")
        for file in data:
            print(f"      - {file.get('name')} ({file.get('views', 0)} views)")
    else:
        print(f"   ❌ Error: {response.status_code}")
        print(f"   Response: {response.text}")
except Exception as e:
    print(f"   ❌ Error: {e}")

print("\n" + "=" * 50)

