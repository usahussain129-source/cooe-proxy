// server.js (Node.js)
const express = require('express');
const puppeteer = require('puppeteer-core');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(express.json());

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'; // Tera Chrome path

let globalBrowser = null;

async function getBrowser() {
    if (!globalBrowser) {
        globalBrowser = await puppeteer.launch({
            executablePath: CHROME_PATH,
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }
    return globalBrowser;
}

// Ye API PHP se call hogi
app.post('/api/check-login', async (req, res) => {
    const { mobile, password } = req.body;
    let context, page;
    try {
        const browser = await getBrowser();
        context = await browser.createBrowserContext();
        page = await context.newPage();

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
        
        // 1. Real site pe jao, taaki Cloudflare clear ho aur real Device ID mile
        await page.goto('https://cooe02.in/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));

        // 2. Browser ke andar se login API hit karo
        const encryptedPass = require('crypto').createHash('md5').update(password).digest('hex');
        
        const result = await page.evaluate(async (mob, passHash) => {
            try {
                const loginRes = await fetch(`https://cooe02.in/user/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        mobile_number: mob,
                        password: passHash,
                        host: "cooe02.in",
                        verify_code: "",
                        device_id: localStorage.getItem('device_id') || null // Real device ID yahan se milegi
                    })
                });
                return await loginRes.json();
            } catch(e) { return { error: e.message }; }
        }, mobile, encryptedPass);

        await context.close();
        
        if(result.error) throw new Error(result.error);
        res.json({ status: 'success', data: result });

    } catch (err) {
        if (context) try { await context.close(); } catch(e) {}
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.listen(PORT, () => console.log(`🚀 Proxy Server running on port ${PORT}`));
