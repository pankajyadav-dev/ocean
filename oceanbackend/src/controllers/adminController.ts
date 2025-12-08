import { Request, Response } from 'express';
import HazardReport from '../models/HazardReport';
import User from '../models/User';

// Get admin dashboard stats
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [
      totalReports,
      pendingReports,
      verifiedReports,
      totalUsers,
      activeUsers,
    ] = await Promise.all([
      HazardReport.countDocuments(),
      HazardReport.countDocuments({ verificationStatus: 'unverified' }),
      HazardReport.countDocuments({ verificationStatus: 'admin-verified' }),
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
    ]);

    res.json({
      reports: {
        total: totalReports,
        pending: pendingReports,
        verified: verifiedReports,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
      },
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ message: 'Failed to get dashboard stats' });
  }
};

// Get all reports with filters
export const getAllReports = async (req: Request, res: Response) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const query: any = {};

    if (status) query.verificationStatus = status;
    if (type) query.type = type;

    const reports = await HazardReport.find(query)
      .populate('reportedBy', 'name email')
      .populate('verifiedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await HazardReport.countDocuments(query);

    res.json({
      reports,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({ message: 'Failed to get reports' });
  }
};

// Verify a report
export const verifyReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).user._id;

    const report = await HazardReport.findByIdAndUpdate(
      id,
      {
        verified: true,
        verificationStatus: 'admin-verified',
        verifiedBy: adminId,
        verifiedAt: new Date(),
      },
      { new: true }
    ).populate('reportedBy', 'name email');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json({ message: 'Report verified successfully', report });
  } catch (error) {
    console.error('Error verifying report:', error);
    res.status(500).json({ message: 'Failed to verify report' });
  }
};

// Decline a report
export const declineReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).user._id;

    // Find and populate report before deleting
    const report = await HazardReport.findById(id).populate('reportedBy', 'name email');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const reportedUser = report.reportedBy as any;
    const declineReason = reason || 'Report does not meet verification criteria';

    // Send email notification to user
    if (reportedUser && reportedUser.email) {
      try {
        const { sendEmail } = await import('../services/emailService');
        await sendEmail(
          reportedUser.email,
          'Hazard Report Declined - OceanGuard',
          `Dear ${reportedUser.name},\n\nYour hazard report has been reviewed and declined.\n\nReport Details:\nType: ${report.type}\nLocation: ${report.location.lat}, ${report.location.lng}\nSeverity: ${report.severity}/10\n\nReason for decline:\n${declineReason}\n\nIf you have any questions, please contact us.\n\nBest regards,\nOceanGuard Team`
        );
        console.log(`Decline notification sent to ${reportedUser.email}`);
      } catch (emailError) {
        console.error('Failed to send decline notification:', emailError);
      }
    }

    // Delete the report from database
    await HazardReport.findByIdAndDelete(id);

    res.json({ 
      message: 'Report declined and removed successfully',
      notificationSent: !!reportedUser?.email 
    });
  } catch (error) {
    console.error('Error declining report:', error);
    res.status(500).json({ message: 'Failed to decline report' });
  }
};

// Delete a report
export const deleteReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const report = await HazardReport.findByIdAndDelete(id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ message: 'Failed to delete report' });
  }
};

// Get all users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
};

// Update user role
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User role updated successfully', user });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Failed to update user role' });
  }
};

// Toggle user active status
export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({ 
      message: `User ${user.isActive ? 'activated' : 'suspended'} successfully`, 
      user 
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};




