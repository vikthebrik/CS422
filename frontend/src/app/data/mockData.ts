import { Event, Club, User, CollabEvent } from '../types';

export const clubs: Club[] = [
  { 
    id: 'saca', 
    name: 'SACA', 
    color: '#FF6B6B', 
    outlookLink: 'https://outlook.example.com/saca',
    description: 'Student Alliance for Cultural Awareness promotes cultural diversity and understanding.',
    instagram: 'https://instagram.com/saca_uo',
    linktree: 'https://linktr.ee/saca_uo',
    engage: 'https://engage.uoregon.edu/saca'
  },
  { 
    id: 'msa', 
    name: 'MSA', 
    color: '#4ECDC4', 
    outlookLink: 'https://outlook.example.com/msa',
    description: 'Muslim Student Association fosters Islamic awareness and community.',
    instagram: 'https://instagram.com/msa_uo',
    linktree: 'https://linktr.ee/msa_uo',
    engage: 'https://engage.uoregon.edu/msa'
  },
  { 
    id: 'vsa', 
    name: 'VSA', 
    color: '#95E1D3', 
    outlookLink: 'https://outlook.example.com/vsa',
    description: 'Vietnamese Student Association celebrates Vietnamese culture and heritage.',
    instagram: 'https://instagram.com/vsa_uo',
    linktree: 'https://linktr.ee/vsa_uo',
    engage: 'https://engage.uoregon.edu/vsa'
  },
  { 
    id: 'bsu', 
    name: 'BSU', 
    color: '#F3A683', 
    outlookLink: 'https://outlook.example.com/bsu',
    description: 'Black Student Union advocates for Black students and promotes cultural awareness.',
    instagram: 'https://instagram.com/bsu_uo',
    linktree: 'https://linktr.ee/bsu_uo',
    engage: 'https://engage.uoregon.edu/bsu'
  },
  { 
    id: 'lsu', 
    name: 'LSU', 
    color: '#786FA6', 
    outlookLink: 'https://outlook.example.com/lsu',
    description: 'Latin Student Union celebrates Latin American culture and supports Latinx students.',
    instagram: 'https://instagram.com/lsu_uo',
    linktree: 'https://linktr.ee/lsu_uo',
    engage: 'https://engage.uoregon.edu/lsu'
  },
  { 
    id: 'aasu', 
    name: 'AASU', 
    color: '#F8B500', 
    outlookLink: 'https://outlook.example.com/aasu',
    description: 'Asian American Student Union promotes Asian American culture and community.',
    instagram: 'https://instagram.com/aasu_uo',
    linktree: 'https://linktr.ee/aasu_uo',
    engage: 'https://engage.uoregon.edu/aasu'
  },
];

