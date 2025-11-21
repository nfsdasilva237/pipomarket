// data/bdlStudioServices.js - Services et packages BDL Studio

export const bdlStudioServices = [
  {
    id: 'design-graphique',
    name: 'Design Graphique',
    icon: '🎨',
    gradient: ['#667eea', '#764ba2'],
    description: 'Des créations visuelles professionnelles pour valoriser votre image de marque',
    startingPrice: 7500,
    packages: [
      {
        id: 'conception-unique',
        name: 'Conception Unique',
        price: 7500,
        popular: false,
        features: [
          '1 création graphique personnalisée',
          'Design unique et original',
          'Formats adaptés à vos besoins',
          'Livraison rapide'
        ]
      },
      {
        id: 'pack-argent',
        name: 'Pack Argent',
        price: 50000,
        popular: false,
        features: [
          '8 conceptions graphiques / mois',
          '1 révision par conception',
          'Formats adaptés aux réseaux sociaux',
          'Livraison sous 48h'
        ]
      },
      {
        id: 'pack-or',
        name: 'Pack Or',
        price: 80000,
        popular: true,
        features: [
          '12 conceptions graphiques / mois',
          '2 révisions par conception',
          'Formats réseaux sociaux et impression',
          'Support prioritaire'
        ]
      },
      {
        id: 'pack-diamant',
        name: 'Pack Diamant',
        price: 110000,
        popular: false,
        features: [
          '16 conceptions graphiques / mois',
          '3 révisions par conception',
          'Formats réseaux sociaux et impression',
          'Consultation stratégique incluse'
        ]
      }
    ]
  },
  {
    id: 'filtre-snapchat',
    name: 'Filtre Snapchat',
    icon: '👻',
    gradient: ['#FFFC00', '#FFD700'],
    description: 'Créez votre filtre Snapchat personnalisé pour marquer les esprits',
    startingPrice: 10000,
    packages: [
      {
        id: 'filtre-unique',
        name: 'Filtre Snapchat',
        price: 10000,
        popular: false,
        features: [
          'Filtre personnalisé pour Snapchat',
          'Design unique et original',
          'Format prêt à l\'emploi',
          'Support technique inclus'
        ]
      }
    ]
  },
  {
    id: 'montage-video',
    name: 'Montage Vidéo',
    icon: '🎥',
    gradient: ['#f093fb', '#f5576c'],
    description: 'Des montages professionnels pour valoriser votre image et captiver votre audience',
    startingPrice: 10000,
    packages: [
      {
        id: 'montage-unique',
        name: 'Montage Unique',
        price: 10000,
        popular: false,
        features: [
          '1 montage vidéo personnalisé',
          'Durée max : 1 min',
          'Qualité : HD (1080p)',
          '1 révision incluse',
          'Livraison sous 48h'
        ]
      },
      {
        id: 'pack-standard',
        name: 'Pack Standard',
        price: 35000,
        popular: false,
        features: [
          '4 montages vidéos / mois',
          'Durée max : 1 min / vidéo',
          'Qualité : HD (1080p)',
          '1 révision par vidéo',
          'Livraison planifiée chaque semaine'
        ]
      },
      {
        id: 'pack-professionnel',
        name: 'Pack Professionnel',
        price: 50000,
        popular: true,
        features: [
          '6 montages vidéos / mois',
          'Durée max : 2 min / vidéo',
          'Qualité : HD & 4K',
          '2 révisions par vidéo',
          'Calendrier de diffusion personnalisé'
        ]
      }
    ],
    eventCoverage: {
      available: true,
      title: 'Couverture événementielle',
      specialties: [
        {
          icon: '🎂',
          name: 'Anniversaires',
          description: 'Fêtes d\'anniversaire enfants et adultes, célébrations familiales'
        },
        {
          icon: '💒',
          name: 'Baptêmes & Communions',
          description: 'Cérémonies religieuses, moments spirituels importants'
        },
        {
          icon: '💍',
          name: 'Mariages',
          description: 'De la cérémonie à la réception, votre jour J immortalisé'
        },
        {
          icon: '🎓',
          name: 'Graduations',
          description: 'Remises de diplômes, cérémonies de fin d\'études'
        },
        {
          icon: '🏢',
          name: 'Événements Corporate',
          description: 'Séminaires, lancements de produits, conférences'
        },
        {
          icon: '🎭',
          name: 'Spectacles & Galas',
          description: 'Représentations artistiques, soirées de gala'
        }
      ]
    }
  },
  {
    id: 'developpement-web',
    name: 'Développement Web',
    icon: '💻',
    gradient: ['#4facfe', '#00f2fe'],
    description: 'Des sites modernes, performants et adaptés à vos objectifs pour renforcer votre présence en ligne',
    startingPrice: 100000,
    packages: [
      {
        id: 'pack-starter',
        name: 'Pack Starter',
        price: 100000,
        popular: false,
        features: [
          'Site vitrine 1 à 3 pages',
          'Design responsive',
          'Formulaire de contact',
          'Hébergement & domaine 1 an inclus',
          'Livraison : 5 à 7 jours'
        ]
      },
      {
        id: 'pack-standard',
        name: 'Pack Standard',
        price: 200000,
        popular: true,
        features: [
          'Site complet 4 à 6 pages',
          'Blog intégré + SEO de base',
          'Design sur-mesure',
          'Hébergement & domaine 1 an inclus',
          'Formation à la gestion du site'
        ]
      },
      {
        id: 'pack-premium',
        name: 'Pack Premium',
        price: 300000,
        popular: false,
        features: [
          'Site vitrine ou e-commerce (jusqu\'à 15 produits)',
          'SEO avancé + sécurité renforcée',
          'Design premium & animations',
          'Interface d\'administration',
          'Assistance 1 mois après livraison'
        ]
      },
      {
        id: 'pack-entreprise',
        name: 'Pack Entreprise',
        price: 500000,
        popular: false,
        features: [
          'Site e-commerce ou institutionnel avancé',
          'Catalogue complet illimité',
          'Outils marketing intégrés',
          'Référencement + optimisation mobile',
          'Maintenance & support 3 mois'
        ]
      }
    ]
  },
  {
    id: 'location-drone',
    name: 'Location de Drone',
    icon: '🚁',
    gradient: ['#11998e', '#38ef7d'],
    description: 'Des prestations aériennes professionnelles avec pilotes expérimentés pour capturer vos moments uniques',
    startingPrice: 60000,
    packages: [
      {
        id: 'pack-standard',
        name: 'Pack Standard',
        price: 60000,
        popular: false,
        features: [
          '1 heure de vol',
          'Opérateur professionnel',
          'Livraison des rushs bruts',
          'Idéal pour : petites cérémonies, photos simples'
        ]
      },
      {
        id: 'pack-professionnel',
        name: 'Pack Professionnel',
        price: 150000,
        popular: true,
        features: [
          '2h30 de vol',
          'Opérateur + assistant',
          'Vidéo montée (1 min 30)',
          'Livraison HD + rushs bruts',
          'Idéal : mariages, clips, projets pro'
        ]
      },
      {
        id: 'pack-elite',
        name: 'Pack Elite',
        price: 250000,
        popular: false,
        features: [
          'Jusqu\'à 4h sur site',
          '2 opérateurs (pilote + cadreur)',
          'Montage complet + teaser',
          'Livraison 4K + rushs HD',
          'Prises FPV disponibles',
          'Idéal : pubs, films, gros events'
        ]
      }
    ]
  },
  {
    id: 'community-management',
    name: 'Community Management',
    icon: '📱',
    gradient: ['#fa709a', '#fee140'],
    description: 'Nos offres pour booster votre présence en ligne avec des stratégies personnalisées',
    startingPrice: 100000,
    packages: [
      {
        id: 'pack-standard',
        name: 'Pack Standard',
        price: 100000,
        popular: false,
        features: [
          'Gestion de 2 réseaux sociaux max',
          '6 publications affiches / mois',
          '4 montages vidéos (max 1 min) / mois',
          '8 publications d\'articles / mois',
          'Interaction proactive avec la communauté',
          'Sponsoring des publications',
          'Calendrier de publication',
          'Rapport mensuel d\'analyse des performances'
        ]
      },
      {
        id: 'pack-professionnel',
        name: 'Pack Professionnel',
        price: 150000,
        popular: true,
        features: [
          'Gestion de 3 réseaux sociaux max',
          '8 publications affiches / mois',
          '5 montages vidéos (max 1 min) / mois',
          '10 publications d\'articles / mois',
          'Interaction proactive avec la communauté',
          'Sponsoring des publications',
          'Calendrier de publication',
          'Rapport mensuel d\'analyse des performances'
        ]
      },
      {
        id: 'pack-elite',
        name: 'Pack Elite',
        price: 200000,
        popular: false,
        features: [
          'Gestion de 4 réseaux sociaux max',
          '12 publications affiches / mois',
          '6 montages vidéos (max 1 min) / mois',
          '12 publications d\'articles / mois',
          'Interaction proactive avec la communauté',
          'Sponsoring des publications',
          'Calendrier de publication',
          'Rapport mensuel d\'analyse + recommandations'
        ]
      }
    ]
  },
  {
    id: 'shooting-photo',
    name: 'Shooting Photo',
    icon: '📸',
    gradient: ['#FFA500', '#FF6347'],
    description: 'Capturez l\'instant avec esthétisme, émotion et cohérence',
    startingPrice: 25000,
    packages: [
      {
        id: 'pack-essentiel',
        name: 'Pack Essentiel',
        price: 25000,
        popular: false,
        features: [
          '1h de shooting photo',
          '15 photos retouchées HD',
          '1 changement de tenue',
          'Retouches de base incluses',
          'Livraison sous 48h'
        ]
      },
      {
        id: 'pack-standard',
        name: 'Pack Standard',
        price: 45000,
        popular: true,
        features: [
          '2h de shooting photo',
          '30 photos retouchées HD',
          '3 changements de tenues',
          'Retouches avancées incluses',
          '2 décors/lieux différents',
          'Galerie en ligne privée'
        ]
      },
      {
        id: 'pack-premium',
        name: 'Pack Premium',
        price: 70000,
        popular: false,
        features: [
          '3h de shooting photo',
          '50 photos retouchées HD',
          'Changements illimités',
          'Retouches professionnelles',
          '3 décors/lieux différents',
          'Maquillage professionnel inclus',
          'Photos haute résolution'
        ]
      }
    ]
  }
];

// Fonction helper pour obtenir un service par ID
export const getServiceById = (serviceId) => {
  return bdlStudioServices.find(service => service.id === serviceId);
};

// Fonction helper pour obtenir un package spécifique
export const getPackageById = (serviceId, packageId) => {
  const service = getServiceById(serviceId);
  if (!service) return null;
  return service.packages.find(pkg => pkg.id === packageId);
};