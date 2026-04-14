import React, { useState } from 'react';
import { 
  Box, Typography, Card, CardContent, Stack, TextField, MenuItem, 
  CircularProgress, Button, Stepper, Step, StepLabel, Alert, 
  Snackbar, Paper, List, ListItem, ListItemIcon, ListItemText,
  Divider
} from '@mui/material';
import { CloudUpload, CheckCircle, ErrorOutline, FileDownload, UploadFile } from '@mui/icons-material';
import { importAPI, labsAPI } from '../services/api';
import type { ImportResult, Lab } from '../types';

const steps = ['Select Data Type', 'Upload File', 'Review Results'];

const Import: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [entity, setEntity] = useState<string>('');
  const [labId, setLabId] = useState<number | ''>('');
  const [file, setFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);

  // Load labs if needed
  const [labs, setLabs] = useState<Lab[]>([]);
  const loadLabs = async () => {
    try {
      if (labs.length === 0) setLabs(await labsAPI.getAll());
    } catch { /* Ignore */ }
  };

  const handleEntityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEntity(e.target.value);
    if (e.target.value === 'pcs' || e.target.value === 'lab-equipment') {
      loadLabs();
    }
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      if (!entity) return setError('Please select an entity type');
      if ((entity === 'pcs' || entity === 'lab-equipment') && !labId) {
        return setError('Please select a target lab');
      }
      setActiveStep(1);
    } else if (activeStep === 1) {
      if (!file) return setError('Please upload a file');
      
      setLoading(true);
      setError('');
      try {
        let res: ImportResult;
        if (entity === 'labs') {
          res = await importAPI.importLabs(file);
        } else if (entity === 'pcs') {
          res = await importAPI.importPCs(file, labId as number);
        } else {
          res = await importAPI.importLabEquipment(file, labId as number);
        }
        setResult(res);
        setActiveStep(2);
      } catch (err: any) {
        setError(err?.response?.data?.error || err.message || 'Import failed');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleReset = () => {
    setActiveStep(0);
    setFile(null);
    setResult(null);
  };

  const downloadTemplate = () => {
    const templates: Record<string, string> = {
      'labs': 'name,location\nLab 1,Building A\n',
      'pcs': 'device_name,product_id,brand,serial_number,status\nPC-01,HP-Desktop,HP,SN123,working\n',
      'lab-equipment': 'category,status,quantity,location_in_lab,equipment_type\nFurniture,working,5,Corner,OTHER\n'
    };
    if (!entity) return;
    const content = templates[entity];
    if (!content) return;
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entity}_template.csv`;
    a.click();
  };

  return (
    <Box sx={{ maxWidth: '900px', mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.5px' }}>
          Bulk Data Import
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Upload CSV files to import multiple records at once
        </Typography>
      </Box>

      <Card className="glass-panel" sx={{ borderRadius: '16px', backgroundImage: 'none', mb: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 6 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Box sx={{ maxWidth: 500, mx: 'auto' }}>
              <Stack spacing={3}>
                <TextField select label="Entity to Import" value={entity} onChange={handleEntityChange} fullWidth>
                  <MenuItem value="labs">Labs</MenuItem>
                  <MenuItem value="pcs">PCs (Computers)</MenuItem>
                  <MenuItem value="lab-equipment">Lab Equipment</MenuItem>
                </TextField>

                {(entity === 'pcs' || entity === 'lab-equipment') && (
                  <TextField select label="Target Lab" value={labId} onChange={(e) => setLabId(e.target.value ? Number(e.target.value) : '')} fullWidth>
                    {labs.map((l) => (
                      <MenuItem key={l.id} value={l.id}>{l.name} - {l.location}</MenuItem>
                    ))}
                  </TextField>
                )}

                {entity && (
                  <Button variant="outlined" startIcon={<FileDownload />} onClick={downloadTemplate} sx={{ alignSelf: 'flex-start', borderRadius: '8px' }}>
                    Download CSV Template
                  </Button>
                )}
              </Stack>
            </Box>
          )}

          {activeStep === 1 && (
            <Box sx={{ maxWidth: 500, mx: 'auto' }}>
              <Stack spacing={2}>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 6, 
                    textAlign: 'center', 
                    borderRadius: '16px', 
                    borderStyle: 'dashed',
                    borderColor: 'divider',
                    bgcolor: 'background.default',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                  component="label"
                >
                  <input
                    type="file"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    style={{ display: 'none' }}
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6">{file ? file.name : 'Click to select CSV file'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Make sure to follow the template format'}
                  </Typography>
                </Paper>
              </Stack>
            </Box>
          )}

          {activeStep === 2 && result && (
            <Box>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 4 }}>
                <Paper sx={{ flex: 1, p: 3, textAlign: 'center', borderRadius: '16px', bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }} elevation={0}>
                  <Typography variant="h3" fontWeight={700}>{result.created}</Typography>
                  <Typography variant="body2" fontWeight={600}>Successfully Imported</Typography>
                </Paper>
                <Paper sx={{ flex: 1, p: 3, textAlign: 'center', borderRadius: '16px', bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }} elevation={0}>
                  <Typography variant="h3" fontWeight={700}>{result.errors.length}</Typography>
                  <Typography variant="body2" fontWeight={600}>Failed / Errors</Typography>
                </Paper>
                <Paper sx={{ flex: 1, p: 3, textAlign: 'center', borderRadius: '16px', bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }} elevation={0}>
                  <Typography variant="h3" fontWeight={700}>{result.skipped || 0}</Typography>
                  <Typography variant="body2" fontWeight={600}>Records Skipped</Typography>
                </Paper>
              </Stack>

              {result.errors.length > 0 && (
                <Box>
                  <Typography variant="h6" color="error" sx={{ mb: 2 }}>Error Log</Typography>
                  <List disablePadding>
                    {result.errors.map((err, i) => (
                      <React.Fragment key={i}>
                        <ListItem sx={{ py: 2 }}>
                          <ListItemIcon>
                            <ErrorOutline color="error" />
                          </ListItemIcon>
                          <ListItemText primary={err} />
                        </ListItem>
                        {i < result.errors.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}

          {/* Nav Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 4, mt: 4, borderTop: '1px solid', borderColor: 'divider' }}>
            {activeStep > 0 && activeStep < 2 && (
              <Button onClick={handleBack} sx={{ mr: 1, borderRadius: '8px' }} color="inherit">
                Back
              </Button>
            )}
            {activeStep === 2 ? (
              <Button onClick={handleReset} variant="contained" sx={{ borderRadius: '8px' }}>
                Import More Data
              </Button>
            ) : (
              <Button onClick={handleNext} variant="contained" disabled={loading} sx={{ borderRadius: '8px' }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : activeStep === 1 ? 'Start Import' : 'Next'}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError('')}>
        <Alert severity="error" onClose={() => setError('')} variant="filled">{error}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Import;
