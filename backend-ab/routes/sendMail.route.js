import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Validate environment variables
const requiredEnvVars = ['EMAIL_USER', 'EMAIL_PASS', 'GMEETLINK'];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// POST /api/send-email
router.post('/send-email', async (req, res) => {
  const { to, eventName, date, timeRange, description } = req.body;

  if (!to || !eventName) {
    return res.status(400).json({ error: 'Missing required fields: to, eventName' });
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `Event Confirmation: ${eventName}`,
    text: `
      Dear Attendee,

      Your event "${eventName}" has been scheduled.
      Date: ${date}
      Time: ${timeRange}
      Description: ${description || 'No description provided'}
      Google Meet Link: ${process.env.GMEETLINK}

      Regards,
      Event Creator
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', {
      message: error.message,
      code: error.code,
      response: error.response,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

export default router;