import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Download, Edit3, Check } from 'lucide-react';
import { useState } from 'react';
import type { JCardData } from '../types';
import type { LabelData } from '../types/label';
import { LABEL_DIMENSIONS, LABEL_PREVIEW_SCALE } from '../types/label';
import { exportToImage } from '../utils/export';
import './LabelPreviewPage.css';

export default function LabelPreviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const jCardData = location.state?.jCardData as JCardData | undefined;
  const labelDataA = location.state?.labelDataA as LabelData | undefined;
  const labelDataB = location.state?.labelDataB as LabelData | undefined;
  const dualSideMode = location.state?.dualSideMode as boolean | undefined;

  const [isExporting, setIsExporting] = useState(false);
  const [previewSide, setPreviewSide] = useState<'A' | 'B'>('A');

  // 데이터가 없으면 에디터로 리다이렉트
  if (!labelDataA) {
    return (
      <div className="preview-page empty-state">
        <div className="empty-content">
          <h2>라벨 데이터가 없습니다</h2>
          <p>먼저 라벨을 디자인해주세요.</p>
          <button onClick={() => navigate('/create/label')}>
            라벨 디자인하기
          </button>
        </div>
      </div>
    );
  }

  const currentLabelData = previewSide === 'A' ? labelDataA : (labelDataB || labelDataA);

  // 프리뷰용 스케일
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

  const handleExport = async (format: 'png' | 'jpeg') => {
    setIsExporting(true);
    try {
      const fileName = dualSideMode
        ? `label-side-${previewSide.toLowerCase()}.${format === 'jpeg' ? 'jpg' : 'png'}`
        : `label-design.${format === 'jpeg' ? 'jpg' : 'png'}`;
      await exportToImage('label-final-preview', format, fileName);
    } finally {
      setIsExporting(false);
    }
  };

  const handleContinue = () => {
    navigate('/create/mockup', {
      state: { jCardData, labelDataA, labelDataB, dualSideMode }
    });
  };

  const handleEdit = () => {
    navigate('/create/label', {
      state: { jCardData, labelDataA, labelDataB, dualSideMode }
    });
  };

  // 라벨 프리뷰 렌더링
  const renderLabelPreview = (data: LabelData) => {
    // SVG mask ID를 고유하게 생성
    const maskId = `label-mask-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div
        style={{
          width: bleedWidth,
          height: bleedHeight,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '4px',
          backgroundColor: '#fff', // Default background
        }}
      >
        {/* SVG Mask for window cutout */}
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <mask id={maskId}>
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
                fill="white"
                fillRule="evenodd"
              />
            </mask>
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

        {/* Masked Content Wrapper */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: data.backgroundColor,
          mask: `url(#${maskId})`,
          WebkitMask: `url(#${maskId})`,
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
                alt="Background"
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
    <div className="preview-page label-preview-page">
      {/* Header */}
      <header className="preview-header">
        <button className="back-btn" onClick={handleEdit}>
          <ArrowLeft size={20} />
          <span>수정하기</span>
        </button>
        <div className="header-title">
          <span className="step-indicator">라벨 완성</span>
          <h1>디자인 확인</h1>
        </div>
        <div style={{ width: 100 }}></div>
      </header>

      <div className="preview-content">
        {/* Preview Section */}
        <motion.div
          className="preview-main"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="preview-card">
            <div className="preview-badge">
              <Check size={16} />
              <span>라벨 완성!</span>
            </div>

            {/* Side tabs for dual mode */}
            {dualSideMode && (
              <div className="side-tabs">
                <button
                  className={`side-tab ${previewSide === 'A' ? 'active' : ''}`}
                  onClick={() => setPreviewSide('A')}
                >
                  Side A
                </button>
                <button
                  className={`side-tab ${previewSide === 'B' ? 'active' : ''}`}
                  onClick={() => setPreviewSide('B')}
                >
                  Side B
                </button>
              </div>
            )}

            <div className="label-preview-wrapper" id="label-final-preview">
              {renderLabelPreview(currentLabelData)}
            </div>

            <div className="preview-info">
              <h3>라벨 정보</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">크기</span>
                  <span className="info-value">{LABEL_DIMENSIONS.cut.width}mm × {LABEL_DIMENSIONS.cut.height}mm</span>
                </div>
                <div className="info-item">
                  <span className="info-label">타입</span>
                  <span className="info-value">{dualSideMode ? '양면 라벨' : '단면 라벨'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">해상도</span>
                  <span className="info-value">300 DPI</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Panel */}
        <aside className="preview-actions">
          <div className="action-section">
            <h3>다음 단계</h3>
            <p>라벨 디자인이 완료되었어요! 이제 실제 카세트가 어떻게 완성될지 목업으로 확인해볼까요?</p>
            <button className="primary-action" onClick={handleContinue}>
              <span>최종 확인하기</span>
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="action-section">
            <h3>수정하기</h3>
            <p>디자인을 수정하고 싶다면 돌아가서 편집할 수 있어요.</p>
            <button className="secondary-action" onClick={handleEdit}>
              <Edit3 size={18} />
              <span>라벨 수정</span>
            </button>
          </div>

          <div className="action-section">
            <h3>이미지 저장</h3>
            <p>현재 디자인을 이미지로 저장할 수 있어요.</p>
            <div className="export-buttons">
              <button
                className="export-btn"
                onClick={() => handleExport('png')}
                disabled={isExporting}
              >
                <Download size={16} />
                <span>PNG</span>
              </button>
              <button
                className="export-btn"
                onClick={() => handleExport('jpeg')}
                disabled={isExporting}
              >
                <Download size={16} />
                <span>JPG</span>
              </button>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="progress-section">
            <h4>진행 상황</h4>
            <div className="progress-steps">
              <div className="progress-step completed">
                <div className="step-dot"><Check size={12} /></div>
                <span>J카드</span>
              </div>
              <div className="progress-line completed"></div>
              <div className="progress-step completed">
                <div className="step-dot"><Check size={12} /></div>
                <span>라벨</span>
              </div>
              <div className="progress-line"></div>
              <div className="progress-step current">
                <div className="step-dot">3</div>
                <span>목업</span>
              </div>
              <div className="progress-line"></div>
              <div className="progress-step">
                <div className="step-dot">4</div>
                <span>주문</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

