import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Pages privées : pas la peine de les indexer
      disallow: ['/dashboard', '/classements', '/groupes', '/ajouter', '/activites', '/calendrier', '/historique', '/parametres', '/profil', '/api'],
    },
    sitemap: 'https://grindordie.vercel.app/sitemap.xml',
  }
}
