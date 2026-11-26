const express = require('express');
const puppeteer = require('puppeteer');
const crypto = require('crypto');

const app = express();
app.use(express.json());

app.post('/api/login', async (req, res) => {
    const { mobile, password } = req.body;
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        const page = await browser.newPage();
        
        // Real Chrome jaisa UA set karo
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
        
        // Cloudflare clear karne ke liye site open karo
        await page.goto('https://cooe02.in/', { waitUntil: 'networkidle2', timeout: 45000 });
        await new Promise(r => setTimeout(r, 2000));

        const passHash = crypto.createHash('md5').update(password).digest('hex');

        // Browser ke andar API call karo
        const result = await page.evaluate(async (mob, hash) => {
            const res = await fetch(`https://cooe02.in/user/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mobile_number: mob,
                    password: hash,
                    host: "cooe02.in",
                    verify_code: "",
                    device_id: localStorage.getItem('device_id') || null
                })
            });
            return await res.json();
        }, mobile, passHash);

        res.json({ status: 'success', data: result });
    } catch (error) {
        console.error("Puppeteer Error:", error.message);
        res.status(500).json({ status: 'error', message: error.message });
    } finally {
        if (browser) await browser.close();
    }
});

app.get('/', (req, res) => res.send('Proxy is running!'));

app.listen(process.env.PORT || 5000, () => console.log('Proxy Running'));
