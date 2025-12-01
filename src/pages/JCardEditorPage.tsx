import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { initialJCardData } from '../types';
import type { JCardData } from '../types';
import EditorPanel from '../components/EditorPanel';
import PreviewPanel from '../components/PreviewPanel';
import './JCardEditorPage.css';

// 기존 데이터를 새 구조로 마이그레이션
const migrateOldData = (oldData: any): JCardData => {
  // 이미 새 구조인 경우 그대로 반환
  if (oldData.cover?.backgroundColor !== undefined &&
    oldData.cover?.textElements !== undefined &&
    oldData.cover?.backgroundImage !== undefined) {
    return oldData as JCardData;
  }

  // 기존 구조라면 initialJCardData 반환
  return initialJCardData;
};

export default function JCardEditorPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // 이전 페이지에서 전달받은 데이터가 있으면 사용
  const receivedData = location.state?.jCardData;
  const initialData = receivedData ? migrateOldData(receivedData) : initialJCardData;

  // 라벨 데이터 보존을 위한 state 읽기
  const labelDataA = location.state?.labelDataA;
  const labelDataB = location.state?.labelDataB;
  const dualSideMode = location.state?.dualSideMode;

  const [jCardData, setJCardData] = useState<JCardData>(initialData);
  const [activeTab, setActiveTab] = useState<'cover' | 'spine' | 'flap'>('cover');
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  // location.state가 변경되면 데이터 업데이트
  useEffect(() => {
    if (location.state?.jCardData) {
      setJCardData(location.state.jCardData);
    }
  }, [location.state]);

  const updateJCardData = (section: keyof JCardData, data: Partial<JCardData[keyof JCardData]>) => {
    setJCardData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...data,
      },
    }));
  };

  const handleComplete = () => {
    // J카드 프리뷰 페이지로 이동하면서 데이터 전달 (라벨 데이터도 함께 전달)
    navigate('/create/jcard/preview', {
      state: {
        jCardData,
        labelDataA,
        labelDataB,
        dualSideMode
      }
    });
  };

  return (
    <div className="jcard-editor-page">
      {/* Header */}
      <header className="jcard-editor-header">
        <button className="back-btn" onClick={() => navigate('/guide')}>
          <ArrowLeft size={20} />
          <span>처음으로</span>
        </button>
        <div className="header-title">
          <span className="step-indicator">STEP 1/4</span>
          <h1>J카드 디자인</h1>
        </div>
        <button className="next-btn" onClick={handleComplete}>
          <Check size={18} />
          <span>완료</span>
          <ArrowRight size={18} />
        </button>
      </header>

      {/* Editor Content */}
      <div className="jcard-editor-content">
        <div onClick={() => setSelectedElement(null)}>
          <EditorPanel
            data={jCardData}
            updateData={updateJCardData}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedElement={selectedElement}
            onSelectElement={setSelectedElement}
          />
        </div>
        <PreviewPanel
          data={jCardData}
          onUpdate={updateJCardData}
          selectedElement={selectedElement}
          onElementSelected={setSelectedElement}
          onElementDeselected={() => setSelectedElement(null)}
        />
      </div>
    </div>
  );
}
