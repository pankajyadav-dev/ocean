import User from '../models/User';
import { sendEmail } from './emailService';
import twilio from 'twilio';
import axios from 'axios';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER; // Format: whatsapp:+14155238886

const twilioClient = accountSid && authToken ? twilio(accountSid, authToken) : null;

/**
 * Get human-readable address from coordinates using reverse geocoding
 */
const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'OceanGuard-App/1.0'
        }
      }
    );

    if (response.data && response.data.display_name) {
      return response.data.display_name;
    }
    return `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
  } catch (error) {
    console.error('Error getting address from coordinates:', error);
    return `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
  }
};

interface HazardNotificationData {
  title: string;
  description: string;
  location: {
    type: string;
    coordinates: number[];
  };
  severity: string;
  hazardType: string;
}

/**
 * Find users within a specified radius (in meters) from a given location
 * Uses MongoDB geospatial queries with $near operator
 */
export const findNearbyUsers = async (
  location: { type: string; coordinates: number[] },
  radiusInMeters: number = 10000 // Default 10km
) => {
  try {
    const nearbyUsers = await User.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: location.coordinates
          },
          $maxDistance: radiusInMeters
        }
      }
    }).select('name email phone location');

    return nearbyUsers;
  } catch (error) {
    console.error('Error finding nearby users:', error);
    return [];
  }
};

/**
 * Send email notification to a user about a nearby hazard
 */
export const sendHazardEmailNotification = async (
  userEmail: string,
  userName: string,
  hazard: HazardNotificationData
) => {
  try {
    const [lng, lat] = hazard.location.coordinates;
    const address = await getAddressFromCoordinates(lat, lng);
    const googleMapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
    
    const subject = `⚠️ Ocean Hazard Alert: ${hazard.title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">🌊 Ocean Hazard Alert</h2>
        <p>Hello ${userName},</p>
        <p>A new ocean hazard has been reported near your location:</p>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #991b1b;">${hazard.title}</h3>
          <p><strong>Type:</strong> ${hazard.hazardType}</p>
          <p><strong>Severity:</strong> ${hazard.severity}</p>
          <p><strong>Description:</strong> ${hazard.description}</p>
          <p><strong>Location:</strong> ${address}</p>
          <p style="font-size: 12px; color: #6b7280;">Coordinates: ${lat.toFixed(4)}°, ${lng.toFixed(4)}°</p>
          <p><a href="${googleMapsLink}" style="color: #2563eb;">📍 View on Google Maps</a></p>
        </div>
        
        <p>Please exercise caution in the affected area. Stay safe!</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">
          This is an automated alert from OceanGuard. You received this because you are within 10km of the reported hazard.
        </p>
      </div>
    `;

    await sendEmail(userEmail, subject, html);
    console.log(`Email notification sent to ${userEmail}`);
  } catch (error) {
    console.error(`Failed to send email to ${userEmail}:`, error);
  }
};

/**
 * Send WhatsApp notification to a user about a nearby hazard
 * Requires Twilio account with WhatsApp enabled
 */
export const sendHazardWhatsAppNotification = async (
  userPhone: string,
  userName: string,
  hazard: HazardNotificationData
) => {
  if (!twilioClient) {
    console.warn('Twilio client not configured. Skipping WhatsApp notification.');
    return;
  }

  if (!twilioWhatsAppNumber) {
    console.warn('Twilio WhatsApp number not configured. Skipping WhatsApp notification.');
    return;
  }

  try {
    const [lng, lat] = hazard.location.coordinates;
    const address = await getAddressFromCoordinates(lat, lng);
    const googleMapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
    
    // Format phone number for WhatsApp (must start with +)
    const formattedPhone = userPhone.startsWith('+') ? userPhone : `+${userPhone}`;
    
    const message = `🌊 *OceanGuard Hazard Alert*\n\nHello ${userName},\n\nA new ocean hazard has been reported near you:\n\n*${hazard.title}*\nType: ${hazard.hazardType}\nSeverity: ${hazard.severity}\n\n${hazard.description}\n\n📍 *Location:*\n${address}\n\n🗺️ View on map: ${googleMapsLink}\n\nPlease exercise caution. Stay safe! 🛡️`;

    await twilioClient.messages.create({
      body: message,
      from: twilioWhatsAppNumber,
      to: `whatsapp:${formattedPhone}`
    });

    console.log(`WhatsApp notification sent to ${userPhone}`);
  } catch (error) {
    console.error(`Failed to send WhatsApp to ${userPhone}:`, error);
  }
};

/**
 * Send notifications to all users within radius of a hazard
 * Sends both email and WhatsApp notifications if available
 */
export const notifyNearbyUsers = async (
  hazard: HazardNotificationData,
  radiusInMeters: number = 10000
) => {
  try {
    const nearbyUsers = await findNearbyUsers(hazard.location, radiusInMeters);
    
    console.log(`Found ${nearbyUsers.length} users within ${radiusInMeters}m of hazard`);

    const notificationPromises = nearbyUsers.map(async (user) => {
      const promises: Promise<void>[] = [];

      // Send email notification if user has email
      if (user.email) {
        promises.push(
          sendHazardEmailNotification(user.email, user.name, hazard)
        );
      }

      // Send WhatsApp notification if user has phone
      if (user.phone) {
        promises.push(
          sendHazardWhatsAppNotification(user.phone, user.name, hazard)
        );
      }

      return Promise.all(promises);
    });

    await Promise.all(notificationPromises);
    
    return {
      success: true,
      notifiedCount: nearbyUsers.length,
      users: nearbyUsers.map(u => ({ name: u.name, email: u.email }))
    };
  } catch (error) {
    console.error('Error notifying nearby users:', error);
    return {
      success: false,
      notifiedCount: 0,
      users: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
