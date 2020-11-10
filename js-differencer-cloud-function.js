const puppeteer = require('puppeteer')
const devices = puppeteer.devices
const PixelDiff = require('pixel-diff')
const fs = require('fs')

/* Device for mobile emulation */
const phone = devices['Nexus 5X']

const createImg = async (url, device) => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'], timeout: 10000 })
    const page = await browser.newPage()

    // Emulate a phone or standard desktop size.
    if (device === 'mobile') {
        await page.emulate(phone)
    } else {
        await page.setViewport({ width: 1920, height: 1080 })
    }
    // Navigate to URL
    await page.goto(url)

    // Take an image with JavaScript
    const imageJavascript = await page.screenshot()

    // Disable JavaScript
    await page.setJavaScriptEnabled(false)

    // Navigate to URL
    await page.goto(url)

    // Take an image without JavaScript
    const imageNoJavascript = await page.screenshot()

    // Close Puppeteer
    await browser.close()

    // const imageDiff = null;
    const diff = new PixelDiff({
        imageA: imageJavascript,
        imageB: imageNoJavascript,
        composeLeftToRight: true,
        thresholdType: PixelDiff.THRESHOLD_PERCENT,
        threshold: 0.01, // 1% threshold
        imageOutputPath: 'tmp/image.png'
    })

    return diff.runWithPromise()
        .then(result => {
            return fs.readFileSync('tmp/image.png')
        })
        .catch(error => {
            throw error
        })
}

exports.API = (req, res) => {
    res.set('Access-Control-Allow-Origin', '*')

    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'GET')
        res.set('Access-Control-Allow-Headers', 'Content-Type')
        res.set('Access-Control-Max-Age', '3600')

        res.status(204).send('')
    } else {
        const url = req.query.url
        const device = req.query.device

        createImg(url, device)
            .then(e => {
                res.setHeader('Content-Type', ' image/png')
                res.status(200).send(e)
            })
            .catch(e => {
                res.status(500).send('Something went wrong.')
            })
    }
}
