import { AIService } from '../services/aiService';

describe('AI Pipeline & Utility Unit Tests', () => {
  it('AIService should be defined with real inference methods', () => {
    expect(AIService.isServiceOnline).toBeDefined();
    expect(AIService.extractEmbedding).toBeDefined();
    expect(AIService.processFrame).toBeDefined();
    expect(AIService.analyzeVideo).toBeDefined();
  });

  it('AIService should report status cleanly when microservice is offline', async () => {
    const isOnline = await AIService.isServiceOnline();
    expect(typeof isOnline).toBe('boolean');
  });

  it('FastAPI AI Microservice Python file exists and YuNet ONNX model is present', () => {
    const fs = require('fs');
    const path = require('path');
    const modelPath = path.resolve(__dirname, '../../../ai-service/models/face_detection_yunet_2023mar.onnx');
    const pyPath = path.resolve(__dirname, '../../../ai-service/main.py');

    expect(fs.existsSync(modelPath)).toBe(true);
    expect(fs.existsSync(pyPath)).toBe(true);
  });
});
