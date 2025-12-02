import type { ImageElement, TextElement, TextStyle } from '../types.ts';

// 카세트 라벨 물리 사이즈 (mm 단위)
// 가로 가장 긴 부분 90mm 기준
export const LABEL_DIMENSIONS = {
  // 전체 블리드 영역 (검은 프레임) - 95.5mm x 44mm (블리드 2mm 포함)
  bleed: {
    width: 95.5,
    height: 44,
  },
  // 실제 재단선 (빨간선) - 블리드 2mm 제외
  cut: {
    width: 91.5, // 95.5 - 2 - 2
    height: 40,  // 44 - 2 - 2
  },
  // 안전 영역 (파란 점선) - 재단선에서 2mm 안쪽
  safe: {
    width: 87.5, // 91.5 - 2 - 2
    height: 36,  // 40 - 2 - 2
  },
  // 가운데 구멍 (투명창 - 잘라낼 부분)
  window: {
    width: 63,
    height: 16.5,
    cornerRadius: 0, // 둥근 모서리 없음
    x: 16.25, // Horizontal Center: (95.5 - 63) / 2
    y: 16.5, // Top position (44 - 11 - 16.5) -> 11mm from bottom
  },
  // 구멍 주변 안전 영역
  windowSafe: {
    width: 59,  // 63 - 2 - 2
    height: 12.5, // 16.5 - 2 - 2
    x: 18.25, // 16.25 + 2
    y: 18.5, // 16.5 + 2
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
    x: Math.round(LABEL_DIMENSIONS.window.x * MM_TO_PX),
    y: Math.round(LABEL_DIMENSIONS.window.y * MM_TO_PX),
  },
  windowSafe: {
    width: Math.round(LABEL_DIMENSIONS.windowSafe.width * MM_TO_PX),
    height: Math.round(LABEL_DIMENSIONS.windowSafe.height * MM_TO_PX),
    x: Math.round(LABEL_DIMENSIONS.windowSafe.x * MM_TO_PX),
    y: Math.round(LABEL_DIMENSIONS.windowSafe.y * MM_TO_PX),
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
