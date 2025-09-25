import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Button, Space, Progress, Statistic, Alert, message, Spin, InputNumber } from 'antd'
import { PlayCircleOutlined, ReloadOutlined, ThunderboltOutlined, DatabaseOutlined } from '@ant-design/icons'
import { systemAPI } from '../services/api'
import type { SystemInfo, HealthStatus } from '../types'

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [stressLoading, setStressLoading] = useState<{cpu: boolean, memory: boolean}>({
    cpu: false,
    memory: false
  })
  const [stressParams, setStressParams] = useState({
    cpuSeconds: 10,
    memorySizeMB: 200
  })
  const [lastStressResults, setLastStressResults] = useState<{
    cpu?: any,
    memory?: any
  }>({})

  useEffect(() => {
    fetchSystemData()
    
    // 30초마다 시스템 정보 갱신
    const interval = setInterval(fetchSystemData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchSystemData = async () => {
    try {
      setLoading(true)
      const [info, health] = await Promise.all([
        systemAPI.getSystemInfo().catch(() => null),
        systemAPI.getHealth().catch(() => null)
      ])
      
      setSystemInfo(info)
      setHealthStatus(health)
    } catch (error) {
      console.error('Error fetching system data:', error)
      message.error('시스템 정보를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleCPUStress = async () => {
    setStressLoading(prev => ({ ...prev, cpu: true }))
    try {
      const result = await systemAPI.stressCPU(stressParams.cpuSeconds)
      setLastStressResults(prev => ({ ...prev, cpu: result }))
      message.success(`CPU 부하 테스트 완료 (${stressParams.cpuSeconds}초)`)
      
      // 테스트 후 시스템 정보 갱신
      setTimeout(fetchSystemData, 2000)
    } catch (error) {
      message.error('CPU 부하 테스트 실패')
      console.error('CPU stress test failed:', error)
    } finally {
      setStressLoading(prev => ({ ...prev, cpu: false }))
    }
  }

  const handleMemoryStress = async () => {
    setStressLoading(prev => ({ ...prev, memory: true }))
    try {
      const result = await systemAPI.stressMemory(stressParams.memorySizeMB)
      setLastStressResults(prev => ({ ...prev, memory: result }))
      message.success(`메모리 부하 테스트 완료 (${stressParams.memorySizeMB}MB)`)
      
      // 테스트 후 시스템 정보 갱신
      setTimeout(fetchSystemData, 2000)
    } catch (error) {
      message.error('메모리 부하 테스트 실패')
      console.error('Memory stress test failed:', error)
    } finally {
      setStressLoading(prev => ({ ...prev, memory: false }))
    }
  }

  const getMemoryUsagePercent = () => {
    if (!systemInfo) return 0
    return Math.round((systemInfo.used_memory_mb / systemInfo.total_memory_mb) * 100)
  }

  const getMemoryAvailablePercent = () => {
    if (!systemInfo) return 0
    return Math.round((systemInfo.free_memory_mb / systemInfo.total_memory_mb) * 100)
  }

  if (loading && !systemInfo) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>시스템 정보를 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div>
      {/* 시스템 상태 개요 */}
      <Card 
        title="📊 시스템 대시보드" 
        extra={
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchSystemData}
            loading={loading}
          >
            새로고침
          </Button>
        }
        style={{ marginBottom: 24 }}
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Card className="stat-card">
              <Statistic
                title="CPU 코어"
                value={systemInfo?.processors || 0}
                suffix="cores"
                valueStyle={{ color: 'white' }}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="stat-card">
              <Statistic
                title="총 메모리"
                value={systemInfo?.total_memory_mb || 0}
                suffix="MB"
                valueStyle={{ color: 'white' }}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="stat-card">
              <Statistic
                title="사용 가능 메모리"
                value={systemInfo?.free_memory_mb || 0}
                suffix="MB"
                valueStyle={{ color: 'white' }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 시스템 상태 */}
      {healthStatus && (
        <Card title="🏥 시스템 상태" style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Alert
                message={`애플리케이션 상태: ${healthStatus.status}`}
                description={`버전: ${healthStatus.version}`}
                type={healthStatus.status === 'UP' ? 'success' : 'error'}
                showIcon
              />
            </Col>
            <Col xs={24} md={12}>
              <Alert
                message={`데이터베이스 상태: ${healthStatus.database.status}`}
                description={`타입: ${healthStatus.database.type}`}
                type={healthStatus.database.status === 'UP' ? 'success' : 'error'}
                showIcon
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 메모리 사용량 */}
      {systemInfo && (
        <Card title="💾 메모리 사용량" style={{ marginBottom: 24 }}>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <div style={{ marginBottom: 16 }}>
                <h4>메모리 사용률</h4>
                <Progress
                  percent={getMemoryUsagePercent()}
                  status={getMemoryUsagePercent() > 80 ? 'exception' : 'normal'}
                  format={() => `${systemInfo.used_memory_mb}MB / ${systemInfo.total_memory_mb}MB`}
                />
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div style={{ marginBottom: 16 }}>
                <h4>가용 메모리</h4>
                <Progress
                  percent={getMemoryAvailablePercent()}
                  status="success"
                  format={() => `${systemInfo.free_memory_mb}MB 사용 가능`}
                />
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* 부하 테스트 */}
      <Card title="⚡ 부하 테스트" style={{ marginBottom: 24 }}>
        <Alert
          message="Kubernetes 스케일링 테스트"
          description="CPU 및 메모리 부하를 발생시켜 HPA(Horizontal Pod Autoscaler) 동작을 테스트할 수 있습니다."
          type="info"
          style={{ marginBottom: 24 }}
        />
        
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card title="🔥 CPU 부하 테스트" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <label>테스트 시간 (초):</label>
                  <InputNumber
                    min={1}
                    max={300}
                    value={stressParams.cpuSeconds}
                    onChange={(value) => setStressParams(prev => ({ ...prev, cpuSeconds: value || 10 }))}
                    style={{ marginLeft: 8 }}
                  />
                </div>
                <Button
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  onClick={handleCPUStress}
                  loading={stressLoading.cpu}
                  block
                >
                  CPU 부하 테스트 시작
                </Button>
                {lastStressResults.cpu && (
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    마지막 테스트: {lastStressResults.cpu.duration_ms}ms, 
                    소수 발견: {lastStressResults.cpu.primes_found}개
                  </div>
                )}
              </Space>
            </Card>
          </Col>
          
          <Col xs={24} md={12}>
            <Card title="🧠 메모리 부하 테스트" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <label>할당 메모리 (MB):</label>
                  <InputNumber
                    min={10}
                    max={1000}
                    value={stressParams.memorySizeMB}
                    onChange={(value) => setStressParams(prev => ({ ...prev, memorySizeMB: value || 200 }))}
                    style={{ marginLeft: 8 }}
                  />
                </div>
                <Button
                  type="primary"
                  icon={<DatabaseOutlined />}
                  onClick={handleMemoryStress}
                  loading={stressLoading.memory}
                  block
                >
                  메모리 부하 테스트 시작
                </Button>
                {lastStressResults.memory && (
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    마지막 테스트: {lastStressResults.memory.duration_ms}ms, 
                    할당: {lastStressResults.memory.memory_allocated_mb}MB
                  </div>
                )}
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 실습 가이드 */}
      <Card title="🎯 인턴십 실습 가이드">
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Card title="1. HPA 테스트" size="small">
              <p>CPU 부하 테스트를 실행하여 Horizontal Pod Autoscaler가 자동으로 Pod 수를 증가시키는지 확인해보세요.</p>
              <code style={{ fontSize: '12px' }}>kubectl get hpa skyline-hpa -w</code>
            </Card>
          </Col>
          
          <Col xs={24} md={8}>
            <Card title="2. 메모리 모니터링" size="small">
              <p>메모리 부하 테스트를 통해 메모리 사용량이 증가하는 것을 모니터링하고 리소스 제한 설정을 확인해보세요.</p>
              <code style={{ fontSize: '12px' }}>kubectl top pods</code>
            </Card>
          </Col>
          
          <Col xs={24} md={8}>
            <Card title="3. 로그 확인" size="small">
              <p>부하 테스트 중 애플리케이션 로그를 확인하여 성능 변화를 관찰해보세요.</p>
              <code style={{ fontSize: '12px' }}>kubectl logs -f deployment/skyline-app</code>
            </Card>
          </Col>
        </Row>
        
        <Alert
          message="💡 추가 실습 아이디어"
          description={
            <ul style={{ marginTop: 8, marginBottom: 0 }}>
              <li>Prometheus와 Grafana를 설치하여 메트릭 대시보드 구성</li>
              <li>여러 Pod에서 동시에 부하 테스트 실행하여 로드 밸런싱 확인</li>
              <li>Node Exporter를 설치하여 노드 수준의 메트릭 모니터링</li>
              <li>Alert Manager를 설정하여 임계값 초과 시 알림 받기</li>
            </ul>
          }
          type="success"
          style={{ marginTop: 16 }}
        />
      </Card>
    </div>
  )
}

export default DashboardPage