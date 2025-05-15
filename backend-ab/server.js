import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';                // <-- Import CORS
import calendarRoutes from './routes/calendar.route.js';
import sendMail from './routes/sendMail.route.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());                        // <-- Enable CORS for all origins
app.use(bodyParser.json());
app.use('/api', calendarRoutes);        // Use a consistent route prefix
app.use('/mail', sendMail);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});