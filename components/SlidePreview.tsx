import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { PresentationSettings } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Play, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

interface SlidePreviewProps {
    text: string;
    settings: PresentationSettings;
    currentSlide: number;
    totalSlides: number;
    onNext: () => void;
    onPrev: () => void;
    onSettingsChange?: (settings: PresentationSettings) => void;
}

export function SlidePreview({ text, settings, currentSlide, totalSlides, onNext, onPrev, onSettingsChange }: SlidePreviewProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1.5);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const fullScreenContainerRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef<{ x: number, y: number, initialX: number, initialY: number } | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const containerStyle: React.CSSProperties = {
        backgroundColor: settings.backgroundType === 'color' ? settings.backgroundColor : undefined,
        backgroundImage: settings.backgroundType === 'image' && settings.backgroundImage ? `url(${settings.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    };

    const textStyle: React.CSSProperties = {
        color: settings.fontColor,
        fontSize: `${settings.fontSize}px`,
        lineHeight: settings.lineHeight,
        fontWeight: settings.fontBold ? 'bold' : 'normal',
        textTransform: settings.fontCase === 'normal' ? undefined : settings.fontCase,
        textAlign: settings.textAlign,
        WebkitTextStroke: settings.textStroke ? `${settings.textStrokeWidth}px ${settings.textStrokeColor}` : undefined,
        position: 'absolute',
        left: `${settings.textPosition?.x ?? 50}%`,
        top: `${settings.textPosition?.y ?? 50}%`,
        transform: 'translate(-50%, -50%)',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
        zIndex: 60,
    };

    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (!onSettingsChange) return;
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        dragStartRef.current = {
            x: clientX,
            y: clientY,
            initialX: settings.textPosition?.x ?? 50,
            initialY: settings.textPosition?.y ?? 50
        };
    };

    const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging || !dragStartRef.current || !onSettingsChange) return;

        // Determine which container is active (fullscreen or preview)
        const activeContainer = isFullscreen ? fullScreenContainerRef.current : containerRef.current;
        if (!activeContainer) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        const rect = activeContainer.getBoundingClientRect();

        // Calculate total delta from start
        const totalDeltaX = clientX - dragStartRef.current.x;
        const totalDeltaY = clientY - dragStartRef.current.y;

        // Convert delta to percentage
        const deltaXPercent = (totalDeltaX / rect.width) * 100;
        const deltaYPercent = (totalDeltaY / rect.height) * 100;

        const newX = Math.max(0, Math.min(100, dragStartRef.current.initialX + deltaXPercent));
        const newY = Math.max(0, Math.min(100, dragStartRef.current.initialY + deltaYPercent));

        onSettingsChange({
            ...settings,
            textPosition: { x: newX, y: newY }
        });
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        dragStartRef.current = null;
    };

    // Handle keyboard navigation for full screen
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isFullscreen) return;

        if (e.key === 'ArrowRight' || e.key === 'Space') {
            onNext();
        } else if (e.key === 'ArrowLeft') {
            onPrev();
        } else if (e.key === 'Escape') {
            exitFullscreen();
        }
    }, [isFullscreen, onNext, onPrev]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const enterFullscreen = async () => {
        setIsFullscreen(true);
        try {
            await document.documentElement.requestFullscreen();
        } catch (e) {
            console.error("Failed to enter fullscreen:", e);
        }
    };

    const exitFullscreen = async () => {
        setIsFullscreen(false);
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            }
        } catch (e) {
            console.error("Failed to exit fullscreen:", e);
        }
    };

    // Listen for fullscreen change (e.g. user presses Esc)
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                setIsFullscreen(false);
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Full screen overlay content
    const fullScreenContent = (
        <div
            ref={fullScreenContainerRef}
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ ...containerStyle, backgroundColor: settings.backgroundType === 'color' ? settings.backgroundColor : 'black' }}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
        >
            {/* Controls */}
            <div className="absolute top-4 right-4 flex gap-2 z-50">
                <div className="flex items-center gap-1 bg-black/30 rounded-lg p-1 mr-2">
                    <Button variant="ghost" size="icon" onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))} className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8">
                        <ZoomOut className="w-5 h-5" />
                    </Button>
                    <span className="text-white/70 text-xs w-8 text-center">{Math.round(zoomLevel * 100)}%</span>
                    <Button variant="ghost" size="icon" onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.1))} className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8">
                        <ZoomIn className="w-5 h-5" />
                    </Button>
                </div>
                <Button variant="ghost" size="icon" onClick={exitFullscreen} className="text-white/50 hover:text-white hover:bg-white/10">
                    <X className="w-8 h-8" />
                </Button>
            </div>

            {/* Navigation Zones (Invisible click areas) */}
            <div className="absolute inset-y-0 left-0 w-1/4 z-40 cursor-pointer" onClick={onPrev} title="Previous Slide" />
            <div className="absolute inset-y-0 right-0 w-1/4 z-40 cursor-pointer" onClick={onNext} title="Next Slide" />

            {/* Slide Content */}
            <div className="w-full h-full relative overflow-hidden">
                <p
                    style={{ ...textStyle, fontSize: `${settings.fontSize * zoomLevel}px` }}
                    className="whitespace-pre-wrap break-words w-full max-w-6xl"
                    onMouseDown={handleDragStart}
                    onTouchStart={handleDragStart}
                    data-testid="lyrics-text-fullscreen"
                >
                    {text || "Preview Text"}
                </p>
            </div>

            {/* Slide Counter */}
            <div className="absolute bottom-4 left-4 text-white/30 text-sm z-50 font-mono">
                Slide {currentSlide + 1} / {totalSlides}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Preview</h3>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={enterFullscreen} title="Start Slide Show">
                        <Play className="w-4 h-4 mr-2" />
                        Slide Show
                    </Button>
                    <div className="h-4 w-px bg-border mx-2" />
                    <Button variant="outline" size="sm" onClick={onPrev} disabled={currentSlide === 0}>
                        Prev
                    </Button>
                    <span className="text-sm text-muted-foreground min-w-[3rem] text-center">
                        {totalSlides > 0 ? currentSlide + 1 : 0} / {totalSlides}
                    </span>
                    <Button variant="outline" size="sm" onClick={onNext} disabled={currentSlide === totalSlides - 1}>
                        Next
                    </Button>
                </div>
            </div>
            <div
                ref={containerRef}
                className="w-full aspect-video rounded-lg overflow-hidden border border-border shadow-sm relative"
                style={containerStyle}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchMove={handleDragMove}
                onTouchEnd={handleDragEnd}
            >
                <div className="w-full h-full relative overflow-hidden">
                    <p
                        style={textStyle}
                        className="whitespace-pre-wrap break-words w-full max-w-[90%]"
                        onMouseDown={handleDragStart}
                        onTouchStart={handleDragStart}
                        data-testid="lyrics-text-preview"
                    >
                        {text || "Preview Text"}
                    </p>
                </div>
            </div>

            {/* Render portal if fullscreen and mounted */}
            {mounted && isFullscreen && createPortal(fullScreenContent, document.body)}
        </div>
    );
}
