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

    const monthlyTrends = Array.from({ length: 6 }, (_, offset) => {
      const monthDate = new Date();
      monthDate.setDate(1);
      monthDate.setHours(0, 0, 0, 0);
      monthDate.setMonth(monthDate.getMonth() - (5 - offset));
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const cases = memoryStore.cases.filter((record) => {
        const created = new Date(record.createdAt);
        return created.getFullYear() === year && created.getMonth() === month;
      }).length;
      const matches = memoryStore.matches.filter((record) => {
        const created = new Date(record.createdAt);
        return created.getFullYear() === year && created.getMonth() === month;
      }).length;
      return { month: monthDate.toLocaleString('en', { month: 'short' }), cases, matches };
    });

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
      disclaimer: 'Candidate records and generic image-feature similarities are unverified suggestions, not confirmed identities or sightings.'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
