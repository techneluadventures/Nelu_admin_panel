import puppeteer from 'puppeteer';
import { logger } from './logger.js';

let browser = null;

export async function getBrowser() {
  if (browser) {
    try {
      // PRODUCTION GRADE: Deep Health Check
      if (browser.isConnected()) {
        const pages = await browser.pages();
        if (pages.length < 10) return browser; // Only reuse if not overloaded
        logger.warn('Browser overloaded, cycling for performance...');
      }
      await browser.close();
    } catch (err) {
      logger.warn('Cleaning up fragmented browser instance...');
    }
    browser = null;
  }

  logger.info('🚀 Deploying Fresh High-Capacity Puppeteer Instance...');
  browser = await puppeteer.launch({
    headless: true,
    timeout: 30000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-extensions'
    ]
  });

  browser.on('disconnected', () => {
    logger.warn('Puppeteer browser disconnected');
    browser = null;
  });

  return browser;
}

export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
