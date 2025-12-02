import { Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MobileRestricted() {
    const navigate = useNavigate();

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            color: '#1a1a1a',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 9999
        }}>
            <div style={{
                padding: '2rem',
                borderRadius: '1rem',
                backgroundColor: '#f8f9fa',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
                <Monitor size={48} style={{ color: '#4b5563' }} />
                <div>
                    <h2 style={{
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        marginBottom: '0.5rem',
                        color: '#111827'
                    }}>
                        PC로 접속해주세요
                    </h2>
                    <p style={{
                        color: '#4b5563',
                        lineHeight: 1.6,
                        fontSize: '0.95rem'
                    }}>
                        원활한 커스텀 제작을 위해<br />
                        PC 환경에서 접속해 주시기 바랍니다.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        background: 'none',
                        border: 'none',
                        textDecoration: 'underline',
                        cursor: 'pointer'
                    }}
                >
                    메인으로 돌아가기
                </button>
            </div>
        </div>
    );
}
