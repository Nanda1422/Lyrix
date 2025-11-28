export interface PresentationSettings {
    backgroundType: 'color' | 'image';
    backgroundColor: string;
    backgroundImage: string | null;
    fontColor: string;
    textStroke: boolean;
    textStrokeWidth: number;
    textStrokeColor: string;
    fontSize: number;
    lineHeight: number;
    fontBold: boolean;
    fontCase: 'uppercase' | 'lowercase' | 'capitalize' | 'normal';
    textAlign: 'left' | 'center' | 'right' | 'justify';

}

export const defaultSettings: PresentationSettings = {
    backgroundType: 'color',
    backgroundColor: '#1a1a1a',
    backgroundImage: null,
    fontColor: '#ffffff',
    textStroke: false,
    textStrokeWidth: 1,
    textStrokeColor: '#000000',
    fontSize: 40,
    lineHeight: 1.0,
    fontBold: true,
    fontCase: 'normal',
    textAlign: 'center',
};
