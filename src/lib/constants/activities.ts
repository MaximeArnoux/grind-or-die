import type { ActivityCategory } from '@/types'

export const ACTIVITY_CATEGORIES: Omit<ActivityCategory, 'id'>[] = [
  { name: 'Fitness', emoji: '🏋️', color: '#22c55e', order_index: 0 },
  { name: 'Nutrition', emoji: '🥗', color: '#f59e0b', order_index: 1 },
  { name: 'Sommeil', emoji: '😴', color: '#6366f1', order_index: 2 },
  { name: 'Études', emoji: '📚', color: '#3b82f6', order_index: 3 },
  { name: 'Dev perso', emoji: '🧠', color: '#8b5cf6', order_index: 4 },
  { name: 'Looksmax', emoji: '💅', color: '#ec4899', order_index: 5 },
  { name: 'Entrepreneuriat', emoji: '💼', color: '#f97316', order_index: 6 },
]

export const DEFAULT_ACTIVITIES = [
  // FITNESS
  { name: 'Salle de sport', emoji: '🏋️', points: 5, type: 'positive', category: 'Fitness', can_repeat_daily: false, max_per_day: 1 },
  { name: '1km course à pied', emoji: '🏃', points: 1, type: 'positive', category: 'Fitness', can_repeat_daily: true, max_per_day: 15 },
  { name: '2km de vélo', emoji: '🚴', points: 1, type: 'positive', category: 'Fitness', can_repeat_daily: true, max_per_day: 20 },
  { name: '10K steps', emoji: '🚶', points: 2, type: 'positive', category: 'Fitness', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Natation 30min', emoji: '🏊', points: 4, type: 'positive', category: 'Fitness', can_repeat_daily: false, max_per_day: 1 },
  { name: 'HIIT 20min', emoji: '💪', points: 3, type: 'positive', category: 'Fitness', can_repeat_daily: false, max_per_day: 1 },
  { name: '50 pompes', emoji: '💪', points: 2, type: 'positive', category: 'Fitness', can_repeat_daily: true, max_per_day: 3 },
  { name: 'Stretching 15min', emoji: '🧘', points: 1, type: 'positive', category: 'Fitness', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Sport collectif', emoji: '⚽', points: 3, type: 'positive', category: 'Fitness', can_repeat_daily: false, max_per_day: 1 },
  { name: '10km course', emoji: '🏅', points: 5, type: 'positive', category: 'Fitness', can_repeat_daily: false, max_per_day: 1 },

  // NUTRITION
  { name: '3L d\'eau', emoji: '💧', points: 2, type: 'positive', category: 'Nutrition', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Repas sain', emoji: '🥗', points: 7, type: 'positive', category: 'Nutrition', can_repeat_daily: true, max_per_day: 3 },
  { name: 'Jeûne intermittent', emoji: '⏰', points: 3, type: 'positive', category: 'Nutrition', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Zéro sucre ajouté', emoji: '🚫', points: 3, type: 'positive', category: 'Nutrition', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Zéro alcool', emoji: '🚱', points: 2, type: 'positive', category: 'Nutrition', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Deliveroo', emoji: '🛵', points: -5, type: 'negative', category: 'Nutrition', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Cheat meal', emoji: '🍔', points: -5, type: 'negative', category: 'Nutrition', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Fast food', emoji: '🍟', points: -7, type: 'negative', category: 'Nutrition', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Soirée pizza', emoji: '🍕', points: -4, type: 'negative', category: 'Nutrition', can_repeat_daily: false, max_per_day: 1 },

  // SOMMEIL
  { name: '8h sommeil', emoji: '😴', points: 3, type: 'positive', category: 'Sommeil', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Réveil avant 9h', emoji: '⏰', points: 2, type: 'positive', category: 'Sommeil', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Coucher avant 00h', emoji: '🌙', points: 5, type: 'positive', category: 'Sommeil', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Sieste 20min', emoji: '💤', points: 1, type: 'positive', category: 'Sommeil', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Moins de 6h sommeil', emoji: '😵', points: -3, type: 'negative', category: 'Sommeil', can_repeat_daily: false, max_per_day: 1 },
  { name: '+10h sommeil', emoji: '🛌', points: -3, type: 'negative', category: 'Sommeil', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Couché après 01h', emoji: '🌃', points: -2, type: 'negative', category: 'Sommeil', can_repeat_daily: false, max_per_day: 1 },
  { name: '11h30-13h30 / 19h-21h', emoji: '📵', points: -2, type: 'negative', category: 'Sommeil', can_repeat_daily: false, max_per_day: 1 },

  // ÉTUDES
  { name: 'Réviser 2h', emoji: '📚', points: 4, type: 'positive', category: 'Études', can_repeat_daily: true, max_per_day: 4 },
  { name: 'Cours en ligne', emoji: '💻', points: 3, type: 'positive', category: 'Études', can_repeat_daily: true, max_per_day: 3 },
  { name: '15min lecture', emoji: '📖', points: 2, type: 'positive', category: 'Études', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Lire 1h', emoji: '📕', points: 3, type: 'positive', category: 'Études', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Flashcards', emoji: '📝', points: 1, type: 'positive', category: 'Études', can_repeat_daily: true, max_per_day: 3 },
  { name: 'Finir un module', emoji: '🎓', points: 4, type: 'positive', category: 'Études', can_repeat_daily: true, max_per_day: 2 },
  { name: 'Prendre des notes de cours', emoji: '✏️', points: 2, type: 'positive', category: 'Études', can_repeat_daily: true, max_per_day: 4 },

  // DEV PERSO
  { name: 'Méditation 10min', emoji: '🧘', points: 2, type: 'positive', category: 'Dev perso', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Journal', emoji: '📓', points: 2, type: 'positive', category: 'Dev perso', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Douche froide', emoji: '🚿', points: 3, type: 'positive', category: 'Dev perso', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Podcast éducatif', emoji: '🎧', points: 1, type: 'positive', category: 'Dev perso', can_repeat_daily: true, max_per_day: 2 },
  { name: 'Visualisation', emoji: '🎯', points: 1, type: 'positive', category: 'Dev perso', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Pas de réseaux sociaux', emoji: '📵', points: 3, type: 'positive', category: 'Dev perso', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Temps écran 3h+', emoji: '📺', points: -3, type: 'negative', category: 'Dev perso', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Temps écran 5h+', emoji: '📺', points: -5, type: 'negative', category: 'Dev perso', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Temps écran 7h+', emoji: '📺', points: -7, type: 'negative', category: 'Dev perso', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Réseaux sociaux 2h+', emoji: '📱', points: -3, type: 'negative', category: 'Dev perso', can_repeat_daily: false, max_per_day: 1 },

  // LOOKSMAX
  { name: 'Skincare routine', emoji: '🧴', points: 2, type: 'positive', category: 'Looksmax', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Coiffure soignée', emoji: '💇', points: 1, type: 'positive', category: 'Looksmax', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Tenue stylée', emoji: '👔', points: 1, type: 'positive', category: 'Looksmax', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Hygiène complète', emoji: '🦷', points: 2, type: 'positive', category: 'Looksmax', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Compléments alimentaires', emoji: '💊', points: 1, type: 'positive', category: 'Looksmax', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Rasage/entretien', emoji: '🪒', points: 1, type: 'positive', category: 'Looksmax', can_repeat_daily: false, max_per_day: 1 },

  // ENTREPRENEURIAT
  { name: 'Travailler 1h sur projet', emoji: '💼', points: 3, type: 'positive', category: 'Entrepreneuriat', can_repeat_daily: true, max_per_day: 8 },
  { name: 'Travailler 2h+ sur projet', emoji: '🚀', points: 5, type: 'bonus', category: 'Entrepreneuriat', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Networking', emoji: '🤝', points: 2, type: 'positive', category: 'Entrepreneuriat', can_repeat_daily: true, max_per_day: 5 },
  { name: 'Appel client/prospect', emoji: '📞', points: 4, type: 'positive', category: 'Entrepreneuriat', can_repeat_daily: true, max_per_day: 10 },
  { name: 'Publier du contenu', emoji: '📱', points: 3, type: 'positive', category: 'Entrepreneuriat', can_repeat_daily: true, max_per_day: 3 },
  { name: 'Veille marché', emoji: '📊', points: 2, type: 'positive', category: 'Entrepreneuriat', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Revenue généré', emoji: '💰', points: 10, type: 'bonus', category: 'Entrepreneuriat', can_repeat_daily: true, max_per_day: 100 },
  { name: '5 cold emails envoyés', emoji: '📧', points: 3, type: 'positive', category: 'Entrepreneuriat', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Objectif du jour accompli', emoji: '✅', points: 5, type: 'bonus', category: 'Entrepreneuriat', can_repeat_daily: false, max_per_day: 1 },
]

export const CATEGORY_COLORS: Record<string, string> = {
  'Fitness': '#22c55e',
  'Nutrition': '#f59e0b',
  'Sommeil': '#6366f1',
  'Études': '#3b82f6',
  'Dev perso': '#8b5cf6',
  'Looksmax': '#ec4899',
  'Entrepreneuriat': '#f97316',
}
