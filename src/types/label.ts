import type { ImageElement, TextElement, TextStyle } from '../types';

// 카세트 라벨 물리 사이즈 (mm 단위)
// 가로 가장 긴 부분 90mm 기준
export const LABEL_DIMENSIONS = {
  // 전체 블리드 영역 (검은 프레임) - 재단 여유 3mm 포함
  bleed: {
    width: 96,  // 90 + 3 + 3
    height: 56, // 50 + 3 + 3
  },
  // 실제 재단선 (빨간선)
  cut: {
    width: 90,
    height: 50,
  },
  // 안전 영역 (파란 점선) - 재단선에서 3mm 안쪽
  safe: {
    width: 84,  // 90 - 3 - 3
    height: 44, // 50 - 3 - 3
  },
  // 가운데 구멍 (투명창 - 잘라낼 부분)
  window: {
    width: 64,
    height: 24,
    cornerRadius: 4, // 둥근 모서리
  },
  // 구멍 주변 안전 영역
  windowSafe: {
    width: 58,  // 64 - 3 - 3
    height: 18, // 24 - 3 - 3
  },
};

// 300 DPI 기준 픽셀 변환
export const MM_TO_PX = 11.811; // 300 DPI: 1mm = 11.811px
export const LABEL_DPI = 300;

// 픽셀 단위 사이즈
export const LABEL_PX = {
  bleed: {
    width: Math.round(LABEL_DIMENSIONS.bleed.width * MM_TO_PX),
    height: Math.round(LABEL_DIMENSIONS.bleed.height * MM_TO_PX),
  },
  cut: {
    width: Math.round(LABEL_DIMENSIONS.cut.width * MM_TO_PX),
    height: Math.round(LABEL_DIMENSIONS.cut.height * MM_TO_PX),
  },
  safe: {
    width: Math.round(LABEL_DIMENSIONS.safe.width * MM_TO_PX),
    height: Math.round(LABEL_DIMENSIONS.safe.height * MM_TO_PX),
  },
  window: {
    width: Math.round(LABEL_DIMENSIONS.window.width * MM_TO_PX),
    height: Math.round(LABEL_DIMENSIONS.window.height * MM_TO_PX),
    cornerRadius: Math.round(LABEL_DIMENSIONS.window.cornerRadius * MM_TO_PX),
  },
  windowSafe: {
    width: Math.round(LABEL_DIMENSIONS.windowSafe.width * MM_TO_PX),
    height: Math.round(LABEL_DIMENSIONS.windowSafe.height * MM_TO_PX),
  },
};

// 프리뷰용 스케일 (화면에 맞게 축소)
export const LABEL_PREVIEW_SCALE = 0.6;

// 텍스트 요소에 추가 스타일 속성
export interface LabelTextElement extends TextElement {
  textAlign?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
}

export interface LabelData {
  backgroundColor: string;
  backgroundImage: string | null;
  baseImgSettings: {
    scale: number;
    x: number;
    y: number;
    baseScale?: number;
    originalWidth?: number;
    originalHeight?: number;
  };
  images: ImageElement[];
  // 추가 텍스트 요소들만 사용 (통일된 텍스트 박스)
  textElements: LabelTextElement[];
}

export const initialLabelData: LabelData = {
  backgroundColor: '#ffffff',
  backgroundImage: null,
  baseImgSettings: { scale: 1, x: 0, y: 0 },
  images: [],
  textElements: [],
};

export { type ImageElement, type TextElement, type TextStyle };
