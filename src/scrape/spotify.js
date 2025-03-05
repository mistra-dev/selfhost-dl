const axios = require("axios");
const platformPatterns = require('../system/patterns');

class SpotifyDownloader {
    constructor(url) {
        this.url = url;
    }

        async download() {
        const BASEURL = "https://api.fabdl.com";
        const headers = {
            Accept: "application/json, text/plain, */*",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
        };

        try {
                        if (!platformPatterns.spotify.test(this.url)) {
                throw new Error('URL Spotify tidak valid');
            }

            const response = await axios.get(`${BASEURL}/spotify/get?url=${this.url}`, { headers });
            const info = response.data;

                        console.log('API Response:', info);

            if (!info.result) {
                throw new Error("Tidak ada hasil ditemukan dalam respons.");
            }

            const { gid, id, name, image, duration_ms } = info.result;

            const downloadResponse = await axios.get(`${BASEURL}/spotify/mp3-convert-task/${gid}/${id}`, { headers });
            const downloadInfo = downloadResponse.data;

                        console.log('Download API Response:', downloadInfo);

            if (!downloadInfo.result || !downloadInfo.result.download_url) {
                throw new Error("Download URL tidak ditemukan dalam respons.");
            }

            return {
                platform: 'spotify',
                downloads: [{
                    type: 'audio',
                    url: `${BASEURL}${downloadInfo.result.download_url}`,
                    filename: `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`
                }],
                metadata: {
                    title: name,
                    duration: duration_ms,
                    cover: image,
                }
            };
        } catch (error) {
            console.error("Error downloading Spotify track:", error.message);
            throw new Error(error.message);
        }
    }
}

module.exports = SpotifyDownloader;