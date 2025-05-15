import express from 'express';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const CREDENTIALS = JSON.parse(process.env.CREDENTIALS);
const calendarId = process.env.CALENDAR_ID;
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const calendar = google.calendar({ version: 'v3' });

// Validate environment variables
const requiredEnvVars = ['CREDENTIALS', 'CALENDAR_ID', 'GMEETLINK'];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

const auth = new google.auth.JWT(
  CREDENTIALS.client_email,
  null,
  CREDENTIALS.private_key,
  SCOPES
);

const insertEvent = async (event) => {
  try {
    console.log('Event object sent to Google Calendar API:', JSON.stringify(event, null, 2));
    const response = await calendar.events.insert({
      auth: auth,
      calendarId: calendarId,
      resource: event,
    });
    return response.data;
  } catch (error) {
    console.error('Error at insertEvent:', {
      message: error.message,
      code: error.code,
      details: error.errors,
    });
    throw new Error(`Failed to insert event: ${error.message}`);
  }
};

// POST /api/event
router.post('/event', async (req, res) => {
  const { summary, description, start, end, client_email } = req.body;

  if (!summary || !start?.dateTime || !end?.dateTime) {
    return res.status(400).json({ error: 'Missing required fields: summary, start.dateTime, end.dateTime' });
  }

  // Validate date/time formats
  try {
    const startDate = new Date(start.dateTime);
    const endDate = new Date(end.dateTime);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Invalid dateTime format');
    }
    if (endDate <= startDate) {
      throw new Error('End time must be after start time');
    }
  } catch (error) {
    return res.status(400).json({ error: `Invalid dateTime: ${error.message}` });
  }

  const event = {
    summary,
    description: `${description || ''}\nGoogle Meet Link: ${process.env.GMEETLINK}\nClient Email: ${client_email || 'N/A'}`,
    start: {
      dateTime: start.dateTime,
      timeZone: start.timeZone || 'Asia/Kolkata',
    },
    end: {
      dateTime: end.dateTime,
      timeZone: end.timeZone || 'Asia/Kolkata',
    },
  };

  try {
    const eventData = await insertEvent(event);
    res.status(200).json({
      message: 'Event added to calendar',
      eventId: eventData.id,
    });
  } catch (error) {
    console.error('Event creation error:', error.stack);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

export default router;