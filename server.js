const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto').webcrypto;
global.crypto = crypto;
const Downloader = require('./src/downloader');
const app = express();
const PORT = process.env.PORT || 3996; // PORT
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.get('/', (_, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/download', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({
                error: 'URL cannot be empty'
            });
        }

        const downloader = new Downloader();
        const platform = downloader.getPlatform(url);

        if (!platform) {
            return res.status(400).json({
                error: 'Platform not supported'
            });
        }

        const result = await downloader.download(url);
        
        if (!result) {
            return res.status(404).json({
                error: 'Media not found'
            });
        }

        res.json(result);

    } catch (error) {
        console.error('Download Error:', error);
        res.status(500).json({
            error: error.message || 'Error occurred while downloading media'
        });
    }
});


app.use((err, _, res, _next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        error: 'Internal server error'
    });
});


app.use((_, res) => {
    res.status(404).json({
        error: 'Endpoint not found'
    });
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`URL: http://localhost:${PORT}`);
    
    
    const downloader = new Downloader();
    const platforms = Object.keys(downloader.platformPatterns);
    console.log('\nSupported platforms:');
    platforms.forEach(platform => {
        console.log(`- ${platform}`);
    });
});


process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});


process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
});
