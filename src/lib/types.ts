export type UserRole = 'admin' | 'member' | 'crew'

export interface Tour {
  id: string
  name: string
  band_tag: string | null
  created_at: string
  invite_code_band: string | null
  invite_code_artist: string | null
  invite_code_crew: string | null
  band_logo_url: string | null
  shows?: Show[]
}

export interface Show {
  id: string
  tour_id: string
  date: string
  venue_name: string
  city: string
  capacity: number | null
  soundcheck_time: string | null
  soundcheck_duration: number | null
  show_time: string | null
  show_duration: number | null
  has_screen: boolean
  screen_resolution: string | null
  hotel_name: string | null
  hotel_address: string | null
  hotel_lat: number | null
  hotel_lng: number | null
  hotel_phone: string | null
  notes: string | null
  color: string | null
  check_type: 'soundcheck' | 'linecheck' | null
  venue_address: string | null
  venue_lat: number | null
  venue_lng: number | null
  status: 'confirmado' | 'pendiente' | 'cancelado'
  created_at: string
  contacts?: Contact[]
  schedule_items?: ScheduleItem[]
  documents?: Document[]
}

export interface Contact {
  id: string
  show_id: string
  role: string | null
  name: string
  email: string | null
  phone: string | null
}

export interface ScheduleItem {
  id: string
  show_id: string
  time_start: string
  time_end: string | null
  title: string
  subtitle: string | null
  order_index: number | null
  contact_id: string | null
  location_address: string | null
  location_lat: number | null
  location_lng: number | null
}

export interface Document {
  id: string
  show_id: string
  type: 'rider' | 'setlist' | 'ticket' | 'other'
  label: string | null
  url: string | null
  order_index: number | null
  created_at: string
}

export interface NoteAttachment {
  id: string
  show_id: string
  file_name: string
  file_url: string
  file_type: 'image' | 'pdf'
  created_at: string
}

export interface Profile {
  id: string
  full_name: string | null
  role: UserRole
  username: string | null
  avatar_url: string | null
  band: string | null
  bio: string | null
}

export interface TravelDay {
  id: string
  show_id: string
  date: string
  direction: 'before' | 'after'
  destination: string | null
  created_at: string
}

export interface TravelScheduleItem {
  id: string
  travel_day_id: string
  time_start: string
  time_end: string | null
  title: string
  subtitle: string | null
  order_index: number | null
  created_at: string
}

export interface TravelDocument {
  id: string
  travel_day_id: string
  label: string | null
  url: string | null
  file_type: 'pdf' | 'link' | null
  created_at: string
}

export interface TourMember {
  id: string
  tour_id: string
  user_id: string
  role: 'owner' | 'admin' | 'band' | 'artist' | 'crew'
  created_at: string
  profiles?: {
    id: string
    full_name: string | null
    username: string | null
    avatar_url: string | null
  }
}

export interface TicketVisibility {
  id: string
  document_id: string
  user_id: string
}

export interface ScheduleVisibility {
  id: string
  schedule_item_id: string
  user_id: string
}

export const TOUR_COLORS = ['#A4B2DA', '#A99F49', '#DC412C', '#B090F5', '#D0B53C']
