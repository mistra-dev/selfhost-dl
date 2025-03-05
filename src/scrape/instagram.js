const FIXED_TIMESTAMP = 1739185749634;
const SECRECT_KEY = "46e9243172efe7ed14fa58a98949d9e3a6cc7ec3aa0ae5d21c1654e507de884c";
const BASE_URL = "https://instasupersave.com";
const URL_MSEC = "/msec";
const URL_CONVERT = "/api/convert";

class InstagramDownloader {
    constructor(url) {
        this.url = url;
        this.headers = {
            "authority": "instasupersave.com",
            "accept": "*/*",
            "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
            "content-type": "application/json",
            "origin": "https://instasupersave.com",
            "referer": "https://instasupersave.com/en/",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36"
        };
    }

    async req(url, method = "GET", data = null) {
        try {
            const response = await fetch(url, {
                method,
                headers: this.headers,
                ...(data ? { body: data } : {})
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return response;
        } catch (error) {
            console.error('Request Error:', error);
            throw error;
        }
    }

    sort(obj) {
        return Object.keys(obj).sort().reduce((result, key) => {
            result[key] = obj[key];
            return result;
        }, {});
    }

    async genSignature(input) {
        try {
            const rs = await this.req(BASE_URL + URL_MSEC);
            const { msec } = await rs.json();

            let serverTime = Math.floor(msec * 1000);
            let timeDiff = serverTime ? Date.now() - serverTime : 0;
            
            if (Math.abs(timeDiff) < 60000) {
                timeDiff = 0;
            }

            const timestamp = Date.now() - timeDiff;
            const payload = typeof input === "string" ? input : JSON.stringify(this.sort(input));
            const digest = `${payload}${timestamp}${SECRECT_KEY}`;
            
            const encoder = new TextEncoder();
            const data = encoder.encode(digest);
            const hashBuffer = await crypto.subtle.digest("SHA-256", data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const signature = hashArray.map(byte => byte.toString(16).padStart(2, "0")).join("");

            return {
                url: input,
                ts: timestamp,
                _ts: FIXED_TIMESTAMP,
                _tsc: timeDiff,
                _s: signature
            };
        } catch (error) {
            console.error('Signature Generation Error:', error);
            throw error;
        }
    }

    cleanUrl(url) {
                try {
            const urlObj = new URL(url);
            urlObj.search = '';             return urlObj.toString();
        } catch (error) {
            return url;
        }
    }

    async download() {
        try {
            const signature = await this.genSignature(this.url);
            console.log('Sending request with signature:', signature);
            
            const response = await this.req(
                BASE_URL + URL_CONVERT,
                "POST",
                JSON.stringify(signature)
            );
            
            const result = await response.json();
            console.log('API Response:', result);
            const postDate = new Date(result.meta?.taken_at * 1000);
            const formattedDate = postDate.toLocaleString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            return {
                platform: 'instagram',
                caption: result.meta?.title || '',
                author: result.meta?.username || '',
                username: result.meta?.username || '',
                'img-thumb': result.thumb || null,
                like: result.meta?.like_count || 0,
                views: 0,
                comments: result.meta?.comment_count || 0,
                date: formattedDate,
                downloads: result.url.map(media => {
                    let type = 'download_video_hd';
                    if (media.type === 'jpg' || media.type === 'jpeg' || media.type === 'png') {
                        type = 'download_image';
                    }
                    
                    return {
                        type: type,
                        url: media.url,
                        filename: `instagram_${Date.now()}.${media.ext}`
                    };
                })
            };

        } catch (error) {
            console.error('Instagram Download Error:', error);
            throw new Error('Gagal mengunduh dari Instagram: ' + error.message);
        }
    }
}

module.exports = InstagramDownloader;