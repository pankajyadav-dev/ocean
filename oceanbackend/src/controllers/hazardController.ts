import { Response, Request } from 'express';
import HazardReport from '../models/HazardReport';
import { AuthRequest } from '../middleware/auth';
import { sendHazardNotificationEmail } from '../services/emailService';
import EmailNotification from '../models/EmailNotification';
import NewsArticle from '../models/NewsArticle';
import { io } from '../index';
import { notifyNearbyUsers } from '../services/notificationService';

export const createHazardReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    const { type, location, severity, description } = req.body;
    
    // Handle image upload - if file was uploaded, use the file path
    // Otherwise, use imageUrl from body (for backward compatibility)
    let imageUrl = '';
    if (req.file) {
      // File was uploaded via multer
      imageUrl = `/uploads/hazards/${req.file.filename}`;
      console.log('Image uploaded:', imageUrl);
    } else if (req.body.imageUrl) {
      // Fallback to imageUrl from body (for base64 or external URLs)
      imageUrl = req.body.imageUrl;
    }

    // Parse location if it's a string (from FormData)
    let locationObj: { lat: number; lng: number };
    if (typeof location === 'string') {
      try {
        locationObj = JSON.parse(location);
        console.log('Parsed location from string:', locationObj);
      } catch (e) {
        console.error('Failed to parse location string:', location, e);
        // If parsing fails, location might be in separate lat/lng fields
        const lat = parseFloat(req.body['location[lat]'] || req.body.lat || '0');
        const lng = parseFloat(req.body['location[lng]'] || req.body.lng || '0');
        locationObj = { lat, lng };
        console.log('Using fallback location:', locationObj);
      }
    } else if (location && typeof location === 'object') {
      locationObj = location;
    } else {
      // Try to get from body fields
      const lat = parseFloat(req.body['location[lat]'] || req.body.lat || '0');
      const lng = parseFloat(req.body['location[lng]'] || req.body.lng || '0');
      locationObj = { lat, lng };
      console.log('Using body fields for location:', locationObj);
    }

    // Validate location
    if (!locationObj || typeof locationObj.lat !== 'number' || typeof locationObj.lng !== 'number') {
      res.status(400).json({ message: 'Invalid location data' });
      return;
    }

    const hazardReport = await HazardReport.create({
      type,
      location: locationObj,
      severity: typeof severity === 'string' ? parseInt(severity) : severity,
      description: description || '',
      imageUrl: imageUrl || '',
      reportedBy: req.user!._id,
    });

    // Check if email has already been sent for a similar disaster in the same location
    // We consider it the same disaster if:
    // 1. Same type
    // 2. Within 0.1 degrees (approximately 11km) of the same location
    const existingNotification = await EmailNotification.findOne({
      type: type,
      'location.lat': { $gte: locationObj.lat - 0.1, $lte: locationObj.lat + 0.1 },
      'location.lng': { $gte: locationObj.lng - 0.1, $lte: locationObj.lng + 0.1 },
      emailSent: true,
    });

    if (!existingNotification) {
      // Send email notification to ocean authority
      const reportedBy = req.user!.name || req.user!.email || 'Unknown User';
      const emailSent = await sendHazardNotificationEmail({
        type,
        location: locationObj,
        severity,
        description,
        reportedBy,
        reportId: String(hazardReport._id),
      });

      // Record the email notification
      await EmailNotification.create({
        reportId: hazardReport._id,
        type,
        location: locationObj,
        emailSent,
      });

      if (emailSent) {
        console.log(`✅ Email notification sent for hazard report ${hazardReport._id}`);
      } else {
        console.warn(`❌ Failed to send email notification for hazard report ${hazardReport._id}`);
        console.warn('   Check the error messages above for details on how to fix the email configuration');
      }
    } else {
      console.log(`Skipping email notification - similar disaster already reported at this location (Report ID: ${existingNotification.reportId})`);
    }

    // Create a news article from this hazard report
    try {
      const severityLabels: { [key: number]: string } = {
        1: 'Low',
        2: 'Low',
        3: 'Low',
        4: 'Medium',
        5: 'Medium',
        6: 'Medium',
        7: 'High',
        8: 'High',
        9: 'Critical',
        10: 'Critical',
      };
      
      const severityLabel = severityLabels[severity] || 'Medium';
      const reporterName = typeof req.user === 'object' && req.user ? (req.user.name || req.user.email || 'Anonymous') : 'Anonymous';
      
      // Generate news title and summary
      const title = `${severityLabel} Severity ${type} Reported at ${locationObj.lat.toFixed(2)}°N, ${locationObj.lng.toFixed(2)}°W`;
      const summary = description 
        ? `${type} of ${severityLabel.toLowerCase()} severity has been reported. ${description}`
        : `A ${severityLabel.toLowerCase()} severity ${type.toLowerCase()} has been reported in the ocean. Location: ${locationObj.lat.toFixed(4)}°N, ${locationObj.lng.toFixed(4)}°W. Reported by ${reporterName}.`;
      
      // Create news article linked to the hazard report
      await NewsArticle.create({
        title,
        summary,
        imageUrl: imageUrl || 'https://picsum.photos/seed/hazard/400/300',
        category: type,
        date: new Date(),
        source: 'hazard-report',
        verificationStatus: 'unverified',
        hazardReportId: hazardReport._id,
      });
      
      console.log(`News article created for hazard report ${hazardReport._id}`);
    } catch (newsError: any) {
      // Don't fail the report creation if news article creation fails
      console.error('Error creating news article:', newsError);
    }

    // Emit Socket.io event for real-time notifications
    io.emit('hazard-reported', {
      id: hazardReport._id,
      type: hazardReport.type,
      location: hazardReport.location,
      severity: hazardReport.severity,
      description: hazardReport.description,
      imageUrl: hazardReport.imageUrl,
      reportedAt: hazardReport.createdAt
    });
    console.log(`Socket.io event emitted for hazard ${hazardReport._id}`);

    // Send notifications to nearby users (within 10km)
    try {
      const notificationResult = await notifyNearbyUsers({
        title: `${type} Reported Nearby`,
        description: description || `A ${type.toLowerCase()} has been reported in your area.`,
        location: {
          type: 'Point',
          coordinates: [locationObj.lng, locationObj.lat]
        },
        severity: severity.toString(),
        hazardType: type
      }, 10000); // 10km radius

      console.log(`Notified ${notificationResult.notifiedCount} nearby users`);
    } catch (notificationError: any) {
      console.error('Error sending nearby user notifications:', notificationError);
      // Don't fail the hazard report if notification fails
    }

    res.status(201).json({
      message: 'Hazard report created successfully',
      data: hazardReport,
    });
  } catch (error: any) {
    console.error('Error creating hazard report:', error);
    res.status(500).json({ message: error.message || 'Error creating hazard report' });
  }
};

