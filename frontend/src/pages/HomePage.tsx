import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Button, Space, Alert, Spin } from 'antd'
import { PlusOutlined, SearchOutlined, BarChartOutlined, HeartOutlined } from '@ant-design/icons'
import { flightAPI, reservationAPI, systemAPI } from '../services/api'
import type { HealthStatus } from '../types'

const HomePage: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [stats, setStats] = useState({
    totalFlights: 0,
    availableFlights: 0,
    totalReservations: 0,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // 병렬로 데이터 가져오기
        const [health, flights, availableFlights, reservations] = await Promise.all([
          systemAPI.getHealth().catch(() => null),
          flightAPI.getAllFlights().catch(() => []),
          flightAPI.getAvailableFlights().catch(() => []),
          reservationAPI.getAllReservations().catch(() => []),
        ])
        
        setHealthStatus(health)
        setStats({
          totalFlights: flights.length,
          availableFlights: availableFlights.length,
          totalReservations: reservations.length,
        })
      } catch (error) {
        console.error('데이터 로딩 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'search':
        window.location.href = '/search'
        break
      case 'reservations':
        window.location.href = '/reservations'
        break
      case 'dashboard':
        window.location.href = '/dashboard'
        break
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      {/* 환영 메시지 */}
      <Card style={{ marginBottom: 24 }}>
        <Row align="middle" gutter={[24, 24]}>
          <Col xs={24} md={16}>
            <h1 style={{ fontSize: '32px', marginBottom: '8px', color: '#1890ff' }}>
              ✈️ Skyline 항공예약시스템에 오신 것을 환영합니다!
            </h1>
            <p style={{ fontSize: '16px', color: '#666', marginBottom: '16px' }}>
              EKS 인턴십 교육용 데모 애플리케이션입니다. 다양한 기능을 자유롭게 테스트해보세요!
            </p>
            <Space>
              <Button 
                type="primary" 
                icon={<SearchOutlined />} 
                size="large"
                onClick={() => handleQuickAction('search')}
              >
                항공편 검색
              </Button>
              <Button 
                icon={<PlusOutlined />} 
                size="large"
                onClick={() => handleQuickAction('reservations')}
              >
                예약 관리
              </Button>
              <Button 
                icon={<BarChartOutlined />} 
                size="large"
                onClick={() => handleQuickAction('dashboard')}
              >
                대시보드
              </Button>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛫</div>
              <p style={{ color: '#666' }}>실습 환경에서 자유롭게 실험해보세요!</p>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 시스템 상태 */}
      {healthStatus && (
        <Card title="시스템 상태" style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Alert
                message={`애플리케이션: ${healthStatus.status}`}
                description={`버전: ${healthStatus.version}`}
                type={healthStatus.status === 'UP' ? 'success' : 'error'}
                showIcon
              />
            </Col>
            <Col span={12}>
              <Alert
                message={`데이터베이스: ${healthStatus.database.status}`}
                description={`타입: ${healthStatus.database.type}`}
                type={healthStatus.database.status === 'UP' ? 'success' : 'error'}
                showIcon
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 통계 카드 */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="전체 항공편"
              value={stats.totalFlights}
              prefix="✈️"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="예약 가능 항공편"
              value={stats.availableFlights}
              prefix="🎫"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="총 예약 수"
              value={stats.totalReservations}
              prefix="📋"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 기능 소개 */}
      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card
            title="🔍 항공편 검색"
            actions={[
              <Button type="link" onClick={() => handleQuickAction('search')}>
                시작하기 →
              </Button>
            ]}
          >
            <p>출발지, 도착지, 날짜를 입력하여 원하는 항공편을 검색할 수 있습니다.</p>
            <ul style={{ marginTop: '12px', paddingLeft: '20px' }}>
              <li>실시간 좌석 정보 확인</li>
              <li>다양한 항공편 옵션 비교</li>
              <li>가격 및 시간 정보 제공</li>
            </ul>
          </Card>
        </Col>
        
        <Col xs={24} md={8}>
          <Card
            title="📋 예약 관리"
            actions={[
              <Button type="link" onClick={() => handleQuickAction('reservations')}>
                시작하기 →
              </Button>
            ]}
          >
            <p>항공편 예약 생성, 수정, 취소 등의 전체 예약 관리 기능을 제공합니다.</p>
            <ul style={{ marginTop: '12px', paddingLeft: '20px' }}>
              <li>예약 생성 및 확인</li>
              <li>예약 정보 수정</li>
              <li>예약 취소 및 환불</li>
            </ul>
          </Card>
        </Col>
        
        <Col xs={24} md={8}>
          <Card
            title="📊 시스템 대시보드"
            actions={[
              <Button type="link" onClick={() => handleQuickAction('dashboard')}>
                시작하기 →
              </Button>
            ]}
          >
            <p>시스템 성능 모니터링 및 부하 테스트 기능을 제공합니다.</p>
            <ul style={{ marginTop: '12px', paddingLeft: '20px' }}>
              <li>실시간 시스템 정보</li>
              <li>CPU/메모리 부하 테스트</li>
              <li>Kubernetes 스케일링 테스트</li>
            </ul>
          </Card>
        </Col>
      </Row>

      {/* 교육 안내 */}
      <Card 
        title={<span><HeartOutlined /> 인턴십 교육생 안내</span>} 
        style={{ marginTop: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}
        headStyle={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.2)' }}
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <h3 style={{ color: 'white', marginBottom: '12px' }}>🎯 실습 목표</h3>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Kubernetes 클러스터 배포 및 관리</li>
              <li>Docker 컨테이너화 및 이미지 최적화</li>
              <li>MySQL RDS 연동 및 데이터베이스 관리</li>
              <li>모니터링 및 스케일링 전략 구현</li>
            </ul>
          </Col>
          <Col xs={24} md={12}>
            <h3 style={{ color: 'white', marginBottom: '12px' }}>🛠️ 추천 실습</h3>
            <ul style={{ paddingLeft: '20px' }}>
              <li>HPA(Horizontal Pod Autoscaler) 설정</li>
              <li>Ingress Controller 구성</li>
              <li>Service Mesh 적용</li>
              <li>CI/CD 파이프라인 구축</li>
            </ul>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default HomePage