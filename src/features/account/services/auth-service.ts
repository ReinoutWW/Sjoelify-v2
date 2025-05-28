import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile,
  AuthError,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { LoginCredentials, RegisterCredentials } from '../types';

export class AuthService {
  private static getErrorMessage(error: AuthError): string {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please sign in or use a different email.';
      case 'auth/invalid-email':
        return 'The email address is not valid.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled. Please contact support.';
      case 'auth/weak-password':
        return 'The password is too weak. Please use a stronger password.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Invalid email or password.';
      case 'auth/missing-email':
        return 'Please enter your email address.';
      default:
        return 'An error occurred. Please try again.';
    }
  }

  private static validateDisplayName(displayName: string): string | null {
    // Must be between 3 and 20 characters
    if (displayName.length < 3 || displayName.length > 20) {
      return 'Display name must be between 3 and 20 characters';
    }

    // Must be lowercase
    if (displayName !== displayName.toLowerCase()) {
      return 'Display name must be lowercase';
    }

    // Only allow lowercase letters, numbers, and hyphens
    const validPattern = /^[a-z0-9-]+$/;
    if (!validPattern.test(displayName)) {
      return 'Display name can only contain lowercase letters, numbers, and hyphens';
    }

    // Must contain at least 2 letters
    const letterCount = (displayName.match(/[a-z]/g) || []).length;
    if (letterCount < 2) {
      return 'Display name must contain at least 2 letters';
    }

    return null;
  }

  private static async isDisplayNameUnique(displayName: string): Promise<boolean> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('displayName', '==', displayName));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  }

  static async signIn({ email, password }: LoginCredentials): Promise<void> {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw new Error(this.getErrorMessage(error as AuthError));
    }
  }

  static async signUp({ email, password, displayName }: RegisterCredentials): Promise<void> {
    try {
      // Validate display name format
      const validationError = this.validateDisplayName(displayName);
      if (validationError) {
        throw new Error(validationError);
      }

      // Check if display name is unique
      const isUnique = await this.isDisplayNameUnique(displayName);
      if (!isUnique) {
        throw new Error('This display name is already taken. Please choose another one.');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { user } = userCredential;

      // Update profile with display name
      await updateProfile(user, { displayName });

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        email: user.email,
        displayName,
        emailVerified: user.emailVerified,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(this.getErrorMessage(error as AuthError));
    }
  }

  static async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      throw new Error('Failed to sign out. Please try again.');
    }
  }

  static async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw new Error(this.getErrorMessage(error as AuthError));
    }
  }

  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return firebaseOnAuthStateChanged(auth, callback);
  }
} 