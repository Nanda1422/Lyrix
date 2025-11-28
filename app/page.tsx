"use client";

import React, { useState, useEffect } from 'react';
import { LyricsInput } from '@/components/LyricsInput';
import { SlidePreview } from '@/components/SlidePreview';
import { CustomizationPanel } from '@/components/CustomizationPanel';

import { PresentationSettings, defaultSettings } from '@/lib/types';
import { generatePPT } from '@/lib/pptGenerator';
import { Button } from '@/components/ui/button';
import { BibleSection } from '@/components/BibleSection';
import { FileText, Book } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Home() {
    const [lyrics, setLyrics] = useState<string>('');
    const [settings, setSettings] = useState<PresentationSettings>(defaultSettings);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [mounted, setMounted] = useState(false);

    const [view, setView] = useState<'lyrics' | 'bible'>('lyrics');
    const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
    const [songTitle, setSongTitle] = useState('');

    useEffect(() => {
        setMounted(true);
    }, []);

    const verses = lyrics.split(/\n\n+/).filter(v => v.trim() !== '');
    const currentSlideText = verses.length > 0 ? verses[currentSlideIndex] : '';

    // Handle title logic for preview (remove leading dash if present)
    let displayPreviewText = currentSlideText ? currentSlideText.trim() : "Preview Text\n(Add lyrics to see change)";
    if (displayPreviewText.startsWith('-')) {
        displayPreviewText = displayPreviewText.substring(1).trim();
    }

    const handleNextSlide = () => {
        if (currentSlideIndex < verses.length - 1) {
            setCurrentSlideIndex(prev => prev + 1);
        }
    };

    const handlePrevSlide = () => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex(prev => prev - 1);
        }
    };

    // Reset slide index if verses change and index is out of bounds
    useEffect(() => {
        if (currentSlideIndex >= verses.length && verses.length > 0) {
            setCurrentSlideIndex(verses.length - 1);
        } else if (verses.length === 0) {
            setCurrentSlideIndex(0);
        }
    }, [verses.length, currentSlideIndex]);

    const handleDownload = () => {
        // Try to guess title from first line
        const lines = lyrics.split('\n');
        let title = "Lyrics Presentation";
        if (lines.length > 0 && lines[0].trim()) {
            let firstLine = lines[0].trim();
            if (firstLine.startsWith('-')) firstLine = firstLine.substring(1).trim();
            // Limit title length for sanity
            title = firstLine.substring(0, 50);
        }
        setSongTitle(title);
        setIsDownloadDialogOpen(true);
    };

    const confirmDownload = async () => {
        await generatePPT(lyrics, settings, songTitle);
        setIsDownloadDialogOpen(false);
    };



    if (!mounted) return null;

    return (
        <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card z-10">
                <div className="flex items-center gap-2">
                    <FileText className="w-6 h-6" />
                    <h1 className="text-xl font-bold">Lyrix2PPTX</h1>
                </div>

                <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-lg">
                    <Button
                        variant={view === 'lyrics' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setView('lyrics')}
                        className="gap-2"
                    >
                        <FileText className="w-4 h-4" />
                        Lyrics
                    </Button>
                    <Button
                        variant={view === 'bible' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setView('bible')}
                        className="gap-2"
                    >
                        <Book className="w-4 h-4" />
                        Bible
                    </Button>
                </div>


            </header>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {view === 'lyrics' ? (
                    <>
                        {/* Left Column: Lyrics Input */}
                        <div className="w-1/3 min-w-[300px] border-r border-border flex flex-col bg-card/50">
                            <div className="flex-1 overflow-hidden p-6 pt-4 flex flex-col min-h-0">
                                <LyricsInput value={lyrics} onChange={setLyrics} />
                            </div>
                        </div>

                        {/* Right Column: Preview & Settings */}
                        <div className="flex-1 flex flex-col overflow-y-auto">
                            <div className="p-8 flex flex-col gap-8 max-w-4xl mx-auto w-full">

                                {/* Preview Section */}
                                <section className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-6 -mx-4 px-4">
                                    <div className="max-w-2xl mx-auto">
                                        <SlidePreview
                                            text={displayPreviewText}
                                            settings={settings}
                                            currentSlide={currentSlideIndex}
                                            totalSlides={verses.length}
                                            onNext={handleNextSlide}
                                            onPrev={handlePrevSlide}
                                        />
                                    </div>
                                </section>

                                {/* Customization Section */}
                                <section className="bg-card rounded-lg border border-border p-6 shadow-sm">
                                    <CustomizationPanel
                                        settings={settings}
                                        onSettingsChange={setSettings}
                                        onDownload={handleDownload}
                                    />
                                </section>
                            </div>
                        </div>
                    </>
                ) : (
                    <BibleSection
                        onVerseSelect={(text) => {
                            setLyrics(prev => prev + (prev ? '\n\n' : '') + text);
                            // Optional: Switch back to lyrics view on import
                            // setView('lyrics'); 
                        }}
                    />
                )}
            </div>


            <Dialog open={isDownloadDialogOpen} onOpenChange={setIsDownloadDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Download Presentation</DialogTitle>
                        <DialogDescription>
                            Enter a title for your presentation file.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="filename" className="text-right">
                                Title
                            </Label>
                            <Input
                                id="filename"
                                value={songTitle}
                                onChange={(e) => setSongTitle(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" onClick={confirmDownload}>Download</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
