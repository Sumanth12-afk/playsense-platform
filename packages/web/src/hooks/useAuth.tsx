import { useEffect, useState } from "react";
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      // If user is logged in, ensure they have a record in Supabase
      if (firebaseUser) {
        await ensureUserInSupabase(firebaseUser);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Ensure user exists in Supabase for data storage
  const ensureUserInSupabase = async (firebaseUser: User) => {
    try {
      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', firebaseUser.uid)
        .single();

      if (!existingUser) {
        // Create user in Supabase
        await supabase.from('users').insert({
          id: firebaseUser.uid,
          email: firebaseUser.email,
          created_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error ensuring user in Supabase:', error);
    }
  };

  const signUp = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await ensureUserInSupabase(userCredential.user);
    return userCredential;
  };

  const signIn = async (email: string, password: string) => {
    return await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    await ensureUserInSupabase(userCredential.user);
    return userCredential;
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return { 
    user, 
    loading, 
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    session: user ? { user } : null
  };
};
