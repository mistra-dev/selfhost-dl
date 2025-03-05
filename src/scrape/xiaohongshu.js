const axios = require('axios');
const cheerio = require('cheerio');
const patterns = require('../system/patterns');

class XiaohongshuDownloader {
    constructor(url) {
        this.url = url;
        this.FAKE_AGENTS = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
        ];
    }

    removeUnicode(jsonString) {
        try {
            const cleanJson = jsonString
                .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") 
                .replace(/\\u/g, '')
                .replace(/\\n/g, ' ')
                .replace(/002F/g, "/")
                .replace(/undefined/g, "null")
                .replace(/\\r/g, ' ')
                .replace(/\\t/g, ' ')
                .replace(/\\f/g, ' ')
                .replace(/\\b/g, ' ')
                .replace(/\\\\/g, '\\')
                .replace(/\\'/g, "'")
                .replace(/\\"/g, '"')
                .replace(/\s+/g, ' ')
                .trim();

            return cleanJson;
        } catch (error) {
            console.error('Error cleaning JSON:', error);
            throw new Error('Gagal membersihkan JSON string');
        }
    }

    fixImageUrl(url) {
        if (url.startsWith('http://')) {
            url = 'https://' + url.slice(7);
        }
        return url;
    }

    async download() {
        try {
            if (!patterns.xiaohongshu.test(this.url)) {
                throw new Error('URL Xiaohongshu tidak valid');
            }

            const headers = {
                'User-Agent': this.FAKE_AGENTS[Math.floor(Math.random() * this.FAKE_AGENTS.length)],
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Referer': 'https://www.xiaohongshu.com/',
                'Cookie': 'webId=auto;'
            };

            const response = await axios.get(this.url, { headers });
            const html = response.data;
            const $ = cheerio.load(html);
            
            let scriptContent = '';
            $('script').each((i, elem) => {
                const content = $(elem).html();
                if (content && content.includes('window.__INITIAL_STATE__=')) {
                    scriptContent = content;
                }
            });

            if (!scriptContent) {
                throw new Error('Tidak dapat menemukan data konten');
            }

            const jsonString = scriptContent.split('window.__INITIAL_STATE__=')[1].split(';')[0];
            const cleanJsonString = this.removeUnicode(jsonString);
            
            const data = JSON.parse(cleanJsonString);
            
            if (!data.note || !data.note.currentNoteId) {
                throw new Error('Format data tidak valid');
            }

            const id = data.note.currentNoteId;
            const meta = data.note.noteDetailMap[id].note;
            const downloads = [];
            
            if (meta.video && meta.video.media && meta.video.media.stream && meta.video.media.stream.h264) {
                downloads.push({
                    type: 'download_video_hd',
                    url: this.fixImageUrl(meta.video.media.stream.h264[0].masterUrl),
                    filename: `xiaohongshu_${meta.user.nickname}_video.mp4`
                });
            } else if (meta.imageList && Array.isArray(meta.imageList)) {
                meta.imageList.forEach((img, index) => {
                    if (img.urlDefault) {
                        downloads.push({
                            type: 'download_image',
                            url: this.fixImageUrl(img.urlDefault),
                            filename: `xiaohongshu_${meta.user.nickname}_image_${index + 1}.jpg`
                        });
                    }
                });
            }

            if (downloads.length === 0) {
                throw new Error('Tidak ada media yang dapat diunduh');
            }

            return {
                platform: 'xiaohongshu',
                caption: meta.title || meta.desc || '',
                author: meta.user.nickname || 'Xiaohongshu User',
                username: meta.user.nickname || 'xiaohongshu_user',
                'img-thumb': this.fixImageUrl(meta.cover?.urlDefault || meta.imageList?.[0]?.urlDefault || ''),
                like: parseInt(meta.likeCount) || 0,
                views: parseInt(meta.viewCount) || 0,
                comments: parseInt(meta.commentCount) || 0,
                date: new Date(meta.time || Date.now()).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                downloads: downloads
            };

        } catch (error) {
            console.error('Xiaohongshu Download Error:', error);
            if (error.response) {
                console.error('Response Error:', error.response.data);
            }
            throw new Error('Gagal mengunduh dari Xiaohongshu: ' + error.message);
        }
    }

    async downloadMedia(url) {
        try {
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': this.FAKE_AGENTS[Math.floor(Math.random() * this.FAKE_AGENTS.length)]
                }
            });

            return {
                data: response.data,
                contentType: response.headers['content-type']
            };
        } catch (error) {
            throw new Error('Gagal mengunduh media: ' + error.message);
        }
    }
}

module.exports = XiaohongshuDownloader;