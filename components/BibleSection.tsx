"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Book, Maximize2, Minimize2, Loader2, AlignLeft, AlignCenter, AlignRight, AlignJustify, ChevronLeft, ChevronRight, Type, Bold, ZoomIn, ZoomOut } from 'lucide-react';
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

interface BibleSectionProps {
    onVerseSelect: (text: string) => void;
}

export function BibleSection({ onVerseSelect }: BibleSectionProps) {
    const [selectedBook, setSelectedBook] = useState('Genesis');
    const [selectedChapter, setSelectedChapter] = useState(1);
    const [selectedVerseNum, setSelectedVerseNum] = useState<string>('1');

    const [language, setLanguage] = useState<'english' | 'telugu'>('english');
    const [isComparison, setIsComparison] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('center');

    // Text Styling State
    const [fontSize, setFontSize] = useState(30);
    const [lineHeight, setLineHeight] = useState(1.4);
    const [isBold, setIsBold] = useState(false);

    const [verses, setVerses] = useState<BibleVerse[]>([]);
    const [secondaryVerses, setSecondaryVerses] = useState<BibleVerse[]>([]);
    const [availableChapters, setAvailableChapters] = useState<number[]>([]);
    const [availableVerses, setAvailableVerses] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const navAction = useRef<'default' | 'prev-chapter' | 'prev-book'>('default');

    // Fetch Book Info (Chapter count)
    useEffect(() => {
        const fetchBookInfo = async () => {
            try {
                const res = await fetch(`/api/bible?book=${encodeURIComponent(selectedBook)}&lang=${language}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.chapters) {
                        setAvailableChapters(Array.from({ length: data.chapters.length }, (_, i) => i + 1));

                        // Handle Navigation Logic
                        if (navAction.current === 'prev-book') {
                            setSelectedChapter(data.chapters.length);
                        } else {
                            setSelectedChapter(1);
                            setSelectedVerseNum('1');
                        }
                    }
                } else {
                    setAvailableChapters(Array.from({ length: 50 }, (_, i) => i + 1));
                    setSelectedChapter(1);
                    setSelectedVerseNum('1');
                }
            } catch (e) {
                console.error(e);
                setAvailableChapters(Array.from({ length: 50 }, (_, i) => i + 1));
            }
        };
        fetchBookInfo();
    }, [selectedBook, language]);

    // Fetch Chapter Verses (Primary Language)
    useEffect(() => {
        const fetchChapter = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/bible?book=${encodeURIComponent(selectedBook)}&chapter=${selectedChapter}&lang=${language}`);
                if (res.ok) {
                    const data = await res.json();
                    const vs = data.verses || [];
                    setVerses(vs);
                    setAvailableVerses(vs.map((v: BibleVerse) => v.verse));

                    // Handle Navigation Logic
                    if (navAction.current === 'prev-chapter' || navAction.current === 'prev-book') {
                        if (vs.length > 0) {
                            setSelectedVerseNum(vs[vs.length - 1].verse);
                        }
                        navAction.current = 'default'; // Reset
                    } else {
                        if (!vs.find((v: BibleVerse) => v.verse === selectedVerseNum)) {
                            setSelectedVerseNum(vs[0]?.verse || '1');
                        }
                    }
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

    // Fetch Secondary Language if Comparison is ON
    useEffect(() => {
        if (!isComparison) {
            setSecondaryVerses([]);
            return;
        }

        const fetchSecondary = async () => {
            const secLang = language === 'english' ? 'telugu' : 'english';
            try {
                const res = await fetch(`/api/bible?book=${encodeURIComponent(selectedBook)}&chapter=${selectedChapter}&lang=${secLang}`);
                if (res.ok) {
                    const data = await res.json();
                    setSecondaryVerses(data.verses || []);
                }
            } catch (error) {
                console.error("Failed to fetch secondary chapter:", error);
            }
        };
        fetchSecondary();
    }, [selectedBook, selectedChapter, language, isComparison]);

    // Handle Full Screen Change Events
    useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const handlePrev = () => {
        const currentIndex = availableVerses.indexOf(selectedVerseNum);
        if (currentIndex > 0) {
            setSelectedVerseNum(availableVerses[currentIndex - 1]);
        } else {
            // Go to previous chapter
            if (selectedChapter > 1) {
                navAction.current = 'prev-chapter';
                setSelectedChapter(prev => prev - 1);
            } else {
                // Go to previous book
                const currentBookIndex = BIBLE_BOOKS.indexOf(selectedBook);
                if (currentBookIndex > 0) {
                    navAction.current = 'prev-book';
                    setSelectedBook(BIBLE_BOOKS[currentBookIndex - 1]);
                }
            }
        }
    };

    const handleNext = () => {
        const currentIndex = availableVerses.indexOf(selectedVerseNum);
        if (currentIndex < availableVerses.length - 1) {
            setSelectedVerseNum(availableVerses[currentIndex + 1]);
        } else {
            // Go to next chapter
            if (selectedChapter < availableChapters.length) {
                navAction.current = 'default'; // Default behavior is fine (verse 1)
                setSelectedChapter(prev => prev + 1);
                setSelectedVerseNum('1');
            } else {
                // Go to next book
                const currentBookIndex = BIBLE_BOOKS.indexOf(selectedBook);
                if (currentBookIndex < BIBLE_BOOKS.length - 1) {
                    navAction.current = 'default';
                    setSelectedBook(BIBLE_BOOKS[currentBookIndex + 1]);
                    // Chapter and Verse will be reset by useEffect
                }
            }
        }
    };

    const getCurrentVerseText = (vs: BibleVerse[]) => {
        const v = vs.find(v => v.verse === selectedVerseNum);
        return v ? v.text : '';
    };

    const primaryText = getCurrentVerseText(verses);
    const secondaryText = getCurrentVerseText(secondaryVerses);

    return (
        <div className="flex flex-col h-full w-full bg-background">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Book className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold">Bible Reader</h2>
                    </div>

                    <div className="h-6 w-px bg-border mx-2" />

                    {/* Selectors */}
                    <div className="flex items-center gap-2">
                        <Select value={selectedBook} onValueChange={setSelectedBook}>
                            <SelectTrigger className="w-[140px] h-8">
                                <SelectValue placeholder="Book" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {BIBLE_BOOKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select value={selectedChapter.toString()} onValueChange={(v) => setSelectedChapter(parseInt(v))}>
                            <SelectTrigger className="w-[70px] h-8">
                                <SelectValue placeholder="Ch" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {availableChapters.map(c => <SelectItem key={c} value={c.toString()}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select value={selectedVerseNum} onValueChange={setSelectedVerseNum}>
                            <SelectTrigger className="w-[70px] h-8">
                                <SelectValue placeholder="Vs" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {availableVerses.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="h-6 w-px bg-border mx-2" />

                    {/* Language & Comparison */}
                    <div className="flex items-center gap-4">
                        <Select value={language} onValueChange={(v: any) => setLanguage(v)}>
                            <SelectTrigger className="w-[100px] h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="english">English</SelectItem>
                                <SelectItem value="telugu">Telugu</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2">
                            <Switch id="comparison-mode" checked={isComparison} onCheckedChange={setIsComparison} />
                            <Label htmlFor="comparison-mode" className="text-sm cursor-pointer">Compare</Label>
                        </div>
                    </div>

                    <div className="h-6 w-px bg-border mx-2" />

                    {/* Text Styling Controls */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Text Settings">
                                <Type className="w-4 h-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Text Appearance</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Customize the reading experience.
                                    </p>
                                </div>
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="font-size">Font Size</Label>
                                            <span className="w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm text-muted-foreground hover:border-border">
                                                {fontSize}px
                                            </span>
                                        </div>
                                        <Slider
                                            id="font-size"
                                            max={64}
                                            min={16}
                                            step={1}
                                            value={[fontSize]}
                                            onValueChange={(value) => setFontSize(value[0])}
                                            className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="line-height">Line Height</Label>
                                            <span className="w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm text-muted-foreground hover:border-border">
                                                {lineHeight}
                                            </span>
                                        </div>
                                        <Slider
                                            id="line-height"
                                            max={3}
                                            min={1}
                                            step={0.1}
                                            value={[lineHeight]}
                                            onValueChange={(value) => setLineHeight(value[0])}
                                            className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="bold-text" className="flex items-center gap-2">
                                            <Bold className="w-4 h-4" />
                                            Bold Text
                                        </Label>
                                        <Switch
                                            id="bold-text"
                                            checked={isBold}
                                            onCheckedChange={setIsBold}
                                        />
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <div className="h-6 w-px bg-border mx-2" />

                    {/* Text Alignment */}
                    <div className="flex items-center bg-secondary/50 rounded-lg p-1 gap-1">
                        <Button
                            variant={textAlign === 'left' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setTextAlign('left')}
                            title="Align Left"
                        >
                            <AlignLeft className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={textAlign === 'center' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setTextAlign('center')}
                            title="Align Center"
                        >
                            <AlignCenter className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={textAlign === 'right' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setTextAlign('right')}
                            title="Align Right"
                        >
                            <AlignRight className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={textAlign === 'justify' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setTextAlign('justify')}
                            title="Justify"
                        >
                            <AlignJustify className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div
                ref={containerRef}
                className={cn(
                    "flex-1 bg-card relative transition-all duration-300 overflow-y-auto flex flex-col group",
                    isFullScreen ? "fixed inset-0 z-50 bg-background" : ""
                )}
            >
                {/* Full Screen Toggle */}
                {isFullScreen ? (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 z-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={toggleFullScreen}
                    >
                        <Minimize2 className="w-6 h-6" />
                    </Button>
                ) : (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-50"
                        onClick={toggleFullScreen}
                        title="Full Screen"
                    >
                        <Maximize2 className="w-5 h-5" />
                    </Button>
                )}

                {/* Zoom Controls (Full Screen Only) */}
                {isFullScreen && (
                    <div className="absolute top-4 right-16 flex gap-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 rounded-lg p-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setFontSize(prev => Math.max(16, prev - 2))}
                            title="Zoom Out"
                        >
                            <ZoomOut className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setFontSize(prev => Math.min(100, prev + 2))}
                            title="Zoom In"
                        >
                            <ZoomIn className="w-5 h-5" />
                        </Button>
                    </div>
                )}

                {/* Navigation Arrows */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80 shadow-sm z-40 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handlePrev}
                    title="Previous Verse"
                >
                    <ChevronLeft className="w-8 h-8" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80 shadow-sm z-40 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleNext}
                    title="Next Verse"
                >
                    <ChevronRight className="w-8 h-8" />
                </Button>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className={cn(
                        "w-full max-w-7xl space-y-8 animate-in fade-in zoom-in-95 duration-300 m-auto p-8",
                        `text-${textAlign}`
                    )}>
                        {/* Primary Verse */}
                        <div className="space-y-4">
                            <p
                                className={cn(
                                    "font-serif text-foreground transition-all duration-200",
                                    isBold ? "font-bold" : "font-normal"
                                )}
                                style={{
                                    fontSize: `${fontSize}px`,
                                    lineHeight: lineHeight
                                }}
                            >
                                {primaryText || "Select a verse..."}
                            </p>
                            {primaryText && (
                                <p className="text-sm text-muted-foreground font-medium tracking-wide uppercase">
                                    {language}
                                </p>
                            )}
                        </div>

                        {/* Secondary Verse (Comparison) */}
                        {isComparison && secondaryText && (
                            <>
                                <div className="w-16 h-px bg-border mx-auto" />
                                <div className="space-y-4">
                                    <p
                                        className={cn(
                                            "font-serif text-foreground/90 transition-all duration-200",
                                            isBold ? "font-bold" : "font-normal"
                                        )}
                                        style={{
                                            fontSize: `${fontSize}px`,
                                            lineHeight: lineHeight
                                        }}
                                    >
                                        {secondaryText}
                                    </p>
                                    <p className="text-sm text-muted-foreground font-medium tracking-wide uppercase">
                                        {language === 'english' ? 'Telugu' : 'English'}
                                    </p>
                                </div>
                            </>
                        )}

                        {/* Reference Display */}
                        {(primaryText || secondaryText) && (
                            <div className="pt-4">
                                <span className="inline-block px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold">
                                    {selectedBook} {selectedChapter}:{selectedVerseNum}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
