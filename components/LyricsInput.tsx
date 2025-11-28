import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface LyricsInputProps {
    value: string;
    onChange: (value: string) => void;
}

export function LyricsInput({ value, onChange }: LyricsInputProps) {
    return (
        <div className="flex flex-col h-full gap-2">
            <Label htmlFor="lyrics" className="text-lg font-semibold">Lyrics</Label>
            <Textarea
                id="lyrics"
                placeholder="Insert your lyrics here..."
                className="flex-1 resize-none p-4 text-base bg-secondary/20 border-border"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            <div className="text-xs text-muted-foreground space-y-1">
                <p>Each slide contains one verse (the verses are separated by two line-breaks).</p>
                <p>Use "-" in the first line to indicate the title of the lyrics.</p>
            </div>
        </div>
    );
}
