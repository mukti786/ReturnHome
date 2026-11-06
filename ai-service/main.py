"""
ReturnHome — Real AI Microservice
Intelligent Missing Person Detection & Investigation System ("From Missing to Found.")

Available AI Pipeline:
1. Face Detection: OpenCV YuNet ONNX model.
2. Facial Quality Assessment:
   - Blur Score: Variance of the Laplacian operator.
   - Lighting Score: Normalized luminance intensity (0-100).
   - Pose Angle: Estimated yaw deviation from eye-nose triangular symmetry.
   - Overall Quality: Weighted aggregate score.
3. Generic Image Representation (not validated for face recognition):
   - ImageNet-pretrained ResNet18 feature vector (512-dim).
   - L2 Unit Normalization.
4. Experimental Image Feature Comparison (not identity matching):
   - Cosine vector similarity between generic ResNet18 features.
5. Video Frame Processing:
   - Video decoding, frame sampling and evidence frame generation with bounding boxes.
"""

import os
import io
import math
import time
import uuid
from typing import List, Optional, Dict, Any

import cv2
import numpy as np
from PIL import Image

import torch
import torchvision.models as models
import torchvision.transforms as transforms
import torch.nn.functional as F

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="ReturnHome AI Service",
    description="Real Deep Face Detection (YuNet), Facial Quality Assessment, 512-dim ResNet Embeddings & Cosine Vector Search",
    version="2.0.0"
)

allowed_origins = [origin.strip() for origin in os.getenv("AI_ALLOWED_ORIGINS", "http://localhost:5000,http://127.0.0.1:5000").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# AI Models Initialization
# -------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
YUNET_MODEL_PATH = os.path.join(BASE_DIR, "models", "face_detection_yunet_2023mar.onnx")
EVIDENCE_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "backend", "uploads", "evidence"))
os.makedirs(EVIDENCE_DIR, exist_ok=True)

# 1. Initialize YuNet Face Detector
yunet_detector = None
try:
    if os.path.exists(YUNET_MODEL_PATH):
        yunet_detector = cv2.FaceDetectorYN_create(
            model=YUNET_MODEL_PATH,
            config="",
            input_size=(320, 320),
            score_threshold=0.55,
            nms_threshold=0.3,
            top_k=5000
        )
        print(f"[ReturnHome AI] YuNet Face Detector loaded from {YUNET_MODEL_PATH}")
    else:
        print(f"[ReturnHome AI] YuNet model file missing at {YUNET_MODEL_PATH}")
except Exception as e:
    print(f"[ReturnHome AI] Warning initializing YuNet: {e}")

# 2. Initialize ResNet18 Feature Extractor (512-dim Embeddings)
print("[ReturnHome AI] Loading pretrained PyTorch ResNet18 feature extractor...")
weights = models.ResNet18_Weights.DEFAULT
try:
    resnet18 = models.resnet18(weights=weights)
    resnet18.fc = torch.nn.Identity() # Truncate classification head to produce 512-dim feature embeddings
    resnet18.eval()
    print("[ReturnHome AI] ResNet18 (512-dim) feature extractor ready on CPU.")
except Exception as e:
    resnet18 = None
    print(f"[ReturnHome AI] ResNet18 weights unavailable; embedding features are disabled: {e}")

# ImageNet Preprocessing Pipeline
face_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])


# -------------------------------------------------------------
# Helper Computer Vision & Quality Assessment Functions
# -------------------------------------------------------------

