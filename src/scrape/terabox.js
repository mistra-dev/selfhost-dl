class TeraboxDownloader {
    constructor(url) {
        this.url = url;
    }

    async getInfo() {
        try {
            const url = `https://terabox.hnn.workers.dev/api/get-info?shorturl=${this.url.split("/").pop()}&pwd=`;
            const headers = {
                "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
                "Referer": "https://terabox.hnn.workers.dev/",
            };
            const response = await fetch(url, { headers });
            if (!response.ok) {
                throw new Error(`Gagal mengambil informasi file: ${response.status} ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Gagal mengambil informasi file:", error);
            throw error;
        }
    }

    async getDownloadLink(fsId, shareid, uk, sign, timestamp) {
        try {
            const url = "https://terabox.hnn.workers.dev/api/get-download";
            const headers = {
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
                "Referer": "https://terabox.hnn.workers.dev/",
            };
            const data = {
                shareid: shareid,
                uk: uk,
                sign: sign,
                timestamp: timestamp,
                fs_id: fsId,
            };
            const response = await fetch(url, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                throw new Error(`Gagal mengambil link download: ${response.status} ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Gagal mengambil link download:", error);
            throw error;
        }
    }

    async download() {
        try {
            const { list, shareid, uk, sign, timestamp } = await this.getInfo();
            if (!list) {
                throw new Error("File tidak ditemukan");
            }

            const downloads = await Promise.all(list.map(async (file) => {
                const { downloadLink } = await this.getDownloadLink(file.fs_id, shareid, uk, sign, timestamp);
                
                
                let type = 'download_video_hd'; 
                const ext = file.filename.split('.').pop().toLowerCase();
                
                if (['mp4', 'mkv', 'avi'].includes(ext)) {
                    type = 'download_video_hd';
                } else if (['mp3', 'wav', 'ogg'].includes(ext)) {
                    type = 'download_audio';
                } else if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
                    type = 'download_image';
                }

                return {
                    type: type,
                    url: downloadLink,
                    filename: file.filename,
                    size: file.size
                };
            }));

            
            return {
                platform: 'terabox',
                caption: list[0].filename, 
                author: 'Terabox User',
                username: 'terabox_user',
                'img-thumb': list[0].thumbs?.url || '', 
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
                downloads: downloads
            };
        } catch (error) {
            console.error("Terabox Download Error:", error);
            throw new Error("Gagal mengunduh dari Terabox: " + error.message);
        }
    }
}

module.exports = TeraboxDownloader;