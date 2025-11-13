// utils/categoryService.js - SERVICE POUR CHARGER CATÉGORIES DEPUIS FIRESTORE

import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const categoryService = {
  // Charger toutes les catégories depuis Firestore
  getAllCategories: async () => {
    try {
      const categoriesSnap = await getDocs(collection(db, 'categories'));
      const categories = categoriesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Trier par ordre alphabétique
      categories.sort((a, b) => a.name.localeCompare(b.name));

      return categories;
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
      return [];
    }
  },

  // Catégories par défaut (fallback si Firestore vide)
  getDefaultCategories: () => {
    return [
      { id: '1', name: 'Alimentaire', icon: '🍔' },
      { id: '2', name: 'Mode & Beauté', icon: '💄' },
      { id: '3', name: 'Technologie', icon: '💻' },
      { id: '4', name: 'Services', icon: '⚙️' },
      { id: '5', name: 'Artisanat', icon: '🎨' },
      { id: '6', name: 'Éducation', icon: '📚' },
      { id: '7', name: 'Santé', icon: '💊' },
      { id: '8', name: 'Autre', icon: '📦' },
    ];
  },

  // Charger catégories avec fallback
  getCategoriesWithFallback: async () => {
    const firestoreCategories = await categoryService.getAllCategories();
    
    if (firestoreCategories.length > 0) {
      return firestoreCategories;
    }
    
    // Si Firestore est vide, retourner les catégories par défaut
    return categoryService.getDefaultCategories();
  },
};

export default categoryService;
