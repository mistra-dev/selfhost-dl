const axios = require('axios');

class TikTokDownloader {
    constructor(url) {
        this.url = url;
        this.scrapers = {
            api1: this.api1.bind(this),
            api2: this.api2.bind(this),
            api3: this.api3.bind(this),
            api4: this.api4.bind(this),
            api5: this.api5.bind(this)
        };
    }

    async download() {
        for (const scraper of Object.values(this.scrapers)) {
            try {
                const result = await scraper();
                if (result) {
                                   return result;
                }
            } catch (error) {
                console.error(`Scraper error (${scraper.name}):`, error.message);
                continue;
            }
        }
        throw new Error('Semua metode scraping gagal');
    }

    async api1() {
        try {
            const response = await axios.post('https://www.tikwm.com/api/', {
                url: this.url,
                count: 12,
                cursor: 0,
                web: 1,
                hd: 1
            });
    
            if (response.data.code === 0) {
                const data = response.data.data;
                
                const getOriginalUrl = async (url) => {
                    try {
                        const headResponse = await axios.head(url, { 
                            maxRedirects: 0,
                            validateStatus: (status) => status >= 200 && status < 400 
                        });
                        return headResponse.headers.location || url;
                    } catch (error) {
                        return url;
                    }
                };
    
                const urls = await Promise.all([
                    getOriginalUrl('https://www.tikwm.com' + (data.hdplay || data.play)),
                    getOriginalUrl('https://www.tikwm.com' + data.wmplay),
                    getOriginalUrl('https://www.tikwm.com' + data.music)
                ]);
    
                return {
                    platform: 'tiktok',
                    caption: data.title,
                    author: data.author.nickname,
                    username: data.author.unique_id,
                    'img-thumb': data.cover,
                    like: parseInt(data.digg_count) || 0,
                    views: parseInt(data.play_count) || 0,
                    comments: parseInt(data.comment_count) || 0,
                    date: new Date(data.create_time * 1000).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    downloads: [
                        {
                            type: 'download_video_hd',
                            url: urls[0],
                            filename: `tiktok_${data.author.unique_id}_hd.mp4`
                        },
                        {
                            type: 'download_video_480p',
                            url: urls[1],
                            filename: `tiktok_${data.author.unique_id}_watermark.mp4`
                        },
                        {
                            type: 'download_audio',
                            url: urls[2],
                            filename: `tiktok_${data.author.unique_id}_audio.mp3`
                        }
                    ]
                };
            }
            return null;
        } catch (error) {
            throw new Error('API 1 Error: ' + error.message);
        }
    }

    async api2() {
        try {
            const indexResponse = await axios.get('https://ttdownloader.com/');
            const token = indexResponse.data.match(/value="([0-9a-z]+)"/)[1];

            const formData = new URLSearchParams();
            formData.append('url', this.url);
            formData.append('format', '');
            formData.append('token', token);

            const response = await axios.post('https://ttdownloader.com/search/', formData);
            const urls = response.data.match(/(https?:\/\/.*?\.php\?v=.*?)\"/g);
            
            if (!urls) return null;

            const username = this.url.split('@')[1]?.split('/')[0] || 'unknown';

            return {
                platform: 'tiktok',
                caption: 'TikTok Video',
                author: 'TikTok User',
                username: username,
                'img-thumb': '',
                like: 0,
                views: 0,
                comments: 0,
                date: new Date().toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                downloads: [
                    {
                        type: 'download_video_hd',
                        url: urls[0].replace(/\"$/, ''),
                        filename: `tiktok_${username}_hd.mp4`
                    }
                ]
            };
        } catch (error) {
            throw new Error('API 2 Error: ' + error.message);
        }
    }

    async api3() {
        throw new Error('API 3 belum diimplementasi');
    }

    async api4() {
        throw new Error('API 4 belum diimplementasi');
    }

    async api5() {
        throw new Error('API 5 belum diimplementasi');
    }
}

module.exports = TikTokDownloader;