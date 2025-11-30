import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Package, CreditCard, Truck, X } from 'lucide-react';
import DaumPostcodeEmbed from 'react-daum-postcode';
import { motion } from 'framer-motion';
import './OrderPage.css';

interface OrderFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  addressDetail: string;
  zipCode: string;
  deliveryRequest: string;
  quantity: number;
  tapeColor: string;
}

const TAPE_COLORS = [
  { id: 'black', name: '블랙', hex: '#1a1a1a' },
  { id: 'white', name: '화이트', hex: '#f5f5f5' },
  { id: 'clear', name: '투명', hex: 'transparent' },
  { id: 'red', name: '레드', hex: '#e53935' },
  { id: 'blue', name: '블루', hex: '#1e88e5' },
  { id: 'yellow', name: '옐로우', hex: '#fdd835' },
];

const PRICE_PER_UNIT = 4990; // 개당 가격

export default function OrderPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<OrderFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    addressDetail: '',
    zipCode: '',
    deliveryRequest: '',
    quantity: 1,
    tapeColor: 'black',
  });
  const [step, setStep] = useState<'details' | 'payment' | 'complete'>('details');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const totalPrice = PRICE_PER_UNIT * formData.quantity;

  const handleInputChange = (field: keyof OrderFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      zipCode: data.zonecode,
      address: fullAddress,
      addressDetail: '', // Reset detail address
    }));
    setIsAddressModalOpen(false);
  };

  const handleSubmit = () => {
    // TODO: 실제 결제 연동
    setStep('payment');
    setTimeout(() => {
      setStep('complete');
    }, 2000);
  };

  if (step === 'complete') {
    return (
      <div className="order-page">
        <motion.div
          className="order-complete"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="complete-icon">
            <Check size={48} />
          </div>
          <h1>주문 완료!</h1>
          <p>주문이 성공적으로 접수되었습니다.</p>
          <p className="order-number">주문번호: TW-{Date.now().toString().slice(-8)}</p>
          <div className="complete-info">
            <div className="info-item">
              <Package size={20} />
              <span>제작 기간: 약 5-7일</span>
            </div>
            <div className="info-item">
              <Truck size={20} />
              <span>배송: 제작 완료 후 2-3일</span>
            </div>
          </div>
          <button className="home-btn" onClick={() => navigate('/')}>
            홈으로 돌아가기
          </button>
        </motion.div>
      </div>
    );
  }

  if (step === 'payment') {
    return (
      <div className="order-page">
        <motion.div
          className="payment-processing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="spinner"></div>
          <p>결제 처리 중...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="order-page">
      {/* Header */}
      <header className="order-header">
        <button className="back-btn" onClick={() => navigate('/create/label')}>
          <ArrowLeft size={20} />
          <span>라벨 편집으로 돌아가기</span>
        </button>
        <div className="header-title">
          <span className="step-indicator">STEP 3/3</span>
          <h1>주문 & 배송</h1>
        </div>
        <div style={{ width: 180 }}></div>
      </header>

      <div className="order-content">
        {/* Order Form */}
        <div className="order-form">
          <section className="form-section">
            <h2>
              <Package size={20} />
              <span>상품 옵션</span>
            </h2>

            <div className="form-group">
              <label>테이프 색상</label>
              <div className="color-options">
                {TAPE_COLORS.map(color => (
                  <button
                    key={color.id}
                    className={`color-option ${formData.tapeColor === color.id ? 'selected' : ''}`}
                    onClick={() => handleInputChange('tapeColor', color.id)}
                  >
                    <span
                      className="color-swatch"
                      style={{
                        backgroundColor: color.hex,
                        border: color.id === 'clear' ? '2px dashed #666' : 'none',
                      }}
                    />
                    <span className="color-name">{color.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>수량</label>
              <div className="quantity-selector">
                <button
                  onClick={() => handleInputChange('quantity', Math.max(1, formData.quantity - 1))}
                  disabled={formData.quantity <= 1}
                >
                  -
                </button>
                <span>{formData.quantity}</span>
                <button
                  onClick={() => handleInputChange('quantity', formData.quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>
          </section>

          <section className="form-section">
            <h2>
              <Truck size={20} />
              <span>배송 정보</span>
            </h2>

            <div className="form-group">
              <label>이름</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="홍길동"
              />
            </div>

            <div className="form-group">
              <label>이메일</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="email@example.com"
              />
            </div>

            <div className="form-group">
              <label>전화번호</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="010-1234-5678"
              />
            </div>

            <div className="form-group">
              <label>우편번호</label>
              <div className="zipcode-wrapper">
                <input
                  type="text"
                  value={formData.zipCode}
                  readOnly
                  placeholder="우편번호"
                  style={{ flex: 1 }}
                />
                <button
                  className="address-search-btn"
                  onClick={() => setIsAddressModalOpen(true)}
                >
                  주소 검색
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>주소</label>
              <input
                type="text"
                value={formData.address}
                readOnly
                placeholder="주소 검색을 통해 입력해주세요"
              />
            </div>

            <div className="form-group">
              <label>상세주소</label>
              <input
                type="text"
                value={formData.addressDetail}
                onChange={(e) => handleInputChange('addressDetail', e.target.value)}
                placeholder="상세주소를 입력해주세요"
              />
            </div>

            <div className="form-group">
              <label>배송 요청사항 (선택)</label>
              <input
                type="text"
                value={formData.deliveryRequest}
                onChange={(e) => handleInputChange('deliveryRequest', e.target.value)}
                placeholder="예: 문 앞에 놔주세요"
              />
            </div>
          </section>
        </div>

        {/* Order Summary */}
        <aside className="order-summary">
          <h2>주문 요약</h2>

          <div className="summary-items">
            <div className="summary-item">
              <span>커스텀 카세트 테이프</span>
              <span>× {formData.quantity}</span>
            </div>
            <div className="summary-item">
              <span>테이프 색상</span>
              <span>{TAPE_COLORS.find(c => c.id === formData.tapeColor)?.name}</span>
            </div>
          </div>

          <div className="summary-includes">
            <h4>포함 항목</h4>
            <ul>
              <li>커스텀 J카드 (인쇄)</li>
              <li>커스텀 라벨 (인쇄)</li>
              <li>카세트 테이프 본체</li>
              <li>플라스틱 케이스</li>
            </ul>
          </div>

          <div className="summary-price">
            <div className="price-row">
              <span>상품 금액</span>
              <span>{(PRICE_PER_UNIT * formData.quantity).toLocaleString()}원</span>
            </div>
            <div className="price-row">
              <span>배송비</span>
              <span>무료</span>
            </div>
            <div className="price-row total">
              <span>총 결제금액</span>
              <span>{totalPrice.toLocaleString()}원</span>
            </div>
          </div>

          <button
            className="checkout-btn"
            onClick={handleSubmit}
            disabled={!formData.name || !formData.email || !formData.address}
          >
            <CreditCard size={20} />
            <span>결제하기</span>
          </button>

          <p className="checkout-note">
            * 주문 후 디자인 수정이 불가합니다.
            <br />
            * 결제 완료 후 제작이 시작됩니다.
          </p>
        </aside>
      </div>
      {/* Address Search Modal */}
      {isAddressModalOpen && (
        <div className="address-modal-overlay" onClick={() => setIsAddressModalOpen(false)}>
          <div className="address-modal-content" onClick={e => e.stopPropagation()}>
            <div className="address-modal-header">
              <h3>주소 검색</h3>
              <button className="close-modal-btn" onClick={() => setIsAddressModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <DaumPostcodeEmbed
              onComplete={handleAddressComplete}
              style={{ height: '450px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
