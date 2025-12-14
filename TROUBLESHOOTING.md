# Troubleshooting Guide

## Issue: Raw HTML code showing instead of rendered page

### Symptoms:
- Browser shows HTML code instead of rendering the page
- Classroom materials can't be fetched

### Solution:

1. **Check if files exist in the correct location:**
   ```bash
   ls -la /var/www/html/
   ```
   You should see:
   - `index.html`
   - `script.js`
   - `style.css`
   - `server.py`
   - `classroom/` folder

2. **Check server logs:**
   ```bash
   sudo journalctl -u agbay -n 50 --no-pager
   ```
   Or watch live logs:
   ```bash
   sudo journalctl -u agbay -f
   ```

3. **Verify the server can find the files:**
   ```bash
   cd /var/www/html
   python3 check_server.py
   ```

4. **Test the API directly:**
   ```bash
   curl http://localhost:3000/api/classroom/files
   ```
   Should return JSON with file list.

5. **Check browser console:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for JavaScript errors
   - Check Network tab for failed requests

6. **Restart the server:**
   ```bash
   sudo systemctl restart agbay
   sudo journalctl -u agbay -f
   ```
   Then access http://192.168.137.101:3000 and watch the logs

## Issue: Classroom folder not found

If the classroom folder exists but files aren't showing:

1. **Check folder permissions:**
   ```bash
   ls -la /var/www/html/classroom/
   sudo chown -R kuchinonaka:kuchinonaka /var/www/html/classroom/
   ```

2. **Verify files are readable:**
   ```bash
   sudo chmod 644 /var/www/html/classroom/*
   ```

3. **Test classroom listing:**
   ```bash
   python3 test_classroom.py
   ```

## Common Issues:

### Files in wrong location
If files are elsewhere, copy them:
```bash
sudo cp -r /path/to/your/files/* /var/www/html/
sudo chown -R kuchinonaka:kuchinonaka /var/www/html/
```

### Port already in use
```bash
sudo netstat -tlnp | grep :3000
sudo kill <PID>
sudo systemctl restart agbay
```

### Permission denied
```bash
sudo chown -R kuchinonaka:kuchinonaka /var/www/html/
sudo chmod -R 755 /var/www/html/
```

