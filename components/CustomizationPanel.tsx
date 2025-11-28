import React from 'react';
import { PresentationSettings } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';

interface CustomizationPanelProps {
    settings: PresentationSettings;
    onSettingsChange: (settings: PresentationSettings) => void;
    onDownload: () => void;
}

export function CustomizationPanel({ settings, onSettingsChange, onDownload }: CustomizationPanelProps) {

    const updateSetting = <K extends keyof PresentationSettings>(key: K, value: PresentationSettings[K]) => {
        onSettingsChange({ ...settings, [key]: value });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                updateSetting('backgroundImage', event.target?.result as string);
                updateSetting('backgroundType', 'image');
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-1">

            {/* Background */}
            <div className="space-y-3">
                <Label>Presentation background</Label>
                <div className="flex flex-col gap-2">
                    <Input type="file" accept="image/*" onChange={handleImageUpload} className="cursor-pointer" />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">OR</div>
                    <div className="flex items-center gap-2">
                        <Input
                            type="color"
                            value={settings.backgroundColor}
                            onChange={(e) => {
                                // Update both properties in a single state update to avoid race conditions
                                onSettingsChange({
                                    ...settings,
                                    backgroundColor: e.target.value,
                                    backgroundType: 'color'
                                });
                            }}
                            className="h-10 w-full cursor-pointer p-1"
                        />
                    </div>
                </div>
            </div>

            {/* Font Color */}
            <div className="space-y-3">
                <Label>Font color</Label>
                <Input
                    type="color"
                    value={settings.fontColor}
                    onChange={(e) => updateSetting('fontColor', e.target.value)}
                    className="h-10 w-full cursor-pointer p-1"
                />
            </div>

            {/* Text Stroke */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>Text stroke</Label>
                    <Switch
                        checked={settings.textStroke}
                        onCheckedChange={(checked) => updateSetting('textStroke', checked)}
                    />
                </div>
                {settings.textStroke && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs w-8">{settings.textStrokeWidth}px</span>
                            <Slider
                                value={[settings.textStrokeWidth]}
                                min={0}
                                max={10}
                                step={0.5}
                                onValueChange={([val]) => updateSetting('textStrokeWidth', val)}
                            />
                        </div>
                        <Input
                            type="color"
                            value={settings.textStrokeColor}
                            onChange={(e) => updateSetting('textStrokeColor', e.target.value)}
                            className="h-8 w-full cursor-pointer p-1"
                        />
                    </div>
                )}
            </div>

            {/* Font Size */}
            <div className="space-y-3">
                <Label>Font size</Label>
                <div className="flex items-center gap-2">
                    <span className="text-xs w-8">{settings.fontSize}px</span>
                    <Slider
                        value={[settings.fontSize]}
                        min={10}
                        max={200}
                        step={1}
                        onValueChange={([val]) => updateSetting('fontSize', val)}
                    />
                </div>
            </div>

            {/* Line Height */}
            <div className="space-y-3">
                <Label>Line height</Label>
                <div className="flex items-center gap-2">
                    <span className="text-xs w-8">{settings.lineHeight}</span>
                    <Slider
                        value={[settings.lineHeight]}
                        min={0.5}
                        max={3}
                        step={0.1}
                        onValueChange={([val]) => updateSetting('lineHeight', val)}
                    />
                </div>
            </div>

            {/* Font Bold */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>Font bold</Label>
                    <Switch
                        checked={settings.fontBold}
                        onCheckedChange={(checked) => updateSetting('fontBold', checked)}
                    />
                </div>
            </div>

            {/* Font Case */}
            <div className="space-y-3">
                <Label>Font case</Label>
                <div className="flex gap-2">
                    <Button
                        variant={settings.fontCase === 'uppercase' ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateSetting('fontCase', 'uppercase')}
                    >
                        AB
                    </Button>
                    <Button
                        variant={settings.fontCase === 'capitalize' ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateSetting('fontCase', 'capitalize')}
                    >
                        Aa
                    </Button>
                    <Button
                        variant={settings.fontCase === 'lowercase' ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateSetting('fontCase', 'lowercase')}
                    >
                        ab
                    </Button>
                    <Button
                        variant={settings.fontCase === 'normal' ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateSetting('fontCase', 'normal')}
                    >
                        Normal
                    </Button>
                </div>
            </div>

            {/* Text Align */}
            <div className="space-y-3">
                <Label>Text align</Label>
                <div className="flex gap-2">
                    <Button
                        variant={settings.textAlign === 'left' ? "default" : "outline"}
                        size="icon"
                        onClick={() => updateSetting('textAlign', 'left')}
                    >
                        <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={settings.textAlign === 'center' ? "default" : "outline"}
                        size="icon"
                        onClick={() => updateSetting('textAlign', 'center')}
                    >
                        <AlignCenter className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={settings.textAlign === 'right' ? "default" : "outline"}
                        size="icon"
                        onClick={() => updateSetting('textAlign', 'right')}
                    >
                        <AlignRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={settings.textAlign === 'justify' ? "default" : "outline"}
                        size="icon"
                        onClick={() => updateSetting('textAlign', 'justify')}
                    >
                        <AlignJustify className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Button className="w-full mt-4" size="lg" onClick={onDownload}>
                Download PPTX
            </Button>
        </div>
    );
}
