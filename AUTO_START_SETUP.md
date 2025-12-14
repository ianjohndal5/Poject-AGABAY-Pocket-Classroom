# Auto-Start Setup Guide

This guide explains how to set up the AGBAY server to start automatically when your Raspberry Pi boots up.

## Quick Setup

1. **Navigate to the project directory:**
   ```bash
   cd ~/Agabay
   # or wherever you placed the project
   ```

2. **Make the install script executable:**
   ```bash
   chmod +x install_autostart.sh
   ```

3. **Run the installation script with sudo:**
   ```bash
   sudo ./install_autostart.sh
   ```

That's it! The server will now start automatically every time your Raspberry Pi boots.

## What the Script Does

The installation script:
- ✅ Detects your Node.js installation path automatically
- ✅ Checks if dependencies are installed (installs them if needed)
- ✅ Creates a systemd service file at `/etc/systemd/system/agbay.service`
- ✅ Enables the service to start on boot
- ✅ Starts the service immediately (so you don't need to reboot)

## Verifying It Works

After running the install script, verify the service is running:

```bash
sudo systemctl status agbay
```

You should see:
- Status: `active (running)`
- The server should be accessible at `http://localhost:3000`

## Useful Commands

### Service Management
```bash
# Start the service
sudo systemctl start agbay

# Stop the service
sudo systemctl stop agbay

# Restart the service
sudo systemctl restart agbay

# Check service status
sudo systemctl status agbay

# View live logs
sudo journalctl -u agbay -f

# View recent logs
sudo journalctl -u agbay -n 50
```

### Auto-Start Management
```bash
# Disable auto-start (service won't start on boot)
sudo systemctl disable agbay

# Re-enable auto-start
sudo systemctl enable agbay
```

## Troubleshooting

### Service Won't Start

1. **Check the service status:**
   ```bash
   sudo systemctl status agbay
   ```

2. **Check the logs for errors:**
   ```bash
   sudo journalctl -u agbay -n 50
   ```

3. **Common issues:**
   - **Node.js not found**: Install Node.js first
     ```bash
     curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
     sudo apt-get install -y nodejs
     ```
   
   - **Dependencies missing**: Install npm packages
     ```bash
     cd ~/Agabay
     npm install
     ```
   
   - **Wrong path**: The script should auto-detect paths, but if it fails, edit the service file:
     ```bash
     sudo nano /etc/systemd/system/agbay.service
     ```
     Update the `WorkingDirectory` and `ExecStart` paths to match your setup.

### Service Starts But Server Not Accessible

1. **Check if the server is actually running:**
   ```bash
   sudo systemctl status agbay
   ```

2. **Check if port 3000 is in use:**
   ```bash
   sudo netstat -tulpn | grep 3000
   ```

3. **Check firewall settings** (if you have one enabled):
   ```bash
   sudo ufw status
   ```

### Uninstalling Auto-Start

If you want to remove the auto-start feature:

```bash
sudo ./uninstall_autostart.sh
```

Or manually:
```bash
sudo systemctl stop agbay
sudo systemctl disable agbay
sudo rm /etc/systemd/system/agbay.service
sudo systemctl daemon-reload
```

## Testing After Reboot

After setting up auto-start, you can test it by rebooting:

```bash
sudo reboot
```

After the Pi boots up, wait about 30 seconds, then check:

```bash
sudo systemctl status agbay
```

The service should be `active (running)`.

## Notes

- The service will automatically restart if it crashes (configured with `Restart=always`)
- Logs are stored in the systemd journal and can be viewed with `journalctl`
- The service runs as the user who ran the install script (usually `pi`)
- The server will be accessible at `http://<raspberry-pi-ip>:3000` from other devices on your network