export const events: Event[] = [
  {
    id: '1',
    title: 'General Meeting',
    description: 'Monthly general meeting to discuss upcoming events and initiatives.',
    location: 'EMU Room 301',
    startTime: new Date(2026, 1, 10, 18, 0),
    endTime: new Date(2026, 1, 10, 19, 30),
    clubId: 'saca',
    eventType: 'Meeting',
    color: '#FF6B6B'
  },
  {
    id: '2',
    title: 'Lunar New Year Celebration',
    description: 'Join us for a celebration of the Lunar New Year with traditional food, performances, and activities.',
    location: 'EMU Ballroom',
    startTime: new Date(2026, 1, 15, 17, 0),
    endTime: new Date(2026, 1, 15, 20, 0),
    clubId: 'saca',
    eventType: 'Event',
    color: '#FF6B6B'
  },
  {
    id: '3',
    title: 'Study Workshop',
    description: 'Group study session and academic support workshop.',
    location: 'Knight Library Room 201',
    startTime: new Date(2026, 1, 12, 15, 0),
    endTime: new Date(2026, 1, 12, 17, 0),
    clubId: 'msa',
    eventType: 'Event',
    color: '#4ECDC4'
  },
  {
    id: '4',
    title: 'Cultural Night',
    description: 'An evening showcasing Vietnamese culture through dance, music, and food.',
    location: 'EMU Amphitheater',
    startTime: new Date(2026, 1, 20, 18, 30),
    endTime: new Date(2026, 1, 20, 21, 0),
    clubId: 'vsa',
    eventType: 'Event',
    color: '#95E1D3'
  },
  {
    id: '5',
    title: 'Community Service Day',
    description: 'Volunteer at local community centers and give back to the community.',
    location: 'Various Locations',
    startTime: new Date(2026, 1, 14, 9, 0),
    endTime: new Date(2026, 1, 14, 14, 0),
    clubId: 'bsu',
    eventType: 'Event',
    color: '#F3A683'
  },
  {
    id: '6',
    title: 'Film Screening',
    description: 'Watch and discuss contemporary Latin American cinema.',
    location: 'EMU Cinema',
    startTime: new Date(2026, 1, 18, 19, 0),
    endTime: new Date(2026, 1, 18, 21, 30),
    clubId: 'lsu',
    eventType: 'Event',
    color: '#786FA6'
  },
  {
    id: '7',
    title: 'Leadership Workshop',
    description: 'Professional development workshop focused on leadership skills.',
    location: 'MCC Conference Room',
    startTime: new Date(2026, 1, 11, 16, 0),
    endTime: new Date(2026, 1, 11, 18, 0),
    clubId: 'aasu',
    eventType: 'Event',
    color: '#F8B500'
  },
  {
    id: '8',
    title: 'Office Hours with President',
    description: 'Drop-in office hours to speak with club leadership.',
    location: 'MCC Room 101',
    startTime: new Date(2026, 1, 25, 14, 0),
    endTime: new Date(2026, 1, 25, 16, 0),
    clubId: 'msa',
    eventType: 'Office Hours',
    color: '#4ECDC4'
  },
  {
    id: '9',
    title: 'Coffee Social',
    description: 'Informal gathering to meet new members and socialize.',
    location: 'Starbucks EMU',
    startTime: new Date(2026, 1, 13, 14, 0),
    endTime: new Date(2026, 1, 13, 15, 30),
    clubId: 'vsa',
    eventType: 'Event',
    color: '#95E1D3'
  },
  {
    id: '10',
    title: 'Panel Discussion',
    description: 'Panel on diversity and inclusion in higher education.',
    location: 'EMU Room 204',
    startTime: new Date(2026, 1, 17, 17, 0),
    endTime: new Date(2026, 1, 17, 19, 0),
    clubId: 'bsu',
    eventType: 'Other',
    color: '#F3A683'
  },
  // Overlapping events with existing ones
  {
    id: '11',
    title: 'Board Meeting',
    description: 'Executive board meeting to plan spring semester events.',
    location: 'MCC Room 102',
    startTime: new Date(2026, 1, 10, 18, 30), // Overlaps with SACA General Meeting
    endTime: new Date(2026, 1, 10, 20, 0),
    clubId: 'msa',
    eventType: 'Meeting',
    color: '#4ECDC4'
  },
  {
    id: '12',
    title: 'Potluck Dinner',
    description: 'Bring your favorite dish and share with the community.',
    location: 'EMU Room 305',
    startTime: new Date(2026, 1, 10, 17, 30), // Overlaps with SACA General Meeting
    endTime: new Date(2026, 1, 10, 19, 0),
    clubId: 'lsu',
    eventType: 'Event',
    color: '#786FA6'
  },
  {
    id: '13',
    title: 'Asian Heritage Workshop',
    description: 'Learn about Asian heritage and contemporary issues.',
    location: 'EMU Room 401',
    startTime: new Date(2026, 1, 15, 17, 30), // Overlaps with Lunar New Year Celebration
    endTime: new Date(2026, 1, 15, 19, 30),
    clubId: 'aasu',
    eventType: 'Event',
    color: '#F8B500'
  },
  {
    id: '14',
    title: 'Poetry Reading',
    description: 'Open mic night featuring student poetry and spoken word.',
    location: 'MCC Main Space',
    startTime: new Date(2026, 1, 15, 18, 0), // Overlaps with Lunar New Year Celebration
    endTime: new Date(2026, 1, 15, 20, 30),
    clubId: 'bsu',
    eventType: 'Event',
    color: '#F3A683'
  },
  {
    id: '15',
    title: 'Study Group',
    description: 'Weekly study group for midterm preparation.',
    location: 'Knight Library Room 150',
    startTime: new Date(2026, 1, 12, 15, 30), // Overlaps with Study Workshop
    endTime: new Date(2026, 1, 12, 17, 30),
    clubId: 'saca',
    eventType: 'Event',
    color: '#FF6B6B'
  },
  {
    id: '16',
    title: 'Member Orientation',
    description: 'Orientation for new members joining this semester.',
    location: 'EMU Room 302',
    startTime: new Date(2026, 1, 12, 14, 30), // Overlaps with Study Workshop
    endTime: new Date(2026, 1, 12, 16, 0),
    clubId: 'vsa',
    eventType: 'Meeting',
    color: '#95E1D3'
  },
  {
    id: '17',
    title: 'Karaoke Night',
    description: 'Sing your heart out at our weekly karaoke social.',
    location: 'EMU Game Room',
    startTime: new Date(2026, 1, 20, 19, 0), // Overlaps with Cultural Night
    endTime: new Date(2026, 1, 20, 22, 0),
    clubId: 'aasu',
    eventType: 'Event',
    color: '#F8B500'
  },
  {
    id: '18',
    title: 'Documentary Screening',
    description: 'Screening of award-winning documentary on social justice.',
    location: 'EMU Room 206',
    startTime: new Date(2026, 1, 18, 19, 30), // Overlaps with Film Screening
    endTime: new Date(2026, 1, 18, 21, 0),
    clubId: 'msa',
    eventType: 'Event',
    color: '#4ECDC4'
  },
  {
    id: '19',
    title: 'Game Night',
    description: 'Board games, card games, and fun competitions.',
    location: 'MCC Lounge',
    startTime: new Date(2026, 1, 18, 18, 30), // Overlaps with Film Screening
    endTime: new Date(2026, 1, 18, 21, 30),
    clubId: 'saca',
    eventType: 'Event',
    color: '#FF6B6B'
  }
];

