const TiktokDownloader = require('./scrape/tiktok');
const CapcutDownloader = require('./scrape/capcut');
const XiaohongshuDownloader = require('./scrape/xiaohongshu');
const ThreadsDownloader = require('./scrape/threads');
const SoundcloudDownloader = require('./scrape/soundcloud');
const SpotifyDownloader = require('./scrape/spotify');
const InstagramDownloader = require('./scrape/instagram');
const FacebookDownloader = require('./scrape/facebook');
const TeraboxDownloader = require('./scrape/terabox');
const SnackVideoDownloader = require('./scrape/snackvideo');
const platformPatterns = require('./system/patterns.js');

class Downloader {
    constructor() {
        this.platformPatterns = platformPatterns;
        this.downloaders = {
            tiktok: TiktokDownloader,
            capcut: CapcutDownloader,
            xiaohongshu: XiaohongshuDownloader,
            threads: ThreadsDownloader,
            soundcloud: SoundcloudDownloader,
            spotify: SpotifyDownloader,
            instagram: InstagramDownloader,
            facebook: FacebookDownloader,
            terabox: TeraboxDownloader,
            snackvideo: SnackVideoDownloader
        };
    }

    getPlatform(url) {
        if (!url) throw new Error('URL tidak boleh kosong');

        for (const [platform, pattern] of Object.entries(this.platformPatterns)) {
            if (pattern.test(url)) {
                return platform;
            }
        }

        throw new Error('Platform tidak didukung');
    }

    async download(url) {
        try {
            if (!url) {
                throw new Error('URL tidak boleh kosong');
            }

            url = url.trim();

            if (!/^https?:\/\//i.test(url)) {
                url = 'https://' + url;
            }

            const platform = this.getPlatform(url);

            if (!this.downloaders[platform]) {
                throw new Error(`Platform ${platform} tidak didukung`);
            }

            const DownloaderClass = this.downloaders[platform];
            const downloader = new DownloaderClass(url);
            const result = await downloader.download();

            if (!result) {
                throw new Error('Gagal mendapatkan hasil download');
            }

            return result;

        } catch (error) {
            console.error('Download Error:', error);
            throw error;
        }
    }
}

module.exports = Downloader;
