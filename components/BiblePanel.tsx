"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Book, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BibleVerse {
    verse: string;
    text: string;
}

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

interface BiblePanelProps {
    onVerseSelect: (text: string) => void;
}

export function BiblePanel({ onVerseSelect }: BiblePanelProps) {
    const [selectedBook, setSelectedBook] = useState('Genesis');
    const [selectedChapter, setSelectedChapter] = useState(1);
    const [language, setLanguage] = useState<'english' | 'telugu'>('english');
    const [verses, setVerses] = useState<BibleVerse[]>([]);
    const [loading, setLoading] = useState(false);
    const [availableChapters, setAvailableChapters] = useState<number[]>([]);

    // Fetch Book Info (Chapter count)
    useEffect(() => {
        const fetchBookInfo = async () => {
            try {
                const res = await fetch(`/api/bible?book=${encodeURIComponent(selectedBook)}&lang=${language}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.chapters) {
                        setAvailableChapters(Array.from({ length: data.chapters.length }, (_, i) => i + 1));
                    }
                } else {
                    // Fallback if book not found (e.g. not downloaded yet)
                    setAvailableChapters(Array.from({ length: 50 }, (_, i) => i + 1));
                }
            } catch (e) {
                console.error(e);
                setAvailableChapters(Array.from({ length: 50 }, (_, i) => i + 1));
            }
        };
        fetchBookInfo();
    }, [selectedBook, language]);

    // Fetch Chapter Verses
    useEffect(() => {
        const fetchChapter = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/bible?book=${encodeURIComponent(selectedBook)}&chapter=${selectedChapter}&lang=${language}`);
                if (res.ok) {
                    const data = await res.json();
                    setVerses(data.verses || []);
                } else {
                    setVerses([]);
                }
            } catch (error) {
                console.error("Failed to fetch chapter:", error);
                setVerses([]);
            } finally {
                setLoading(false);
            }
        };

        fetchChapter();
    }, [selectedBook, selectedChapter, language]);

    const handleNextChapter = () => {
        if (selectedChapter < availableChapters.length) {
            setSelectedChapter(prev => prev + 1);
        }
    };

    const handlePrevChapter = () => {
        if (selectedChapter > 1) {
            setSelectedChapter(prev => prev - 1);
        }
    };

    return (
        <div className="flex flex-col h-full gap-4">
            {/* Controls */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Book className="w-4 h-4" />
                        Bible
                    </h3>
                    <Select value={language} onValueChange={(v: any) => setLanguage(v)}>
                        <SelectTrigger className="w-[100px] h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="english">English</SelectItem>
                            <SelectItem value="telugu">Telugu</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Select value={selectedBook} onValueChange={setSelectedBook}>
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Book" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            {BIBLE_BOOKS.map(book => (
                                <SelectItem key={book} value={book}>{book}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevChapter} disabled={selectedChapter <= 1}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Select value={selectedChapter.toString()} onValueChange={(v) => setSelectedChapter(parseInt(v))}>
                            <SelectTrigger className="h-8 text-xs flex-1">
                                <SelectValue placeholder="Ch" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {availableChapters.map(ch => (
                                    <SelectItem key={ch} value={ch.toString()}>{ch}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextChapter} disabled={selectedChapter >= availableChapters.length}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Verses List */}
            <div className="flex-1 border rounded-md bg-background/50 p-2 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : verses.length > 0 ? (
                    <div className="space-y-2">
                        {verses.map((verse) => (
                            <div
                                key={verse.verse}
                                className="p-2 hover:bg-accent rounded cursor-pointer group transition-colors"
                                onClick={() => onVerseSelect(`${verse.text}\n- ${selectedBook} ${selectedChapter}:${verse.verse}`)}
                                title="Click to add to lyrics"
                            >
                                <div className="flex gap-2">
                                    <span className="text-xs font-mono text-muted-foreground w-5 shrink-0 pt-1">{verse.verse}</span>
                                    <p className="text-sm leading-relaxed">{verse.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm text-center p-4">
                        <p>No verses found.</p>
                        <p className="text-xs mt-2">Make sure Bible data is downloaded.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
