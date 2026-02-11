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

interface Club {
  id: string;
  name: string;
  markup_description?: string; // Optional if you have descriptions
  logo_url?: string; // Optional if you have logos
  ics_source_url?: string;
}

function App() {
  // Data State
  const [events, setEvents] = useState<Event[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [activeTab, setActiveTab] = useState<'events' | 'roster'>('events');
  const [selectedClubId, setSelectedClubId] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch both in parallel
        const [eventsRes, clubsRes] = await Promise.all([
          fetch(`${API_URL}/events`),
          fetch(`${API_URL}/clubs`)
        ]);

        if (!eventsRes.ok || !clubsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const eventsData = await eventsRes.json();
        const clubsData = await clubsRes.json();

        setEvents(eventsData);
        setClubs(clubsData);
      } catch (err) {
        console.error(err);
        setError("Failed to load data. Is the backend running?");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_URL]);

  // Derived State (Filtering & Sorting)
  const filteredEvents = events
    .filter(event => selectedClubId === 'all' || event.club_id === selectedClubId)
    .sort((a, b) => {
      const dateA = new Date(a.start_time).getTime();
      const dateB = new Date(b.start_time).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

  // Helper to find club name
  const getClubName = (id: string) => clubs.find(c => c.id === id)?.name || 'Unknown Club';

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Navbar / Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-indigo-600 tracking-tight">MCC Scheduler</h1>
            <nav className="flex space-x-4">
              <button
                onClick={() => setActiveTab('events')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'events' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
              >
                Events
              </button>
              <button
                onClick={() => setActiveTab('roster')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'roster' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
              >
                Club Roster
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && activeTab === 'events' && (
          <div>
            {/* Controls Toolbar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center sticky top-20 z-0">
              <div className="w-full sm:w-auto">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Filter by Club</label>
                <select
                  value={selectedClubId}
                  onChange={(e) => setSelectedClubId(e.target.value)}
                  className="block w-full sm:w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                >
                  <option value="all">All Clubs</option>
                  {clubs.map(club => (
                    <option key={club.id} value={club.id}>{club.name}</option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-auto">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Sort by Date</label>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setSortOrder('asc')}
                    className={`flex-1 sm:flex-none px-4 py-1.5 text-sm rounded-md transition-all ${sortOrder === 'asc' ? 'bg-white shadow text-indigo-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Soonest
                  </button>
                  <button
                    onClick={() => setSortOrder('desc')}
                    className={`flex-1 sm:flex-none px-4 py-1.5 text-sm rounded-md transition-all ${sortOrder === 'desc' ? 'bg-white shadow text-indigo-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Latest
                  </button>
                </div>
              </div>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                <p className="text-gray-500">No events found matching your filters.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredEvents.map(event => (
                  <div key={event.id || event.start_time} className="group bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {getClubName(event.club_id)}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">{event.title}</h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4 text-sm text-gray-500 mb-4">
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            <span>{new Date(event.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span>{new Date(event.start_time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} - {new Date(event.end_time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:col-span-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            <span>{event.location || 'TBD'}</span>
                          </div>
                        </div>

                        <div className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed border-t pt-4 border-gray-100">
                          {event.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && !error && activeTab === 'roster' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubs.map(club => (
              <div key={club.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xl mb-4 overflow-hidden">
                  {club.logo_url ? (
                    <img src={club.logo_url} alt={`${club.name} logo`} className="h-full w-full object-cover" />
                  ) : (
                    club.name.charAt(0)
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{club.name}</h3>
                {club.ics_source_url && (
                  <a href={club.ics_source_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1">
                    Source Calendar
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                  </a>
                )}
              </div>
            ))}
            {clubs.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                No clubs found.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App