def evaluate_quality(face_bgr: np.ndarray, landmarks: Optional[np.ndarray] = None) -> Dict[str, float]:
    """
    Computes real metrics:
    - Blur score using variance of Laplacian
    - Lighting score using normalized luminance
    - Pose angle estimate using landmark symmetry
    """
    gray = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2GRAY)
    
    # Blur: variance of Laplacian
    var_lap = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    blur_score = round(min(100.0, max(5.0, var_lap / 3.0)), 1)
    
    # Lighting: mean luminance
    mean_val = float(np.mean(gray))
    lighting_score = round(min(100.0, (mean_val / 255.0) * 100.0), 1)
    
    # Pose estimation
    pose_angle = 5.0
    if landmarks is not None and len(landmarks) >= 5:
        # Landmarks: [re_x, re_y, le_x, le_y, nt_x, nt_y, rc_x, rc_y, lc_x, lc_y]
        re_x, le_x, nt_x = landmarks[0], landmarks[2], landmarks[4]
        eye_center = (re_x + le_x) / 2.0
        eye_dist = abs(le_x - re_x) + 1e-5
        asymmetry = abs(nt_x - eye_center) / eye_dist
        pose_angle = round(float(asymmetry * 45.0), 1)
    
    overall_quality = round(min(0.99, max(0.30, (blur_score * 0.4 + lighting_score * 0.4 + max(0, 100 - pose_angle * 3) * 0.2) / 100.0)), 2)
    
    return {
        "blur_score": blur_score,
        "lighting_score": lighting_score,
        "pose_angle": pose_angle,
        "overall_quality": overall_quality
    }


def detect_faces_in_bgr(img_bgr: np.ndarray) -> List[Dict[str, Any]]:
    """
    Runs YuNet deep face detector on an input BGR image.
    Returns list of detected face dictionaries containing bounding boxes, landmarks, confidence, and crops.
    """
    if yunet_detector is None:
        raise HTTPException(status_code=503, detail="YuNet face detector is unavailable because its model did not load.")
    h, w = img_bgr.shape[:2]
    detected_faces = []
    
    if yunet_detector is not None:
        yunet_detector.setInputSize((w, h))
        _, faces = yunet_detector.detect(img_bgr)
        
        if faces is not None:
            for face in faces:
                box_x, box_y, box_w, box_h = int(face[0]), int(face[1]), int(face[2]), int(face[3])
                conf = float(face[14])
                landmarks = face[4:14]
                
                # Clip coordinates to image boundaries
                x1 = max(0, box_x)
                y1 = max(0, box_y)
                x2 = min(w, box_x + box_w)
                y2 = min(h, box_y + box_h)
                
                if x2 - x1 >= 15 and y2 - y1 >= 15:
                    face_crop = img_bgr[y1:y2, x1:x2]
                    quality = evaluate_quality(face_crop, landmarks)
                    detected_faces.append({
                        "box": {"x": x1, "y": y1, "width": x2 - x1, "height": y2 - y1},
                        "confidence": round(conf, 3),
                        "quality": quality,
                        "crop": face_crop
                    })
    
    return detected_faces


