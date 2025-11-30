import React, { useState } from 'react';
import type { JCardData } from '../types';
import JCardPreview from './JCardPreview';
import { ZoomIn, ZoomOut, Eye, EyeOff } from 'lucide-react';

interface PreviewPanelProps {
    data: JCardData;
    onUpdate?: (section: keyof JCardData, data: Partial<JCardData[keyof JCardData]>) => void;
    selectedElement?: string | null;
    onElementSelected?: (element: string | null) => void;
    onElementDeselected?: () => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ data, onUpdate, selectedElement, onElementSelected, onElementDeselected }) => {
    const [zoom, setZoom] = useState(1);
    const [showGuides, setShowGuides] = useState(true);

    return (
        <div 
            className="preview-panel"
            onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.classList.contains('preview-panel') || target.classList.contains('preview-content')) {
                    onElementDeselected?.();
                }
            }}
        >
            <div className="toolbar">
                <div className="toolbar-group">
                    <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}><ZoomOut size={16} /></button>
                    <span style={{ minWidth: '40px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(2, z + 0.1))}><ZoomIn size={16} /></button>
                </div>

                <div className="toolbar-group">
                    <button onClick={() => setShowGuides(!showGuides)} title="Toggle Guides">
                        {showGuides ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                </div>
            </div>

            <div className="preview-content">
                <div style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s ease' }}>
                    <JCardPreview
                        data={data}
                        showGuides={showGuides}
                        id="j-card-preview"
                        onUpdate={onUpdate}
                        selectedElement={selectedElement}
                        onElementSelected={onElementSelected}
                        onElementDeselected={onElementDeselected}
                    />
                </div>
            </div>

            <style>{`
        .preview-panel {
          position: relative;
        }
        
        .toolbar {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #1e1e1e;
          padding: 8px 16px;
          border-radius: 8px;
          display: flex;
          gap: 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 100;
        }
        .toolbar-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .toolbar button {
          padding: 6px 10px;
          font-size: 0.9em;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .preview-content {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
        }
      `}</style>
        </div>
    );
};

export default PreviewPanel;
