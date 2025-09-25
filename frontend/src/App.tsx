import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import { HomeOutlined, SearchOutlined, BookOutlined, BarChartOutlined } from '@ant-design/icons'
import HomePage from './pages/HomePage'
import FlightSearchPage from './pages/FlightSearchPage'
import ReservationPage from './pages/ReservationPage'
import DashboardPage from './pages/DashboardPage'

const { Header, Content, Footer } = Layout

const App: React.FC = () => {
  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '홈',
    },
    {
      key: '/search',
      icon: <SearchOutlined />,
      label: '항공편 검색',
    },
    {
      key: '/reservations',
      icon: <BookOutlined />,
      label: '예약 관리',
    },
    {
      key: '/dashboard',
      icon: <BarChartOutlined />,
      label: '대시보드',
    },
  ]

  return (
    <Layout>
      <Header>
        <div className="logo">Skyline</div>
        <Menu
          theme="dark"
          mode="horizontal"
          items={menuItems}
          style={{ marginLeft: 'auto', background: 'transparent' }}
          onClick={({ key }) => {
            window.location.href = key
          }}
        />
      </Header>
      
      <Content>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<FlightSearchPage />} />
          <Route path="/reservations" element={<ReservationPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </Content>
      
      <Footer style={{ textAlign: 'center', background: '#f0f2f5' }}>
        <p>Skyline 항공예약시스템 ©2024 - EKS 인턴십 교육용 데모</p>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          🎓 자유롭게 실험하고 창의적으로 구성해보세요!
        </p>
      </Footer>
    </Layout>
  )
}

export default App