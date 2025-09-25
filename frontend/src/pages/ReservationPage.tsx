import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, Input, message, Space, Tag, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, StopOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { reservationAPI, flightAPI } from '../services/api'
import type { Reservation, CreateReservationRequest, Flight } from '../types'

const ReservationPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
  const [searchEmail, setSearchEmail] = useState('')
  const [form] = Form.useForm()

  useEffect(() => {
    fetchReservations()
    fetchFlights()
    
    // URL에서 flightId 파라미터 확인 (검색 페이지에서 넘어온 경우)
    const urlParams = new URLSearchParams(window.location.search)
    const flightId = urlParams.get('flightId')
    if (flightId) {
      handleCreateReservation(parseInt(flightId))
    }
  }, [])

  const fetchReservations = async () => {
    try {
      setLoading(true)
      const data = await reservationAPI.getAllReservations()
      setReservations(data)
    } catch (error) {
      message.error('예약 목록을 불러올 수 없습니다.')
      console.error('Error fetching reservations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFlights = async () => {
    try {
      const data = await flightAPI.getAvailableFlights()
      setFlights(data)
    } catch (error) {
      console.error('Error fetching flights:', error)
    }
  }

  const handleCreateReservation = (preSelectedFlightId?: number) => {
    setEditingReservation(null)
    form.resetFields()
    if (preSelectedFlightId) {
      form.setFieldsValue({ flightId: preSelectedFlightId })
    }
    setModalVisible(true)
  }

  const handleEditReservation = (reservation: Reservation) => {
    setEditingReservation(reservation)
    form.setFieldsValue({
      flightId: reservation.flight.flightId,
      passengerName: reservation.passengerName,
      passengerEmail: reservation.passengerEmail,
      passengerPhone: reservation.passengerPhone,
      seatNumber: reservation.seatNumber,
    })
    setModalVisible(true)
  }

  const handleSubmit = async (values: any) => {
    try {
      const requestData: CreateReservationRequest = {
        flight: { flightId: values.flightId },
        passengerName: values.passengerName,
        passengerEmail: values.passengerEmail,
        passengerPhone: values.passengerPhone,
        seatNumber: values.seatNumber,
      }

      if (editingReservation) {
        await reservationAPI.updateReservation(editingReservation.reservationId, requestData)
        message.success('예약이 수정되었습니다.')
      } else {
        await reservationAPI.createReservation(requestData)
        message.success('예약이 생성되었습니다.')
      }

      setModalVisible(false)
      fetchReservations()
    } catch (error) {
      message.error(editingReservation ? '예약 수정에 실패했습니다.' : '예약 생성에 실패했습니다.')
      console.error('Error submitting reservation:', error)
    }
  }

  const handleCancelReservation = async (reservationId: number) => {
    try {
      await reservationAPI.cancelReservation(reservationId)
      message.success('예약이 취소되었습니다.')
      fetchReservations()
    } catch (error) {
      message.error('예약 취소에 실패했습니다.')
      console.error('Error cancelling reservation:', error)
    }
  }

  const handleDeleteReservation = async (reservationId: number) => {
    try {
      await reservationAPI.deleteReservation(reservationId)
      message.success('예약이 삭제되었습니다.')
      fetchReservations()
    } catch (error) {
      message.error('예약 삭제에 실패했습니다.')
      console.error('Error deleting reservation:', error)
    }
  }

  const handleSearchByEmail = async () => {
    if (!searchEmail.trim()) {
      message.warning('이메일을 입력해주세요.')
      return
    }

    try {
      setLoading(true)
      const data = await reservationAPI.getReservationsByEmail(searchEmail.trim())
      setReservations(data)
      message.success(`${data.length}개의 예약을 찾았습니다.`)
    } catch (error) {
      message.error('검색에 실패했습니다.')
      console.error('Error searching reservations:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnsType<Reservation> = [
    {
      title: '예약번호',
      dataIndex: 'reservationId',
      key: 'reservationId',
      width: 100,
    },
    {
      title: '항공편',
      key: 'flight',
      render: (_, record) => (
        <div>
          <div><strong>{record.flight.flightNumber}</strong></div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.flight.departureAirport.airportCode} → {record.flight.arrivalAirport.airportCode}
          </div>
        </div>
      ),
    },
    {
      title: '승객정보',
      key: 'passenger',
      render: (_, record) => (
        <div>
          <div><strong>{record.passengerName}</strong></div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.passengerEmail}</div>
          {record.passengerPhone && (
            <div style={{ fontSize: '12px', color: '#666' }}>{record.passengerPhone}</div>
          )}
        </div>
      ),
    },
    {
      title: '좌석',
      dataIndex: 'seatNumber',
      key: 'seatNumber',
      width: 80,
      render: (seatNumber) => seatNumber || '-',
    },
    {
      title: '출발시간',
      key: 'departureTime',
      render: (_, record) => dayjs(record.flight.departureTime).format('MM/DD HH:mm'),
    },
    {
      title: '예약일',
      dataIndex: 'reservationDate',
      key: 'reservationDate',
      render: (date) => dayjs(date).format('MM/DD HH:mm'),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          CONFIRMED: { color: 'green', text: '확정' },
          CANCELLED: { color: 'red', text: '취소' },
          PENDING: { color: 'orange', text: '대기' },
        }
        const config = statusConfig[status as keyof typeof statusConfig]
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '작업',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditReservation(record)}
            disabled={record.status === 'CANCELLED'}
          >
            수정
          </Button>
          {record.status === 'CONFIRMED' && (
            <Popconfirm
              title="예약을 취소하시겠습니까?"
              onConfirm={() => handleCancelReservation(record.reservationId)}
            >
              <Button type="link" icon={<StopOutlined />} danger>
                취소
              </Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="예약을 완전히 삭제하시겠습니까?"
            onConfirm={() => handleDeleteReservation(record.reservationId)}
          >
            <Button type="link" icon={<DeleteOutlined />} danger>
              삭제
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card 
        title="📋 예약 관리"
        extra={
          <Space>
            <Input.Search
              placeholder="이메일로 검색"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onSearch={handleSearchByEmail}
              style={{ width: 200 }}
              enterButton={<SearchOutlined />}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleCreateReservation()}>
              새 예약
            </Button>
            <Button onClick={fetchReservations} loading={loading}>
              새로고침
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={reservations}
          rowKey="reservationId"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `총 ${total}개 예약`,
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      <Modal
        title={editingReservation ? '예약 수정' : '새 예약 생성'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="flightId"
            label="항공편"
            rules={[{ required: true, message: '항공편을 선택해주세요.' }]}
          >
            <select className="ant-select ant-select-single ant-select-show-arrow" style={{ width: '100%', height: '32px' }}>
              <option value="">항공편 선택</option>
              {flights.map(flight => (
                <option key={flight.flightId} value={flight.flightId}>
                  {flight.flightNumber} - {flight.departureAirport.airportCode} → {flight.arrivalAirport.airportCode} 
                  ({dayjs(flight.departureTime).format('MM/DD HH:mm')})
                </option>
              ))}
            </select>
          </Form.Item>

          <Form.Item
            name="passengerName"
            label="승객명"
            rules={[{ required: true, message: '승객명을 입력해주세요.' }]}
          >
            <Input placeholder="승객명 입력" />
          </Form.Item>

          <Form.Item
            name="passengerEmail"
            label="이메일"
            rules={[
              { required: true, message: '이메일을 입력해주세요.' },
              { type: 'email', message: '올바른 이메일 형식이 아닙니다.' }
            ]}
          >
            <Input placeholder="이메일 입력" />
          </Form.Item>

          <Form.Item
            name="passengerPhone"
            label="전화번호"
          >
            <Input placeholder="전화번호 입력 (선택사항)" />
          </Form.Item>

          <Form.Item
            name="seatNumber"
            label="좌석번호"
          >
            <Input placeholder="좌석번호 입력 (예: 1A)" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingReservation ? '수정' : '생성'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                취소
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ReservationPage