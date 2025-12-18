import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export const scrapeUrl = async (url: string): Promise<{ title: string; content: string; links: string[] }> => {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            dumpio: true, // Log browser stdout/stderr to process stdout/stderr
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-software-rasterizer',
                '--disable-features=IsolateOrigins,site-per-process', // Memory: Disable strict isolation
                '--blink-settings=imagesEnabled=false', // Memory: Disable images
                '--mute-audio' // Memory: Disable audio
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
        });

        const page = await browser.newPage();

        // BLOCK RESOURCES (Images, CSS, Fonts, Media) to save bandwidth/memory
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const resourceType = req.resourceType();
            if (['image', 'stylesheet', 'font', 'media', 'other'].includes(resourceType)) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // Set a realistic User-Agent (Mac Chrome) to avoid detection
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Add extra headers
        await page.setExtraHTTPHeaders({
            'Upgrade-Insecure-Requests': '1',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Referer': 'https://www.google.com/',
        });

        console.log(`Navigating to ${url}`);

        let retries = 3;
        while (retries > 0) {
            try {
                // Increased timeout for slow sites, but "domcontentloaded" is usually fast
                const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
                if (response) {
                    // console.log(`Response status: ${response.status()}`); // Debug log
                    if (response.status() >= 400 && response.status() !== 404) { // Allow 404 for now to see if content extracts
                        console.warn(`Warning: Response status ${response.status()}`);
                    }
                }

                await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 2000) + 1000));
                break;
            } catch (error: any) {
                const isRetryable = error.message.includes('detached Frame') ||
                    error.message.includes('Execution context was destroyed') ||
                    error.message.includes('Target closed') ||
                    error.message.includes('LifecycleWatcher disposed') ||
                    error.message.includes('Protocol error');

                if (isRetryable && retries > 1) {
                    console.warn(`Navigation error (${error.message}), retrying... (${retries - 1} attempts left)`);
                    retries--;
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } else {
                    throw error;
                }
            }
        }

        // Add a random delay (1-3 seconds)
        const delay = Math.floor(Math.random() * 2000) + 1000;
        console.log(`Waiting ${delay}ms for dynamic content...`);
        await new Promise(resolve => setTimeout(resolve, delay));

        let html = '';
        try {
            html = await page.content();
            // console.log(`Raw HTML length: ${html.length}`);
            require('fs').writeFileSync('debug_raw.html', html);
        } catch (error: any) {
            if (error.message.includes('detached Frame') || error.message.includes('Execution context was destroyed') || error.message.includes('Target closed')) {
                console.warn('Frame detached or context destroyed during content extraction, reloading and retrying...');
                try {
                    await page.reload({ waitUntil: 'domcontentloaded' });
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    html = await page.content();
                } catch (retryError) {
                    console.error('Failed to recover from detached frame:', retryError);
                    throw error; // Throw original error if recovery fails
                }
            } else {
                throw error;
            }
        }

        // Clean HTML *before* passing to Readability? No, let Readability handle it first.
        // If we clean too aggressively, we might remove the container holding the article.
        const dom = new JSDOM(html, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        // Fallback or use Readability result
        let title = '';
        let content = '';

        if (article && article.textContent && article.textContent.length > 200) {
            console.log('Readability successfully extracted content.');
            title = article.title || dom.window.document.title;
            content = article.textContent.replace(/\s+/g, ' ').trim();
        } else {
            console.warn('Readability failed or content too short, falling back to Cheerio.');
            const $fallback = cheerio.load(html);
            // Remove scripts, styles, and other non-content elements
            $fallback('script, style, nav, footer, header, aside, iframe, noscript, .ad, .ads, .social-share, .menu').remove();
            title = $fallback('head > title').text().trim();
            content = $fallback('body').text().replace(/\s+/g, ' ').trim();
        }

        // Link extraction (always use Cheerio on full HTML for links)
        const $links = cheerio.load(html);
        $links('script, style, nav, footer, header, aside, iframe, noscript, .ad, .ads, .social-share, .menu').remove();

        const baseUrl = new URL(url);
        const links: string[] = [];

        $links('a').each((_, element) => {
            const href = $links(element).attr('href');
            if (href) {
                try {
                    const absoluteUrl = new URL(href, url);

                    // Filter: Only same domain
                    if (absoluteUrl.hostname !== baseUrl.hostname && !absoluteUrl.hostname.endsWith('.' + baseUrl.hostname) && !baseUrl.hostname.endsWith('.' + absoluteUrl.hostname)) {
                        return;
                    }

                    // Filter: Common non-content patterns
                    const junkPatterns = [
                        '/login', '/signup', '/register', '/signin', '/signout', '/logout',
                        'facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com', 'pinterest.com',
                        'mailto:', 'tel:', 'javascript:', '#',
                        '/ads/', '/advertisement/', 'doubleclick',
                        'share=', 'sharer'
                    ];

                    if (junkPatterns.some(pattern => absoluteUrl.href.toLowerCase().includes(pattern))) {
                        return;
                    }

                    links.push(absoluteUrl.href);
                } catch (e) {
                    // Ignore invalid URLs
                }
            }
        });

        // Deduplicate links
        const uniqueLinks = Array.from(new Set(links));

        console.log(`Scraping completed for ${url}: Title="${title.substring(0, 30)}...", ContentLength=${content.length}, LinksFound=${uniqueLinks.length}`);

        return { title, content, links: uniqueLinks };
    } catch (error) {
        console.error('Error scraping URL:', error);
        throw new Error('Failed to scrape URL');
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};
