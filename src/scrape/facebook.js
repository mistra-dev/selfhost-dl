const axios = require("axios");
const patterns = require("../system/patterns");

class FacebookDownloader {
    constructor(url) {
        this.url = url;
        if (!patterns.facebook.test(url)) {
            throw new Error("invalid url. please enter a valid facebook url");
        }
    }

    async download() {
        try {
            const results = await this.getFacebookData(this.url);
            if (!results || !results.downloads || results.downloads.length === 0) {
                throw new Error("no media found");
            }
            return results;
        } catch (error) {
            throw new Error('error while downloading from facebook: ' + error.message);
        }
    }

    async getFacebookData(url) {
        if (!url.includes('facebook.com')) {
            url = `https://www.facebook.com/${url}`;
        }
        
        try {
            const headers = {
                "sec-fetch-user": "?1",
                "sec-ch-ua-mobile": "?0",
                "sec-fetch-site": "none",
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "cache-control": "max-age=0",
                authority: "www.facebook.com",
                "upgrade-insecure-requests": "1",
                "accept-language": "en-GB,en;q=0.9,tr-TR;q=0.8,tr;q=0.7,en-US;q=0.6",
                "sec-ch-ua": '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
                accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            };

            const { data } = await axios.get(url, { headers });
            const extractData = data.replace(/&quot;/g, '"').replace(/&amp;/g, "&");

            const videoUrl = this.match(extractData, /"browser_native_hd_url":"(.*?)"/, /hd_src\s*:\s*"([^"]*)"/,
                                                  /"browser_native_sd_url":"(.*?)"/, /sd_src\s*:\s*"([^"]*)"/)?.[1];
            const title = this.match(extractData, /<meta\sname="description"\scontent="(.*?)"/)?.[1] || 
                         this.match(extractData, /<title>(.*?)<\/title>/)?.[1] || "Facebook Video";
            const thumbnail = this.match(extractData, /"preferred_thumbnail":{"image":{"uri":"(.*?)"/)?.[1];

            if (!videoUrl) {
                throw new Error("can't find download link");
            }

            return {
                platform: 'facebook',
                metadata: {
                    title: this.parseString(title),
                    thumbnail: this.parseString(thumbnail || ''),
                    author: {
                        name: 'Facebook User'
                    }
                },
                downloads: [{
                    type: 'video',
                    url: this.parseString(videoUrl),
                    quality: 'Original',
                    filename: `facebook_${Date.now()}.mp4`
                }]
            };

        } catch (error) {
            console.error("Facebook Scraping Error:", error);
            throw new Error(error.message || "error while getting data from facebook");
        }
    }

    match(data, ...patterns) {
        for (const pattern of patterns) {
            const result = data.match(pattern);
            if (result) return result;
        }
        return null;
    }

    parseString(string) {
        try {
            return JSON.parse(`{"text": "${string}"}`).text;
        } catch (e) {
            return string;
        }
    }
}

module.exports = FacebookDownloader;
