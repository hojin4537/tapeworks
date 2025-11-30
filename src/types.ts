export interface ImageElement {
  id: string;
  src: string;
  x: number;
  y: number;
  scale: number;
  rotation?: number;
  baseScale?: number; // 프레임에 꽉 차는 기준 스케일
  originalWidth?: number; // 원본 이미지 너비
  originalHeight?: number; // 원본 이미지 높이
}

export interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: number;
  width?: number;
  textAlign?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
}

export interface TextStyle {
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: number;
  width?: number;
  textAlign?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
}

// 배경 이미지 설정 (위아래가 꽉 차게)
export interface BackgroundImageSettings {
  scale: number;
  x: number;
  y: number;
  baseScale?: number;
  originalWidth?: number;
  originalHeight?: number;
}

export interface JCardData {
  cover: {
    backgroundColor: string;
    backgroundImage: string | null;
    backgroundImageSettings: BackgroundImageSettings;
    images: ImageElement[];
    textElements: TextElement[];
  };
  spine: {
    backgroundColor: string;
    backgroundImage: string | null;
    backgroundImageSettings: BackgroundImageSettings;
    images: ImageElement[];
    textElements: TextElement[];
  };
  flap: {
    backgroundColor: string;
    backgroundImage: string | null;
    backgroundImageSettings: BackgroundImageSettings;
    images: ImageElement[];
    textElements: TextElement[];
  };
}

export const initialJCardData: JCardData = {
  cover: {
    backgroundColor: '#ffffff',
    backgroundImage: null,
    backgroundImageSettings: { scale: 1, x: 0, y: 0 },
    images: [],
    textElements: [],
  },
  spine: {
    backgroundColor: '#ffffff',
    backgroundImage: null,
    backgroundImageSettings: { scale: 1, x: 0, y: 0 },
    images: [],
    textElements: [],
  },
  flap: {
    backgroundColor: '#ffffff',
    backgroundImage: null,
    backgroundImageSettings: { scale: 1, x: 0, y: 0 },
    images: [],
    textElements: [],
  },
};
