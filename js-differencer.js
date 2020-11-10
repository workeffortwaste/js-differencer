#!/usr/bin/env node

/*
 * SPDX-License-Identifier: Apache-2.0
 */

/* Args */
const yargs = require('yargs')

const options = yargs
  .usage('Usage: --url <url> --device [mobile|desktop] --output <filename>')
  .example('js-differencer --url https://blacklivesmatter.com/ --device mobile --output difference.png')
  .default({ device: 'mobile', output: 'difference.png' })
  .describe('url', 'Website URL')
  .describe('device', 'Device type [mobile|desktop]')
  .describe('output', 'Output filename')
  .demandOption(['url'])
  .argv

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
        imageOutputPath: options.output
    })

    return diff.runWithPromise()
        .then(result => {
            return 'Image created.'
        })
        .catch(error => {
            throw error
        })
}

createImg(options.url, options.device).then(e => console.log(e)).catch(e => console.log(e))

