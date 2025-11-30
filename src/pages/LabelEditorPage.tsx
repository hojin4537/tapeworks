import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Eye, EyeOff, ZoomIn, ZoomOut,
  Plus, Trash2, X, Check, Image, Type, HelpCircle,
  AlignCenter, AlignLeft, AlignRight, Bold, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LABEL_DIMENSIONS,
  LABEL_PREVIEW_SCALE,
  initialLabelData,
  type LabelData,
  type ImageElement,
  type LabelTextElement,
} from '../types/label';
import './LabelEditorPage.css';

const FONTS = [
  'Pretendard',
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Noto Sans KR',
  'Nanum Gothic',
  'Nanum Myeongjo',
  'Black Han Sans',
  'Jua',
  'Playfair Display',
  'Merriweather',
  'Poppins',
  'Raleway',
  'Ubuntu'
];

export default function LabelEditorPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // 이전 페이지에서 전달받은 데이터
  const jCardData = location.state?.jCardData;
  const initialLabelA = location.state?.labelDataA || initialLabelData;
  const initialLabelB = location.state?.labelDataB || initialLabelData;
  const initialDualMode = location.state?.dualSideMode || false;

  // Side A 데이터
  const [labelDataA, setLabelDataA] = useState<LabelData>(initialLabelA);
  // Side B 데이터
  const [labelDataB, setLabelDataB] = useState<LabelData>(initialLabelB);
  // 양면 모드
  const [dualSideMode, setDualSideMode] = useState(initialDualMode);
  // 현재 편집 중인 면
  const [currentSide, setCurrentSide] = useState<'A' | 'B'>('A');

  const [showGuides, setShowGuides] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showGuideInfo, setShowGuideInfo] = useState(false);

  // 현재 편집 중인 데이터
  const labelData = currentSide === 'A' ? labelDataA : labelDataB;
  const setLabelData = currentSide === 'A' ? setLabelDataA : setLabelDataB;

  // 프리뷰용 스케일된 사이즈 (px)
  const previewScale = LABEL_PREVIEW_SCALE * 11.811; // mm to px * scale
  const bleedWidth = LABEL_DIMENSIONS.bleed.width * previewScale;
  const bleedHeight = LABEL_DIMENSIONS.bleed.height * previewScale;
  const cutWidth = LABEL_DIMENSIONS.cut.width * previewScale;
  const cutHeight = LABEL_DIMENSIONS.cut.height * previewScale;
  const safeWidth = LABEL_DIMENSIONS.safe.width * previewScale;
  const safeHeight = LABEL_DIMENSIONS.safe.height * previewScale;
  const windowWidth = LABEL_DIMENSIONS.window.width * previewScale;
  const windowHeight = LABEL_DIMENSIONS.window.height * previewScale;
  const windowRadius = LABEL_DIMENSIONS.window.cornerRadius * previewScale;

  // Font loading effect
  useEffect(() => {
    const fontsToLoad = new Set<string>();
    labelDataA.textElements?.forEach(el => fontsToLoad.add(el.fontFamily));
    labelDataB.textElements?.forEach(el => fontsToLoad.add(el.fontFamily));

    fontsToLoad.forEach(font => {
      const linkId = `font-${font.replace(/\s+/g, '-')}`;
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';

        if (font === 'Pretendard') {
          link.href = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css';
        } else {
          link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}:wght@400;700&display=swap`;
        }

        document.head.appendChild(link);
      }
    });
  }, [labelDataA.textElements, labelDataB.textElements]);

  // Drag state
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    isResizing: boolean;
    target: string | null;
    targetType: 'image' | 'text' | 'background' | null;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialWidth?: number;
  }>({
    isDragging: false,
    isResizing: false,
    target: null,
    targetType: null,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });

  const updateLabelData = (updates: Partial<LabelData>) => {
    setLabelData(prev => ({ ...prev, ...updates }));
  };

  const handleBackgroundColorChange = (color: string) => {
    updateLabelData({ backgroundColor: color });
  };

  const handleBackgroundImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new window.Image();
        img.onload = () => {
          // 배경 이미지: 위아래가 꽉 차게 (높이 기준)
          const scaleY = bleedHeight / img.height;
          const baseScale = scaleY;

          updateLabelData({
            backgroundImage: reader.result as string,
            baseImgSettings: {
              scale: 1,
              x: 0,
              y: 0,
              baseScale: baseScale,
              originalWidth: img.width,
              originalHeight: img.height,
            }
          });
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new window.Image();
        img.onload = () => {
          // 추가 이미지: 좌우가 꽉 차게 (너비 기준의 30%)
          const scaleX = (bleedWidth * 0.3) / img.width;
          const baseScale = scaleX;

          const newImage: ImageElement = {
            id: Date.now().toString(),
            src: reader.result as string,
            x: 0,
            y: 0,
            scale: 1,
            baseScale: baseScale,
            originalWidth: img.width,
            originalHeight: img.height,
          };
          updateLabelData({ images: [...(labelData.images || []), newImage] });
          setSelectedElement(newImage.id);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const updateImage = (id: string, updates: Partial<ImageElement>) => {
    const newImages = (labelData.images || []).map(img =>
      img.id === id ? { ...img, ...updates } : img
    );
    updateLabelData({ images: newImages });
  };

  const removeImage = (id: string) => {
    const newImages = (labelData.images || []).filter(img => img.id !== id);
    updateLabelData({ images: newImages });
    if (selectedElement === id) setSelectedElement(null);
  };

  const addTextElement = () => {
    const newElement: LabelTextElement = {
      id: Date.now().toString(),
      text: '새 텍스트',
      x: 0,
      y: 0,
      fontSize: 14,
      fontFamily: 'Inter',
      color: '#000000',
      width: 150,
      fontWeight: 400,
      textAlign: 'center',
      letterSpacing: 0,
      lineHeight: 1.4,
    };
    updateLabelData({ textElements: [...(labelData.textElements || []), newElement] });
    setSelectedElement(newElement.id);
  };

  const updateTextElement = (id: string, updates: Partial<LabelTextElement>) => {
    const newElements = (labelData.textElements || []).map(el =>
      el.id === id ? { ...el, ...updates } : el
    );
    updateLabelData({ textElements: newElements });
  };

  const removeTextElement = (id: string) => {
    const newElements = (labelData.textElements || []).filter(el => el.id !== id);
    updateLabelData({ textElements: newElements });
    if (selectedElement === id) setSelectedElement(null);
  };

  // 텍스트가 윈도우 영역 안에 있는지 체크
  const isInWindowZone = (x: number, y: number, width: number): boolean => {
    const halfWindowW = windowWidth / 2 + 20;
    const halfWindowH = windowHeight / 2 + 10;
    const textHalfW = width / 2;

    return Math.abs(x) < halfWindowW + textHalfW && Math.abs(y) < halfWindowH;
  };

  // Mouse handlers for drag
  const handleMouseDown = (e: React.MouseEvent, target: string, type: 'image' | 'text' | 'background') => {
    e.preventDefault();
    e.stopPropagation();

    setSelectedElement(target === 'background' ? null : target);

    let initialX = 0;
    let initialY = 0;

    if (type === 'background') {
      initialX = labelData.baseImgSettings?.x ?? 0;
      initialY = labelData.baseImgSettings?.y ?? 0;
    } else if (type === 'text') {
      const element = labelData.textElements?.find(el => el.id === target);
      if (element) {
        initialX = element.x;
        initialY = element.y;
      }
    } else if (type === 'image') {
      const element = labelData.images?.find(img => img.id === target);
      if (element) {
        initialX = element.x;
        initialY = element.y;
      }
    }

    setDragState({
      isDragging: true,
      isResizing: false,
      target,
      targetType: type,
      startX: e.clientX,
      startY: e.clientY,
      initialX,
      initialY,
    });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, target: string) => {
    e.preventDefault();
    e.stopPropagation();

    const element = labelData.textElements?.find(el => el.id === target);
    if (!element) return;

    setDragState({
      isDragging: false,
      isResizing: true,
      target,
      targetType: 'text',
      startX: e.clientX,
      startY: 0,
      initialX: 0,
      initialY: 0,
      initialWidth: element.width || 150,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.isDragging && !dragState.isResizing) return;
    if (!dragState.target) return;

    if (dragState.isResizing) {
      const dx = e.clientX - dragState.startX;
      const newWidth = Math.max(50, (dragState.initialWidth || 150) + dx);
      updateTextElement(dragState.target, { width: newWidth });
      return;
    }

    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    let newX = dragState.initialX + dx;
    let newY = dragState.initialY + dy;

    // 텍스트의 경우 윈도우 영역 진입 방지
    if (dragState.targetType === 'text') {
      const element = labelData.textElements?.find(el => el.id === dragState.target);
      if (element && isInWindowZone(newX, newY, element.width || 150)) {
        return;
      }
    }

    if (dragState.targetType === 'background') {
      updateLabelData({
        baseImgSettings: {
          ...(labelData.baseImgSettings ?? { scale: 1, x: 0, y: 0 }),
          x: newX,
          y: newY
        }
      });
    } else if (dragState.targetType === 'text') {
      updateTextElement(dragState.target, { x: newX, y: newY });
    } else if (dragState.targetType === 'image') {
      updateImage(dragState.target, { x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setDragState(prev => ({ ...prev, isDragging: false, isResizing: false, target: null, targetType: null }));
  };

  // 정렬 함수들
  const centerTextHorizontally = (id: string) => {
    updateTextElement(id, { x: 0 });
  };

  const centerTextVertically = (id: string) => {
    // 윈도우 영역 피해서 상단 또는 하단에 배치
    const element = labelData.textElements?.find(el => el.id === id);
    if (!element) return;

    const currentY = element.y;
    if (currentY >= 0) {
      // 하단 영역의 중앙
      updateTextElement(id, { y: (safeHeight / 2 + windowHeight / 2) / 2 });
    } else {
      // 상단 영역의 중앙
      updateTextElement(id, { y: -(safeHeight / 2 + windowHeight / 2) / 2 });
    }
  };

  const centerImageHorizontally = (id: string) => {
    updateImage(id, { x: 0 });
  };

  const centerImageVertically = (id: string) => {
    updateImage(id, { y: 0 });
  };

  // 라벨 프리뷰 렌더링 함수
  const renderLabelPreview = (data: LabelData, id: string) => {
    // SVG mask ID를 고유하게 생성 (가이드 꺼졌을 때만 사용)
    const maskId = `label-mask-editor-${id}`;

    return (
      <div
        className="label-bleed"
        id={id}
        style={{
          width: bleedWidth,
          height: bleedHeight,
          backgroundColor: data.backgroundColor,
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedElement(null);
          }
        }}
      >
        {/* SVG Mask for window cutout (가이드 꺼졌을 때만) */}
        {!showGuides && (
          <svg width="0" height="0" style={{ position: 'absolute' }}>
            <defs>
              <mask id={maskId}>
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={bleedWidth / 2 - windowWidth / 2}
                  y={bleedHeight / 2 - windowHeight / 2}
                  width={windowWidth}
                  height={windowHeight}
                  rx={windowRadius}
                  fill="black"
                />
              </mask>
            </defs>
          </svg>
        )}
        {/* Background Image */}
        {data.backgroundImage && (() => {
          const baseScale = data.baseImgSettings?.baseScale ?? 1;
          const effectiveScale = baseScale * (data.baseImgSettings?.scale ?? 1);
          const displayWidth = data.baseImgSettings?.originalWidth
            ? data.baseImgSettings.originalWidth * effectiveScale
            : undefined;
          const displayHeight = data.baseImgSettings?.originalHeight
            ? data.baseImgSettings.originalHeight * effectiveScale
            : undefined;
          return (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                zIndex: 1,
              }}
            >
              <img
                src={data.backgroundImage}
                alt="Background"
                style={{
                  width: displayWidth ? `${displayWidth}px` : 'auto',
                  height: displayHeight ? `${displayHeight}px` : 'auto',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(calc(-50% + ${data.baseImgSettings?.x ?? 0}px), calc(-50% + ${data.baseImgSettings?.y ?? 0}px))`,
                  transformOrigin: 'center',
                  cursor: 'move',
                  pointerEvents: 'auto',
                }}
                onMouseDown={(e) => handleMouseDown(e, 'background', 'background')}
              />
            </div>
          );
        })()}

        {/* Additional Images */}
        {(data.images || []).map((img) => {
          const baseScale = img.baseScale ?? 1;
          const effectiveScale = baseScale * img.scale;
          const displayWidth = img.originalWidth ? img.originalWidth * effectiveScale : undefined;
          const displayHeight = img.originalHeight ? img.originalHeight * effectiveScale : undefined;
          const isSelected = selectedElement === img.id;

          return (
            <div
              key={img.id}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${img.x}px), calc(-50% + ${img.y}px))`,
                transformOrigin: 'center',
                cursor: 'move',
                pointerEvents: 'auto',
                zIndex: 2,
                border: isSelected ? '2px solid #4CAF50' : '2px solid transparent',
                padding: '2px',
              }}
              onMouseDown={(e) => handleMouseDown(e, img.id, 'image')}
            >
              <img
                src={img.src}
                alt={`Image ${img.id}`}
                style={{
                  display: 'block',
                  width: displayWidth ? `${displayWidth}px` : 'auto',
                  height: displayHeight ? `${displayHeight}px` : 'auto',
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              />
            </div>
          );
        })}

        {/* Text Elements */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          mask: !showGuides ? `url(#${maskId})` : 'none',
          WebkitMask: !showGuides ? `url(#${maskId})` : 'none',
        }}>
          {(data.textElements || []).map((el) => {
            const isSelected = selectedElement === el.id;
            return (
              <div
                key={el.id}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${el.x}px), calc(-50% + ${el.y}px))`,
                  fontSize: el.fontSize,
                  fontFamily: el.fontFamily,
                  fontWeight: el.fontWeight || 400,
                  color: el.color,
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  width: el.width || 150,
                  maxWidth: el.width || 150,
                  textAlign: (el.textAlign as 'left' | 'center' | 'right') || 'center',
                  letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
                  lineHeight: el.lineHeight || 1.4,
                  cursor: 'move',
                  pointerEvents: 'auto',
                  userSelect: 'none',
                  zIndex: 50,
                  padding: '4px',
                  border: isSelected ? '1px dashed rgba(0,0,0,0.5)' : '1px dashed transparent',
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.1)' : 'transparent',
                }}
                onMouseDown={(e) => handleMouseDown(e, el.id, 'text')}
              >
                {el.text}
                {/* Resize handle */}
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      right: -4,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 8,
                      height: 20,
                      background: '#4CAF50',
                      cursor: 'ew-resize',
                      borderRadius: 2,
                      pointerEvents: 'auto',
                    }}
                    onMouseDown={(e) => handleResizeMouseDown(e, el.id)}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Center Window (Cutout) */}
        <div
          className="label-window"
          style={{
            width: windowWidth,
            height: windowHeight,
            borderRadius: windowRadius,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: showGuides ? 'rgba(128, 128, 128, 0.5)' : '#808080',
            border: showGuides ? '2px solid #e53935' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: showGuides ? 60 : 100,
            pointerEvents: 'none',
          }}
        >
          {showGuides && (
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#555', letterSpacing: '1px' }}>
              CUT OUT
            </span>
          )}
        </div>

        {/* Cut Line (Red) - 항상 표시 */}
        <div
          className="label-cut-guide"
          style={{
            width: cutWidth,
            height: cutHeight,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            border: '2px solid #e53935',
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: 101,
          }}
        />

        {/* Safe Zone (Blue Dotted) */}
        {showGuides && (
          <div
            className="label-safe-guide"
            style={{
              width: safeWidth,
              height: safeHeight,
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              border: '2px dashed #2196f3',
              borderRadius: '4px',
              pointerEvents: 'none',
              zIndex: 101,
            }}
          />
        )}

        {/* Window Safe Zone Guide */}
        {showGuides && (
          <div
            style={{
              width: windowWidth + 36,
              height: windowHeight + 36,
              borderRadius: windowRadius + 4,
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              border: '2px dashed #2196f3',
              pointerEvents: 'none',
              zIndex: 101,
            }}
          />
        )}

        {/* Zone Labels */}
        {showGuides && (
          <>
            <div style={{
              position: 'absolute',
              top: 4,
              left: 4,
              fontSize: '9px',
              fontWeight: 600,
              color: '#666',
              background: 'rgba(255,255,255,0.8)',
              padding: '2px 6px',
              borderRadius: '2px',
              zIndex: 102,
            }}>
              BLEED
            </div>
            <div style={{
              position: 'absolute',
              bottom: 4,
              right: 4,
              fontSize: '9px',
              fontWeight: 600,
              color: '#2196f3',
              background: 'rgba(255,255,255,0.8)',
              padding: '2px 6px',
              borderRadius: '2px',
              zIndex: 102,
            }}>
              SAFE
            </div>
          </>
        )}
      </div>
    );
  };

  // 선택된 텍스트 요소


  return (
    <div className="label-editor-page">
      {/* Header */}
      <header className="label-editor-header">
        <button className="back-btn" onClick={() => navigate('/create/jcard/preview', { state: { jCardData } })}>
          <ArrowLeft size={20} />
          <span>J카드로 돌아가기</span>
        </button>
        <div className="header-title">
          <span className="step-indicator">STEP 2/4</span>
          <h1>라벨 디자인</h1>
        </div>
        <button className="next-btn" onClick={() => navigate('/create/label/preview', {
          state: { jCardData, labelDataA, labelDataB, dualSideMode }
        })}>
          <Check size={18} />
          <span>완료</span>
          <ArrowRight size={18} />
        </button>
      </header>

      <div className="label-editor-content">
        {/* Editor Panel */}
        <aside className="label-editor-panel" onClick={() => setSelectedElement(null)}>
          {/* 가이드 설명 섹션 */}
          <div className="panel-section guide-info-section">
            <div
              className="guide-info-header"
              onClick={(e) => {
                e.stopPropagation();
                setShowGuideInfo(!showGuideInfo);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={16} color="#ff6b35" />
                <h3 style={{ margin: 0 }}>영역 가이드 안내</h3>
              </div>
              {showGuideInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            <AnimatePresence>
              {showGuideInfo && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="guide-info-content">
                    <div className="guide-info-item">
                      <div className="guide-color-box bleed"></div>
                      <div>
                        <strong>블리드 영역 (Bleed)</strong>
                        <p>재단 시 여유를 위한 영역입니다. 배경 이미지나 색상은 이 영역까지 채워주세요. 실제 인쇄물에서는 잘려나갑니다.</p>
                      </div>
                    </div>
                    <div className="guide-info-item">
                      <div className="guide-color-box cut"></div>
                      <div>
                        <strong>재단선 (Cut Line)</strong>
                        <p>실제로 잘리는 라인입니다. 최종 라벨의 외곽선이 됩니다.</p>
                      </div>
                    </div>
                    <div className="guide-info-item">
                      <div className="guide-color-box safe"></div>
                      <div>
                        <strong>안전 영역 (Safe Zone)</strong>
                        <p>중요한 텍스트나 로고는 이 영역 안에 배치하세요. 재단 오차로 인해 잘리지 않도록 보호됩니다.</p>
                      </div>
                    </div>
                    <div className="guide-info-item">
                      <div className="guide-color-box window"></div>
                      <div>
                        <strong>투명창 (Window)</strong>
                        <p>카세트 테이프가 보이는 구멍입니다. 이 영역은 잘려나가므로 디자인이 표시되지 않습니다.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 양면 모드 섹션 */}
          <div className="panel-section" onClick={(e) => e.stopPropagation()}>
            <h3>라벨 옵션</h3>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={dualSideMode}
                onChange={(e) => {
                  setDualSideMode(e.target.checked);
                  if (!e.target.checked) setCurrentSide('A');
                }}
              />
              <span>양면 라벨 (Side A / B)</span>
            </label>

            {dualSideMode && (
              <div className="side-tabs" style={{ marginTop: '12px' }}>
                <button
                  className={`side-tab ${currentSide === 'A' ? 'active' : ''}`}
                  onClick={() => setCurrentSide('A')}
                >
                  Side A
                </button>
                <button
                  className={`side-tab ${currentSide === 'B' ? 'active' : ''}`}
                  onClick={() => setCurrentSide('B')}
                >
                  Side B
                </button>
              </div>
            )}
          </div>

          {/* 배경 섹션 */}
          <div className="panel-section" onClick={(e) => e.stopPropagation()}>
            <h3>배경 {dualSideMode && `(Side ${currentSide})`}</h3>

            {/* 배경색 */}
            <div className="color-picker-row">
              <label>배경색</label>
              <input
                type="color"
                value={labelData.backgroundColor}
                onChange={(e) => handleBackgroundColorChange(e.target.value)}
              />
            </div>

            {/* 배경 이미지 */}
            <div className="control-row" style={{ marginTop: '12px' }}>
              <label>이미지</label>
              {!labelData.backgroundImage ? (
                <label className="upload-btn">
                  <Image size={14} />
                  <span>이미지 선택</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundImageUpload}
                    hidden
                  />
                </label>
              ) : (
                <div className="image-preview-row">
                  <div className="image-thumbnail">
                    <img
                      src={labelData.backgroundImage}
                      alt="배경 이미지"
                    />
                    <button
                      className="remove-btn"
                      onClick={() => updateLabelData({ backgroundImage: null, baseImgSettings: { scale: 1, x: 0, y: 0 } })}
                      title="이미지 삭제"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <div className="slider-control">
                    <label>크기</label>
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={labelData.baseImgSettings?.scale ?? 1}
                      onChange={(e) => updateLabelData({
                        baseImgSettings: {
                          ...(labelData.baseImgSettings ?? { scale: 1, x: 0, y: 0 }),
                          scale: parseFloat(e.target.value),
                        }
                      })}
                    />
                    <span>{(labelData.baseImgSettings?.scale ?? 1).toFixed(1)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 추가 이미지 섹션 */}
          <div className="panel-section" onClick={(e) => e.stopPropagation()}>
            <div className="section-header">
              <h3>추가 이미지 {dualSideMode && `(Side ${currentSide})`}</h3>
              <label className="icon-btn add-btn">
                <Plus size={14} strokeWidth={2.5} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAddImage}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {(labelData.images || []).length === 0 && (
              <p className="empty-text">추가된 이미지가 없습니다</p>
            )}

            {(labelData.images || []).map((img, index) => {
              const isSelected = selectedElement === img.id;
              return (
                <div
                  key={img.id}
                  className={`element-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedElement(img.id)}
                >
                  <div className="element-card-header">
                    <div className="element-thumbnail">
                      <img src={img.src} alt={`이미지 ${index + 1}`} />
                    </div>
                    <span>이미지 {index + 1}</span>
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(img.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {isSelected && (
                    <div className="element-controls">
                      <div className="slider-control">
                        <label>크기: {img.scale.toFixed(2)}</label>
                        <input
                          type="range"
                          min="0.1"
                          max="3"
                          step="0.05"
                          value={img.scale}
                          onChange={(e) => updateImage(img.id, { scale: parseFloat(e.target.value) })}
                        />
                      </div>
                      <div className="align-buttons">
                        <button onClick={() => centerImageHorizontally(img.id)} title="가로 중앙">↔</button>
                        <button onClick={() => centerImageVertically(img.id)} title="세로 중앙">↕</button>
                        <button onClick={() => { centerImageHorizontally(img.id); centerImageVertically(img.id); }} title="중앙">⊕</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 텍스트 섹션 */}
          <div className="panel-section" onClick={(e) => e.stopPropagation()}>
            <div className="section-header">
              <h3>텍스트 {dualSideMode && `(Side ${currentSide})`}</h3>
              <button className="icon-btn add-btn" onClick={addTextElement}>
                <Plus size={14} strokeWidth={2.5} />
              </button>
            </div>

            {(labelData.textElements || []).length === 0 && (
              <p className="empty-text">추가된 텍스트가 없습니다</p>
            )}

            {(labelData.textElements || []).map((el) => {
              const isSelected = selectedElement === el.id;
              return (
                <div
                  key={el.id}
                  className={`element-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedElement(el.id)}
                >
                  <div className="element-card-header">
                    <Type size={16} color="#888" />
                    <textarea
                      value={el.text}
                      onChange={(e) => updateTextElement(el.id, { text: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      className="text-input-inline"
                      rows={1}
                      style={{
                        minHeight: '32px',
                        resize: 'vertical',
                        overflow: 'hidden'
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                    />
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTextElement(el.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {isSelected && (
                    <div className="element-controls">
                      {/* 폰트 & 크기 */}
                      <div className="control-row">
                        <select
                          value={el.fontFamily}
                          onChange={(e) => updateTextElement(el.id, { fontFamily: e.target.value })}
                          style={{ flex: 2 }}
                        >
                          {FONTS.map(font => <option key={font} value={font}>{font}</option>)}
                        </select>
                        <input
                          type="number"
                          value={el.fontSize}
                          onChange={(e) => updateTextElement(el.id, { fontSize: parseInt(e.target.value) || 12 })}
                          style={{ width: '60px' }}
                        />
                      </div>

                      {/* 색상 & 스타일 */}
                      <div className="control-row">
                        <input
                          type="color"
                          value={el.color}
                          onChange={(e) => updateTextElement(el.id, { color: e.target.value })}
                          className="color-input"
                        />
                        <button
                          className={`style-btn ${(el.fontWeight || 400) === 700 ? 'active' : ''}`}
                          onClick={() => updateTextElement(el.id, { fontWeight: (el.fontWeight || 400) === 700 ? 400 : 700 })}
                        >
                          <Bold size={14} />
                        </button>
                        <button
                          className={`style-btn ${el.textAlign === 'left' ? 'active' : ''}`}
                          onClick={() => updateTextElement(el.id, { textAlign: 'left' })}
                        >
                          <AlignLeft size={14} />
                        </button>
                        <button
                          className={`style-btn ${el.textAlign === 'center' || !el.textAlign ? 'active' : ''}`}
                          onClick={() => updateTextElement(el.id, { textAlign: 'center' })}
                        >
                          <AlignCenter size={14} />
                        </button>
                        <button
                          className={`style-btn ${el.textAlign === 'right' ? 'active' : ''}`}
                          onClick={() => updateTextElement(el.id, { textAlign: 'right' })}
                        >
                          <AlignRight size={14} />
                        </button>
                      </div>

                      {/* 너비 슬라이더 */}
                      <div className="slider-control">
                        <label>너비: {el.width || 150}px</label>
                        <input
                          type="range"
                          min="50"
                          max="400"
                          step="10"
                          value={el.width || 150}
                          onChange={(e) => updateTextElement(el.id, { width: parseInt(e.target.value) })}
                        />
                      </div>

                      {/* 자간 & 행간 */}
                      <div className="control-row">
                        <div className="mini-slider">
                          <label>자간</label>
                          <input
                            type="range"
                            min="-2"
                            max="10"
                            step="0.5"
                            value={el.letterSpacing || 0}
                            onChange={(e) => updateTextElement(el.id, { letterSpacing: parseFloat(e.target.value) })}
                          />
                          <span>{el.letterSpacing || 0}</span>
                        </div>
                        <div className="mini-slider">
                          <label>행간</label>
                          <input
                            type="range"
                            min="1"
                            max="2.5"
                            step="0.1"
                            value={el.lineHeight || 1.4}
                            onChange={(e) => updateTextElement(el.id, { lineHeight: parseFloat(e.target.value) })}
                          />
                          <span>{(el.lineHeight || 1.4).toFixed(1)}</span>
                        </div>
                      </div>

                      {/* 정렬 버튼 */}
                      <div className="align-buttons">
                        <button onClick={() => centerTextHorizontally(el.id)} title="가로 중앙">↔</button>
                        <button onClick={() => centerTextVertically(el.id)} title="세로 중앙">↕</button>
                        <button onClick={() => { centerTextHorizontally(el.id); centerTextVertically(el.id); }} title="중앙">⊕</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 가이드 토글 */}
          <div className="panel-section" onClick={(e) => e.stopPropagation()}>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={showGuides}
                onChange={(e) => setShowGuides(e.target.checked)}
              />
              <span>가이드라인 표시</span>
            </label>
          </div>
        </aside>

        {/* Preview Area */}
        <main className="label-preview-area" onClick={() => setSelectedElement(null)}>
          <div className="preview-toolbar" onClick={(e) => e.stopPropagation()}>
            <div className="toolbar-group">
              <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}><ZoomOut size={16} /></button>
              <span style={{ minWidth: '40px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(2, z + 0.1))}><ZoomIn size={16} /></button>
            </div>
            <button
              className={`toolbar-btn ${showGuides ? 'active' : ''}`}
              onClick={() => setShowGuides(!showGuides)}
            >
              {showGuides ? <Eye size={18} /> : <EyeOff size={18} />}
              <span>가이드</span>
            </button>
          </div>

          <motion.div
            className="label-preview-container"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            style={{ transform: `scale(${zoom})` }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Side Label */}
            {dualSideMode && (
              <div className="side-label">
                Side {currentSide}
              </div>
            )}

            {/* Label Preview */}
            {renderLabelPreview(labelData, 'label-preview')}

            {/* Guide Legend */}
            {showGuides && (
              <div className="guide-legend">
                <div className="legend-item">
                  <span className="legend-color bleed"></span>
                  <span>블리드 영역</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color cut"></span>
                  <span>재단선</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color safe"></span>
                  <span>안전 영역</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color window"></span>
                  <span>투명창</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Dimensions Info */}
          <div className="dimensions-info">
            <span>재단 크기: {LABEL_DIMENSIONS.cut.width}mm × {LABEL_DIMENSIONS.cut.height}mm</span>
            <span>해상도: 300 DPI</span>
            {dualSideMode && <span>양면 라벨</span>}
          </div>
        </main>
      </div>
    </div>
  );
}
