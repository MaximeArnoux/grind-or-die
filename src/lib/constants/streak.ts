import type { MandatoryActivity } from '@/types'

// Ces activités doivent toutes être complétées pour maintenir la série quotidienne
export const MANDATORY_ACTIVITIES: MandatoryActivity[] = [
  {
    id: 'mandatory_sleep',
    name: '7h+ de sommeil',
    emoji: '😴',
    description: 'Dormir au moins 7 heures par nuit',
  },
  {
    id: 'mandatory_sleep_time',
    name: 'Coucher avant 01h',
    emoji: '🌙',
    description: 'Se coucher avant 1h du matin',
  },
  {
    id: 'mandatory_no_junk',
    name: 'Zéro junk food',
    emoji: '🚫',
    description: 'Pas de fast food, Deliveroo ou cheat meal',
  },
  {
    id: 'mandatory_sport',
    name: '1 activité sportive',
    emoji: '🏃',
    description: 'Au moins une activité physique dans la journée',
  },
]

export const TOTAL_MANDATORY = MANDATORY_ACTIVITIES.length

// Mapping entre les activités obligatoires et les IDs d'activités en base
// Ces mappings sont résolus au runtime après avoir chargé les activités depuis Supabase
export const MANDATORY_ACTIVITY_NAMES = {
  mandatory_water: '3L d\'eau',
  mandatory_sleep: '7h+ de sommeil',
  mandatory_sleep_time: 'Coucher avant 01h',
  mandatory_no_junk: ['Deliveroo', 'Cheat meal', 'Fast food', 'Soirée pizza'],
  mandatory_sport: ['Salle de sport', '1km course à pied', '2km de vélo', '10K steps', 'Natation 30min', 'HIIT 20min', '50 pompes', 'Sport collectif', '10km course'],
}
