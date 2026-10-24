import { Request, Response } from 'express';
import { memoryStore } from '../store/memoryStore';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalCases = memoryStore.cases.length;
    const activeCases = memoryStore.cases.filter(c => c.status === 'Active' || c.status === 'Under Investigation').length;
    const potentialMatches = memoryStore.matches.filter(m => m.status === 'Pending Review').length;
    const verifiedMatches = memoryStore.matches.filter(m => m.status === 'Accepted Lead' || m.status === 'Verified').length;
    const resolvedCases = memoryStore.cases.filter(c => c.status === 'Found' || c.status === 'Closed').length;

    // Recent cases
    const recentCases = memoryStore.cases.slice(0, 5);
    // Recent potential matches
    const recentMatches = memoryStore.matches.slice(0, 5);
    // Recent activity stream
    const recentTimeline = memoryStore.timeline.slice(0, 6);

    // Chart aggregations
    const casesByStatus = [
      { name: 'Active', value: memoryStore.cases.filter(c => c.status === 'Active').length },
      { name: 'Under Investigation', value: memoryStore.cases.filter(c => c.status === 'Under Investigation').length },
      { name: 'Potential Match', value: memoryStore.cases.filter(c => c.status === 'Potential Match').length },
      { name: 'Found / Resolved', value: resolvedCases }
    ];

    const monthlyTrends = [
      { month: 'Apr', cases: 14, matches: 8 },
      { month: 'May', cases: 18, matches: 12 },
      { month: 'Jun', cases: 22, matches: 19 },
      { month: 'Jul', cases: 29, matches: 25 },
      { month: 'Aug', cases: 35, matches: 31 },
      { month: 'Sep', cases: totalCases, matches: memoryStore.matches.length }
    ];

    return res.json({
      success: true,
      stats: {
        totalCases,
        activeCases,
        potentialMatches,
        verifiedMatches,
        resolvedCases
      },
      recentCases,
      recentMatches,
      recentTimeline,
      charts: {
        casesByStatus,
        monthlyTrends
      },
      disclaimer: 'AI-generated matches are potential leads only and must be independently verified by authorized personnel.'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
