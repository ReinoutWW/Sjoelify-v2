'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { FriendsService, FriendRequest } from '@/features/friends/services/friends-service';
import { UserProfile } from '@/features/account/types';
import { motion } from 'framer-motion';
import { fadeIn } from '@/shared/styles/animations';
import { 
  UserPlusIcon, 
  UserMinusIcon, 
  CheckIcon, 
  XMarkIcon,
  UserGroupIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useDebounce } from '@/shared/hooks/useDebounce';

interface SearchResult extends UserProfile {
  requestSent?: boolean;
}

interface FriendRequestWithSender extends FriendRequest {
  sender: UserProfile;
}

export default function FriendsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequestWithSender[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (!user) return;

    // Set up real-time subscriptions
    const unsubscribeFriends = FriendsService.subscribeToFriendships(
      user.uid,
      (updatedFriends) => {
        setFriends(updatedFriends);
        setLoading(false);
      },
      (error) => {
        console.error('Error in friends subscription:', error);
        toast.error('Failed to load friends data');
      }
    );

    const unsubscribeRequests = FriendsService.subscribeToFriendRequests(
      user.uid,
      (requests) => {
        setFriendRequests(requests.incoming);
        setSentRequests(requests.outgoing.map(req => req.receiverId));
        setLoading(false);
      },
      (error) => {
        console.error('Error in friend requests subscription:', error);
        toast.error('Failed to load friend requests');
      }
    );

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeFriends();
      unsubscribeRequests();
    };
  }, [user]);

  useEffect(() => {
    if (debouncedSearchQuery && user) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchQuery, user]);

  const searchUsers = async () => {
    if (!user || !debouncedSearchQuery.trim()) return;

    try {
      setSearching(true);
      const results = await FriendsService.searchUsers(debouncedSearchQuery, user.uid);
      // Mark users who have already been sent a request
      const resultsWithRequestStatus = results.map(user => ({
        ...user,
        requestSent: sentRequests.includes(user.id)
      }));
      setSearchResults(resultsWithRequestStatus);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!user) return;
    
    try {
      await FriendsService.removeFriend(user.uid, friendId);
      toast.success('Friend removed successfully');
    } catch (error) {
      console.error('Error removing friend:', error);
      toast.error('Failed to remove friend');
    }
  };

  const handleFriendRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      await FriendsService.respondToFriendRequest(requestId, status);
      toast.success(status === 'accepted' ? 'Friend request accepted' : 'Friend request rejected');
    } catch (error) {
      console.error('Error handling friend request:', error);
      toast.error('Failed to handle friend request');
    }
  };

  const handleSendFriendRequest = async (receiverId: string) => {
    if (!user) return;

    try {
      await FriendsService.sendFriendRequest(user.uid, receiverId);
      toast.success('Friend request sent successfully');
      // Update local state to show the request was sent
      setSentRequests(prev => [...prev, receiverId]);
      setSearchResults(prev => 
        prev.map(user => 
          user.id === receiverId 
            ? { ...user, requestSent: true }
            : user
        )
      );
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send friend request');
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="max-w-4xl mx-auto px-4 py-8"
    >
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('friends')}
              className={`flex items-center px-6 py-4 text-sm font-medium ${
                activeTab === 'friends'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserGroupIcon className="w-5 h-5 mr-2" />
              Friends List
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex items-center px-6 py-4 text-sm font-medium ${
                activeTab === 'requests'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BellIcon className="w-5 h-5 mr-2" />
              Friend Requests
              {friendRequests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-600 rounded-full">
                  {friendRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center px-6 py-4 text-sm font-medium ${
                activeTab === 'search'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
              Find Friends
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : activeTab === 'friends' ? (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900">Your Friends</h2>
              {friends.length === 0 ? (
                <p className="text-gray-500">You haven't added any friends yet.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {friend.displayName}
                        </h3>
                        <p className="text-sm text-gray-500">{friend.email}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveFriend(friend.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove friend"
                      >
                        <UserMinusIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'requests' ? (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900">Friend Requests</h2>
              {friendRequests.length === 0 ? (
                <p className="text-gray-500">No pending friend requests.</p>
              ) : (
                <div className="space-y-4">
                  {friendRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {request.sender.displayName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {request.sender.email}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleFriendRequest(request.id, 'accepted')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                          title="Accept request"
                        >
                          <CheckIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleFriendRequest(request.id, 'rejected')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Reject request"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900">Find Friends</h2>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by display name or email..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                />
                {searching && (
                  <div className="absolute right-3 top-2.5 text-gray-400">
                    Searching...
                  </div>
                )}
              </div>
              {searchResults.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {user.displayName}
                        </h3>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      {user.requestSent ? (
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                          <ClockIcon className="w-5 h-5" />
                          <span>Request sent</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSendFriendRequest(user.id)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
                          title="Send friend request"
                        >
                          <UserPlusIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : searchQuery && !searching ? (
                <p className="text-gray-500">No users found.</p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
} 