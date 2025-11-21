import { getAuth } from "firebase/auth";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../config/firebaseConfig";

export const loadUserOrders = (onOrdersLoaded, onError) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    onError?.("Utilisateur non connecté");
    return;
  }

  try {
    const userOrdersRef = collection(db, "users", user.uid, "orders");
    const q = query(userOrdersRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const orders = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        onOrdersLoaded(orders);
      },
      (error) => {
        console.error("❌ Erreur Firestore:", error);
        onError?.(error);
      }
    );

    return unsubscribe;

  } catch (err) {
    console.error("❌ Erreur:", err);
    onError?.(err);
  }
};