export const getHazardReports = async (req: Request | AuthRequest, res: Response): Promise<void> => {
    try {
        const { type, verified, limit = 100, skip = 0, userId } = req.query;

        const filter: any = {};
        if (type) filter.type = type;
        if (verified !== undefined) filter.verified = verified === 'true';
        if (userId) filter.reportedBy = userId;

        const reports = await HazardReport.find(filter)
            .populate('reportedBy', 'name email')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip(Number(skip));

        const total = await HazardReport.countDocuments(filter);

        res.status(200).json({
            message: 'Hazard reports retrieved successfully',
            data: reports,
            total,
            limit: Number(limit),
            skip: Number(skip),
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error retrieving hazard reports' });
    }
};

export const getHazardReportById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const report = await HazardReport.findById(id).populate('reportedBy', 'name email');

    if (!report) {
      res.status(404).json({ message: 'Hazard report not found' });
      return;
    }

    res.status(200).json({
      message: 'Hazard report retrieved successfully',
      data: report,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error retrieving hazard report' });
  }
};

export const updateHazardReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { verified, severity, description } = req.body;

    const report = await HazardReport.findById(id);

    if (!report) {
      res.status(404).json({ message: 'Hazard report not found' });
      return;
    }

    // Only allow updating verified status and other fields
    if (verified !== undefined) report.verified = verified;
    if (severity !== undefined) report.severity = severity;
    if (description !== undefined) report.description = description;

    await report.save();

    res.status(200).json({
      message: 'Hazard report updated successfully',
      data: report,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error updating hazard report' });
  }
};

export const deleteHazardReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const report = await HazardReport.findByIdAndDelete(id);

    if (!report) {
      res.status(404).json({ message: 'Hazard report not found' });
      return;
    }

    res.status(200).json({
      message: 'Hazard report deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error deleting hazard report' });
  }
};

