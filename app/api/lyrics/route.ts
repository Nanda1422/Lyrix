import { NextResponse } from 'next/server';
import Genius from 'genius-lyrics';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const Client = new Genius.Client();

async function fetchWithCurl(url: string): Promise<string> {
    try {
        const { stdout } = await execAsync(`curl.exe -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" "${url}"`);
        return stdout;
    } catch (error) {
        console.error("Curl failed:", error);
        return '';
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const url = searchParams.get('url');

    if (!id && !url) {
        return NextResponse.json({ error: 'Query parameter "id" or "url" is required' }, { status: 400 });
    }

    let debugInfo: any = {};

    try {
        let songUrl = url;
        let lyrics = '';

        // If no URL provided, try to get it from ID (might fail without token)
        if (!songUrl && id) {
            try {
                const song = await Client.songs.get(Number(id));
                songUrl = song?.url;
                // Try standard fetch if we have the song object
                if (song) {
                    try {
                        lyrics = await song.lyrics();
                    } catch (e) {
                        console.log("Standard lyrics fetch failed:", e);
                    }
                }
            } catch (e) {
                console.log("Failed to fetch song metadata:", e);
            }
        }

        // Fallback to manual scraping if standard fetch failed or we have a URL
        if ((!lyrics || !lyrics.trim()) && songUrl) {
            console.log(`Scraping lyrics from: ${songUrl}`);
            try {
                let html = '';
                let $: any;

                if (songUrl.includes('teluguchristianresource.com')) {
                    // Try fetch first
                    try {
                        const response = await fetch(songUrl, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                                'Accept-Language': 'en-US,en;q=0.9',
                                'Referer': 'https://christianlyricz.com/'
                            }
                        });
                        html = await response.text();
                        debugInfo.source = 'fetch';
                    } catch (e) {
                        console.log("Fetch failed:", e);
                    }

                    $ = cheerio.load(html);
                    let tabs = $('.su-tabs-pane');

                    // If fetch failed to get tabs, try curl
                    if (tabs.length === 0) {
                        console.log("Fetch failed to get tabs, trying curl...");
                        html = await fetchWithCurl(songUrl);
                        debugInfo.source = 'curl';
                        $ = cheerio.load(html);
                        tabs = $('.su-tabs-pane');
                    }

                    debugInfo.htmlLength = html.length;
                    debugInfo.tabsGlobalCount = tabs.length;

                    if (tabs.length > 0) {
                        lyrics = '';
                        tabs.each((i: any, el: any) => {
                            const title = $(el).attr('data-title') || '';
                            const paneContent = $(el).clone();

                            // Clean up pane content
                            paneContent.find('script, style, .sharedaddy, .related-posts').remove();
                            paneContent.find('br').replaceWith('\n');
                            paneContent.find('p, h4, h3, h2, h1, div').each((_: any, tag: any) => {
                                $(tag).append('\n');
                            });

                            const text = paneContent.text().trim();
                            if (text) {
                                if (title.includes('Telugu')) {
                                    lyrics += `Telugu Lyrics\n${text}\n\n`;
                                } else if (title.includes('English')) {
                                    lyrics += `English Lyrics\n${text}\n\n`;
                                } else {
                                    lyrics += `${text}\n\n`;
                                }
                            }
                        });
                    } else {
                        // Fallback to full content
                        const content = $('.entry-content');
                        debugInfo.fallback = true;
                        debugInfo.contentLength = content.length;

                        // Clean up
                        content.find('script').remove();
                        content.find('style').remove();
                        content.find('.sharedaddy').remove();
                        content.find('.related-posts').remove();

                        // Preserve newlines
                        content.find('br').replaceWith('\n');
                        content.find('p, h4, h3, h2, h1').each((i: any, el: any) => {
                            $(el).append('\n');
                        });

                        lyrics = content.text();
                    }
                } else {
                    const response = await fetch(songUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                            'Accept-Language': 'en-US,en;q=0.9',
                            'Referer': 'https://christianlyricz.com/'
                        }
                    });
                    html = await response.text();
                    $ = cheerio.load(html);

                    // Check for ChristianLyricz specific structure
                    if (songUrl.includes('christianlyricz.com')) {
                        // ChristianLyricz specific scraping
                        const entryContent = $('.entry-content');

                        // Check for tabs (Lyrics, Audio, Chords)
                        // Try multiple selectors
                        let tabs = entryContent.find('.responsive-tabs__panel');
                        if (tabs.length === 0) {
                            tabs = entryContent.find('.tabcontent');
                        }

                        let targetContainer = entryContent;
                        if (tabs.length > 0) {
                            // Try to find the one with "Lyrics" or just the first one
                            targetContainer = tabs.first();
                        }

                        // Extract text from paragraphs to avoid noise
                        let extractedText = '';
                        targetContainer.find('p').each((i: any, el: any) => {
                            const text = $(el).text().trim();
                            if (text) {
                                extractedText += text + '\n\n';
                            }
                        });

                        // If no paragraphs found, try direct text (fallback)
                        if (!extractedText.trim()) {
                            // Clean up noise first
                            targetContainer.find('script, style, .sharedaddy, .related-posts, .addtoany_share_save_container, .jp-audio, div[class*="share"]').remove();
                            targetContainer.find('br').replaceWith('\n');
                            extractedText = targetContainer.text();
                        }

                        lyrics = extractedText;

                        debugInfo.source = 'christianlyricz_scraper_v2';
                        debugInfo.tabsFound = tabs.length;
                        debugInfo.paragraphsFound = targetContainer.find('p').length;
                    } else {
                        // Default Genius scraping
                        // Select lyrics containers (Genius uses data-lyrics-container="true")
                        const containers = $('[data-lyrics-container="true"]');

                        if (containers.length > 0) {
                            containers.each((i: any, el: any) => {
                                $(el).find('br').replaceWith('\n');
                                lyrics += $(el).text() + '\n\n';
                            });
                        } else {
                            // Fallback for older pages
                            $('.lyrics').each((i: any, el: any) => {
                                $(el).find('br').replaceWith('\n');
                                lyrics += $(el).text() + '\n\n';
                            });
                        }
                    }
                }
            } catch (e: any) {
                console.error("Scraping failed:", e);
                debugInfo.error = e.message;
            }
        }

        if (!lyrics || !lyrics.trim()) {
            return NextResponse.json({ error: 'Lyrics not found for this song', debug: debugInfo }, { status: 404 });
        }

        // Clean the lyrics
        let cleanedLyrics = lyrics
            .replace(/\[.*?\]/g, '') // Remove [Verse], [Chorus], etc.
            .replace(/\{.*?\}/g, '') // Remove {Metadata} if any
            .replace(/<.*?>/g, '')   // Remove HTML tags if any slipped through
            .replace(/Lyricist:.*$/gm, '') // Remove Lyricist lines
            .replace(/పాట రచయిత:.*$/gm, '') // Remove Telugu Lyricist lines
            .replace(/Download Lyrics as:.*$/gm, '') // Remove Download link text
            .trim();

        // Truncate at "Audio" or "Chords" using split (Nuclear option)
        let parts = cleanedLyrics.split(/Audio\s*[\r\n]/i);
        if (parts.length > 1) {
            cleanedLyrics = parts[0];
        } else {
            parts = cleanedLyrics.split(/\nAudio/i);
            if (parts.length > 1) {
                cleanedLyrics = parts[0];
            }
        }

        parts = cleanedLyrics.split(/Chords\s*[\r\n]/i);
        if (parts.length > 1) {
            cleanedLyrics = parts[0];
        } else {
            parts = cleanedLyrics.split(/\nChords/i);
            if (parts.length > 1) {
                cleanedLyrics = parts[0];
            }
        }

        // Parse Variants (Telugu vs English)
        const variants: any = {};

        // Helper to normalize newlines:
        const normalizeSpacing = (text: string) => {
            return text
                .replace(/\r\n/g, '\n') // Normalize CRLF
                // Mark stanzas (3+ newlines with optional whitespace)
                .replace(/\n\s*\n\s*\n[\s\n]*/g, '___STANZA___')
                // Reduce double newlines (lines) to single (handle whitespace)
                .replace(/\n\s*\n/g, '\n')
                // Restore stanzas as double
                .replace(/___STANZA___/g, '\n\n')
                .trim();
        };

        cleanedLyrics = normalizeSpacing(cleanedLyrics);

        const teluguMatch = cleanedLyrics.match(/Telugu Lyrics\s*([\s\S]*?)(?=English Lyrics|$)/i);
        const englishMatch = cleanedLyrics.match(/English Lyrics\s*([\s\S]*?)$/i);

        if (teluguMatch && teluguMatch[1].trim()) {
            variants.telugu = teluguMatch[1].trim();
        }

        if (englishMatch && englishMatch[1].trim()) {
            variants.english = englishMatch[1].trim();
        }

        // Remove headers for default view
        cleanedLyrics = cleanedLyrics
            .replace(/Telugu Lyrics/gi, '')
            .replace(/English Lyrics/gi, '')
            .trim();

        // Ensure we don't have excessive newlines at the end
        cleanedLyrics = cleanedLyrics.replace(/\n{3,}/g, '\n\n');

        return NextResponse.json({
            lyrics: cleanedLyrics,
            variants: Object.keys(variants).length > 0 ? variants : undefined,
            debug: debugInfo
        });
    } catch (error: any) {
        console.error('Lyrics fetch error:', error);
        // Log to file for debugging
        try {
            fs.appendFileSync('lyrics_error.log', `${new Date().toISOString()} - Error: ${error.message}\nStack: ${error.stack}\n`);
        } catch (e) {
            console.error("Failed to write to log file:", e);
        }

        return NextResponse.json({
            error: 'Failed to fetch lyrics',
            details: error.message || error.toString(),
            debug: debugInfo
        }, { status: 500 });
    }
}
