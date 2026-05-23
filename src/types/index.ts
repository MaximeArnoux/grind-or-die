export type ActivityType = 'positive' | 'negative' | 'bonus'
export type ActivityPeriod = 'daily' | 'weekly'
export type GroupRole = 'admin' | 'member'
export type RankingTimeframe = 'weekly' | 'lifetime'

export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  objectives: string | null
  height_cm: number | null
  weight_kg: number | null
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface ActivityCategory {
  id: string
  name: string
  emoji: string
  color: string
  order_index: number
}

export interface Activity {
  id: string
  name: string
  emoji: string | null
  points: number
  type: ActivityType
  category_id: string | null
  is_default: boolean
  can_repeat_daily: boolean
  max_per_day: number
  created_at: string
  category?: ActivityCategory
}

export interface ActivityLog {
  id: string
  user_id: string
  activity_id: string
  points_earned: number
  multiplier: number
  notes: string | null
  logged_at: string
  activity?: Activity
  profile?: Profile
}

export interface Group {
  id: string
  name: string
  description: string | null
  avatar_url: string | null
  invite_code: string
  created_by: string
  max_members: number
  created_at: string
  member_count?: number
  members?: GroupMember[]
}

export interface GroupMember {
  group_id: string
  user_id: string
  role: GroupRole
  joined_at: string
  profile?: Profile
}

export interface GroupActivityOverride {
  group_id: string
  activity_id: string
  custom_points: number
}

export interface UserObjective {
  id: string
  user_id: string
  activity_id: string
  target_count: number
  period: ActivityPeriod
  multiplier: number
  is_active: boolean
  created_at: string
  activity?: Activity
}

export interface WeightLog {
  id: string
  user_id: string
  weight_kg: number
  logged_at: string
}

export interface UserStreak {
  user_id: string
  current_streak: number
  longest_streak: number
  last_completed_date: string | null
  updated_at: string
}

export interface RankingEntry {
  user_id: string
  username: string
  avatar_url: string | null
  total_points: number
  rank: number
  streak?: number
}

export interface DailyStats {
  date: string
  points: number
  activities_count: number
  mandatory_completed: number
  total_mandatory: number
}

export interface WeekSummary {
  points_gained: number
  activities_validated: number
  best_day_points: number
  best_day_name: string
  current_streak: number
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string | null
  is_read: boolean
  created_at: string
}

export interface MandatoryActivity {
  id: string
  name: string
  emoji: string
  description: string
}
