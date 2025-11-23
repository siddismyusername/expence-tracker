# MongoDB Atlas Setup Guide

## Step 1: Create a Free MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up with your email or Google account
3. Complete the registration

## Step 2: Create a Free Cluster

1. Click **"Build a Database"**
2. Choose **"M0 Free"** tier
3. Select a cloud provider (AWS, Google Cloud, or Azure)
4. Choose a region closest to you
5. Name your cluster (e.g., `Cluster0`)
6. Click **"Create Cluster"** (takes 3-5 minutes)

## Step 3: Create a Database User

1. In the left sidebar, click **"Database Access"** under Security
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter a username (e.g., `expenseuser`)
5. Click **"Autogenerate Secure Password"** and **COPY IT**
6. Under "Database User Privileges", select **"Read and write to any database"**
7. Click **"Add User"**

## Step 4: Whitelist Your IP Address

1. In the left sidebar, click **"Network Access"** under Security
2. Click **"Add IP Address"**
3. For development, click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - ⚠️ For production, whitelist only your server's IP
4. Click **"Confirm"**

## Step 5: Get Your Connection String

1. Go back to **"Database"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** as the driver and latest version
5. Copy the connection string (it looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 6: Configure Your Application

1. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

2. Edit `.env` and replace the `MONGODB_URI` with your connection string:
   - Replace `<username>` with your database username
   - Replace `<password>` with the password you copied
   - Add the database name after `.net/` (e.g., `expense_tracker`)

   Example:
   ```
   MONGODB_URI=mongodb+srv://expenseuser:MyP@ssw0rd@cluster0.abc123.mongodb.net/expense_tracker?retryWrites=true&w=majority
   ```

3. Also update the JWT and Session secrets:
   ```
   JWT_SECRET=your-random-secure-string-here
   SESSION_SECRET=another-random-secure-string-here
   ```

## Step 7: Test the Connection

1. Install dependencies (if not already done):
   ```bash
   npm install
   ```

2. Start your server:
   ```bash
   npm start
   ```

3. You should see:
   ```
   MongoDB connected successfully
   Database: expense_tracker
   Server running on http://localhost:3000
   ```

## Troubleshooting

### "Connection timed out"
- Check that your IP is whitelisted in Network Access
- Verify your internet connection

### "Authentication failed"
- Double-check your username and password in the connection string
- Make sure there are no special characters that need URL encoding
- Use the exact password from Atlas (no spaces)

### "URI malformed"
- Ensure the connection string format is correct
- Special characters in password need to be URL-encoded (e.g., `@` → `%40`)

## Security Best Practices

1. **Never commit `.env` to Git** - It's already in `.gitignore`
2. Use strong, unique passwords for database users
3. In production, whitelist only specific IP addresses
4. Rotate credentials periodically
5. Use environment-specific databases (dev, staging, production)

## Free Tier Limits

MongoDB Atlas Free Tier (M0) includes:
- 512 MB storage
- Shared RAM
- Shared vCPU
- Perfect for development and small applications

For production with higher traffic, consider upgrading to M10+ clusters.
