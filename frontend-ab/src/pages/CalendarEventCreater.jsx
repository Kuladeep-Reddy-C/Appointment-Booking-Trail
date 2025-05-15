import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

function CalendarEventCreator() {
  const url = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  if (!url) {
    console.error('VITE_BACKEND_URL is not defined');
  }
  const GMEETLINK = import.meta.env.VITE_GMEETLINK; // Fallback static link
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  function combineDateTime(date, timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const dateObj = new Date(date);
    dateObj.setHours(hours, minutes, 0, 0);
    const offset = '+05:30';
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hoursStr = String(hours).padStart(2, '0');
    const minutesStr = String(minutes).padStart(2, '0');
    return `${year}-${month}-${day}T${hoursStr}:${minutesStr}:00${offset}`;
  }

  async function createCalendarEvent() {
    if (!eventName) {
      alert('Please enter an event name');
      return;
    }
    if (!attendeeEmail) {
      alert('Please enter your email');
      return;
    }

    const startDateTime = combineDateTime(selectedDate, startTime);
    const endDateTime = combineDateTime(selectedDate, endTime);

    // Validate end time is after start time
    const startDate = new Date(startDateTime.replace('+05:30', 'Z'));
    const endDate = new Date(endDateTime.replace('+05:30', 'Z'));
    if (endDate <= startDate) {
      alert('End time must be after start time');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const formatDate = (date) => {
      return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      });
    };

    const event = {
      summary: eventName,
      description: eventDescription,
      start: {
        dateTime: startDateTime,
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'Asia/Kolkata',
      },
      client_email: attendeeEmail, // Fixed typo
    };

    try {
      console.log('Event payload sent to backend:', JSON.stringify(event, null, 2));
      const response = await fetch(`${url}/api/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = `HTTP error ${response.status}`;
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          const text = await response.text();
          console.error('Non-JSON response:', text);
          errorMessage = `Server returned non-JSON response (Status: ${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(
          `Event "${eventName}" booked for ${formatDate(
            new Date(startDateTime.replace('+05:30', 'Z'))
          )}. Google Meet: ${GMEETLINK}`
        );
        setShowSuccessMessage(true);

        // Send email notification
        try {
          const emailResponse = await fetch(`${url}/mail/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: attendeeEmail,
              eventName,
              date: selectedDate.toLocaleDateString('en-IN'),
              timeRange: `${startTime} to ${endTime}`,
              description: eventDescription,
            }),
          });
          if (!emailResponse.ok) {
            const emailData = await emailResponse.json();
            alert('Failed to send email: ' + emailData.error);
          }
        } catch (emailError) {
          console.error('Error sending email:', emailError);
          alert('Error sending email.');
        }

        // Reset form
        setEventName('');
        setEventDescription('');
        setAttendeeEmail('');
        setTimeout(() => setShowSuccessMessage(false), 7000);
      } else {
        alert(`Error booking event: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Error booking event: ${error.message}`);
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Generate time options
  const timeOptions = Array.from({ length: 24 }, (_, hour) => [
    `${hour.toString().padStart(2, '0')}:00`,
    `${hour.toString().padStart(2, '0')}:30`,
  ]).flat();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg
              className="h-6 w-6 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xl font-bold text-indigo-700">Event Creator</span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 pt-24 pb-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Calendar Event Creator</h1>
        <p className="text-gray-600 mb-8">Book an event with the website owner</p>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          {showSuccessMessage && (
            <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-6">
              <p>{successMessage}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Select Date</h3>
              <Calendar
                onChange={setSelectedDate}
                value={selectedDate}
                locale="en-IN"
                className="max-w-full border-none rounded-lg shadow-md"
              />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Time</label>
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-lg focus:border-indigo-500"
                  >
                    {timeOptions.map((time) => (
                      <option key={`start-${time}`} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Time</label>
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-lg focus:border-indigo-500"
                  >
                    {timeOptions.map((time) => (
                      <option key={`end-${time}`} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Event Name</label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Enter event name"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-lg focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Event Description</label>
                <textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Enter event description"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-lg focus:border-indigo-500"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Your Email</label>
                <input
                  type="email"
                  value={attendeeEmail}
                  onChange={(e) => setAttendeeEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-lg focus:border-indigo-500"
                />
              </div>

              <button
                onClick={createCalendarEvent}
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-300 disabled:opacity-50"
              >
                {isLoading ? 'Booking...' : 'Book Event'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarEventCreator;