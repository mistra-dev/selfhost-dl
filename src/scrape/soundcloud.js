const scdl = require('soundcloud-downloader').default;

class SoundCloudDownloader {
    constructor(url) {
        this.url = url;
        this.CLIENT_ID = 'yLfooVZK5emWPvRLZQlSuGTO8pof6z4t';
    }

    formatDuration(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return `${minutes}:${seconds.padStart(2, '0')}`;
    }

    async download() {
        try {
            if (!this.url.includes('soundcloud.com')) {
                throw new Error('URL SoundCloud tidak valid');
            }

            const info = await scdl.getInfo(this.url, this.CLIENT_ID);
            
            
            const uploadDate = new Date(info.created_at);
            const formattedDate = uploadDate.toLocaleString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            return {
                platform: 'soundcloud',
                caption: info.title,
                author: info.user.username,
                username: info.user.permalink,
                'img-thumb': info.artwork_url?.replace('-large', '-t500x500') || info.user.avatar_url,
                like: info.likes_count || 0,
                views: info.playback_count || 0,
                comments: info.comment_count || 0,
                date: formattedDate,
                downloads: [{
                    type: 'download_audio',
                    url: this.url,
                    filename: `${info.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${info.id}.mp3`
                }]
            };

        } catch (error) {
            console.error('SoundCloud Download Error:', error);
            throw new Error('Gagal mengunduh dari SoundCloud: ' + error.message);
        }
    }

    async downloadAudio() {
        try {
            const stream = await scdl.download(this.url, this.CLIENT_ID);
        
            const chunks = [];
            const audioBuffer = await new Promise((resolve, reject) => {
                stream.on('data', chunk => chunks.push(chunk));
                stream.on('end', () => resolve(Buffer.concat(chunks)));
                stream.on('error', reject);
            });

            return audioBuffer;
        } catch (error) {
            console.error('Audio Download Error:', error);
            throw new Error('Gagal mengunduh audio: ' + error.message);
        }
    }
}

module.exports = SoundCloudDownloader;
