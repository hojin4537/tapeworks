import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import type { JCardData } from '../types';
import type { LabelData } from '../types/label';
import { LABEL_DIMENSIONS, LABEL_PREVIEW_SCALE } from '../types/label';
import JCardPreview from '../components/JCardPreview';
import './MockupPage.css';

type MockupView = 'jcard' | 'label' | 'example';

export default function MockupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const jCardData = location.state?.jCardData as JCardData | undefined;
  const labelDataA = location.state?.labelDataA as LabelData | undefined;
  const labelDataB = location.state?.labelDataB as LabelData | undefined;
  const dualSideMode = location.state?.dualSideMode as boolean | undefined;

  const [currentView, setCurrentView] = useState<MockupView>('jcard');
  const [labelSide, setLabelSide] = useState<'A' | 'B'>('A');

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
    // 래피드 결제 페이지로 이동 (임시 URL)
    window.open('https://rapid-checkout-placeholder.com', '_blank');
  };

  const handleBack = () => {
    navigate('/create/label/preview', {
      state: { jCardData, labelDataA, labelDataB, dualSideMode }
    });
  };

  // 라벨 프리뷰 렌더링
  const previewScale = LABEL_PREVIEW_SCALE * 11.811;
  const labelWidth = LABEL_DIMENSIONS.cut.width * previewScale;
  const labelHeight = LABEL_DIMENSIONS.cut.height * previewScale;
  const windowWidth = LABEL_DIMENSIONS.window.width * previewScale;
  const windowHeight = LABEL_DIMENSIONS.window.height * previewScale;
  const windowRadius = LABEL_DIMENSIONS.window.cornerRadius * previewScale;

  const currentLabelData = labelSide === 'A' ? labelDataA : (labelDataB || labelDataA);

  const renderLabelPreview = (data: LabelData) => {
    // SVG mask ID를 고유하게 생성
    const maskId = `label-mask-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div
        className="label-mockup"
        style={{
          width: labelWidth,
          height: labelHeight,
          backgroundColor: data.backgroundColor,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '8px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
        }}
      >
        {/* SVG Mask for window cutout */}
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <mask id={maskId}>
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={labelWidth / 2 - windowWidth / 2}
                y={labelHeight / 2 - windowHeight / 2}
                width={windowWidth}
                height={windowHeight}
                rx={windowRadius}
                fill="black"
              />
            </mask>
          </defs>
        </svg>
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
          const displayWidth = img.originalWidth ? img.originalWidth * img.scale : undefined;
          const displayHeight = img.originalHeight ? img.originalHeight * img.scale : undefined;
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

        {/* Text Elements with mask applied */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          mask: `url(#${maskId})`,
          WebkitMask: `url(#${maskId})`,
        }}>
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
              }}
            >
              {el.text}
            </div>
          ))}
        </div>

        {/* Window (visual only) */}
        <div
          style={{
            width: windowWidth,
            height: windowHeight,
            borderRadius: windowRadius,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#808080',
            zIndex: 100,
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)',
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
          <span className="step-indicator">목업 미리보기</span>
          <h1>완성 예상 이미지</h1>
        </div>
        <button className="next-btn" onClick={handleOrder}>
          <span>주문하기</span>
          <ArrowRight size={20} />
        </button>
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
            <button
              className={`mockup-tab ${currentView === 'example' ? 'active' : ''}`}
              onClick={() => setCurrentView('example')}
            >
              예시 이미지
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
                    <JCardPreview data={jCardData} showGuides={false} />
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

              {currentView === 'example' && (
                <motion.div
                  key="example"
                  className="mockup-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mockup-label-tag">제작 예시</div>

                  <div className="example-images-container">
                    {/* Design Image */}
                    <div className="example-image-box">
                      <h4>디자인 시안</h4>
                      <div className="image-display-area">
                        <img
                          src="https://placehold.co/400x400/252525/ffffff?text=Design+Example"
                          alt="Design Example"
                        />
                      </div>
                      <p className="upload-desc">고객님이 디자인하신 시안입니다.</p>
                    </div>

                    {/* Real Image */}
                    <div className="example-image-box">
                      <h4>실제 제작물</h4>
                      <div className="image-display-area">
                        <img
                          src="https://placehold.co/400x400/1a1a1a/ffffff?text=Real+Product"
                          alt="Real Product Example"
                        />
                      </div>
                      <p className="upload-desc">실제 제작되어 배송되는 제품의 예시입니다.</p>
                    </div>
                  </div>
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
