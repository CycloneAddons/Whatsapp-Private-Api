const express = require('express');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const app = express();
const port = 3000;

app.use(express.json());

// ✅ Use LocalAuth to save sessions automatically:
const client = new Client({
    puppeteer: {
            // optional but recommended to avoid path issues
           args: ['--no-sandbox', '--disable-setuid-sandbox'],
           headless: true, // or false if you want to see the browser
       },
    authStrategy: new LocalAuth() // Automatically saves and restores session in .wwebjs_auth folder
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp client is ready and session restored!');
});

client.initialize();

app.post('/send-message', async (req, res) => {
    const { number, message, media } = req.body;

    if (!number) {
        return res.status(400).json({ success: false, message: 'Number is required' });
    }

    if (!message) {
        return res.status(400).json({ success: false, message: 'Message or media is required' });
    }

    try {
        const formattedNumber = `${number}@c.us`;
        const isRegistered = await client.isRegisteredUser(formattedNumber);
        if (!isRegistered) {
            return res.status(400).json({ success: false, message: 'Number is not registered on WhatsApp' });
        }

        if (media) {
            // If media is provided, send a media message
            const mediaObject = await MessageMedia.fromUrl(media);
            await client.sendMessage(formattedNumber, mediaObject, { caption: message || '' });
        } else {
            // If no media is provided, send a normal text message
            await client.sendMessage(formattedNumber, message || '');
        }

        res.json({ success: true, message: 'Message sent successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to send message', error });
    }
});

app.listen(port, () => {
    console.log(`API server running at http://localhost:${port}`);
});
