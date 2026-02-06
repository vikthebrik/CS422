import { useState, useEffect } from 'react';

// Define event interface
interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  club_id: string;
}

function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use environment variable for API URL or default to localhost
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

  useEffect(() => {
    fetch(`${API_URL}/events`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setEvents(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching events:", err);
        setError("Failed to load events.");
        setLoading(false);
      });
  }, [API_URL]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">MCC Scheduler Events</h1>

        {loading && <p className="text-gray-500">Loading events...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && events.length === 0 && (
          <p className="text-gray-500">No events found.</p>
        )}

        <div className="grid gap-6">
          {events.map(event => (
            <div key={event.id || event.start_time} className="bg-white shadow rounded-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">{event.title}</h2>
              <p className="text-sm text-gray-500 mb-2">
                {new Date(event.start_time).toLocaleString()} - {new Date(event.end_time).toLocaleTimeString()}
              </p>
              <p className="text-gray-600 mb-2">{event.location}</p>
              <div className="text-gray-700 whitespace-pre-wrap">{event.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App
