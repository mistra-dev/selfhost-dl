<div align='center'>

# SelfHost-DL

<p>SelfHost-DL is my project that lets users self-host a simple web downloader with minimal setup. Just run it with Node.js—no third-party services needed. Deploy the files, start the server, and download content easily. Perfect for a lightweight, self-managed solution.</p>

<h4> </span> <a href="https://fann.cloud"> Demo Website </a> <span> · </span> <a href="https://github.com/rdmistra/selfhost-dl/issues"> Report Bug </a> <span> · </span> <a href="https://github.com/rdmistra/selfhost-dl/issues"> Request Feature </a> </h4>
</div>

---------------

<div align='center'>

# SCREENSHOT

</div>

<p align="center">
  <a href="https://ibb.co/j9scmGHy">
    <img src="https://i.ibb.co/HL3W6YXt/Screenshot-2025-02-16-120806.png" alt="Screenshot-2025-02-16-120806" border="0">
  </a>
  <a href="https://ibb.co/5XWt9LcD">
    <img src="https://i.ibb.co/PsZ3YgCp/Screenshot-2025-02-16-120812.png" alt="Screenshot-2025-02-16-120812" border="0">
  </a>
  <a href="https://ibb.co/ZRjYJPsg">
    <img src="https://i.ibb.co/5X0n9yDj/Screenshot-2025-02-16-120836.png" alt="Screenshot-2025-02-16-120836" border="0">
  </a>
</p>

---------------

## 🚀 Features
- **Scrape APIs** – Uses various APIs to fetch and download media.  
- **Requires Only Node.js** – No database or heavy dependencies needed.  
- **Lightweight & Fast** – Optimized for speed and minimal resource usage.  
- **Supports multiple platforms:**
  - **TikTok**: `TiktokDownloader`
  - **CapCut**: `CapcutDownloader`
  - **Xiaohongshu**: `XiaohongshuDownloader`
  - **Threads**: `ThreadsDownloader`
  - **SoundCloud**: `SoundcloudDownloader`
  - **Spotify**: `SpotifyDownloader`
  - **Instagram**: `InstagramDownloader`
  - **Facebook**: `FacebookDownloader`
  - **Terabox**: `TeraboxDownloader`
  - **SnackVideo**: `SnackVideoDownloader`
- **Easy to Use** – Simple setup and intuitive usage.  
- **Vercel Deployment Support** – Deploy in seconds with a single click.  

---------------
## This project can be run in three ways:
1. **Locally** (on your machine)
2. **On a VPS** (self-hosted)
3. **Deploying to Vercel** (serverless)

---

## 🖥️ Running Locally

1. **Clone the repository:**
   ```sh
   git clone https://github.com/rdmistra/selfhost-dl.git
   cd selfhost-dl
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Start the server:**
   ```sh
   node index.js
   ```

4. **Access the app:**
   ```
   http://localhost:<PORT>
   ```

---

## 🌍 Running on a VPS

### Prerequisites:
- A VPS with **Node.js (v16+)** installed
- **PM2** (for process management)

1. **Connect to your VPS** via SSH:
   ```sh
   ssh user@your-vps-ip
   ```

2. **Clone the repository:**
   ```sh
   git clone https://github.com/rdmistra/selfhost-dl.git
   cd selfhost-dl
   ```

3. **Install dependencies:**
   ```sh
   npm install
   ```

4. **Run with PM2 (recommended for production):**
   ```sh
   npm install -g pm2
   pm2 start index.js --name selfhost-dl
   pm2 save
   pm2 startup
   ```

5. **Access the app via your VPS IP:**
   ```
   http://your-vps-ip:<PORT>
   ```

(Optional) **Use Nginx as a reverse proxy** for a custom domain and SSL setup.

---

## ☁️ Deploying to Vercel

### **One-Click Deploy**
Click the button below to instantly deploy to **Vercel**:

<p align="center">
  <a href="https://vercel.com/new/clone?repository-url=https://github.com/rdmistra/selfhost-dl">
    <img src="https://vercel.com/button" alt="Deploy to Vercel"/>
  </a>
</p>

---
## License
This project is licensed under the Apache License 2.0.
