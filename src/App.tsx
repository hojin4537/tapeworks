import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import LandingPage from './pages/LandingPage';
import OnboardingPage from './pages/OnboardingPage';
import JCardEditorPage from './pages/JCardEditorPage';
import JCardPreviewPage from './pages/JCardPreviewPage';
import LabelEditorPage from './pages/LabelEditorPage';
import LabelPreviewPage from './pages/LabelPreviewPage';
import MockupPage from './pages/MockupPage';
import OrderPage from './pages/OrderPage';
import { useIsMobile } from './hooks/useIsMobile';
import MobileRestricted from './components/MobileRestricted';

function AppContent() {
  const location = useLocation();
  const isMobile = useIsMobile();

  // Allow LandingPage ('/') and OnboardingPage ('/guide') on mobile, block everything else
  if (isMobile && location.pathname !== '/' && location.pathname !== '/guide') {
    return <MobileRestricted />;
  }

  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Guide - 카세트 구성 요소 설명 (랜딩 다음) */}
      <Route path="/guide" element={<OnboardingPage />} />

      {/* Create Flow */}
      {/* Step 1: J카드 디자인 */}
      <Route path="/create/jcard" element={<JCardEditorPage />} />
      <Route path="/create/jcard/preview" element={<JCardPreviewPage />} />

      {/* Step 2: 라벨 디자인 */}
      <Route path="/create/label" element={<LabelEditorPage />} />
      <Route path="/create/label/preview" element={<LabelPreviewPage />} />

      {/* Step 3: 목업 미리보기 */}
      <Route path="/create/mockup" element={<MockupPage />} />

      {/* Step 4: 주문/결제 */}
      <Route path="/create/order" element={<OrderPage />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
