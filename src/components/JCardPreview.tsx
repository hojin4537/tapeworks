import React from 'react';
import type { JCardData } from '../types';

interface JCardPreviewProps {
    data: JCardData;
    showGuides?: boolean;
    id?: string;
    onUpdate?: (section: keyof JCardData, data: Partial<JCardData[keyof JCardData]>) => void;
    selectedElement?: string | null;
    onElementSelected?: (element: string | null) => void;
    onElementDeselected?: () => void;
}

const CM_TO_PX = 60;

const JCardPreview: React.FC<JCardPreviewProps> = ({
    data,
    showGuides = true,
    id,
    onUpdate,
    selectedElement: externalSelectedElement,
    onElementSelected,
    onElementDeselected
}) => {
    const totalWidth = (2.3 + 1.5 + 6.6) * CM_TO_PX;
    const totalHeight = 10.4 * CM_TO_PX;

    // Selected element state
    const [internalSelectedElement, setInternalSelectedElement] = React.useState<string | null>(null);
    const selectedElement = externalSelectedElement !== undefined ? externalSelectedElement : internalSelectedElement;
    const setSelectedElement = (element: string | null) => {
        if (onElementSelected) {
            onElementSelected(element);
        } else {
            setInternalSelectedElement(element);
        }
    };

    // Drag and resize state
    const [dragState, setDragState] = React.useState<{
        isDragging: boolean;
        isResizing: boolean;
        target: string | null;
        targetType: 'image' | 'text' | 'background' | null;
        section: 'cover' | 'spine' | 'flap' | null;
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
        section: null,
        startX: 0,
        startY: 0,
        initialX: 0,
        initialY: 0,
    });

    const handleMouseDown = (
        e: React.MouseEvent,
        target: string,
        type: 'image' | 'text' | 'background',
        section: 'cover' | 'spine' | 'flap'
    ) => {
        if (!onUpdate) return;
        e.preventDefault();
        e.stopPropagation();

        if (type === 'text') {
            setSelectedElement(`${section}-${target}`);
        } else if (type === 'background') {
            // 배경 이미지 클릭 시 선택 해제
            if (onElementDeselected) {
                onElementDeselected();
            } else {
                setSelectedElement(null);
            }
        }

        let initialX = 0;
        let initialY = 0;

        if (type === 'background') {
            initialX = data[section].backgroundImageSettings?.x ?? 0;
            initialY = data[section].backgroundImageSettings?.y ?? 0;
        } else if (type === 'text') {
            const element = data[section].textElements?.find(el => el.id === target);
            if (element) {
                initialX = element.x;
                initialY = element.y;
            }
        } else if (type === 'image') {
            const element = data[section].images?.find(img => img.id === target);
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
            section,
            startX: e.clientX,
            startY: e.clientY,
            initialX,
            initialY,
        });
    };

    const handleResizeMouseDown = (e: React.MouseEvent, target: string, section: 'cover' | 'spine' | 'flap') => {
        if (!onUpdate) return;
        e.preventDefault();
        e.stopPropagation();

        const element = data[section].textElements?.find(el => el.id === target);
        if (!element) return;

        setDragState({
            isDragging: false,
            isResizing: true,
            target,
            targetType: 'text',
            section,
            startX: e.clientX,
            startY: 0,
            initialX: 0,
            initialY: 0,
            initialWidth: element.width || 150,
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!onUpdate || (!dragState.isDragging && !dragState.isResizing) || !dragState.target || !dragState.section) return;

        const section = dragState.section;

        if (dragState.isResizing) {
            const dx = e.clientX - dragState.startX;
            const newWidth = Math.max(50, (dragState.initialWidth || 150) + dx);

            const newElements = (data[section].textElements || []).map(el =>
                el.id === dragState.target ? { ...el, width: newWidth } : el
            );
            onUpdate(section, { textElements: newElements });
            return;
        }

        const dx = e.clientX - dragState.startX;
        const dy = e.clientY - dragState.startY;
        const newX = dragState.initialX + dx;
        const newY = dragState.initialY + dy;

        if (dragState.targetType === 'background') {
            onUpdate(section, {
                backgroundImageSettings: {
                    ...(data[section].backgroundImageSettings ?? { scale: 1, x: 0, y: 0 }),
                    x: newX,
                    y: newY
                }
            });
        } else if (dragState.targetType === 'text') {
            const newElements = (data[section].textElements || []).map(el =>
                el.id === dragState.target ? { ...el, x: newX, y: newY } : el
            );
            onUpdate(section, { textElements: newElements });
        } else if (dragState.targetType === 'image') {
            const newImages = (data[section].images || []).map(img =>
                img.id === dragState.target ? { ...img, x: newX, y: newY } : img
            );
            onUpdate(section, { images: newImages });
        }
    };

    const handleMouseUp = () => {
        setDragState(prev => ({ ...prev, isDragging: false, isResizing: false, target: null, targetType: null, section: null }));
    };

    const handleDeselect = (e: React.MouseEvent) => {
        // 프레임 전체를 클릭했을 때 선택 해제
        const target = e.target as HTMLElement;
        const isBackgroundClick =
            target === e.currentTarget ||
            target.classList.contains('section-background') ||
            target.id === id;

        if (isBackgroundClick) {
            if (onElementDeselected) {
                onElementDeselected();
            } else {
                setSelectedElement(null);
            }
        }
    };

    // 배경 이미지 렌더링 (위아래가 꽉 차게)
    const renderBackgroundImage = (
        section: 'cover' | 'spine' | 'flap'
    ) => {
        const sectionData = data[section];
        if (!sectionData.backgroundImage) return null;

        const settings = sectionData.backgroundImageSettings;
        const baseScale = settings?.baseScale ?? 1;
        const effectiveScale = baseScale * (settings?.scale ?? 1);
        const displayWidth = settings?.originalWidth ? settings.originalWidth * effectiveScale : undefined;
        const displayHeight = settings?.originalHeight ? settings.originalHeight * effectiveScale : undefined;

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
                    src={sectionData.backgroundImage}
                    alt="Background"
                    style={{
                        width: displayWidth ? `${displayWidth}px` : 'auto',
                        height: displayHeight ? `${displayHeight}px` : 'auto',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: `translate(calc(-50% + ${settings?.x ?? 0}px), calc(-50% + ${settings?.y ?? 0}px))`,
                        transformOrigin: 'center',
                        cursor: onUpdate ? 'move' : 'default',
                        pointerEvents: onUpdate ? 'auto' : 'none',
                        imageRendering: 'auto',
                    }}
                    onMouseDown={onUpdate ? (e) => handleMouseDown(e, 'background', 'background', section) : undefined}
                />
            </div>
        );
    };

    // 추가 이미지 렌더링 (좌우가 꽉 차게)
    const renderImages = (section: 'cover' | 'spine' | 'flap', rotation: number = 0) => {
        const sectionData = data[section];
        return (sectionData.images || []).map((img) => {
            const effectiveScale = (img.baseScale ?? 1) * img.scale;
            const displayWidth = img.originalWidth ? img.originalWidth * effectiveScale : undefined;
            const displayHeight = img.originalHeight ? img.originalHeight * effectiveScale : undefined;
            const imageId = `${section}-image-${img.id}`;
            const isSelected = selectedElement === imageId;

            return (
                <div
                    key={img.id}
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: `translate(calc(-50% + ${img.x}px), calc(-50% + ${img.y}px)) rotate(${(img.rotation ?? 0) + rotation}deg)`,
                        transformOrigin: 'center',
                        cursor: onUpdate ? 'move' : 'default',
                        pointerEvents: onUpdate ? 'auto' : 'none',
                        zIndex: 3,
                        padding: '2px',
                        border: isSelected ? '2px solid rgba(100, 108, 255, 0.8)' : '2px solid transparent',
                        boxSizing: 'border-box',
                    }}
                    onMouseDown={onUpdate ? (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleMouseDown(e, img.id, 'image', section);
                    } : undefined}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onUpdate) {
                            setSelectedElement(imageId);
                        }
                    }}
                >
                    <img
                        src={img.src}
                        alt={`Image ${img.id}`}
                        style={{
                            display: 'block',
                            width: displayWidth ? `${displayWidth}px` : 'auto',
                            height: displayHeight ? `${displayHeight}px` : 'auto',
                            userSelect: 'none',
                            imageRendering: 'auto',
                            pointerEvents: 'none',
                        }}
                    />
                </div>
            );
        });
    };

    // 텍스트 요소 렌더링
    const renderTextElements = (section: 'cover' | 'spine' | 'flap', rotation: number = 0) => {
        const sectionData = data[section];
        return (sectionData.textElements || []).map((el) => {
            const elementId = `${section}-${el.id}`;
            const isSelected = selectedElement === elementId;

            return (
                <div
                    key={el.id}
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: `translate(calc(-50% + ${el.x}px), calc(-50% + ${el.y}px)) rotate(${rotation}deg)`,
                        fontSize: el.fontSize,
                        fontFamily: el.fontFamily,
                        fontWeight: el.fontWeight || 400,
                        color: el.color,
                        letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
                        lineHeight: el.lineHeight || 1.4,
                        width: el.width || 150,
                        maxWidth: el.width || 150,
                        textAlign: el.textAlign || 'center',
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word',
                        cursor: onUpdate ? 'move' : 'default',
                        pointerEvents: 'auto',
                        userSelect: 'none',
                        padding: '4px',
                        border: isSelected ? '1px dashed rgba(100, 108, 255, 0.8)' : 'none',
                        zIndex: 5,
                    }}
                    onMouseDown={(e) => {
                        if (onUpdate) {
                            handleMouseDown(e, el.id, 'text', section);
                        }
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onUpdate) {
                            setSelectedElement(elementId);
                        }
                    }}
                >
                    {el.text}
                    {/* Resize handle */}
                    {onUpdate && isSelected && (
                        <div
                            style={{
                                position: 'absolute',
                                right: -4,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: 8,
                                height: 20,
                                background: '#646cff',
                                cursor: 'ew-resize',
                                borderRadius: 2,
                                pointerEvents: 'auto',
                            }}
                            onMouseDown={(e) => handleResizeMouseDown(e, el.id, section)}
                        />
                    )}
                </div>
            );
        });
    };

    const styles = {
        container: {
            display: 'flex',
            width: `${totalWidth}px`,
            height: `${totalHeight}px`,
            backgroundColor: '#ffffff',
            boxShadow: '0 0 20px rgba(0,0,0,0.5)',
            position: 'relative' as const,
            boxSizing: 'border-box' as const,
        },
        flap: {
            width: `${2.3 * CM_TO_PX}px`,
            height: `${totalHeight}px`,
            backgroundColor: data.flap.backgroundColor,
            position: 'relative' as const,
            overflow: 'hidden',
            borderRight: showGuides ? '1px dashed rgba(0,0,0,0.2)' : 'none',
            boxSizing: 'border-box' as const,
            flexShrink: 0,
        },
        spine: {
            width: `${1.5 * CM_TO_PX}px`,
            height: `${totalHeight}px`,
            backgroundColor: data.spine.backgroundColor,
            position: 'relative' as const,
            overflow: 'hidden',
            borderRight: showGuides ? '1px dashed rgba(0,0,0,0.2)' : 'none',
            boxSizing: 'border-box' as const,
            flexShrink: 0,
        },
        cover: {
            width: `${6.6 * CM_TO_PX}px`,
            height: `${totalHeight}px`,
            backgroundColor: data.cover.backgroundColor,
            position: 'relative' as const,
            overflow: 'hidden',
            boxSizing: 'border-box' as const,
            flexShrink: 0,
        },
    };

    return (
        <div
            id={id}
            style={{
                width: `${totalWidth}px`,
                height: `${totalHeight}px`,
                display: 'flex',
                flexDirection: 'row',
                position: 'relative',
                fontFamily: 'Inter, system-ui, sans-serif',
                backgroundColor: 'transparent',
                boxSizing: 'border-box',
                alignItems: 'flex-start',
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleDeselect}
        >
            {/* Flap - 텍스트 -90도 회전 */}
            <div
                style={styles.flap}
                className="section-background"
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget) {
                        handleDeselect(e);
                    }
                }}
            >
                {showGuides && (
                    <div style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        background: 'rgba(0, 0, 0, 0.6)',
                        color: '#fff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '0.5px',
                        zIndex: 1000,
                        pointerEvents: 'none',
                    }}>
                        FLAP
                    </div>
                )}
                {renderBackgroundImage('flap')}
                {renderImages('flap', 0)}
                <div style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, zIndex: 5, pointerEvents: 'none' }}>
                    {renderTextElements('flap', -90)}
                </div>
            </div>

            {/* Spine - 텍스트 90도 회전 */}
            <div
                style={styles.spine}
                className="section-background"
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget) {
                        handleDeselect(e);
                    }
                }}
            >
                {showGuides && (
                    <div style={{
                        position: 'absolute',
                        top: 8,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(0, 0, 0, 0.6)',
                        color: '#fff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '0.5px',
                        zIndex: 1000,
                        pointerEvents: 'none',
                    }}>
                        SPINE
                    </div>
                )}
                {renderBackgroundImage('spine')}
                {renderImages('spine', 90)}
                <div style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, zIndex: 5, pointerEvents: 'none' }}>
                    {renderTextElements('spine', 90)}
                </div>
            </div>

            {/* Cover - 텍스트 회전 없음 */}
            <div
                style={styles.cover}
                className="section-background"
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget) {
                        handleDeselect(e);
                    }
                }}
            >
                {showGuides && (
                    <div style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        background: 'rgba(0, 0, 0, 0.6)',
                        color: '#fff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '0.5px',
                        zIndex: 1000,
                        pointerEvents: 'none',
                    }}>
                        COVER
                    </div>
                )}
                {renderBackgroundImage('cover')}
                {renderImages('cover', 0)}
                <div style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, zIndex: 5, pointerEvents: 'none' }}>
                    {renderTextElements('cover', 0)}
                </div>
            </div>
        </div>
    );
};

export default JCardPreview;