def extract_resnet_embedding(face_crop_bgr: np.ndarray) -> List[float]:
    """
    Extracts genuine L2-normalized 512-dimensional embedding vector using PyTorch ResNet18.
    """
    if resnet18 is None:
        raise HTTPException(status_code=503, detail="The ResNet18 feature model is unavailable; no embedding was generated.")
    rgb = cv2.cvtColor(face_crop_bgr, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(rgb)
    tensor = face_transform(pil_img).unsqueeze(0)
    
    with torch.no_grad():
        raw_feat = resnet18(tensor)
        norm_feat = F.normalize(raw_feat, p=2, dim=1)
        
    return norm_feat[0].tolist()


def compute_cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """
    Computes mathematical Cosine Similarity between two L2-normalized vectors.
    Since ||a|| = 1 and ||b|| = 1, cos(a, b) = a . b
    """
    if len(vec_a) != 512 or len(vec_b) != 512:
        raise ValueError("Both feature vectors must contain exactly 512 values.")
    if not all(math.isfinite(value) for value in vec_a + vec_b):
        raise ValueError("Feature vectors must contain only finite values.")
    norm_a = math.sqrt(sum(value * value for value in vec_a))
    norm_b = math.sqrt(sum(value * value for value in vec_b))
    if norm_a == 0 or norm_b == 0:
        raise ValueError("Feature vectors must not be zero vectors.")
    dot_product = sum(a * b for a, b in zip(vec_a, vec_b)) / (norm_a * norm_b)
    # Clamp floating point noise to the mathematical cosine range.
    return float(max(0.0, min(1.0, dot_product)))


# -------------------------------------------------------------
# API Request / Response Data Models
# -------------------------------------------------------------

class BoundingBox(BaseModel):
    x: int
    y: int
    width: int
    height: int

class FaceQuality(BaseModel):
    blur_score: float
    lighting_score: float
    pose_angle: float
    overall_quality: float

class RegisteredPerson(BaseModel):
    case_id: str
    name: str
    embedding: List[float] = Field(min_length=512, max_length=512)
    photo_url: Optional[str] = None

class FrameProcessRequest(BaseModel):
    camera_id: str
    camera_name: str
    camera_location: str
    frame_base64: str # Base64 encoded JPEG/PNG frame
    registered_persons: List[RegisteredPerson]
    min_confidence: float = 0.65

class MatchSearchRequest(BaseModel):
    query_embedding: List[float] = Field(min_length=512, max_length=512)
    registered_persons: List[RegisteredPerson]
    threshold: float = Field(default=0.65, ge=0.0, le=1.0)


MAX_IMAGE_BYTES = 10 * 1024 * 1024
MAX_VIDEO_BYTES = 250 * 1024 * 1024


async def read_limited_upload(upload: UploadFile, limit: int) -> bytes:
    content = await upload.read(limit + 1)
    if len(content) > limit:
        raise HTTPException(status_code=413, detail=f"Upload exceeds the {limit // (1024 * 1024)} MB size limit.")
    return content


async def save_limited_upload(upload: UploadFile, destination: str, limit: int) -> int:
    written = 0
    with open(destination, "wb") as output:
        while True:
            chunk = await upload.read(min(1024 * 1024, limit + 1 - written))
            if not chunk:
                break
            written += len(chunk)
            if written > limit:
                output.close()
                if os.path.exists(destination):
                    os.remove(destination)
                raise HTTPException(status_code=413, detail="Video exceeds the 250 MB size limit.")
            output.write(chunk)
    return written


def decode_image(content: bytes, message: str = "Invalid image file format") -> np.ndarray:
    img = cv2.imdecode(np.frombuffer(content, np.uint8), cv2.IMREAD_COLOR)
    if img is None or img.size == 0:
        raise HTTPException(status_code=400, detail=message)
    if img.shape[0] * img.shape[1] > 40_000_000:
        raise HTTPException(status_code=413, detail="Image dimensions exceed the 40 megapixel limit.")
    return img


def parse_registered_data(serialized: str) -> List[Dict[str, Any]]:
    import json
    try:
        persons = json.loads(serialized)
    except (TypeError, json.JSONDecodeError):
        raise HTTPException(status_code=400, detail="Registered case features must be valid JSON.")
    if not isinstance(persons, list) or len(persons) > 1000:
        raise HTTPException(status_code=400, detail="Registered case features must be a list.")
    for person in persons:
        embedding = person.get("embedding") if isinstance(person, dict) else None
        if not isinstance(person.get("case_id"), str) or not isinstance(person.get("name"), str) or not isinstance(embedding, list) or len(embedding) != 512 or not all(isinstance(value, (int, float)) and math.isfinite(value) for value in embedding):
            raise HTTPException(status_code=400, detail="Each registered case feature vector must contain 512 finite values.")
    return persons


# -------------------------------------------------------------
# API Endpoints
# -------------------------------------------------------------

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "ReturnHome AI Microservice",
        "tagline": "From Missing to Found.",
        "version": "2.0.0",
        "pipeline": {
            "face_detector": "OpenCV YuNet Deep Neural Network",
            "feature_extractor": "ImageNet-pretrained ResNet18 (generic image features; not face-recognition validated)",
            "similarity_metric": "Experimental generic image-feature cosine similarity; not identity matching",
            "quality_assessment": "Laplacian Blur Variance + Mean Luminance + Landmark Asymmetry"
        },
        "disclaimer": "This service does not provide validated face recognition. Generic image-feature similarities are experimental suggestions, not identities or confirmed matches."
    }

@app.get("/health")
def health_check(response: Response):
    ready = yunet_detector is not None and resnet18 is not None
    if not ready:
        response.status_code = 503
    return {
        "status": "healthy" if ready else "degraded",
        "detector_loaded": yunet_detector is not None,
        "resnet_loaded": resnet18 is not None,
        "device": "CPU",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")
    }

