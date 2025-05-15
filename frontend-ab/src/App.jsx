import './App.css';
import React from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CalendarEventCreator from './pages/CalendarEventCreater';

function App() {
  const supabase = useSupabaseClient();

  
  return (
    <Router> 
      
      <Routes> 
        <Route path="/" element={<CalendarEventCreator />} />
      </Routes>
    </Router>
  );
}

export default App;
