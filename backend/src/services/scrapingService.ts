import axios from 'axios';
import * as cheerio from 'cheerio';

export const scrapeUrl = async (url: string): Promise<{ title: string; content: string; links: string[] }> => {
    try {
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);

        // Extract links before removing elements (nav/header might have useful links)
        const links: string[] = [];
        $('a').each((_, element) => {
            const href = $(element).attr('href');
            if (href) {
                try {
                    // Resolve relative URLs
                    const absoluteUrl = new URL(href, url).href;
                    links.push(absoluteUrl);
                } catch (e) {
                    // Ignore invalid URLs
                }
            }
        });

        // Remove scripts, styles, and other non-content elements
        $('script, style, nav, footer, header, aside').remove();

        const title = $('title').text().trim();
        const content = $('body').text().replace(/\s+/g, ' ').trim();

        // Deduplicate links
        const uniqueLinks = Array.from(new Set(links));

        return { title, content, links: uniqueLinks };
    } catch (error) {
        console.error('Error scraping URL:', error);
        throw new Error('Failed to scrape URL');
    }
};