@app.post("/api/ai/detect-face")
async def detect_face(file: UploadFile = File(...)):
    """
    Detects faces in uploaded image using real YuNet deep detector and calculates real quality scores.
    """
    content = await read_limited_upload(file, MAX_IMAGE_BYTES)
    img_bgr = decode_image(content)
        
    faces = detect_faces_in_bgr(img_bgr)
    
    detections = []
    for i, f in enumerate(faces):
        detections.append({
            "detection_id": f"DET-FAC-{int(time.time())}-{i+1}",
            "box": f["box"],
            "quality": f["quality"],
            "confidence": f["confidence"]
        })
        
    return {
        "success": True,
        "filename": file.filename,
        "faces_detected": len(detections),
        "detections": detections,
        "disclaimer": "This service does not provide validated face recognition. Generic image-feature similarities are experimental suggestions, not identities or confirmed matches."
    }

@app.post("/api/ai/generate-embedding")
async def generate_embedding(file: UploadFile = File(...)):
    """
    Processes an image, detects the primary face, and extracts a real 512-dim normalized feature embedding.
    """
    content = await read_limited_upload(file, MAX_IMAGE_BYTES)
    img_bgr = decode_image(content)
        
    faces = detect_faces_in_bgr(img_bgr)
    if not faces:
        raise HTTPException(status_code=422, detail="No face was detected. No embedding was generated.")
    primary_face = faces[0]
    
    embedding = extract_resnet_embedding(primary_face["crop"])
    
    return {
        "success": True,
        "embedding_id": f"EMB-RESNET-{uuid.uuid4().hex[:8]}",
        "dimension": len(embedding),
        "embedding": embedding,
        "quality": primary_face["quality"],
        "confidence": primary_face["confidence"]
    }

@app.post("/api/ai/search-match")
def search_match(req: MatchSearchRequest):
    """
    Performs real cosine vector similarity comparison of query embedding against all registered missing persons.
    """
    matches = []
    if not all(math.isfinite(value) for value in req.query_embedding):
        raise HTTPException(status_code=422, detail="Query vector must contain only finite values.")
    if any(not all(math.isfinite(value) for value in person.embedding) for person in req.registered_persons):
        raise HTTPException(status_code=422, detail="Registered feature vectors must contain only finite values.")
    if sum(value * value for value in req.query_embedding) == 0 or any(sum(value * value for value in person.embedding) == 0 for person in req.registered_persons):
        raise HTTPException(status_code=422, detail="Feature vectors must not be zero vectors.")
    
    for person in req.registered_persons:
        sim = compute_cosine_similarity(req.query_embedding, person.embedding)
        tier = "HIGH" if sim >= 0.85 else ("MEDIUM" if sim >= 0.70 else "LOW")
        
        if sim >= req.threshold:
            matches.append({
                "match_id": f"MATCH-{uuid.uuid4().hex[:8].upper()}",
                "case_id": person.case_id,
                "missing_person_name": person.name,
                "similarity_score": round(sim, 4),
                "confidence_tier": tier,
                "photo_url": person.photo_url,
                "status": "Pending Review",
                "requires_human_review": True
            })
            
    matches.sort(key=lambda m: m["similarity_score"], reverse=True)
    
    return {
        "success": True,
        "results_count": len(matches),
        "matches": matches,
        "disclaimer": "This service does not provide validated face recognition. Generic image-feature similarities are experimental suggestions, not identities or confirmed matches."
    }

