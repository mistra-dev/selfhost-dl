const axios = require('axios');
const cheerio = require('cheerio');

class SnackVideoDownloader {
    constructor(url) {
        this.url = url;
    }

    async download() {
        try {
            const response = await axios.get(this.url);
            const $ = cheerio.load(response.data);
            
            const videoData = $("#VideoObject").text().trim();
            if (!videoData) {
                throw new Error("Tidak dapat menemukan data video");
            }

            const videoInfo = JSON.parse(videoData);
            if (!videoInfo.contentUrl) {
                throw new Error("Tidak dapat menemukan URL video");
            }

            
            const uploadDate = videoInfo.uploadDate ? new Date(videoInfo.uploadDate) : new Date();
            const formattedDate = uploadDate.toLocaleString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            return {
                platform: 'snackvideo',
                caption: videoInfo.name || videoInfo.description || '',
                author: videoInfo.author?.name || '',
                username: videoInfo.author?.name || '',
                'img-thumb': videoInfo.thumbnailUrl || null,
                like: parseInt(videoInfo.interactionStatistic?.userInteractionCount) || 0,
                views: parseInt(videoInfo.interactionCount) || 0,
                comments: 0, 
                date: formattedDate,
                downloads: [{
                    type: 'download_video_hd',
                    url: videoInfo.contentUrl,
                    filename: `snackvideo_${Date.now()}.mp4`
                }]
            };

        } catch (error) {
            console.error("SnackVideo Download Error:", error);
            throw new Error("Gagal mengunduh dari SnackVideo: " + error.message);
        }
    }
}

module.exports = SnackVideoDownloader;
