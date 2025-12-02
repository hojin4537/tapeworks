import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CreditCard, Lock, User, MapPin, Search } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import DaumPostcode from 'react-daum-postcode';
import html2canvas from 'html2canvas';
import JCardPreview from '../components/JCardPreview';
import { LABEL_DIMENSIONS, LABEL_PREVIEW_SCALE, type LabelData } from '../types/label';
import './OrderPage.css';

// Helper to upload base64 image
const uploadBase64Image = async (base64String: string, path: string): Promise<string> => {
    if (!base64String || !base64String.startsWith('data:image')) return base64String;

    try {
        const storageRef = ref(storage, path);

        // Extract format (e.g., image/png) to set correct Content-Type
        const contentType = base64String.split(';')[0].split(':')[1] || 'image/png';
        const filename = path.split('/').pop() || 'download.png';

        const metadata = {
            contentType: contentType,
            // Explicitly specify filename to ensure robust download behavior
            contentDisposition: `attachment; filename="${filename}"`,
        };

        await uploadString(storageRef, base64String, 'data_url', metadata);
        return await getDownloadURL(storageRef);
    } catch (error) {
        console.error('Image upload failed:', error);
        throw error;
    }
};

export default function OrderPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // Design Data from previous steps
    const { jCardData, labelDataA, labelDataB, dualSideMode } = location.state || {};

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        password: '',
        zipcode: '',
        address: '',
        detailAddress: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

    // Refs for capturing images
    const jCardRef = useRef<HTMLDivElement>(null);
    const labelARef = useRef<HTMLDivElement>(null);
    const labelBRef = useRef<HTMLDivElement>(null);

    // Redirect to home if no data
    if (!jCardData || !labelDataA) {
        return (
            <div className="order-page empty-state">
                <div className="empty-content">
                    <h2>주문 데이터가 없습니다</h2>
                    <button onClick={() => navigate('/')}>홈으로 돌아가기</button>
                </div>
            </div>
        );
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddressComplete = (data: any) => {
        let fullAddress = data.address;
        let extraAddress = '';

        if (data.addressType === 'R') {
            if (data.bname !== '') {
                extraAddress += data.bname;
            }
            if (data.buildingName !== '') {
                extraAddress += (extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName);
            }
            fullAddress += (extraAddress !== '' ? ` (${extraAddress})` : '');
        }

        setFormData(prev => ({
            ...prev,
            zipcode: data.zonecode,
            address: fullAddress,
        }));
        setIsAddressModalOpen(false);
    };

    const captureElement = async (element: HTMLElement | null): Promise<string | null> => {
        if (!element) return null;
        try {
            // Wait for all images inside the element to load
            const images = Array.from(element.getElementsByTagName('img'));
            await Promise.all(images.map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            }));

            // Additional delay to ensure rendering
            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                allowTaint: true,
                scrollX: 0,
                scrollY: 0,
                logging: false,
                width: element.offsetWidth,
                height: element.offsetHeight,
            });
            return canvas.toDataURL('image/png');
        } catch (error) {
            console.error('Capture failed:', error);
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setUploadStatus('주문 ID 생성 중...');

        try {
            // 1. Create Order ID using Name + Timestamp (Sanitized)
            const sanitizedName = formData.name.replace(/[^a-zA-Z0-9가-힣]/g, '_');
            const orderId = `${sanitizedName}_${Date.now()}`;

            // 2. Capture and Upload Final Images
            setUploadStatus('최종 디자인 이미지 생성 중...');

            const jCardImage = await captureElement(jCardRef.current);
            const labelAImage = await captureElement(labelARef.current);
            const labelBImage = dualSideMode ? await captureElement(labelBRef.current) : null;

            if (!jCardImage || !labelAImage) {
                throw new Error('이미지 생성에 실패했습니다.');
            }

            setUploadStatus('이미지 업로드 중...');
            const jCardUrl = await uploadBase64Image(jCardImage, `orders/${orderId}/final_jcard.png`);
            const labelAUrl = await uploadBase64Image(labelAImage, `orders/${orderId}/final_label_A.png`);
            const labelBUrl = labelBImage ? await uploadBase64Image(labelBImage, `orders/${orderId}/final_label_B.png`) : null;

            // 3. Save order data to Firestore
            setUploadStatus('주문 정보 저장 중...');
            const orderData = {
                userInfo: {
                    name: formData.name,
                    phone: formData.phone,
                    password: formData.password,
                    address: {
                        zipcode: formData.zipcode,
                        address: formData.address,
                        detailAddress: formData.detailAddress,
                    }
                },
                orderImages: {
                    jCard: jCardUrl,
                    labelA: labelAUrl,
                    labelB: labelBUrl,
                },
                designData: {
                    // We keep minimal metadata if needed, but mainly rely on images now
                    dualSideMode: dualSideMode || false,
                },
                status: 'pending_payment',
                createdAt: new Date().toISOString(),
                orderId: orderId,
            };

            // Use setDoc to specify the document ID
            await setDoc(doc(db, 'orders', orderId), orderData);

            // 4. Redirect to external payment page
            setUploadStatus('결제 페이지로 이동 중...');
            window.location.href = 'https://www.latpeed.com/products/dx_Gx';

        } catch (error: any) {
            console.error('Error saving order:', error);
            let errorMessage = '주문 저장 중 오류가 발생했습니다.';

            if (error.code === 'storage/unauthorized') {
                errorMessage = '이미지 업로드 권한이 없습니다. Firebase Storage Rules를 확인해주세요.';
            } else if (error.code === 'permission-denied') {
                errorMessage = '데이터베이스 쓰기 권한이 없습니다. Firebase Firestore Rules를 확인해주세요.';
            } else if (error.message) {
                errorMessage += ` (${error.message})`;
            }

            alert(errorMessage);
            setIsSubmitting(false);
            setUploadStatus('');
        }
    };

    // Label Render Logic (Copied from MockupPage/LabelPreviewPage for consistency)
    const renderLabelPreview = (data: LabelData, idPrefix: string) => {
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

        const clipId = `label-clip-order-${idPrefix}-${Math.random().toString(36).substr(2, 9)}`;

        return (
            <div
                style={{
                    width: bleedWidth,
                    height: bleedHeight,
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '4px',
                    backgroundColor: 'transparent', // Ensure transparent background for capture
                }}
            >
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

                {/* Gray Window Overlay */}
                <div
                    style={{
                        position: 'absolute',
                        left: windowX,
                        top: windowY,
                        width: windowWidth,
                        height: windowHeight,
                        borderRadius: windowRadius,
                        backgroundColor: '#808080',
                        zIndex: 15,
                        boxSizing: 'border-box',
                    }}
                />

                {/* Clipped Content */}
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

                {/* Trim Line */}
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
        <div className="order-page">
            <header className="order-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                    <span>이전으로</span>
                </button>
                <div className="header-title">
                    <span className="step-indicator">STEP 4/4</span>
                    <h1>주문 정보 입력</h1>
                </div>
                <div style={{ width: 100 }}></div>
            </header>

            <div className="order-content">
                <form className="order-form" onSubmit={handleSubmit}>
                    <div className="form-section">
                        <h2>
                            <User size={20} />
                            <span>주문자 정보</span>
                        </h2>

                        <div className="form-group">
                            <label>이름</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="주문자 성함을 입력해주세요"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>전화번호</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="010-0000-0000"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>
                            <MapPin size={20} />
                            <span>배송지 정보</span>
                        </h2>

                        <div className="form-group">
                            <label>우편번호</label>
                            <div className="zipcode-wrapper">
                                <input
                                    type="text"
                                    name="zipcode"
                                    value={formData.zipcode}
                                    readOnly
                                    placeholder="우편번호"
                                    style={{ width: '120px' }}
                                    required
                                />
                                <button
                                    type="button"
                                    className="address-search-btn"
                                    onClick={() => setIsAddressModalOpen(true)}
                                >
                                    <Search size={14} style={{ marginRight: '4px' }} />
                                    주소 검색
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>주소</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                readOnly
                                placeholder="주소 검색을 통해 입력해주세요"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>상세 주소</label>
                            <input
                                type="text"
                                name="detailAddress"
                                value={formData.detailAddress}
                                onChange={handleInputChange}
                                placeholder="상세 주소를 입력해주세요"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>
                            <Lock size={20} />
                            <span>주문 확인용 비밀번호</span>
                        </h2>
                        <p style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>
                            결제 페이지에서 본인 확인을 위해 사용할 비밀번호를 입력해주세요.
                        </p>

                        <div className="form-group">
                            <label>비밀번호</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="비밀번호 입력"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="checkout-btn"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <span>{uploadStatus || '처리중...'}</span>
                        ) : (
                            <>
                                <CreditCard size={20} />
                                <span>결제 페이지로 이동</span>
                            </>
                        )}
                    </button>
                    <p className="checkout-note">
                        '결제 페이지로 이동' 버튼을 누르면 디자인이 저장되고<br />
                        외부 결제 사이트(Latpeed)로 이동합니다.
                    </p>
                </form>

                {/* Order Summary Side Panel */}
                <aside className="order-summary">
                    <h2>주문 요약</h2>
                    <div className="summary-items">
                        <div className="summary-item">
                            <span>상품명</span>
                            <span>커스텀 카세트 테이프</span>
                        </div>
                        <div className="summary-item">
                            <span>라벨 타입</span>
                            <span>{dualSideMode ? '양면' : '단면'}</span>
                        </div>
                    </div>

                    <div className="summary-price">
                        <div className="price-row total">
                            <span>결제 예정 금액</span>
                            <span>₩4,990</span>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Hidden Capture Area - Must be visible for html2canvas to work, so we move it off-screen */}
            <div style={{ position: 'absolute', left: '-10000px', top: 0 }}>
                <div ref={jCardRef} style={{ width: 'fit-content' }}>
                    <JCardPreview data={jCardData} showGuides={false} id="jcard-capture" />
                </div>
                <div ref={labelARef} style={{ width: 'fit-content' }}>
                    {renderLabelPreview(labelDataA, 'A')}
                </div>
                {dualSideMode && labelDataB && (
                    <div ref={labelBRef} style={{ width: 'fit-content' }}>
                        {renderLabelPreview(labelDataB, 'B')}
                    </div>
                )}
            </div>

            {/* Address Modal */}
            {isAddressModalOpen && (
                <div className="address-modal-overlay" onClick={() => setIsAddressModalOpen(false)}>
                    <div className="address-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="address-modal-header">
                            <h3>주소 검색</h3>
                            <button className="close-modal-btn" onClick={() => setIsAddressModalOpen(false)}>✕</button>
                        </div>
                        <DaumPostcode
                            onComplete={handleAddressComplete}
                            style={{ height: '450px' }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
