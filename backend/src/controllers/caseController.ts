import { Request, Response } from 'express';
import { memoryStore } from '../store/memoryStore';
import { AuthRequest } from '../middleware/authMiddleware';

export const getCases = async (req: Request, res: Response) => {
  try {
    const { search, status, priority, gender, ageMin, ageMax, page = 1, limit = 10 } = req.query;

    let filtered = [...memoryStore.cases];

    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(
        c => c.name.toLowerCase().includes(q) ||
             c.caseId.toLowerCase().includes(q) ||
             c.lastSeenLocation.toLowerCase().includes(q)
      );
    }

    if (status && status !== 'All') {
      filtered = filtered.filter(c => c.status === status);
    }

    if (priority && priority !== 'All') {
      filtered = filtered.filter(c => c.priority === priority);
    }

    if (gender && gender !== 'All') {
      filtered = filtered.filter(c => c.gender === gender);
    }

    if (ageMin) {
      filtered = filtered.filter(c => c.age >= Number(ageMin));
    }
    if (ageMax) {
      filtered = filtered.filter(c => c.age <= Number(ageMax));
    }

    const startIndex = (Number(page) - 1) * Number(limit);
    const paginated = filtered.slice(startIndex, startIndex + Number(limit));

    return res.json({
      success: true,
      total: filtered.length,
      page: Number(page),
      limit: Number(limit),
      cases: paginated
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCaseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const caseItem = memoryStore.cases.find(c => c.caseId === id || c._id === id);

    if (!caseItem) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    // Get related potential matches
    const relatedMatches = memoryStore.matches.filter(m => m.caseId === caseItem.caseId);
    // Get timeline events
    const timelineEvents = memoryStore.timeline.filter(t => t.caseId === caseItem.caseId);

    return res.json({
      success: true,
      case: caseItem,
      matches: relatedMatches,
      timeline: timelineEvents
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createCase = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name, age, gender, height, weight, hairColor, eyeColor,
      distinguishingFeatures, lastSeenDate, lastSeenTime, lastSeenLocation,
      description, clothingDescription, priority, contactAuthority, contactNumber, photos
    } = req.body;

    if (!name || !age || !gender || !lastSeenDate || !lastSeenLocation) {
      return res.status(400).json({
        success: false,
        message: 'Name, age, gender, last seen date, and location are required fields.'
      });
    }

    const nextIdNum = memoryStore.cases.length + 1;
    const caseId = `MP-2026-${String(nextIdNum).padStart(4, '0')}`;

    const newCase = {
      caseId,
      name,
      age: Number(age),
      gender,
      height: height || '5 ft 7 in',
      weight: weight || '60 kg',
      hairColor: hairColor || 'Black',
      eyeColor: eyeColor || 'Brown',
      distinguishingFeatures: distinguishingFeatures || 'None noted',
      lastSeenDate,
      lastSeenTime: lastSeenTime || '12:00',
      lastSeenLocation,
      latitude: 28.6139 + (Math.random() * 0.05 - 0.025),
      longitude: 77.2090 + (Math.random() * 0.05 - 0.025),
      description: description || 'Missing person case reported to ReturnHome portal.',
      clothingDescription: clothingDescription || 'Dark jacket and trousers',
      status: 'Active',
      priority: priority || 'High',
      photos: Array.isArray(photos) && photos.length > 0 ? photos : [
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80'
      ],
      contactAuthority: contactAuthority || 'ReturnHome Investigation Bureau',
      contactNumber: contactNumber || '+91-11-23410000',
      createdBy: req.user?.name || 'Investigator Officer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    memoryStore.cases.unshift(newCase);

    // Record initial timeline event
    memoryStore.timeline.unshift({
      id: `evt-${Date.now()}`,
      caseId,
      timestamp: new Date().toISOString(),
      user: req.user?.name || 'Investigator Officer',
      action: 'Case Registered',
      description: `New missing person profile registered for ${name} (${caseId}).`
    });

    // Record Audit Log
    memoryStore.auditLogs.unshift({
      id: `log-${Date.now()}`,
      userId: req.user?.id || 'usr-admin-1',
      userName: req.user?.name || 'Inspector Vikram Singh',
      userRole: req.user?.role || 'Admin',
      action: 'CASE_CREATE',
      resource: 'Cases',
      resourceId: caseId,
      ipAddress: req.ip || '127.0.0.1',
      details: `Created missing person case ${caseId} for ${name}.`,
      timestamp: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      case: newCase,
      message: `Case ${caseId} registered successfully in ReturnHome.`
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCase = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const caseIndex = memoryStore.cases.findIndex(c => c.caseId === id || c._id === id);

    if (caseIndex === -1) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    const currentCase = memoryStore.cases[caseIndex];
    const updatedCase = {
      ...currentCase,
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    memoryStore.cases[caseIndex] = updatedCase;

    // Timeline event if status changed
    if (req.body.status && req.body.status !== currentCase.status) {
      memoryStore.timeline.unshift({
        id: `evt-${Date.now()}`,
        caseId: currentCase.caseId,
        timestamp: new Date().toISOString(),
        user: req.user?.name || 'Investigator Officer',
        action: 'Case Status Changed',
        description: `Case status updated from '${currentCase.status}' to '${req.body.status}'.`
      });
    }

    // Audit Log
    memoryStore.auditLogs.unshift({
      id: `log-${Date.now()}`,
      userId: req.user?.id || 'usr-admin-1',
      userName: req.user?.name || 'Inspector Vikram Singh',
      userRole: req.user?.role || 'Admin',
      action: 'CASE_UPDATE',
      resource: 'Cases',
      resourceId: currentCase.caseId,
      ipAddress: req.ip || '127.0.0.1',
      details: `Updated details for case ${currentCase.caseId}.`,
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      case: updatedCase,
      message: 'Case updated successfully.'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
