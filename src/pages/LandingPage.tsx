import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play, Package, Truck, Sparkles } from 'lucide-react';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Sparkles size={32} />,
      title: '나만의 디자인',
      description: '커버, 라벨까지 직접 커스텀',
    },
    {
      icon: <Package size={32} />,
      title: '실물 제작',
      description: '고품질 인쇄로 실물 카세트 제작',
    },
    {
      icon: <Truck size={32} />,
      title: '집으로 배송',
      description: '완성된 카세트를 우편으로 받아보세요',
    },
  ];

  const steps = [
    { number: '01', title: 'J카드 디자인', desc: '앨범 커버와 트랙리스트' },
    { number: '02', title: '라벨 디자인', desc: '카세트 테이프 라벨' },
    { number: '03', title: '주문 & 배송', desc: '실물로 받아보기' },
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles size={14} />
            <span>나만의 카세트 테이프</span>
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className="title-line">Design Your</span>
            <span className="title-accent">Cassette</span>
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            직접 디자인한 카세트 테이프를 실물로 받아보세요.
            <br />
            J카드부터 라벨까지, 모든 것을 커스텀할 수 있어요.
          </motion.p>

          <motion.button
            className="cta-button"
            onClick={() => navigate('/guide')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Play size={20} />
            <span>카세트 만들어보기</span>
          </motion.button>
        </motion.div>

        {/* Floating Cassette Illustration */}
        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <div className="cassette-3d">
            <div className="cassette-body">
              <div className="cassette-window">
                <div className="cassette-reel left"></div>
                <div className="cassette-reel right"></div>
                <div className="cassette-tape"></div>
              </div>
              <div className="cassette-label">
                <span className="label-text">TAPEWORKS</span>
              </div>
              <div className="cassette-holes">
                <div className="hole"></div>
                <div className="hole"></div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="features">
        <motion.div
          className="features-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={{
            visible: { transition: { staggerChildren: 0.15 } },
          }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="feature-card"
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Process Section */}
      <section className="process">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          간단한 3단계
        </motion.h2>
        <div className="process-steps">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="step"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
            >
              <span className="step-number">{step.number}</span>
              <div className="step-content">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="footer-cta">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2>지금 바로 시작하세요</h2>
          <p>당신만의 특별한 카세트를 만들어보세요</p>
          <button
            className="cta-button secondary"
            onClick={() => navigate('/guide')}
          >
            <Play size={18} />
            <span>시작하기</span>
          </button>
        </motion.div>
      </section>

      {/* Brand Footer */}
      <footer className="brand-footer">
        <span className="brand-name">TAPEWORKS</span>
        <span className="brand-tagline">Your Music, Your Design, Your Tape.</span>
      </footer>
    </div>
  );
}


