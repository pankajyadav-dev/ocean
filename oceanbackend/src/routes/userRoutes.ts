import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import HazardReport from '../models/HazardReport';
import User from '../models/User';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get current user's profile
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    // Get user's reports
    const userReports = await HazardReport.find({ reportedBy: user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const stats = {
      totalReports: userReports.length,
      verifiedReports: userReports.filter(r => r.verified).length,
      avgSeverity: userReports.length > 0
        ? userReports.reduce((sum, r) => sum + r.severity, 0) / userReports.length
        : 0,
    };

    res.status(200).json({
      message: 'Profile retrieved successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        createdAt: user.createdAt,
      },
      reports: userReports,
      stats,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error retrieving profile' });
  }
});

// Update current user's profile
router.put('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    const { name, email, phone, location } = req.body;

    // Update fields if provided
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) {
      // Validate email format
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ message: 'Invalid email format' });
        return;
      }
      updates.email = email;
    }
    if (phone !== undefined) {
      // Allow empty string to clear phone
      if (phone === '') {
        updates.phone = undefined;
      } else {
        updates.phone = phone;
      }
    }
    if (location !== undefined) {
      // Validate location format (GeoJSON Point)
      if (location && location.coordinates && Array.isArray(location.coordinates)) {
        if (location.coordinates.length !== 2) {
          res.status(400).json({ message: 'Invalid location format. Expected [lng, lat]' });
          return;
        }
        const [lng, lat] = location.coordinates;
        if (typeof lng !== 'number' || typeof lat !== 'number') {
          res.status(400).json({ message: 'Location coordinates must be numbers' });
          return;
        }
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          res.status(400).json({ message: 'Invalid latitude or longitude values' });
          return;
        }
        updates.location = {
          type: 'Point',
          coordinates: [lng, lat]
        };
      } else if (location === null || location === '') {
        // Allow clearing location
        updates.location = undefined;
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        location: updatedUser.location,
        createdAt: updatedUser.createdAt,
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error updating profile' });
  }
});

export default router;

