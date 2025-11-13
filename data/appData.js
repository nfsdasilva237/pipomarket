// ==========================================
// PIPOMARKET - DONNÉES 9 STARTUPS
// ==========================================

export const startups = [
  { 
    id: 1, 
    name: 'MOKYO', 
    category: 'Boissons', 
    description: 'Startup révolutionnaire dans le secteur des boissons avec des breuvages innovants et sains.',
    image: '',
    logo: '🥤',
    products: 12, 
    rating: 4.9,
    verified: true,
    deliveryTime: '30-45 min',
    tags: ['Innovant', 'Santé', 'Local'],
  },
  { 
    id: 2, 
    name: 'ABS', 
    category: 'Beauté', 
    description: 'Solutions innovantes de beauté et bien-être avec des produits naturels de qualité premium.',
    image: '',
    logo: '💄',
    products: 25, 
    rating: 4.8,
    verified: true,
    deliveryTime: '1-2 jours',
    tags: ['Naturel', 'Premium', 'Bien-être'],
  },
  { 
    id: 3, 
    name: 'Deal Business', 
    category: 'Technologie', 
    description: 'Plateforme technologique révolutionnaire facilitant les transactions commerciales modernes.',
    image: '',
    logo: '💻',
    products: 35, 
    rating: 4.7,
    verified: true,
    deliveryTime: '2-3 jours',
    tags: ['Tech', 'Innovation', 'Business'],
  },
  { 
    id: 4, 
    name: 'Monde Personnalisé', 
    category: 'Accessoires', 
    description: 'Vente d\'accessoires et appareils personnalisés selon les désirs des clients.',
    image: '',
    logo: '🎨',
    products: 18, 
    rating: 4.9,
    verified: true,
    deliveryTime: '1-2 jours',
    tags: ['Personnalisé', 'Unique', 'Créatif'],
  },
  { 
    id: 5, 
    name: 'Skincare Shein', 
    category: 'Beauté', 
    description: 'Marketplace innovante spécialisée dans les produits de beauté et vêtements tendance.',
    image: '',
    logo: '✨',
    products: 42, 
    rating: 4.8,
    verified: true,
    deliveryTime: '1-2 jours',
    tags: ['Beauté', 'Mode', 'Tendance'],
  },
  { 
    id: 6, 
    name: 'TZ Sports', 
    category: 'Sports', 
    description: 'Boutique en ligne de vente d\'équipements sportifs de qualité : maillots, chaussures, accessoires.',
    image: '',
    logo: '⚽',
    products: 28, 
    rating: 4.6,
    verified: false,
    deliveryTime: '2-3 jours',
    tags: ['Sport', 'Qualité', 'Équipement'],
  },
  { 
    id: 7, 
    name: 'Super Gros et Détail', 
    category: 'Beauté', 
    description: 'Plateforme de distribution innovante pour produits de beauté en gros et au détail.',
    image: '',
    logo: '💅',
    products: 31, 
    rating: 4.9,
    verified: true,
    deliveryTime: '1-2 jours',
    tags: ['Gros', 'Détail', 'Distribution'],
  },
  { 
    id: 8, 
    name: 'Le Goût chez Hadja', 
    category: 'Pâtisserie', 
    description: 'Pâtisseries artisanales traditionnelles : mini gâteaux, glaces et kossam authentique.',
    image: '',
    logo: '🧁',
    products: 15, 
    rating: 4.8,
    verified: false,
    deliveryTime: '1-2 heures',
    tags: ['Artisanal', 'Traditionnel', 'Authentique'],
  },
  { 
    id: 9, 
    name: 'Délices d\'Automne', 
    category: 'Pâtisserie', 
    description: 'Créations sucrées et salées sur mesure : gâteaux, crêpes, cookies personnalisés.',
    image: '',
    logo: '🎂',
    products: 22, 
    rating: 4.9,
    verified: true,
    deliveryTime: '2-3 heures',
    tags: ['Sur-mesure', 'Créatif', 'Délicieux'],
  }
];

