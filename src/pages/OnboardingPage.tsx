import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, ChevronRight } from 'lucide-react';
import './OnboardingPage.css';

interface Step {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  visual: 'cassette' | 'jcard' | 'label' | 'complete';
}

const steps: Step[] = [
  {
    id: 1,
    title: '카세트 테이프란?',
    subtitle: 'CASSETTE TAPE',
    description: '카세트 테이프는 1960년대부터 사용된 음악 저장 매체예요. 최근 레트로 감성과 함께 다시 인기를 얻고 있죠. TapeWorks에서는 나만의 디자인으로 실물 카세트를 만들 수 있어요.',
    visual: 'cassette',
  },
  {
    id: 2,
    title: 'J카드',
    subtitle: 'J-CARD',
    description: 'J카드는 카세트 케이스 안에 들어가는 종이 커버예요. 앨범 아트, 트랙리스트, 아티스트 정보 등을 담을 수 있어요. 앞면(커버), 옆면(스파인), 뒷면(플랩)으로 구성되어 있어요.',
    visual: 'jcard',
  },
  {
    id: 3,
    title: '라벨',
    subtitle: 'LABEL',
    description: '라벨은 카세트 테이프 본체에 붙는 스티커예요. Side A와 Side B 양면에 각각 붙일 수 있어요. 앨범명, 아티스트명 등을 적어 테이프를 꾸밀 수 있죠.',
    visual: 'label',
  },
  {
    id: 4,
    title: '준비 완료!',
    subtitle: 'READY TO CREATE',
    description: '이제 나만의 카세트를 만들 준비가 되었어요! J카드 → 라벨 → 목업 확인 → 주문 순서로 진행됩니다. 완성된 카세트는 실물로 제작되어 집으로 배송돼요.',
    visual: 'complete',
  },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/create/jcard');
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    navigate('/create/jcard');
  };

  const step = steps[currentStep];

  return (
    <div className="onboarding-page">
      {/* Skip button */}
      <button className="skip-btn" onClick={handleSkip}>
        건너뛰기 <ChevronRight size={16} />
      </button>

      {/* Progress indicator */}
      <div className="progress-dots">
        {steps.map((_, index) => (
          <button
            key={index}
            className={`dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
            onClick={() => setCurrentStep(index)}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          className="onboarding-content"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          {/* Visual */}
          <div className="visual-container">
            {step.visual === 'cassette' && <CassetteVisual />}
            {step.visual === 'jcard' && <JCardVisual />}
            {step.visual === 'label' && <LabelVisual />}
            {step.visual === 'complete' && <CompleteVisual />}
          </div>

          {/* Text content */}
          <div className="text-content">
            <span className="step-subtitle">{step.subtitle}</span>
            <h1 className="step-title">{step.title}</h1>
            <p className="step-description">{step.description}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="onboarding-nav">
        <button
          className="nav-btn prev"
          onClick={handlePrev}
          disabled={currentStep === 0}
        >
          <ArrowLeft size={20} />
          <span>이전</span>
        </button>

        <button className="nav-btn next" onClick={handleNext}>
          <span>{currentStep === steps.length - 1 ? '디자인 시작하기' : '다음'}</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}

// Visual Components
function CassetteVisual() {
  return (
    <div className="visual cassette-visual">
      <div className="cassette-body">
        <div className="cassette-top">
          <div className="screw left"></div>
          <div className="screw right"></div>
        </div>
        <div className="cassette-window">
          <div className="reel left">
            <div className="reel-center"></div>
          </div>
          <div className="tape-guide"></div>
          <div className="reel right">
            <div className="reel-center"></div>
          </div>
        </div>
        <div className="cassette-label-area">
          <span>YOUR DESIGN</span>
        </div>
        <div className="cassette-bottom">
          <div className="hole left"></div>
          <div className="hole right"></div>
        </div>
      </div>
      <div className="visual-label">카세트 테이프</div>
    </div>
  );
}

function JCardVisual() {
  return (
    <div className="visual jcard-visual">
      <div className="jcard-image-placeholder">
        <img
          src="https://placehold.co/800x400/1a1a1a/ffffff?text=J-Card+Example"
          alt="J-Card Example"
        />
      </div>
    </div>
  );
}

function LabelVisual() {
  return (
    <div className="visual label-visual">
      <div className="label-image-placeholder">
        <img
          src="https://placehold.co/800x400/1a1a1a/ffffff?text=Label+Example"
          alt="Label Example"
        />
      </div>
    </div>
  );
}

function CompleteVisual() {
  return (
    <div className="visual complete-visual">
      <div className="flow-diagram">
        <div className="flow-step">
          <div className="flow-icon">📝</div>
          <span>J카드</span>
        </div>
        <div className="flow-arrow">→</div>
        <div className="flow-step">
          <div className="flow-icon">🏷️</div>
          <span>라벨</span>
        </div>
        <div className="flow-arrow">→</div>
        <div className="flow-step">
          <div className="flow-icon">👀</div>
          <span>목업</span>
        </div>
        <div className="flow-arrow">→</div>
        <div className="flow-step">
          <div className="flow-icon">📦</div>
          <span>주문</span>
        </div>
      </div>
    </div>
  );
}