export const users: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@uoregon.edu', role: 'admin' },
  { id: '2', name: 'SACA President', email: 'saca@uoregon.edu', role: 'club_officer', clubId: 'saca' },
  { id: '3', name: 'Student User', email: 'student@uoregon.edu', role: 'student' }
];

export const collabEvents: CollabEvent[] = [
  {
    id: 'c1',
    title: 'Multicultural Food Festival',
    partnerClubs: ['saca', 'vsa', 'msa'],
    status: 'pending',
    proposedDate: new Date(2026, 2, 5, 17, 0),
    proposedBy: 'saca',
    type: 'club'
  },
  {
    id: 'c2',
    title: 'Heritage Month Celebration',
    partnerClubs: ['bsu', 'lsu'],
    status: 'approved',
    proposedDate: new Date(2026, 1, 28, 18, 0),
    proposedBy: 'bsu',
    type: 'club',
    eventId: '5'  // Links to Community Service Day event
  },
  {
    id: 'c3',
    title: 'Cross-Center Student Leadership Summit',
    partnerClubs: [],
    status: 'pending',
    proposedDate: new Date(2026, 2, 15, 10, 0),
    proposedBy: 'mcc',
    type: 'center',
    partnerCenter: 'Women\'s Center'
  },
  {
    id: 'c4',
    title: 'Unity Week Planning',
    partnerClubs: [],
    status: 'approved',
    proposedDate: new Date(2026, 3, 1, 14, 0),
    proposedBy: 'mcc',
    type: 'center',
    partnerCenter: 'LGBTQ+ Center',
    eventId: '7'  // Links to Leadership Workshop event
  }
];