import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// List of Bible books in order
const BIBLE_BOOKS = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
    "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
    "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
    "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
    "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations",
    "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
    "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk",
    "Zephaniah", "Haggai", "Zechariah", "Malachi",
    "Matthew", "Mark", "Luke", "John", "Acts",
    "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
    "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy",
    "2 Timothy", "Titus", "Philemon", "Hebrews", "James",
    "1 Peter", "2 Peter", "1 John", "2 John", "3 John",
    "Jude", "Revelation"
];

interface BibleVerse {
    verse: string;
    text: string;
}

interface BibleChapter {
    chapter: string;
    verses: BibleVerse[];
}

interface BibleBook {
    book: string;
    chapters: BibleChapter[];
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const book = searchParams.get('book');
    const chapter = searchParams.get('chapter');
    const lang = searchParams.get('lang') || 'english'; // 'english' or 'telugu'

    // If no book specified, return list of books
    if (!book) {
        return NextResponse.json({ books: BIBLE_BOOKS });
    }

    // Validate language
    const validLangs = ['english', 'telugu'];
    if (!validLangs.includes(lang)) {
        return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
    }

    try {
        const filePath = path.join(process.cwd(), 'public', 'bible', lang, `${book}.json`);

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const bibleBook: BibleBook = JSON.parse(fileContent);

        // If chapter is specified, return only that chapter
        if (chapter) {
            const selectedChapter = bibleBook.chapters.find(c => c.chapter === chapter);
            if (!selectedChapter) {
                return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
            }
            return NextResponse.json(selectedChapter);
        }

        // Otherwise return the whole book (might be large, but useful for caching)
        return NextResponse.json(bibleBook);

    } catch (error) {
        console.error('Bible API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
