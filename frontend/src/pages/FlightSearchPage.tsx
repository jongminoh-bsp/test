import React, { useState, useEffect } from 'react'
import { Card, Form, Select, DatePicker, Button, Row, Col, List, Tag, message, Space, Spin } from 'antd'
import { SearchOutlined, PlusOutlined, ClockCircleOutlined, DollarOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { flightAPI } from '../services/api'
import type { Flight, FlightSearchParams } from '../types'

const { Option } = Select

const FlightSearchPage: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [flights, setFlights] = useState<Flight[]>([])
  const [allFlights, setAllFlights] = useState<Flight[]>([])
  const [searching, setSearching] = useState(false)

  // 공항 목록 (실제로는 API에서 가져와야 하지만 데모용으로 하드코딩)
  const airports = [
    { code: 'ICN', name: '인천국제공항', city: '서울' },
    { code: 'GMP', name: '김포국제공항', city: '서울' },
    { code: 'PUS', name: '김해국제공항', city: '부산' },
    { code: 'CJU', name: '제주국제공항', city: '제주' },
    { code: 'NRT', name: '나리타국제공항', city: '도쿄' },
    { code: 'KIX', name: '간사이국제공항', city: '오사카' },
    { code: 'PEK', name: '베이징 수도국제공항', city: '베이징' },
    { code: 'PVG', name: '상하이 푸둥국제공항', city: '상하이' },
    { code: 'BKK', name: '수완나품국제공항', city: '방콕' },
    { code: 'SIN', name: '창이공항', city: '싱가포르' },
    { code: 'LAX', name: '로스앤젤레스국제공항', city: '로스앤젤레스' },
    { code: 'SFO', name: '샌프란시스코국제공항', city: '샌프란시스코' },
  ]

  useEffect(() => {
    fetchAllFlights()
  }, [])

  const fetchAllFlights = async () => {
    try {
      setLoading(true)
      const allFlightsData = await flightAPI.getAllFlights()
      setAllFlights(allFlightsData)
      setFlights(allFlightsData) // 초기에는 모든 항공편 표시
    } catch (error) {
      message.error('항공편 데이터를 불러올 수 없습니다.')
      console.error('Error fetching flights:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (values: any) => {
    setSearching(true)
    try {
      const searchParams: FlightSearchParams = {}
      
      if (values.from) searchParams.from = values.from
      if (values.to) searchParams.to = values.to
      if (values.date) searchParams.date = values.date.format('YYYY-MM-DD')

      // 검색 파라미터가 있으면 API 검색, 없으면 전체 항공편
      if (Object.keys(searchParams).length > 0) {
        const searchResults = await flightAPI.searchFlights(searchParams)
        setFlights(searchResults)
        message.success(`${searchResults.length}개의 항공편을 찾았습니다.`)
      } else {
        setFlights(allFlights)
        message.info('전체 항공편을 표시합니다.')
      }
    } catch (error) {
      message.error('검색 중 오류가 발생했습니다.')
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }

  const handleReset = () => {
    form.resetFields()
    setFlights(allFlights)
  }

  const handleReserve = (flight: Flight) => {
    // 예약 페이지로 이동하면서 항공편 정보 전달
    const reservationUrl = `/reservations?flightId=${flight.flightId}`
    window.location.href = reservationUrl
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount)
  }

  const formatDateTime = (dateTime: string) => {
    return dayjs(dateTime).format('MM/DD HH:mm')
  }

  const getFlightDuration = (departure: string, arrival: string) => {
    const diff = dayjs(arrival).diff(dayjs(departure), 'minute')
    const hours = Math.floor(diff / 60)
    const minutes = diff % 60
    return `${hours}시간 ${minutes}분`
  }

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>항공편 정보를 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div>
      <Card title="🔍 항공편 검색" style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSearch}
          className="search-form"
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Form.Item name="from" label="출발지">
                <Select
                  placeholder="출발 공항 선택"
                  showSearch
                  optionFilterProp="children"
                  allowClear
                >
                  {airports.map(airport => (
                    <Option key={airport.code} value={airport.code}>
                      {airport.code} - {airport.name} ({airport.city})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={8}>
              <Form.Item name="to" label="도착지">
                <Select
                  placeholder="도착 공항 선택"
                  showSearch
                  optionFilterProp="children"
                  allowClear
                >
                  {airports.map(airport => (
                    <Option key={airport.code} value={airport.code}>
                      {airport.code} - {airport.name} ({airport.city})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={8}>
              <Form.Item name="date" label="출발일">
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="날짜 선택"
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row justify="center">
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                htmlType="submit"
                loading={searching}
                size="large"
              >
                검색
              </Button>
              <Button onClick={handleReset} size="large">
                초기화
              </Button>
            </Space>
          </Row>
        </Form>
      </Card>

      <Card 
        title={`검색 결과 (${flights.length}개)`}
        extra={
          <Button 
            type="link" 
            onClick={fetchAllFlights}
            loading={loading}
          >
            새로고침
          </Button>
        }
      >
        {flights.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✈️</div>
            <h3>검색 조건에 맞는 항공편이 없습니다.</h3>
            <p>다른 조건으로 검색해보세요.</p>
          </div>
        ) : (
          <List
            dataSource={flights}
            renderItem={(flight) => (
              <List.Item
                className="flight-card"
                actions={[
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleReserve(flight)}
                    disabled={flight.availableSeats === 0}
                  >
                    예약하기
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <span className="flight-route">
                        {flight.departureAirport.airportCode} → {flight.arrivalAirport.airportCode}
                      </span>
                      <Tag color="blue">{flight.flightNumber}</Tag>
                      {flight.availableSeats === 0 && <Tag color="red">매진</Tag>}
                    </Space>
                  }
                  description={
                    <div>
                      <Row gutter={[16, 8]}>
                        <Col xs={24} sm={12}>
                          <div>
                            <strong>{flight.departureAirport.airportName}</strong> 
                            <span style={{ margin: '0 8px' }}>→</span>
                            <strong>{flight.arrivalAirport.airportName}</strong>
                          </div>
                          <div className="flight-time">
                            <ClockCircleOutlined /> {formatDateTime(flight.departureTime)} - {formatDateTime(flight.arrivalTime)}
                            <span style={{ marginLeft: 8, color: '#999' }}>
                              ({getFlightDuration(flight.departureTime, flight.arrivalTime)})
                            </span>
                          </div>
                        </Col>
                        <Col xs={24} sm={12}>
                          <div className="flight-price">
                            <DollarOutlined /> {formatCurrency(flight.price)}
                          </div>
                          <div style={{ color: '#666', fontSize: '14px' }}>
                            잔여 좌석: {flight.availableSeats}/{flight.totalSeats}
                            {flight.aircraftType && ` | ${flight.aircraftType}`}
                          </div>
                        </Col>
                      </Row>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  )
}

export default FlightSearchPage