@app.post("/api/ai/process-frame")
async def process_frame(
    camera_id: str = Form(...),
    camera_name: str = Form(...),
    camera_location: str = Form(...),
    min_confidence: float = Form(0.65),
    registered_data: str = Form("[]"),
    frame: UploadFile = File(...)
):
    """
    Real-time frame ingestion endpoint for CCTV streams and live browser webcams.
    - Decodes incoming frame
    - Detects all faces using YuNet
    - Extracts 512-dim embedding for each face
    - Computes real cosine similarity against registered missing person database
    - When similarity >= min_confidence, draws bounding boxes, crops face, saves marked evidence snapshot to disk
    - Returns candidate match event for database storage and live alert
    """
    registered_persons = parse_registered_data(registered_data)
    if not 0 <= min_confidence <= 1:
        raise HTTPException(status_code=422, detail="Similarity threshold must be between 0 and 1.")
    content = await read_limited_upload(frame, MAX_IMAGE_BYTES)
    frame_bgr = decode_image(content, "Failed to decode video frame")
        
    h, w = frame_bgr.shape[:2]
    faces = detect_faces_in_bgr(frame_bgr)
    
    matched_events = []
    
    for i, face in enumerate(faces):
        face_emb = extract_resnet_embedding(face["crop"])
        
        # Compare against registered cases
        best_match = None
        best_sim = 0.0
        
        for person in registered_persons:
            p_emb = person.get("embedding", [])
            if len(p_emb) == 512:
                sim = compute_cosine_similarity(face_emb, p_emb)
                if sim > best_sim:
                    best_sim = sim
                    best_match = person
                    
        # Return candidate similarities for human review only.
        if best_match and best_sim >= min_confidence:
            tier = "HIGH" if best_sim >= 0.85 else ("MEDIUM" if best_sim >= 0.70 else "LOW")
            match_uid = f"MATCH-{uuid.uuid4().hex[:10].upper()}"
            tracking_id = f"TRACK-{uuid.uuid4().hex[:10].upper()}"
            
            # Draw professional inspection bounding box & badge on evidence frame
            box = face["box"]
            x, y, bw, bh = box["x"], box["y"], box["width"], box["height"]
            
            evidence_img = frame_bgr.copy()
            # Draw bounding box
            cv2.rectangle(evidence_img, (x, y), (x + bw, y + bh), (0, 200, 255), 3)
            # Label banner
            label = f"{best_match['name']} ({round(best_sim * 100, 1)}%)"
            cv2.rectangle(evidence_img, (x, max(0, y - 28)), (x + len(label) * 11, max(0, y)), (0, 200, 255), -1)
            cv2.putText(evidence_img, label, (x + 4, max(18, y - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (15, 23, 42), 2)
            
            # Save marked evidence snapshot to backend/uploads/evidence/
            evidence_filename = f"evd-{match_uid}-{int(time.time())}.jpg"
            evidence_path = os.path.join(EVIDENCE_DIR, evidence_filename)
            cv2.imwrite(evidence_path, evidence_img)
            
            matched_events.append({
                "matchId": match_uid,
                "caseId": best_match["case_id"],
                "missingPersonName": best_match["name"],
                "missingPersonPhoto": best_match.get("photo_url", ""),
                "detectedFrameUrl": f"/uploads/evidence/{evidence_filename}",
                "cameraId": camera_id,
                "cameraName": camera_name,
                "location": camera_location,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
                "similarityScore": round(best_sim, 3),
                "confidenceTier": tier,
                "trackingId": tracking_id,
                "boundingBox": box,
                "faceQuality": face["quality"],
                "status": "Pending Review",
                "notes": f"Real-time face detection on {camera_name}. Neural feature similarity {round(best_sim * 100, 1)}%."
            })
            
    return {
        "success": True,
        "faces_detected": len(faces),
        "matches_found": len(matched_events),
        "candidate_matches": matched_events,
        "disclaimer": "Experimental generic image-feature similarities are unverified candidate leads, not face-recognition results or confirmed identities."
    }

@app.post("/api/ai/analyze-video")
async def analyze_video(
    case_id: Optional[str] = Form("MP-2026-0001"),
    camera_id: Optional[str] = Form("CAM-01"),
    camera_name: Optional[str] = Form("Railway Station Gate 3 Feed"),
    camera_location: Optional[str] = Form("New Delhi Railway Station - Gate 3 Concourse"),
    registered_data: Optional[str] = Form("[]"),
    video: UploadFile = File(...)
):
    """
    Real video analysis pipeline:
    - Writes uploaded video file temporarily
    - Decodes video with OpenCV VideoCapture
    - Samples frames periodically (1 frame per 15 frames)
    - Detects faces, evaluates quality, extracts embeddings
    - Compares with registered missing persons
    - Generates genuine candidate matches with evidence snapshots
    """
    registered_persons = parse_registered_data(registered_data or "[]")
    temp_video_path = os.path.join(EVIDENCE_DIR, f"temp_{uuid.uuid4().hex}.video")
    await save_limited_upload(video, temp_video_path, MAX_VIDEO_BYTES)
        
    cap = cv2.VideoCapture(temp_video_path)
    if not cap.isOpened():
        if os.path.exists(temp_video_path):
            os.remove(temp_video_path)
        raise HTTPException(status_code=400, detail="Cannot read video stream format.")
        
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    
    frames_analyzed = 0
    faces_detected_count = 0
    sample_rate = max(1, int(fps / 2)) # Sample 2 frames per second
    
    potential_matches = []
    frame_idx = 0
    
    while cap.isOpened():
        ret, frame_bgr = cap.read()
        if not ret:
            break
            
        if frame_idx % sample_rate == 0:
            frames_analyzed += 1
            faces = detect_faces_in_bgr(frame_bgr)
            faces_detected_count += len(faces)
            
            for face in faces:
                emb = extract_resnet_embedding(face["crop"])
                
                # Check match against target case or all registered cases
                for person in registered_persons:
                    if case_id and person.get("case_id") != case_id:
                        continue
                        
                    p_emb = person.get("embedding", [])
                    if len(p_emb) == 512:
                        sim = compute_cosine_similarity(emb, p_emb)
                        if sim >= 0.65 and len(potential_matches) < 5:
                            # Candidate match found in video
                            tier = "HIGH" if sim >= 0.85 else "MEDIUM"
                            match_uid = f"MATCH-VID-{int(time.time()) % 10000:04d}-{len(potential_matches)+1}"
                            tracking_id = f"TRACK-{int(time.time()) % 1000:03d}"
                            
                            # Draw bounding box
                            box = face["box"]
                            x, y, bw, bh = box["x"], box["y"], box["width"], box["height"]
                            evidence_img = frame_bgr.copy()
                            cv2.rectangle(evidence_img, (x, y), (x + bw, y + bh), (0, 200, 255), 3)
                            label = f"{person['name']} ({round(sim * 100, 1)}%)"
                            cv2.rectangle(evidence_img, (x, max(0, y - 28)), (x + len(label) * 11, max(0, y)), (0, 200, 255), -1)
                            cv2.putText(evidence_img, label, (x + 4, max(18, y - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (15, 23, 42), 2)
                            
                            ev_file = f"evd-vid-{match_uid}.jpg"
                            cv2.imwrite(os.path.join(EVIDENCE_DIR, ev_file), evidence_img)
                            
                            sec = int(frame_idx / fps)
                            timestamp_str = f"{sec // 60:02d}:{sec % 60:02d}"
                            
                            potential_matches.append({
                                "matchId": match_uid,
                                "caseId": person["case_id"],
                                "missingPersonName": person["name"],
                                "missingPersonPhoto": person.get("photo_url", ""),
                                "detectedFrameUrl": f"/uploads/evidence/{ev_file}",
                                "cameraId": camera_id,
                                "cameraName": camera_name,
                                "location": camera_location,
                                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
                                "similarityScore": round(sim, 3),
                                "confidenceTier": tier,
                                "trackingId": tracking_id,
                                "videoTimestamp": timestamp_str,
                                "boundingBox": box,
                                "faceQuality": face["quality"],
                                "status": "Pending Review",
                                "notes": f"Video detection checkpoint at {timestamp_str}. Similarity: {round(sim*100, 1)}%."
                            })
                            
        frame_idx += 1
        
    cap.release()
    if os.path.exists(temp_video_path):
        os.remove(temp_video_path)
        
    # If video had no match, provide an informative result
    # This service samples frames independently and does not implement cross-frame tracking.
    tracks_created = 0
    
    return {
        "success": True,
        "filename": video.filename,
        "case_id": case_id,
        "camera_id": camera_id,
        "frames_analyzed": frames_analyzed,
        "faces_detected": faces_detected_count,
        "tracks_created": tracks_created,
        "potential_matches": potential_matches,
    "disclaimer": "Experimental generic image-feature similarities are unverified candidate leads, not face-recognition results or confirmed identities."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
