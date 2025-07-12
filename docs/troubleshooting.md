# Troubleshooting Guide

## Node.js Version Issues

**Problem:** `Error: The engine "node" is incompatible with this module`
```bash
❌ Node.js v16.19.1 is not supported.
📋 Decision Tapestry requires Node.js 20.0.0 or higher.
```

**Solution:**
1. **Check your Node.js version:** `node --version`
2. **Upgrade Node.js:**
   - **Direct download:** https://nodejs.org/
   - **Using nvm (recommended):**
     ```bash
     # Install nvm (if not already installed)
     curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
     
     # Install and use Node.js 20
     nvm install 20
     nvm use 20
     nvm alias default 20
     ```
   - **Using homebrew (macOS):**
     ```bash
     brew install node@20
     brew link --overwrite node@20
     ```

## Missing Dependencies

**Problem:** `Cannot find package 'ajv'` or similar dependency errors

**Solution:**
```bash
# Clear npm cache and reinstall
npm cache clean --force
npm install

# For yarn users
yarn cache clean
yarn install
```

## Server Startup Issues

**Problem:** `Error: listen EADDRINUSE: address already in use :::8080`

**Solution:**
```bash
# Find and kill the process using port 8080
lsof -ti:8080 | xargs kill -9

# Or use a different port
PORT=3000 decision-tapestry start
```

**Problem:** `Could not find decisions.yml`

**Solution:**
```bash
# Initialize a new decisions.yml file
decision-tapestry init

# Or navigate to the directory containing your decisions.yml
cd /path/to/your/project
decision-tapestry start
```

## Schema Validation Errors

**Problem:** `decisions.yml has validation errors`

**Solution:**
1. **Run validation to see specific errors:**
   ```bash
   decision-tapestry validate
   ```

2. **Common fixes:**
   - **Missing required fields:** Add `id`, `title`, and `status` to each decision
   - **Invalid status values:** Use `Accepted`, `Superseded`, `Rejected`, or `Proposed`
   - **Wrong structure:** Ensure top-level `decisions` array (not nested)
   - **YAML syntax errors:** Check indentation and quotes

3. **Example minimal valid file:**
   ```yaml
   decisions:
     - id: 1
       title: "Your first decision"
       status: Accepted
   ```

## Docker Issues

**Problem:** Docker container startup fails

**Solution:**
```bash
# Ensure proper volume mounting
docker run -p 8080:8080 -v "$(pwd):/app/user_data" decision-tapestry

# Check if decisions.yml exists in current directory
ls -la decisions.yml

# Rebuild the image if needed
docker build -t decision-tapestry .
```

## Permission Issues

**Problem:** `Permission denied writing to decisions.yml`

**Solution:**
```bash
# Check file permissions
ls -la decisions.yml

# Fix permissions
chmod 644 decisions.yml

# For Docker users, check volume permissions
sudo chown $(whoami):$(whoami) decisions.yml
```

## Health Check

Use the health endpoint to verify your setup:
```bash
# Start the server
decision-tapestry start

# Check health (in another terminal)
curl http://localhost:8080/api/health
```

Healthy response:
```json
{
  "status": "ok",
  "checks": {
    "decisionsFile": {"status": "ok", "message": "decisions.yml found and readable"},
    "workingDirectory": {"status": "ok", "message": "Working directory accessible"}
  }
}
```