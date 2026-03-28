import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { labsAPI, musterAPI, pcsAPI } from '../services/api';
import { Lab, PC } from '../types';
import { Button, Form, Input, Select, Table, Space, message } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';

const { TextArea } = Input;

const MusterRegister: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [pcs, setPcs] = useState<PC[]>([]);
  const [selectedLab, setSelectedLab] = useState<number | null>(null);
  const [form, setForm] = useState<{
    date: string;
    time: string;
    class_name: string;
    batch: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    time: '',
    class_name: '',
    batch: '',
  });
  const [entries, setEntries] = useState<Array<{ sr_no: number; roll_no: string; pc: number | null }>>([{
    sr_no: 1,
    roll_no: '',
    pc: null,
  }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Fetch labs on mount
  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const data = await labsAPI.getAll();
        setLabs(data);
      } catch (err) {
        setError('Failed to load labs');
        console.error(err);
      }
    };
    fetchLabs();
  }, []);

  // Fetch PCs when lab changes
  useEffect(() => {
    if (selectedLab !== null) {
      const fetchPCs = async () => {
        try {
          const data = await musterAPI.getPCsForLab(selectedLab);
          setPcs(data);
        } catch (err) {
          setError('Failed to load PCs for the selected lab');
          console.error(err);
        }
      };
      fetchPCs();
    } else {
      setPcs([]);
    }
  }, [selectedLab]);

  // Load session data if editing
  useEffect(() => {
    if (sessionId) {
      const fetchSession = async () => {
        try {
          setLoading(true);
          const data = await musterAPI.getSession(parseInt(sessionId));
          setForm({
            date: data.date,
            time: data.time,
            class_name: data.class_name,
            batch: data.batch,
          });
          setSelectedLab(data.lab);
          // Wait for labs to load, then set entries
          // We'll set entries after labs are loaded and PCs are fetched
          // We'll use a timeout or check if pcs are loaded, but for simplicity we'll set after a bit
          setEntries(
            data.entries.map((entry, index) => ({
              sr_no: entry.sr_no,
              roll_no: entry.roll_no,
              pc: entry.pc,
            }))
          );
          setIsEditMode(true);
          setLoading(false);
        } catch (err) {
          setError('Failed to load session');
          console.error(err);
          setLoading(false);
        }
      };
      fetchSession();
    }
  }, [sessionId]);

  // Handle form changes
  const handleDateChange = (date: string) => {
    setForm(prev => ({ ...prev, date }));
  };

  const handleTimeChange = (time: string) => {
    // Round time to nearest 30 minutes
    if (time) {
      const [hours, minutes] = time.split(':').map(Number);
      let roundedMinutes = 0;
      let roundedHours = hours;
      if (minutes < 15) {
        roundedMinutes = 0;
      } else if (minutes < 45) {
        roundedMinutes = 30;
      } else {
        roundedMinutes = 0;
        roundedHours = (hours + 1) % 24;
      }
      const roundedTime = `${String(roundedHours).padStart(2, '0')}:${String(roundedMinutes).padStart(2, '0')}:00`;
      setForm(prev => ({ ...prev, time: roundedTime }));
    } else {
      setForm(prev => ({ ...prev, time: '' }));
    }
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, class_name: e.target.value }));
  };

  const handleBatchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, batch: e.target.value }));
  };

  const handleLabChange = (value: string) => {
    const labId = value ? parseInt(value) : null;
    setSelectedLab(labId);
    // Reset entries when lab changes? Or keep them? We'll reset for simplicity.
    setEntries([{ sr_no: 1, roll_no: '', pc: null }]);
  };

  // Handle entry changes
  const handleRollNoChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    setEntries(prev => {
      const newEntries = [...prev];
      newEntries[index].roll_no = e.target.value;
      return newEntries;
    });
  };

  const handlePcChange = (index: number, value: string) => {
    const pcId = value ? parseInt(value) : null;
    setEntries(prev => {
      const newEntries = [...prev];
      newEntries[index].pc = pcId;
      return newEntries;
    });
  };

  // Handle add row
  const handleAddRow = () => {
    setEntries(prev => [
      ...prev,
      {
        sr_no: prev.length + 1,
        roll_no: '',
        pc: null,
      },
    ]);
  };

  // Handle remove row
  const handleRemoveRow = (index: number) => {
    setEntries(prev => {
      if (prev.length <= 1) {
        message.warning('At least one row is required');
        return prev;
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Handle save
  const handleSave = async () => {
    // Validate form
    if (!form.date || !form.time || !form.class_name || !form.batch || selectedLab === null) {
      message.error('Please fill in all session details');
      return;
    }

    // Validate entries
    let valid = true;
    entries.forEach(entry => {
      if (!entry.roll_no || entry.pc === null) {
        valid = false;
      }
    });
    if (!valid) {
      message.error('Please fill in all fields for each entry (Roll No and PC)');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (isEditMode && sessionId) {
        // Update existing session
        await musterAPI.updateSession(parseInt(sessionId), {
          date: form.date,
          time: form.time,
          lab: selectedLab,
          class_name: form.class_name,
          batch: form.batch,
          entries: entries.map(entry => ({
            sr_no: entry.sr_no,
            roll_no: entry.roll_no,
            pc: entry.pc,
          })),
        });
        message.success('Muster register updated successfully');
      } else {
        // Create new session
        const sessionData = await musterAPI.createSession({
          date: form.date,
          time: form.time,
          lab: selectedLab,
          class_name: form.class_name,
          batch: form.batch,
        });
        const sessionId = sessionData.id;
        // Save entries for the new session
        await musterAPI.saveEntries(sessionId, entries.map(entry => ({
          sr_no: entry.sr_no,
          roll_no: entry.roll_no,
          pc: entry.pc,
        })));
        message.success('Muster register created successfully');
      }
      setSuccess(true);
      // Optionally redirect to list or reset form
      // navigate(`/muster/list`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save muster register');
      message.error(err.response?.data?.error || 'Failed to save muster register');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Time input placeholder for formatting
  const timeInputValue = form.time ? form.time.substring(0, 5) : '';

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>{isEditMode ? 'Edit Muster Register' : 'New Muster Register'}</h2>
        <Space>
          <Button type="default" onClick={() => navigate('/muster/list')}>
            Back to List
          </Button>
        </Space>
      </div>

      {error && (
        <div style={{ backgroundColor: '#fff2f0', border: '1px solid #ffa39e', borderRadius: '4px', padding: '12px', marginBottom: '16px' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '4px', padding: '12px', marginBottom: '16px' }}>
          Muster register saved successfully!
        </div>
      )}

      <Form layout="vertical">
        <Form.Item label="Date">
          <Input type="date" value={form.date} onChange={e => handleDateChange(e.target.value)} />
        </Form.Item>
        <Form.Item label="Time (HH:MM)">
          <Input
            type="text"
            value={timeInputValue}
            onChange={e => handleTimeChange(e.target.value)}
            placeholder="HH:MM"
          />
          <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
            Time will be rounded to the nearest 30 minutes (e.g., 10:12 → 10:00, 10:18 → 10:30)
          </span>
        </Form.Item>
        <Form.Item label="Lab Name">
          <Select
            showSearch
            placeholder="Select a lab"
            allowClear
            value={selectedLab ?? null}
            onChange={handleLabChange}
          >
            {labs.map(lab => (
              <Select.Option key={lab.id} value={lab.id}>
                {lab.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="Class">
          <Input
            value={form.class_name}
            onChange={handleClassChange}
            placeholder="Enter class (e.g., SE Computer)"
          />
        </Form.Item>
        <Form.Item label="Batch">
          <Input
            value={form.batch}
            onChange={handleBatchChange}
            placeholder="Enter batch (e.g., Batch A)"
          />
        </Form.Item>
      </Form>

      <div style={{ margin: '24px 0' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRow} style={{ marginRight: '8px' }}>
          Add Row
        </Button>
      </div>

      <Table
        columns={[
          {
            title: 'Sr. No.',
            dataIndex: 'sr_no',
            key: 'sr_no',
            width: 80,
            renderText: (text) => text.toString(),
          },
          {
            title: 'Roll No.',
            dataIndex: 'roll_no',
            key: 'roll_no',
            width: 150,
            render: (_, record) => (
              <Input
                value={record.roll_no}
                onChange={e => handleRollNoChange(record.sr_no - 1, e)}
                style={{ width: '100%' }}
              />
            ),
          },
          {
            title: 'PC Name',
            dataIndex: 'pc',
            key: 'pc',
            width: 200,
            render: (_, record) => (
              <Select
                showSearch
                placeholder="Select a PC"
                allowClear
                value={record.pc ?? null}
                onChange={e => handlePcChange(record.sr_no - 1, e.target.value)}
                style={{ width: '100%' }}
              >
                {pcs.map(pc => (
                  <Select.Option key={pc.id} value={pc.id}>
                    {pc.device_name}
                  </Select.Option>
                ))}
              </Select>
            ),
          },
          {
            title: 'Actions',
            dataIndex: 'actions',
            key: 'actions',
            width: 100,
            render: (_, record, index) => (
              <Button
                type="danger"
                icon={<DeleteOutlined />}
                size="small"
                onClick={() => handleRemoveRow(index)}
                danger
              >
                Delete
              </Button>
            ),
          },
        ]}
        dataSource={entries}
        rowKey="sr_no"
        bordered
        size="middle"
      />

      <div style={{ marginTop: '24px', textAlign: 'right' }}>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={loading}
          onClick={handleSave}
          disabled={loading}
        >
          {isEditMode ? 'Update Register' : 'Save Register'}
        </Button>
        <Button
          type="default"
          onClick={() => {
            if (isEditMode && sessionId) {
              navigate(`/muster/list`);
            } else {
              // Reset form for new entry
              setForm({
                date: new Date().toISOString().split('T')[0],
                time: '',
                class_name: '',
                batch: '',
              });
              setSelectedLab(null);
              setEntries([{ sr_no: 1, roll_no: '', pc: null }]);
              setIsEditMode(false);
              setSuccess(false);
              setError(null);
            }
          }}
        >
          {isEditMode ? 'Cancel' : 'Reset'}
        </Button>
      </div>
    </div>
  );
};

export default MusterRegister;