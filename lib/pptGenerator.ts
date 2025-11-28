import PptxGenJS from 'pptxgenjs';
import { PresentationSettings } from './types';

export async function generatePPT(text: string, settings: PresentationSettings, fileName: string = 'Lyrics2PPT') {
    const pptx = new PptxGenJS();

    // Set Layout
    pptx.layout = 'LAYOUT_16x9';

    // Parse lyrics
    // Split by double line breaks to get verses
    const verses = text.split(/\n\n+/).filter(v => v.trim() !== '');

    verses.forEach((verse) => {
        const slide = pptx.addSlide();

        // Background
        if (settings.backgroundType === 'color') {
            slide.background = { color: settings.backgroundColor };
        } else if (settings.backgroundType === 'image' && settings.backgroundImage) {
            slide.background = { data: settings.backgroundImage };
        }

        // Text Content
        let slideText = verse.trim();
        if (slideText.startsWith('-')) {
            slideText = slideText.substring(1).trim();
        }

        // Text Case
        if (settings.fontCase === 'uppercase') {
            slideText = slideText.toUpperCase();
        } else if (settings.fontCase === 'lowercase') {
            slideText = slideText.toLowerCase();
        } else if (settings.fontCase === 'capitalize') {
            slideText = slideText.replace(/\b\w/g, l => l.toUpperCase());
        }

        slide.addText(slideText, {
            x: 0,
            y: 0,
            w: '100%',
            h: '100%',
            fontSize: settings.fontSize,
            color: settings.fontColor.replace('#', ''),
            bold: settings.fontBold,
            align: settings.textAlign,
            valign: 'middle',
            lineSpacing: settings.lineHeight * settings.fontSize,
            fontFace: 'Arial',
            ...(settings.textStroke && {
                outline: { size: settings.textStrokeWidth, color: settings.textStrokeColor.replace('#', '') }
            })
        });
    });

    // Save
    const finalFileName = fileName.endsWith('.pptx') ? fileName : `${fileName}.pptx`;
    await pptx.writeFile({ fileName: finalFileName });
}
