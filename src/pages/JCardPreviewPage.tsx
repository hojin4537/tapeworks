import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Download, Edit3, Check } from 'lucide-react';
import { useState } from 'react';
import type { JCardData } from '../types';
import { exportToImage } from '../utils/export';
import JCardPreview from '../components/JCardPreview';
import './JCardPreviewPage.css';

// 데이터 유효성 검증
const isValidJCardData = (data: any): data is JCardData => {
  return data &&
    data.cover?.backgroundColor !== undefined &&
    data.cover?.backgroundImageSettings !== undefined &&
    data.cover?.textElements !== undefined &&
    data.spine?.backgroundColor !== undefined &&
    data.flap?.backgroundColor !== undefined;
};

export default function JCardPreviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const jCardData = location.state?.jCardData as JCardData | undefined;
  // 라벨 데이터 보존
  const labelDataA = location.state?.labelDataA;
  const labelDataB = location.state?.labelDataB;
  const dualSideMode = location.state?.dualSideMode;

  const [isExporting, setIsExporting] = useState(false);

  // 데이터가 없거나 유효하지 않으면 에디터로 리다이렉트
  if (!jCardData || !isValidJCardData(jCardData)) {
    console.log('Invalid J-Card data:', jCardData);
    return (
      <div className="preview-page empty-state">
        <div className="empty-content">
          <h2>J카드 데이터가 없습니다</h2>
          <p>데이터 구조가 변경되었습니다. 처음부터 다시 디자인해주세요.</p>
          <button onClick={() => navigate('/')}>
            홈으로 가기
          </button>
          <button onClick={() => navigate('/create/jcard')} style={{ marginTop: '12px' }}>
            J카드 디자인하기
          </button>
        </div>
      </div>
    );
  }

  const handleExport = async (format: 'png' | 'jpeg') => {
    setIsExporting(true);
    try {
      await exportToImage('jcard-final-preview', format, `jcard-design.${format === 'jpeg' ? 'jpg' : 'png'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleContinue = () => {
    navigate('/create/label', {
      state: {
        jCardData,
        labelDataA,
        labelDataB,
        dualSideMode
      }
    });
  };

  const handleEdit = () => {
    navigate('/create/jcard', {
      state: {
        jCardData,
        labelDataA,
        labelDataB,
        dualSideMode
      }
    });
  };

  return (
    <div className="preview-page jcard-preview-page">
      {/* Header */}
      <header className="preview-header">
        <button className="back-btn" onClick={handleEdit}>
          <ArrowLeft size={20} />
          <span>수정하기</span>
        </button>
        <div className="header-title">
          <span className="step-indicator">J카드 완성</span>
          <h1>디자인 확인</h1>
        </div>

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
              <span>J카드 완성!</span>
            </div>

            <div className="jcard-preview-wrapper" id="jcard-final-preview">
              <JCardPreview
                data={jCardData}
                showGuides={false}
              />
            </div>

            <div className="preview-info">
              <h3>J카드 구성</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">커버</span>
                  <span className="info-value">{jCardData.cover.textElements?.length || 0}개 텍스트</span>
                </div>
                <div className="info-item">
                  <span className="info-label">스파인</span>
                  <span className="info-value">{jCardData.spine.textElements?.length || 0}개 텍스트</span>
                </div>
                <div className="info-item">
                  <span className="info-label">플랩</span>
                  <span className="info-value">{jCardData.flap.textElements?.length || 0}개 텍스트</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Panel */}
        <aside className="preview-actions">
          <div className="action-section">
            <h3>다음 단계</h3>
            <p>J카드 디자인이 완료되었어요. 이제 카세트 테이프에 붙일 라벨을 디자인해볼까요?</p>
            <button className="primary-action" onClick={handleContinue}>
              <span>라벨 디자인하기</span>
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="action-section">
            <h3>수정하기</h3>
            <p>디자인을 수정하고 싶다면 돌아가서 편집할 수 있어요.</p>
            <button className="secondary-action" onClick={handleEdit}>
              <Edit3 size={18} />
              <span>J카드 수정</span>
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
              <div className="progress-line"></div>
              <div className="progress-step current">
                <div className="step-dot">2</div>
                <span>라벨</span>
              </div>
              <div className="progress-line"></div>
              <div className="progress-step">
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
