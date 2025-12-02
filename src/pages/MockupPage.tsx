import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, ShoppingCart, Download } from 'lucide-react';
import { useState } from 'react';
import html2canvas from 'html2canvas';
import type { JCardData } from '../types';
import type { LabelData } from '../types/label';
import { LABEL_DIMENSIONS, LABEL_PREVIEW_SCALE } from '../types/label';
import JCardPreview from '../components/JCardPreview';
import './MockupPage.css';

type MockupView = 'jcard' | 'label';

export default function MockupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const jCardData = location.state?.jCardData as JCardData | undefined;
  const labelDataA = location.state?.labelDataA as LabelData | undefined;
  const labelDataB = location.state?.labelDataB as LabelData | undefined;
  const dualSideMode = location.state?.dualSideMode as boolean | undefined;

  const [currentView, setCurrentView] = useState<MockupView>('jcard');
  const [labelSide, setLabelSide] = useState<'A' | 'B'>('A');
  const [isExporting, setIsExporting] = useState(false);

  // 데이터가 없으면 에디터로 리다이렉트
  if (!jCardData || !labelDataA) {
    return (
      <div className="mockup-page empty-state">
        <div className="empty-content">
          <h2>디자인 데이터가 없습니다</h2>
          <p>먼저 J카드와 라벨을 디자인해주세요.</p>
          <button onClick={() => navigate('/create/jcard')}>
            처음부터 시작하기
          </button>
        </div>
      </div>
    );
  }

  const handleOrder = () => {
    navigate('/create/order', {
      state: { jCardData, labelDataA, labelDataB, dualSideMode }
    });
  };

  const handleBack = () => {
    navigate('/create/label/preview', {
      state: { jCardData, labelDataA, labelDataB, dualSideMode }
    });
  };

  const handleExport = async (format: 'png' | 'jpg') => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const elementId = currentView === 'jcard' ? 'jcard-preview-export' : 'label-preview-export';
      const element = document.getElementById(elementId);

      if (!element) {
        throw new Error('Preview element not found');
      }

      // Wait for images to load (just in case)
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });

      const link = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      const filename = `cassette-${currentView}-${timestamp}.${format}`;

      link.download = filename;
      link.href = canvas.toDataURL(`image/${format === 'jpg' ? 'jpeg' : 'png'}`);
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
      alert('이미지 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsExporting(false);
    }
  };

  // 라벨 프리뷰 렌더링
  const previewScale = LABEL_PREVIEW_SCALE * 11.811;
  const bleedWidth = LABEL_DIMENSIONS.bleed.width * previewScale;
  const bleedHeight = LABEL_DIMENSIONS.bleed.height * previewScale;
  const cutWidth = LABEL_DIMENSIONS.cut.width * previewScale;
  const cutHeight = LABEL_DIMENSIONS.cut.height * previewScale;
  const windowWidth = LABEL_DIMENSIONS.window.width * previewScale;
  const windowHeight = LABEL_DIMENSIONS.window.height * previewScale;
  const windowX = (bleedWidth - windowWidth) / 2;
  const windowY = bleedHeight - windowHeight - (11 * previewScale);
  const windowRadius = LABEL_DIMENSIONS.window.cornerRadius * previewScale;

  const currentLabelData = labelSide === 'A' ? labelDataA : (labelDataB || labelDataA);

  const renderLabelPreview = (data: LabelData) => {
    // SVG clipPath ID를 고유하게 생성
    const clipId = `label-clip-mockup-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div
        id="label-preview-export"
        className="label-mockup"
        style={{
          width: bleedWidth,
          height: bleedHeight,
          // backgroundColor removed, handled by clipped container
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '4px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
        }}
      >
        {/* SVG ClipPath Definition */}
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <clipPath id={clipId}>
              <path
                d={`
                  M 0 0 H ${bleedWidth} V ${bleedHeight} H 0 Z
                  M ${windowX + windowRadius} ${windowY}
                  L ${windowX + windowWidth - windowRadius} ${windowY}
                  A ${windowRadius} ${windowRadius} 0 0 1 ${windowX + windowWidth} ${windowY + windowRadius}
                  L ${windowX + windowWidth} ${windowY + windowHeight - windowRadius}
                  A ${windowRadius} ${windowRadius} 0 0 1 ${windowX + windowWidth - windowRadius} ${windowY + windowHeight}
                  L ${windowX + windowRadius} ${windowY + windowHeight}
                  A ${windowRadius} ${windowRadius} 0 0 1 ${windowX} ${windowY + windowHeight - windowRadius}
                  L ${windowX} ${windowY + windowRadius}
                  A ${windowRadius} ${windowRadius} 0 0 1 ${windowX + windowRadius} ${windowY}
                  Z
                `}
                clipRule="evenodd"
              />
            </clipPath>
          </defs>
        </svg>

        {/* Gray Window Overlay (Visible on top to ensure export works) */}
        <div
          style={{
            position: 'absolute',
            left: windowX,
            top: windowY,
            width: windowWidth,
            height: windowHeight,
            borderRadius: windowRadius,
            backgroundColor: '#808080',
            zIndex: 15, // Above content, below trim line
            boxSizing: 'border-box',
          }}
        />

        {/* Clipped Content Container */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: data.backgroundColor,
          clipPath: `url(#${clipId})`,
          WebkitClipPath: `url(#${clipId})`,
          zIndex: 1,
        }}>
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
              <img
                src={data.backgroundImage}
                alt=""
                style={{
                  width: displayWidth ? `${displayWidth}px` : 'auto',
                  height: displayHeight ? `${displayHeight}px` : 'auto',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(calc(-50% + ${data.baseImgSettings?.x ?? 0}px), calc(-50% + ${data.baseImgSettings?.y ?? 0}px))`,
                }}
              />
            );
          })()}

          {/* Additional Images */}
          {(data.images || []).map((img) => {
            const baseScale = img.baseScale ?? 1;
            const effectiveScale = baseScale * img.scale;
            const displayWidth = img.originalWidth ? img.originalWidth * effectiveScale : undefined;
            const displayHeight = img.originalHeight ? img.originalHeight * effectiveScale : undefined;
            return (
              <img
                key={img.id}
                src={img.src}
                alt=""
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${img.x}px), calc(-50% + ${img.y}px))`,
                  width: displayWidth ? `${displayWidth}px` : 'auto',
                  height: displayHeight ? `${displayHeight}px` : 'auto',
                  zIndex: 2,
                }}
              />
            );
          })}

          {/* Text Elements */}
          {(data.textElements || []).map((el) => (
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
                width: el.width || 150,
                textAlign: (el.textAlign as 'left' | 'center' | 'right') || 'center',
                whiteSpace: 'pre-wrap',
                letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
                lineHeight: el.lineHeight || 1.4,
                zIndex: 10,
              }}
            >
              {el.text}
            </div>
          ))}
        </div>

        {/* Trim Line (Cut Line) */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: cutWidth,
            height: cutHeight,
            border: '1px solid #000',
            zIndex: 20,
            pointerEvents: 'none',
          }}
        />
      </div>
    );
  };

  return (
    <div className="mockup-page">
      {/* Header */}
      <header className="mockup-header">
        <button className="back-btn" onClick={handleBack}>
          <ArrowLeft size={20} />
          <span>라벨 수정</span>
        </button>
        <div className="header-title">
          <span className="step-indicator">미리보기</span>
          <h1>완성 예상 이미지</h1>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '8px' }}>
          <button
            className="back-btn"
            onClick={() => handleExport('jpg')}
            disabled={isExporting}
            style={{ padding: '10px 12px' }}
            title="JPG로 저장"
          >
            <Download size={18} />
            <span>JPG</span>
          </button>
          <button
            className="back-btn"
            onClick={() => handleExport('png')}
            disabled={isExporting}
            style={{ padding: '10px 12px' }}
            title="PNG로 저장"
          >
            <Download size={18} />
            <span>PNG</span>
          </button>
          <button className="next-btn" onClick={handleOrder}>
            <span>주문하기</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </header>

      <div className="mockup-content">
        {/* Mockup Section */}
        <div className="mockup-main">
          {/* View Tabs */}
          <div className="mockup-tabs">
            <button
              className={`mockup-tab ${currentView === 'jcard' ? 'active' : ''}`}
              onClick={() => setCurrentView('jcard')}
            >
              J카드
            </button>
            <button
              className={`mockup-tab ${currentView === 'label' ? 'active' : ''}`}
              onClick={() => setCurrentView('label')}
            >
              라벨
            </button>
          </div>

          {/* Mockup Display */}
          <div className="mockup-display">
            <AnimatePresence mode="wait">
              {currentView === 'jcard' && (
                <motion.div
                  key="jcard"
                  className="mockup-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mockup-label-tag">J카드 (케이스 커버)</div>
                  <div className="jcard-mockup-wrapper">
                    <JCardPreview data={jCardData} showGuides={false} id="jcard-preview-export" />
                  </div>
                  <p className="mockup-description">
                    카세트 케이스 안에 들어가는 종이 커버입니다.
                  </p>
                </motion.div>
              )}

              {currentView === 'label' && (
                <motion.div
                  key="label"
                  className="mockup-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mockup-label-tag">라벨 (테이프 스티커)</div>

                  {/* Side toggle for dual mode */}
                  {dualSideMode && (
                    <div className="side-toggle">
                      <button
                        className={labelSide === 'A' ? 'active' : ''}
                        onClick={() => setLabelSide('A')}
                      >
                        Side A
                      </button>
                      <button
                        className={labelSide === 'B' ? 'active' : ''}
                        onClick={() => setLabelSide('B')}
                      >
                        Side B
                      </button>
                    </div>
                  )}

                  <div className="label-mockup-wrapper">
                    {renderLabelPreview(currentLabelData)}
                  </div>
                  <p className="mockup-description">
                    카세트 테이프 본체에 붙는 라벨 스티커입니다.
                    {dualSideMode && ' (양면)'}
                  </p>
                </motion.div>
              )}


            </AnimatePresence>
          </div>

          {/* Completion badge */}
          <div className="completion-badge">
            <Check size={20} />
            <span>디자인 완료! 이렇게 제작됩니다</span>
          </div>
          {/* Order Button Section */}
          <div className="order-section-bottom">
            <button className="order-btn" onClick={handleOrder}>
              <ShoppingCart size={20} />
              <span>주문하기</span>
            </button>
            <p className="order-note">
              주문 후 약 5-7일 내 제작되어 배송됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