export const products = [
  { id: 101, startupId: 1, name: "Jus Tropical MOKYO", price: 2500, image: "🥤", description: "Boisson naturelle", category: "Boissons", stock: 50 },
  { id: 102, startupId: 1, name: "Smoothie Mangue", price: 3000, image: "🥭", description: "Smoothie frais", category: "Boissons", stock: 30 },
  { id: 201, startupId: 2, name: "Sérum Visage", price: 8500, image: "💧", description: "Sérum anti-âge", category: "Soins", stock: 20 },
  { id: 202, startupId: 2, name: "Crème Hydratante", price: 6500, image: "🧴", description: "Hydratation 24h", category: "Soins", stock: 35 },
  { id: 301, startupId: 3, name: "Kit Arduino", price: 25000, image: "💻", description: "Kit complet", category: "Électronique", stock: 15 },
  { id: 302, startupId: 3, name: "Câbles USB-C", price: 2500, image: "🔌", description: "Charge rapide", category: "Accessoires", stock: 100 },
  { id: 401, startupId: 4, name: "Coque Personnalisée", price: 5000, image: "📱", description: "Votre design", category: "Accessoires", stock: 45 },
  { id: 402, startupId: 4, name: "Mug Personnalisé", price: 3500, image: "☕", description: "Avec photo", category: "Accessoires", stock: 60 },
  { id: 501, startupId: 5, name: "Kit Maquillage", price: 15000, image: "💄", description: "12 couleurs", category: "Maquillage", stock: 25 },
  { id: 502, startupId: 5, name: "Rouge à Lèvres", price: 4500, image: "💋", description: "Longue tenue", category: "Maquillage", stock: 50 },
  { id: 601, startupId: 6, name: "Maillot PSG 2024", price: 12000, image: "⚽", description: "Maillot officiel", category: "Vêtements", stock: 30 },
  { id: 602, startupId: 6, name: "Chaussures Course", price: 18000, image: "👟", description: "Confort garanti", category: "Chaussures", stock: 20 },
  { id: 701, startupId: 7, name: "Pack Soins Cheveux", price: 12000, image: "💇", description: "Shampooing + Masque", category: "Soins", stock: 40 },
  { id: 702, startupId: 7, name: "Huile de Coco", price: 5500, image: "🥥", description: "100% naturelle", category: "Soins", stock: 60 },
  { id: 801, startupId: 8, name: "Mini Gâteaux", price: 8000, image: "🧁", description: "Box de 12", category: "Pâtisserie", stock: 15 },
  { id: 802, startupId: 8, name: "Glace Kossam", price: 2500, image: "🍦", description: "Glace traditionnelle", category: "Desserts", stock: 25 },
  { id: 901, startupId: 9, name: "Gâteau Anniversaire", price: 15000, image: "🎂", description: "Personnalisé", category: "Gâteaux", stock: 10 },
  { id: 902, startupId: 9, name: "Cookies Chocolat", price: 3500, image: "🍪", description: "Pack de 6", category: "Biscuits", stock: 40 },
];

export const categories = [
  { id: 'all', name: 'Tous', icon: '🎯' },
  { id: 'Beauté', name: 'Beauté', icon: '💄' },
  { id: 'Technologie', name: 'Tech', icon: '💻' },
  { id: 'Sports', name: 'Sports', icon: '⚽' },
  { id: 'Pâtisserie', name: 'Pâtisserie', icon: '🧁' },
  { id: 'Boissons', name: 'Boissons', icon: '🥤' },
  { id: 'Accessoires', name: 'Accessoires', icon: '🎨' }
];

export const appConfig = {
  appName: "PipoMarket",
  appVersion: "1.0.0",
  currency: "FCFA",
  deliveryFee: 1000,
  freeDeliveryThreshold: 20000,
  supportWhatsApp: "+237 620702901",
  colors: {
    primary: "#007AFF",
    secondary: "#5856D6",
    success: "#34C759",
    danger: "#FF3B30",
    warning: "#FF9500",
    background: "#F2F2F7",
  },
};

export const getProductsByStartup = (startupId) => {
  return products.filter(p => p.startupId === startupId);
};

export const getStartupById = (startupId) => {
  return startups.find(s => s.id === startupId);
};

export const getProductById = (productId) => {
  return products.find(p => p.id === productId);
};

export const formatPrice = (price) => {
  return `${price.toLocaleString('fr-FR')} FCFA`;
};