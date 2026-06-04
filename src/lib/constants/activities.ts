import type { ActivityCategory } from '@/types'

export const ACTIVITY_CATEGORIES: Omit<ActivityCategory, 'id'>[] = [
  { name: 'Fitness', emoji: '🏋️', color: '#22c55e', order_index: 0 },
  { name: 'Nutrition', emoji: '🥗', color: '#f59e0b', order_index: 1 },
  { name: 'Sommeil', emoji: '😴', color: '#6366f1', order_index: 2 },
  { name: 'Études', emoji: '📚', color: '#3b82f6', order_index: 3 },
  { name: 'Dev perso', emoji: '🧠', color: '#8b5cf6', order_index: 4 },
  { name: 'Looksmax', emoji: '💅', color: '#ec4899', order_index: 5 },
  { name: 'Entrepreneuriat', emoji: '💼', color: '#f97316', order_index: 6 },
  { name: 'Santé', emoji: '❤️', color: '#06b6d4', order_index: 7 },
]

export const DEFAULT_ACTIVITIES = [
  // FITNESS (UI spéciale — ne pas afficher dans la grille normale)
  { name: 'Course à pied', emoji: '🏃', points: 1, type: 'positive', category: 'Fitness', can_repeat_daily: true, max_per_day: 100 },
  { name: 'Vélo', emoji: '🚴', points: 1, type: 'positive', category: 'Fitness', can_repeat_daily: true, max_per_day: 200 },
  { name: 'Natation', emoji: '🏊', points: 2, type: 'positive', category: 'Fitness', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Salle de sport', emoji: '🏋️', points: 5, type: 'positive', category: 'Fitness', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Street workout', emoji: '💪', points: 5, type: 'positive', category: 'Fitness', can_repeat_daily: false, max_per_day: 1 },

  // NUTRITION
  { name: '3L d\'eau', emoji: '💧', points: 2, type: 'positive', category: 'Nutrition', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Repas sain', emoji: '🥗', points: 7, type: 'positive', category: 'Nutrition', can_repeat_daily: true, max_per_day: 3 },
  { name: 'Jeûne intermittent', emoji: '⏰', points: 3, type: 'positive', category: 'Nutrition', can_repeat_daily: false, max_per_day: 1 },
{ name: 'Deliveroo', emoji: '🛵', points: -5, type: 'negative', category: 'Nutrition', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Cheat meal', emoji: '🍔', points: -5, type: 'negative', category: 'Nutrition', can_repeat_daily: false, max_per_day: 1 },

  // SOMMEIL (UI spéciale)
  { name: 'Sommeil', emoji: '😴', points: 0, type: 'positive', category: 'Sommeil', can_repeat_daily: false, max_per_day: 1 },

  // ÉTUDES
  { name: 'Réviser 2h', emoji: '📚', points: 4, type: 'positive', category: 'Études', can_repeat_daily: true, max_per_day: 4 },
  { name: 'Cours en ligne', emoji: '💻', points: 3, type: 'positive', category: 'Études', can_repeat_daily: true, max_per_day: 3 },
  { name: '15min lecture', emoji: '📖', points: 2, type: 'positive', category: 'Études', can_repeat_daily: false, max_per_day: 1 },
{ name: 'Flashcards', emoji: '📝', points: 1, type: 'positive', category: 'Études', can_repeat_daily: true, max_per_day: 3 },
  { name: 'Finir un module', emoji: '🎓', points: 4, type: 'positive', category: 'Études', can_repeat_daily: true, max_per_day: 2 },

  // DEV PERSO
  { name: 'Méditation 10min', emoji: '🧘', points: 2, type: 'positive', category: 'Dev perso', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Journal', emoji: '📓', points: 2, type: 'positive', category: 'Dev perso', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Douche froide', emoji: '🚿', points: 3, type: 'positive', category: 'Dev perso', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Podcast éducatif', emoji: '🎧', points: 1, type: 'positive', category: 'Dev perso', can_repeat_daily: true, max_per_day: 2 },
  { name: 'Pas de réseaux sociaux', emoji: '📵', points: 3, type: 'positive', category: 'Dev perso', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Réseaux sociaux 2h+', emoji: '📱', points: -3, type: 'negative', category: 'Dev perso', can_repeat_daily: false, max_per_day: 1 },

  // LOOKSMAX
  { name: 'Skincare routine', emoji: '🧴', points: 2, type: 'positive', category: 'Looksmax', can_repeat_daily: false, max_per_day: 1 },
{ name: 'Hygiène complète', emoji: '🦷', points: 2, type: 'positive', category: 'Looksmax', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Compléments alimentaires', emoji: '💊', points: 1, type: 'positive', category: 'Looksmax', can_repeat_daily: false, max_per_day: 1 },

  // ENTREPRENEURIAT
  { name: 'Travailler 1h sur projet', emoji: '💼', points: 3, type: 'positive', category: 'Entrepreneuriat', can_repeat_daily: true, max_per_day: 8 },
  { name: 'Travailler 2h+ sur projet', emoji: '🚀', points: 5, type: 'bonus', category: 'Entrepreneuriat', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Networking', emoji: '🤝', points: 2, type: 'positive', category: 'Entrepreneuriat', can_repeat_daily: true, max_per_day: 5 },
  { name: 'Appel client/prospect', emoji: '📞', points: 4, type: 'positive', category: 'Entrepreneuriat', can_repeat_daily: true, max_per_day: 10 },
  { name: 'Publier du contenu', emoji: '📱', points: 3, type: 'positive', category: 'Entrepreneuriat', can_repeat_daily: true, max_per_day: 3 },
  { name: 'Veille marché', emoji: '📊', points: 2, type: 'positive', category: 'Entrepreneuriat', can_repeat_daily: false, max_per_day: 1 },
  { name: 'Revenue généré', emoji: '💰', points: 10, type: 'bonus', category: 'Entrepreneuriat', can_repeat_daily: true, max_per_day: 100 },
  { name: '5 cold emails envoyés', emoji: '📧', points: 3, type: 'positive', category: 'Entrepreneuriat', can_repeat_daily: false, max_per_day: 1 },
]

// Explications courtes affichées dans le ⓘ à côté de chaque activité
export const ACTIVITY_DESCRIPTIONS: Record<string, string> = {
  'Course à pied': '1 pt par km parcouru',
  'Vélo': '1 pt tous les 2 km',
  'Natation': '2 pts par tranche de 30 min',
  'Salle de sport': '+5 pts par séance',
  'Street workout': '+5 pts par séance',
  'Sport compétitif': '+6 pts (match, compétition)',
  '3L d\'eau': 'Bois 3 litres dans la journée',
  'Repas sain': 'Repas équilibré (max 2/jour)',
  'Jeûne intermittent': 'Jeûne pour respecter l\'objectif (ex : sèche)',
  'Compléments alimentaires': 'Vitamines, protéines…',
  'Deliveroo': 'Commande de livraison · malus',
  'Cheat meal': 'Repas plaisir non sain · malus',
  '11h30-13h30 / 19h00-22h00': 'Malus si heure de repas non respectée',
  'Sommeil': 'Points selon durée, heure de coucher et de réveil',
  'Réviser 2h': '+4 pts par session de révision',
  'Cours en ligne': '+3 pts par cours suivi',
  '15min lecture': '+2 pts de lecture',
  'Méditation 10min': 'Méditation / respiration',
  'Douche froide': 'Douche froide (max 2/jour)',
  'Podcast éducatif': 'Écoute enrichissante',
  'Pas de réseaux sociaux': 'Zéro réseau de la journée',
  'Réseaux sociaux 2h+': 'Temps d\'écran excessif · malus',
  'Night scroll': 'Scroll tard le soir · malus',
  'Motivation': 'Contenu motivant / mindset',
  'Skincare routine': 'Soin du visage',
  'Hygiène complète': 'Douche, dents, soin complet',
  'Travailler 1h sur projet': '+3 pts par heure de travail',
  'Networking': 'Élargir son réseau',
  'Appel client/prospect': 'Appel commercial',
  'Publier du contenu': 'Post, vidéo…',
  'Revenue généré': 'Quand tu gagnes de l\'argent',
  '5 cold emails envoyés': 'Prospection par email',
  'Money management': 'Dépense impulsive / mauvaise gestion · malus',
  'Procrastiner sur une tâche importante': 'Tâche importante repoussée · malus',
  'Jeux vidéo': '−3 pts dès 3h, pénalité croissante',
  'Réseaux sociaux': '−3 pts dès 2h, pénalité croissante',
  'Shift CDI': 'Période d\'au moins 4h de travail en contrat',
  'pen': 'Prise de pen, drogue…',
  'alcool': 'Consommation d\'alcool',
  'goon 2+/week': 'À partir de 2 goon : malus',
}

export const CATEGORY_COLORS: Record<string, string> = {
  'Fitness': '#22c55e',
  'Nutrition': '#f59e0b',
  'Sommeil': '#6366f1',
  'Études': '#3b82f6',
  'Dev perso': '#8b5cf6',
  'Looksmax': '#ec4899',
  'Entrepreneuriat': '#f97316',
  'Santé': '#06b6d4',
}
