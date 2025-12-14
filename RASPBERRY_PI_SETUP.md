# Raspberry Pi Zero 2 W Setup Guide

Quick setup guide specifically for Raspberry Pi Zero 2 W.

## Quick Start

1. **Copy files to Raspberry Pi Zero 2 W**
   - Transfer all files to your Pi (via USB, network share, or SCP)

2. **Navigate to the project directory**
   ```bash
   cd /path/to/Agabay
   ```

3. **Make script executable (optional)**
   ```bash
   chmod +x start_server.sh
   ```

4. **Start the server**
   ```bash
   python3 server.py
   ```
   Or use the script:
   ```bash
   ./start_server.sh
   ```

5. **Access the application**
   - On the Pi: Open browser to `http://localhost:3000`
   - From other devices: `http://<pi-ip-address>:3000`

## Finding Your Pi's IP Address

```bash
hostname -I
```

Or check your router's admin panel for connected devices.

## Running in Background (Optional)

To run the server in the background so it continues after you close the terminal:

```bash
nohup python3 server.py > server.log 2>&1 &
```

To stop it later:
```bash
pkill -f server.py
```

## Auto-Start on Boot (Easiest Method)

To make the server start automatically when the Pi Zero 2 W boots:

### Method 1: Automated Installation (Recommended)

1. Make the install script executable:
   ```bash
   chmod +x install_autostart.sh
   ```

2. Run the installation script:
   ```bash
   sudo ./install_autostart.sh
   ```

That's it! The server will now start automatically on boot.

### Method 2: Manual Installation

If you prefer to do it manually:

1. Make sure you're in the Agabay directory:
   ```bash
   cd /home/pi/Agabay  # or wherever your files are
   ```

2. Copy the service file to systemd:
   ```bash
   sudo cp agbay.service /etc/systemd/system/
   ```

3. Edit the service file to match your path:
   ```bash
   sudo nano /etc/systemd/system/agbay.service
   ```
   Change `/home/pi/Agabay` to your actual directory path.

4. Enable and start:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable agbay.service
   sudo systemctl start agbay.service
   ```

### Managing the Service

Once installed, you can manage it with:

```bash
# Check if it's running
sudo systemctl status agbay

# Start the service
sudo systemctl start agbay

# Stop the service
sudo systemctl stop agbay

# Restart the service
sudo systemctl restart agbay

# View live logs
sudo journalctl -u agbay -f

# Disable auto-start (but keep service installed)
sudo systemctl disable agbay

# Uninstall completely
sudo ./uninstall_autostart.sh
```

### Verify It's Working

After installation, reboot your Pi:
```bash
sudo reboot
```

After it boots, check if the server is running:
```bash
sudo systemctl status agbay
```

You should see "active (running)" in green.

## Performance Tips for Pi Zero 2 W

- The server is optimized for low memory usage
- Supports up to 100 concurrent viewers
- PDF indexing on client side may take 30-60 seconds depending on PDF size
- For best performance, limit PDF files to first 50 pages (already implemented)

## Troubleshooting

### "Address already in use"
Port 3000 is already in use. Either:
- Stop the other service using port 3000
- Change PORT in server.py to a different port (e.g., 8080)

### Can't access from other devices
1. Check firewall: `sudo ufw status`
2. Allow port 3000: `sudo ufw allow 3000`
3. Make sure Pi and other devices are on same network
4. Check Pi's IP hasn't changed (use static IP if needed)

### Server uses too much memory
- The server is already optimized for Pi Zero 2 W
- If issues persist, reduce MAX_VIEWERS in server.py

## Network Configuration

For classroom use, you may want to set a static IP:

1. Edit network config:
   ```bash
   sudo nano /etc/dhcpcd.conf
   ```

2. Add (adjust for your network):
   ```
   interface wlan0
   static ip_address=192.168.1.100/24
   static routers=192.168.1.1
   static domain_name_servers=192.168.1.1
   ```

3. Reboot:
   ```bash
   sudo reboot
   ```

