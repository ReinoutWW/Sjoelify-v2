import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  getDoc,
  Timestamp,
  and,
  or,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { UserProfile } from '@/features/account/types';

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface Friendship {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: Date;
}

export class FriendsService {
  private static friendRequestsCollection = 'friendRequests';
  private static friendsCollection = 'friends';
  private static usersCollection = 'users';

  static async sendFriendRequest(senderId: string, receiverId: string): Promise<void> {
    try {
      // Check if request already exists
      const existingRequest = await this.checkExistingRequest(senderId, receiverId);
      if (existingRequest) {
        throw new Error('Friend request already exists');
      }

      // Check if they're already friends
      const areFriends = await this.checkIfFriends(senderId, receiverId);
      if (areFriends) {
        throw new Error('You are already friends with this user');
      }

      // Create new friend request
      await addDoc(collection(db, this.friendRequestsCollection), {
        senderId,
        receiverId,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  }

  static async respondToFriendRequest(requestId: string, status: 'accepted' | 'rejected'): Promise<void> {
    try {
      const requestRef = doc(db, this.friendRequestsCollection, requestId);
      const request = await getDoc(requestRef);
      
      if (!request.exists()) {
        throw new Error('Friend request not found');
      }

      const requestData = request.data() as FriendRequest;

      if (status === 'accepted') {
        // Create friendship
        await addDoc(collection(db, this.friendsCollection), {
          user1Id: requestData.senderId,
          user2Id: requestData.receiverId,
          createdAt: new Date()
        });
      }

      // Update request status
      await updateDoc(requestRef, {
        status,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error responding to friend request:', error);
      throw error;
    }
  }

  static async removeFriend(userId: string, friendId: string): Promise<void> {
    try {
      const friendship = await this.getFriendship(userId, friendId);
      if (!friendship) {
        throw new Error('Friendship not found');
      }

      await deleteDoc(doc(db, this.friendsCollection, friendship.id));
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  }

  static async getFriends(userId: string): Promise<UserProfile[]> {
    try {
      const friendships = await this.getFriendships(userId);
      const friendIds = friendships.flatMap(f => 
        [f.user1Id, f.user2Id].filter(id => id !== userId)
      );

      if (friendIds.length === 0) return [];

      const usersQuery = query(
        collection(db, this.usersCollection),
        where('id', 'in', friendIds)
      );
      
      const snapshot = await getDocs(usersQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserProfile[];
    } catch (error) {
      console.error('Error getting friends:', error);
      throw error;
    }
  }

  static async getIncomingFriendRequests(userId: string): Promise<(FriendRequest & { sender: UserProfile })[]> {
    try {
      const requestsQuery = query(
        collection(db, this.friendRequestsCollection),
        where('receiverId', '==', userId),
        where('status', '==', 'pending')
      );

      const snapshot = await getDocs(requestsQuery);
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FriendRequest[];

      // Get sender details for each request
      const senderIds = requests.map(r => r.senderId);
      if (senderIds.length === 0) return [];

      const usersQuery = query(
        collection(db, this.usersCollection),
        where('id', 'in', senderIds)
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      const usersMap = new Map(
        usersSnapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() } as UserProfile])
      );

      return requests.map(request => ({
        ...request,
        sender: usersMap.get(request.senderId)!
      }));
    } catch (error) {
      console.error('Error getting incoming friend requests:', error);
      throw error;
    }
  }

  static async getOutgoingFriendRequests(userId: string): Promise<FriendRequest[]> {
    try {
      const requestsQuery = query(
        collection(db, this.friendRequestsCollection),
        where('senderId', '==', userId),
        where('status', '==', 'pending')
      );

      const snapshot = await getDocs(requestsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FriendRequest[];
    } catch (error) {
      console.error('Error getting outgoing friend requests:', error);
      throw error;
    }
  }

  static async searchUsers(searchQuery: string, currentUserId: string): Promise<UserProfile[]> {
    try {
      const searchQueryLower = searchQuery.toLowerCase();
      
      // Create two queries - one for displayName and one for email
      const displayNameQuery = query(
        collection(db, this.usersCollection),
        where('displayName', '>=', searchQueryLower),
        where('displayName', '<=', searchQueryLower + '\uf8ff')
      );

      const emailQuery = query(
        collection(db, this.usersCollection),
        where('email', '>=', searchQueryLower),
        where('email', '<=', searchQueryLower + '\uf8ff')
      );
      
      // Execute both queries
      const [displayNameSnapshot, emailSnapshot] = await Promise.all([
        getDocs(displayNameQuery),
        getDocs(emailQuery)
      ]);

      // Combine results and remove duplicates using a Map
      const usersMap = new Map<string, UserProfile>();
      
      [...displayNameSnapshot.docs, ...emailSnapshot.docs].forEach(doc => {
        const userData = {
          id: doc.id,
          ...doc.data() as Omit<UserProfile, 'id'>
        } as UserProfile;
        usersMap.set(doc.id, userData);
      });

      // Convert Map to array and filter out current user
      const users = Array.from(usersMap.values())
        .filter(user => user.id !== currentUserId);

      return users;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  private static async checkExistingRequest(senderId: string, receiverId: string): Promise<boolean> {
    const requestsQuery = query(
      collection(db, this.friendRequestsCollection),
      and(
        where('status', '==', 'pending'),
        or(
          and(
            where('senderId', '==', senderId),
            where('receiverId', '==', receiverId)
          ),
          and(
            where('senderId', '==', receiverId),
            where('receiverId', '==', senderId)
          )
        )
      )
    );

    const snapshot = await getDocs(requestsQuery);
    return !snapshot.empty;
  }

  static async checkIfFriends(user1Id: string, user2Id: string): Promise<boolean> {
    const friendship = await this.getFriendship(user1Id, user2Id);
    return !!friendship;
  }

  private static async getFriendship(user1Id: string, user2Id: string): Promise<Friendship | null> {
    const friendshipsQuery = query(
      collection(db, this.friendsCollection),
      or(
        and(
          where('user1Id', '==', user1Id),
          where('user2Id', '==', user2Id)
        ),
        and(
          where('user1Id', '==', user2Id),
          where('user2Id', '==', user1Id)
        )
      )
    );

    const snapshot = await getDocs(friendshipsQuery);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as Friendship;
  }

  private static async getFriendships(userId: string): Promise<Friendship[]> {
    const friendshipsQuery = query(
      collection(db, this.friendsCollection),
      or(
        where('user1Id', '==', userId),
        where('user2Id', '==', userId)
      )
    );

    const snapshot = await getDocs(friendshipsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Friendship[];
  }

  static subscribeToFriendRequests(
    userId: string,
    onUpdate: (requests: { incoming: (FriendRequest & { sender: UserProfile })[]; outgoing: FriendRequest[] }) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    try {
      // Query for both incoming and outgoing requests
      const incomingQuery = query(
        collection(db, this.friendRequestsCollection),
        where('receiverId', '==', userId),
        where('status', '==', 'pending')
      );

      const outgoingQuery = query(
        collection(db, this.friendRequestsCollection),
        where('senderId', '==', userId),
        where('status', '==', 'pending')
      );

      // Subscribe to both queries
      const unsubscribeIncoming = onSnapshot(incomingQuery, async (snapshot) => {
        try {
          const requests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as FriendRequest[];

          // Get sender details for incoming requests
          const senderIds = requests.map(r => r.senderId);
          let incomingWithSenders: (FriendRequest & { sender: UserProfile })[] = [];

          if (senderIds.length > 0) {
            const usersQuery = query(
              collection(db, this.usersCollection),
              where('id', 'in', senderIds)
            );
            
            const usersSnapshot = await getDocs(usersQuery);
            const usersMap = new Map(
              usersSnapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() } as UserProfile])
            );

            incomingWithSenders = requests.map(request => ({
              ...request,
              sender: usersMap.get(request.senderId)!
            }));
          }

          // Get outgoing requests
          const outgoingSnapshot = await getDocs(outgoingQuery);
          const outgoingRequests = outgoingSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as FriendRequest[];

          onUpdate({
            incoming: incomingWithSenders,
            outgoing: outgoingRequests
          });
        } catch (error) {
          console.error('Error in friend requests subscription:', error);
          onError?.(error instanceof Error ? error : new Error('Unknown error'));
        }
      });

      return unsubscribeIncoming;
    } catch (error) {
      console.error('Error setting up friend requests subscription:', error);
      throw error;
    }
  }

  static subscribeToFriendships(
    userId: string,
    onUpdate: (friends: UserProfile[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    try {
      const friendshipsQuery = query(
        collection(db, this.friendsCollection),
        or(
          where('user1Id', '==', userId),
          where('user2Id', '==', userId)
        )
      );

      return onSnapshot(friendshipsQuery, async (snapshot) => {
        try {
          const friendships = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Friendship[];

          // Get all friend IDs
          const friendIds = friendships.flatMap(f => 
            [f.user1Id, f.user2Id].filter(id => id !== userId)
          );

          if (friendIds.length === 0) {
            onUpdate([]);
            return;
          }

          // Get friend profiles
          const usersQuery = query(
            collection(db, this.usersCollection),
            where('id', 'in', friendIds)
          );
          
          const usersSnapshot = await getDocs(usersQuery);
          const friends = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as UserProfile[];

          onUpdate(friends);
        } catch (error) {
          console.error('Error in friendships subscription:', error);
          onError?.(error instanceof Error ? error : new Error('Unknown error'));
        }
      });
    } catch (error) {
      console.error('Error setting up friendships subscription:', error);
      throw error;
    }
  }
} 