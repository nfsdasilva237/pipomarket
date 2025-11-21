// contexts/FavoritesContext.js
import { addDoc, collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { auth, db } from '../config/firebase';

const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth.currentUser) {
      loadFavorites();
    } else {
      setLoading(false);
    }
  }, []);

  const loadFavorites = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, 'favorites'),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      const favs = [];
      
      snapshot.forEach((docSnap) => {
        favs.push({ id: docSnap.id, ...docSnap.data() });
      });

      setFavorites(favs);
    } catch (error) {
      console.error('Erreur chargement favoris:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFavorite = (productId) => {
    return favorites.some(fav => fav.productId === productId);
  };

  const addToFavorites = async (product) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Erreur', 'Vous devez être connecté');
        return;
      }

      if (isFavorite(product.id)) {
        return;
      }

      const favoriteData = {
        userId,
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        productImage: product.image || '📦',
        startupId: product.startupId || '',
        startupName: product.startupName || '',
        addedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'favorites'), favoriteData);
      setFavorites([...favorites, { id: docRef.id, ...favoriteData }]);
    } catch (error) {
      console.error('Erreur ajout favoris:', error);
    }
  };

  const removeFromFavorites = async (productId) => {
    try {
      const favorite = favorites.find(fav => fav.productId === productId);
      if (!favorite) return;

      await deleteDoc(doc(db, 'favorites', favorite.id));
      setFavorites(favorites.filter(fav => fav.productId !== productId));
    } catch (error) {
      console.error('Erreur suppression favoris:', error);
    }
  };

  const toggleFavorite = async (product) => {
    if (isFavorite(product.id)) {
      await removeFromFavorites(product.id);
    } else {
      await addToFavorites(product);
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        loading,
        isFavorite,
        addToFavorites,
        removeFromFavorites,
        toggleFavorite,
        loadFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};