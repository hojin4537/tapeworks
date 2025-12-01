import React, { useEffect } from 'react';
import type { JCardData, TextElement, ImageElement } from '../types';
import { Layers, BookOpen, PanelLeft, Plus, Trash2, X, Type, Image, AlignLeft, AlignCenter, AlignRight, Move } from 'lucide-react';

interface EditorPanelProps {
  data: JCardData;
  updateData: (section: keyof JCardData, data: any) => void;
  activeTab: 'cover' | 'spine' | 'flap';
  setActiveTab: (tab: 'cover' | 'spine' | 'flap') => void;
  selectedElement: string | null;
  onSelectElement: (element: string | null) => void;
}

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
  'Ubuntu',
  'Georgia',
  'Times New Roman',
  'Courier New',
];

const EditorPanel: React.FC<EditorPanelProps> = ({
  data,
  updateData,
  activeTab,
  setActiveTab,
  selectedElement,
  onSelectElement
}) => {
  const sectionData = data[activeTab];

  // Font loading effect
  useEffect(() => {
    const fontsToLoad = new Set<string>();

    ['cover', 'spine', 'flap'].forEach(section => {
      const sec = data[section as keyof JCardData];
      sec.textElements?.forEach(el => fontsToLoad.add(el.fontFamily));
    });

    fontsToLoad.forEach(font => {
      const linkId = `font-${font.replace(/\s+/g, '-')}`;
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';

        if (font === 'Pretendard') {
          link.href = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css';
        } else if (['Georgia', 'Times New Roman', 'Courier New'].includes(font)) {
          return; // System fonts
        } else {
          link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}:wght@400;500;600;700&display=swap`;
        }

        document.head.appendChild(link);
      }
    });
  }, [data]);

  // 배경 이미지 업로드 (위아래가 꽉 차게)
  const handleBackgroundImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new window.Image();
        img.onload = () => {
          // 프레임 크기 계산

          const frameHeight = 10.4 * 60;


          // 위아래가 꽉 차게 스케일 계산 (높이 기준)
          const baseScale = frameHeight / img.height;

          updateData(activeTab, {
            backgroundImage: reader.result as string,
            backgroundImageSettings: {
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

  // 추가 이미지 업로드 (좌우가 꽉 차게)
  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new window.Image();
        img.onload = () => {
          // 프레임 크기 계산
          const frameWidths = { cover: 6.6 * 60, spine: 1.5 * 60, flap: 2.3 * 60 };
          const frameWidth = frameWidths[activeTab];

          // 좌우가 꽉 차게 스케일 계산 (너비 기준)
          const baseScale = frameWidth / img.width;

          const newImage: ImageElement = {
            id: Date.now().toString(),
            src: reader.result as string,
            x: 0,
            y: 0,
            scale: 1,
            baseScale: baseScale,
            originalWidth: img.width,
            originalHeight: img.height,
            rotation: 0,
          };
          updateData(activeTab, { images: [...(sectionData.images || []), newImage] });
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const updateImage = (id: string, updates: Partial<ImageElement>) => {
    const newImages = (sectionData.images || []).map(img =>
      img.id === id ? { ...img, ...updates } : img
    );
    updateData(activeTab, { images: newImages });
  };

  const removeImage = (id: string) => {
    const newImages = (sectionData.images || []).filter(img => img.id !== id);
    updateData(activeTab, { images: newImages });
  };

  // 텍스트 추가
  const addTextElement = () => {
    const newElement: TextElement = {
      id: Date.now().toString(),
      text: '텍스트',
      x: 0,
      y: 0,
      fontSize: 16,
      fontFamily: 'Pretendard',
      color: '#000000',
      fontWeight: 400,
      width: 150,
      textAlign: 'center',
      letterSpacing: 0,
      lineHeight: 1.4,
    };
    updateData(activeTab, { textElements: [...(sectionData.textElements || []), newElement] });
    onSelectElement(`${activeTab}-${newElement.id}`);
  };

  const updateTextElement = (id: string, updates: Partial<TextElement>) => {
    const newElements = (sectionData.textElements || []).map(el =>
      el.id === id ? { ...el, ...updates } : el
    );
    updateData(activeTab, { textElements: newElements });
  };

  const removeTextElement = (id: string) => {
    const newElements = (sectionData.textElements || []).filter(el => el.id !== id);
    updateData(activeTab, { textElements: newElements });
    onSelectElement(null);
  };

  // 현재 선택된 텍스트 요소 가져오기
  const getSelectedTextElement = (): TextElement | null => {
    if (!selectedElement) return null;
    const [section, id] = selectedElement.split('-');
    if (section !== activeTab) return null;
    return sectionData.textElements?.find(el => el.id === id) || null;
  };

  const selectedText = getSelectedTextElement();

  return (
    <div className="editor-panel" onClick={(e) => e.stopPropagation()}>
      {/* Tabs */}
      <div className="editor-tabs">
        <button
          className={`tab-btn ${activeTab === 'cover' ? 'active' : ''}`}
          onClick={() => setActiveTab('cover')}
        >
          <Layers size={16} /> Cover
        </button>
        <button
          className={`tab-btn ${activeTab === 'spine' ? 'active' : ''}`}
          onClick={() => setActiveTab('spine')}
        >
          <BookOpen size={16} /> Spine
        </button>
        <button
          className={`tab-btn ${activeTab === 'flap' ? 'active' : ''}`}
          onClick={() => setActiveTab('flap')}
        >
          <PanelLeft size={16} /> Flap
        </button>
      </div>

      <div className="editor-content">
        {/* 배경 섹션 */}
        <div className="editor-section">
          <div className="section-header">
            <span className="section-title">배경</span>
          </div>

          {/* 배경 색상 */}
          <div className="control-row">
            <label>색상</label>
            <div className="color-input-wrapper">
              <input
                type="color"
                value={sectionData.backgroundColor}
                onChange={(e) => updateData(activeTab, { backgroundColor: e.target.value })}
                className="color-picker"
              />
              <input
                type="text"
                value={sectionData.backgroundColor}
                onChange={(e) => updateData(activeTab, { backgroundColor: e.target.value })}
                className="color-text"
              />
            </div>
          </div>

          {/* 배경 이미지 */}
          <div className="control-row">
            <label>이미지</label>
            {!sectionData.backgroundImage ? (
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
                  <img src={sectionData.backgroundImage} alt="Background" />
                  <button
                    className="remove-btn"
                    onClick={() => updateData(activeTab, { backgroundImage: null })}
                  >
                    <X size={12} />
                  </button>
                </div>
                <div className="image-controls">
                  <label>크기</label>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.05"
                    value={sectionData.backgroundImageSettings?.scale ?? 1}
                    onChange={(e) => updateData(activeTab, {
                      backgroundImageSettings: {
                        ...sectionData.backgroundImageSettings,
                        scale: parseFloat(e.target.value)
                      }
                    })}
                  />
                  <span className="value">{((sectionData.backgroundImageSettings?.scale ?? 1) * 100).toFixed(0)}%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 추가 이미지 섹션 */}
        <div className="editor-section">
          <div className="section-header">
            <span className="section-title">이미지</span>
            <label className="add-btn icon-btn" title="이미지 추가">
              <Plus size={16} strokeWidth={2} />
              <input
                type="file"
                accept="image/*"
                onChange={handleAddImage}
                hidden
              />
            </label>
          </div>

          {(sectionData.images || []).map((img, index) => {
            const imageId = `${activeTab}-image-${img.id}`;
            const isSelected = selectedElement === imageId;
            return (
              <div
                key={img.id}
                className={`item-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectElement(imageId)}
              >
                <div className="item-header">
                  <Image size={16} strokeWidth={2} style={{ flexShrink: 0 }} />
                  <span className="item-label">이미지 {index + 1}</span>
                  <button className="delete-btn" onClick={(e) => { e.stopPropagation(); removeImage(img.id); }} title="삭제">
                    <Trash2 size={16} strokeWidth={2} />
                  </button>
                </div>
                <div className="item-controls">
                  <div className="control-row compact">
                    <label>크기</label>
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.05"
                      value={img.scale}
                      onChange={(e) => updateImage(img.id, { scale: parseFloat(e.target.value) })}
                    />
                    <span className="value">{(img.scale * 100).toFixed(0)}%</span>
                  </div>
                  <div className="position-buttons">
                    <button
                      className="position-btn"
                      onClick={() => updateImage(img.id, { x: 0 })}
                      title="가로 중앙"
                    >
                      ↔
                    </button>
                    <button
                      className="position-btn"
                      onClick={() => updateImage(img.id, { y: 0 })}
                      title="세로 중앙"
                    >
                      ↕
                    </button>
                    <button
                      className="position-btn"
                      onClick={() => updateImage(img.id, { x: 0, y: 0 })}
                      title="중앙 정렬"
                    >
                      <Move size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 텍스트 섹션 */}
        <div className="editor-section">
          <div className="section-header">
            <span className="section-title">텍스트</span>
            <button className="add-btn icon-btn" onClick={addTextElement} title="텍스트 추가">
              <Plus size={16} strokeWidth={2} />
            </button>
          </div>

          {(sectionData.textElements || []).map((el) => {
            const isSelected = selectedElement === `${activeTab}-${el.id}`;
            return (
              <div
                key={el.id}
                className={`item-card text-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectElement(`${activeTab}-${el.id}`)}
              >
                <div className="item-header">
                  <Type size={16} strokeWidth={2} />
                  <textarea
                    value={el.text}
                    onChange={(e) => updateTextElement(el.id, { text: e.target.value })}
                    className="text-input"
                    placeholder="텍스트 입력"
                    onClick={(e) => e.stopPropagation()}
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
                  <button className="delete-btn" onClick={(e) => { e.stopPropagation(); removeTextElement(el.id); }} title="삭제">
                    <Trash2 size={16} strokeWidth={2} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 선택된 텍스트 스타일링 패널 (Figma 스타일) */}
        {selectedText && (
          <div className="editor-section style-panel">
            <div className="section-header">
              <span className="section-title">텍스트 스타일</span>
            </div>

            {/* 폰트 선택 */}
            <div className="control-row">
              <label>폰트</label>
              <select
                value={selectedText.fontFamily}
                onChange={(e) => updateTextElement(selectedText.id, { fontFamily: e.target.value })}
                className="font-select"
              >
                {FONTS.map(font => (
                  <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                ))}
              </select>
            </div>

            {/* 크기 & 굵기 */}
            <div className="control-row two-col">
              <div className="control-item">
                <label>크기</label>
                <input
                  type="number"
                  value={selectedText.fontSize}
                  onChange={(e) => updateTextElement(selectedText.id, { fontSize: parseInt(e.target.value) || 12 })}
                  className="number-input"
                  min={8}
                  max={200}
                />
              </div>
              <div className="control-item">
                <label>굵기</label>
                <select
                  value={selectedText.fontWeight}
                  onChange={(e) => updateTextElement(selectedText.id, { fontWeight: parseInt(e.target.value) })}
                  className="weight-select"
                >
                  <option value={400}>Regular</option>
                  <option value={500}>Medium</option>
                  <option value={600}>SemiBold</option>
                  <option value={700}>Bold</option>
                </select>
              </div>
            </div>

            {/* 색상 */}
            <div className="control-row">
              <label>색상</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  value={selectedText.color}
                  onChange={(e) => updateTextElement(selectedText.id, { color: e.target.value })}
                  className="color-picker"
                />
                <input
                  type="text"
                  value={selectedText.color}
                  onChange={(e) => updateTextElement(selectedText.id, { color: e.target.value })}
                  className="color-text"
                />
              </div>
            </div>

            {/* 정렬 */}
            <div className="control-row">
              <label></label>
              <div className="align-buttons">
                <button
                  className={selectedText.textAlign === 'left' ? 'active' : ''}
                  onClick={() => updateTextElement(selectedText.id, { textAlign: 'left' })}
                >
                  <AlignLeft size={16} />
                </button>
                <button
                  className={selectedText.textAlign === 'center' || !selectedText.textAlign ? 'active' : ''}
                  onClick={() => updateTextElement(selectedText.id, { textAlign: 'center' })}
                >
                  <AlignCenter size={16} />
                </button>
                <button
                  className={selectedText.textAlign === 'right' ? 'active' : ''}
                  onClick={() => updateTextElement(selectedText.id, { textAlign: 'right' })}
                >
                  <AlignRight size={16} />
                </button>
              </div>
            </div>

            {/* 자간 & 행간 */}
            <div className="control-row two-col">
              <div className="control-item">
                <label>자간</label>
                <input
                  type="number"
                  value={selectedText.letterSpacing || 0}
                  onChange={(e) => updateTextElement(selectedText.id, { letterSpacing: parseFloat(e.target.value) || 0 })}
                  className="number-input"
                  step={0.5}
                  min={-10}
                  max={20}
                />
              </div>
              <div className="control-item">
                <label>행간</label>
                <input
                  type="number"
                  value={selectedText.lineHeight || 1.4}
                  onChange={(e) => updateTextElement(selectedText.id, { lineHeight: parseFloat(e.target.value) || 1.4 })}
                  className="number-input"
                  step={0.1}
                  min={0.8}
                  max={3}
                />
              </div>
            </div>

            {/* 너비 */}
            <div className="control-row">
              <label>너비</label>
              <input
                type="range"
                min="50"
                max="400"
                step="10"
                value={selectedText.width || 150}
                onChange={(e) => updateTextElement(selectedText.id, { width: parseInt(e.target.value) })}
              />
              <span className="value">{selectedText.width || 150}px</span>
            </div>

            {/* 위치 초기화 */}
            <div className="control-row">
              <label>정렬</label>
              <div className="position-buttons">
                <button
                  className="position-btn"
                  onClick={() => updateTextElement(selectedText.id, { x: 0 })}
                  title="가로 중앙 정렬"
                >
                  가로
                </button>
                <button
                  className="position-btn"
                  onClick={() => updateTextElement(selectedText.id, { y: 0 })}
                  title="세로 중앙 정렬"
                >
                  세로
                </button>
                <button
                  className="position-btn"
                  onClick={() => updateTextElement(selectedText.id, { x: 0, y: 0 })}
                  title="정중앙 정렬"
                >
                  중앙
                </button>
              </div>
            </div>
            <p className="control-description">
              텍스트 박스의 위치를 가로, 세로, 정중앙으로 정렬합니다.
            </p>
          </div>
        )}
      </div>

      <style>{`
        .editor-panel {
          width: 320px;
          background: #1e1e1e;
          border-right: 1px solid #333;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        
        .editor-tabs {
          display: flex;
          border-bottom: 1px solid #333;
          flex-shrink: 0;
        }
        
        .tab-btn {
          flex: 1;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: #888;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px 8px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .tab-btn:hover {
          background: #252525;
          color: #ccc;
        }
        
        .tab-btn.active {
          color: #fff;
          border-bottom-color: #646cff;
        }
        
        .editor-content {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }
        
        .editor-section {
          background: #252525;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .section-title {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #888;
        }
        
        .add-btn {
          border-radius: 6px;
          background: #333;
          border: none;
          color: #ccc;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        
        .add-btn.icon-btn {
          min-width: 32px;
          width: 32px;
          height: 32px;
          padding: 0;
        }
        
        .add-btn:hover {
          background: #646cff;
          color: #fff;
        }
        
        .add-btn svg {
          flex-shrink: 0;
        }
        
        .control-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }
        
        .control-row:last-child {
          margin-bottom: 0;
        }
        
        .control-row label {
          font-size: 12px;
          color: #888;
          min-width: 40px;
        }
        
        .control-row.two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        
        .control-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .control-item label {
          font-size: 11px;
        }
        
        .color-input-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }
        
        .color-picker {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          padding: 0;
        }
        
        .color-text {
          flex: 1;
          min-height: 32px;
          background: #333;
          border: 1px solid #444;
          border-radius: 6px;
          padding: 6px 8px;
          color: #fff;
          font-size: 12px;
          font-family: monospace;
        }
        
        .upload-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          min-height: 32px;
          padding: 6px 12px;
          background: #333;
          border: 1px dashed #555;
          border-radius: 6px;
          color: #aaa;
          font-size: 12px;
          cursor: pointer;
          flex: 1;
          justify-content: center;
          transition: all 0.2s;
        }
        
        .upload-btn:hover {
          background: #3a3a3a;
          border-color: #666;
          color: #fff;
        }
        
        .image-preview-row {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .image-thumbnail {
          position: relative;
          width: 100%;
          height: 60px;
          border-radius: 4px;
          overflow: hidden;
          background: #333;
        }
        
        .image-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .image-thumbnail .remove-btn {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 20px;
          height: 20px;
          border-radius: 4px;
          background: rgba(0,0,0,0.7);
          border: none;
          color: #ff6b6b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .control-description {
          font-size: 11px;
          color: #666;
          margin-top: 6px;
          margin-left: 48px;
          line-height: 1.4;
        }
        
        .image-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .image-controls label {
          font-size: 11px;
          color: #666;
        }
        
        .image-controls input[type="range"] {
          flex: 1;
        }
        
        .image-controls .value {
          font-size: 11px;
          color: #888;
          min-width: 35px;
          text-align: right;
        }
        
        .item-card {
          background: #2a2a2a;
          border: 1px solid #333;
          border-radius: 6px;
          padding: 10px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .item-card:hover {
          border-color: #555;
        }
        
        .item-card.selected {
          border-color: #646cff;
          background: #2d2d3a;
        }
        
        .item-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .item-header svg {
          flex-shrink: 0;
          color: #888;
        }
        
        .item-label {
          font-size: 12px;
          color: #aaa;
          flex: 1;
        }
        
        .delete-btn {
          min-width: 32px;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: transparent;
          border: none;
          color: #666;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        
        .delete-btn:hover {
          background: #ff4444;
          color: #fff;
        }
        
        .delete-btn svg {
          flex-shrink: 0;
        }
        
        .item-controls {
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .control-row.compact {
          margin-bottom: 0;
        }
        
        .control-row.compact label {
          min-width: 30px;
          font-size: 11px;
        }
        
        .control-row.compact .value {
          font-size: 11px;
          min-width: 35px;
          text-align: right;
        }
        
        .center-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          min-height: 32px;
          padding: 6px 8px;
          background: #333;
          border: 1px solid #444;
          border-radius: 6px;
          color: #aaa;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .center-btn:hover {
          background: #444;
          color: #fff;
        }
        
        .text-item {
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .text-item:hover {
          border-color: #555;
        }
        
        .text-input {
          flex: 1;
          background: transparent;
          border: none;
          color: #fff;
          font-size: 12px;
          outline: none;
          font-family: inherit;
          line-height: 1.4;
          padding: 6px 0;
        }
        
        .text-input::placeholder {
          color: #555;
        }
        
        .style-panel {
          background: #1a1a2e;
          border: 1px solid #646cff33;
        }
        
        .font-select {
          flex: 1;
          min-height: 32px;
          background: #333;
          border: 1px solid #444;
          border-radius: 6px;
          padding: 6px 8px;
          color: #fff;
          font-size: 13px;
        }
        
        .number-input {
          width: 100%;
          min-height: 32px;
          background: #333;
          border: 1px solid #444;
          border-radius: 6px;
          padding: 6px 8px;
          color: #fff;
          font-size: 13px;
          text-align: center;
        }
        
        .weight-select {
          width: 100%;
          min-height: 32px;
          background: #333;
          border: 1px solid #444;
          border-radius: 6px;
          padding: 6px 8px;
          color: #fff;
          font-size: 12px;
        }
        
        .align-buttons {
          display: flex;
          gap: 4px;
          flex: 1;
        }
        
        .align-buttons button {
          flex: 1;
          min-height: 32px;
          padding: 6px 8px;
          background: #333;
          border: 1px solid #444;
          border-radius: 6px;
          color: #888;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        
        .align-buttons button:hover {
          background: #444;
          color: #ccc;
        }
        
        .align-buttons button.active {
          background: #646cff;
          border-color: #646cff;
          color: #fff;
        }
        
        .control-row input[type="range"] {
          flex: 1;
          accent-color: #646cff;
        }
        
        .control-row .value {
          font-size: 11px;
          color: #888;
          min-width: 45px;
          text-align: right;
        }
        
        .position-buttons {
          display: flex;
          gap: 6px;
        }
        
        .position-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          min-height: 32px;
          padding: 6px 8px;
          background: #333;
          border: 1px solid #444;
          border-radius: 6px;
          color: #aaa;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .position-btn:hover {
          background: #646cff;
          border-color: #646cff;
          color: #fff;
        }
      `}</style>
    </div>
  );
};

export default EditorPanel;
