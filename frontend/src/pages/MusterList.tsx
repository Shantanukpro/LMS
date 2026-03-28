import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { musterAPI } from '../services/api';
import { Button, Table, Popconfirm, Space, message } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const MusterList: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const data = await musterAPI.listSessions();
        setSessions(data);
      } catch (err) {
        setError('Failed to load muster sessions');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await musterAPI.deleteSession(id);
      setSessions(prev => prev.filter(session => session.id !== id));
      message.success('Muster session deleted successfully');
    } catch (err) {
      setError('Failed to delete muster session');
      console.error(err);
    }
  };

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Loading...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '24px', backgroundColor: '#fff2f0', border: '1px solid #ffa39e', borderRadius: '4px' }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Muster Register Sessions</h2>
        <Space>
          <Button type="primary" onClick={() => navigate('/muster/register')}>
            Create New Session
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={[
          {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
          },
          {
            title: 'Time',
            dataIndex: 'time',
            key: 'time',
          },
          {
            title: 'Lab',
            dataIndex: 'lab_name',
            key: 'lab_name',
          },
          {
            title: 'Class',
            dataIndex: 'class_name',
            key: 'class_name',
          },
          {
            title: 'Batch',
            dataIndex: 'batch',
            key: 'batch',
          },
          {
            title: 'Entries',
            dataIndex: 'entry_count',
            key: 'entry_count',
          },
          {
            title: 'Created At',
            dataIndex: 'created_at',
            key: 'created_at',
          },
          {
            title: 'Actions',
            dataIndex: 'actions',
            key: 'actions',
            width: 120,
            render: (_, record) => (
              <Space>
                <a href={`/muster/register/${record.id}`}>
                  <EyeOutlined title="View" />
                </a>
                <Popconfirm
                  title="Are you sure you want to delete this muster session?"
                  onConfirm={() => handleDelete(record.id)}
                >
                  <DeleteOutlined title="Delete" />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
        dataSource={sessions}
        bordered
        size="middle"
      />
    </div>
  );
};

export default MusterList;