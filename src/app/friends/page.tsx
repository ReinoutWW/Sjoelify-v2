'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { useTranslation } from '@/lib/hooks/useTranslation';
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
  ClockIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useDebounce } from '@/shared/hooks/useDebounce';
import Link from 'next/link';

interface SearchResult extends UserProfile {
  requestSent?: boolean;
  isFriend?: boolean;
}

interface FriendRequestWithSender extends FriendRequest {
  sender?: UserProfile;
}

interface FriendRequestWithReceiver extends FriendRequest {
  receiver?: UserProfile;
}

export default function FriendsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequestWithSender[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestWithReceiver[]>([]);
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
        // Update search results to reflect friendship status
        setSearchResults(prev => prev.map(result => ({
          ...result,
          isFriend: updatedFriends.some(friend => friend.id === result.id)
        })));
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
        setOutgoingRequests(requests.outgoing);
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
      // Mark users who have already been sent a request or are friends
      const resultsWithStatus = results.map(user => ({
        ...user,
        requestSent: sentRequests.includes(user.id),
        isFriend: friends.some(friend => friend.id === user.id)
      }));
      setSearchResults(resultsWithStatus);
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
      toast.success(status === 'accepted' ? t.friends.requestAccepted : 'Friend request rejected');
    } catch (error) {
      console.error('Error handling friend request:', error);
      toast.error('Failed to handle friend request');
    }
  };

  const handleSendFriendRequest = async (receiverId: string) => {
    if (!user) return;

    try {
      await FriendsService.sendFriendRequest(user.uid, receiverId);
      toast.success(t.friends.requestSent);
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

  const handleCancelFriendRequest = async (requestId: string) => {
    try {
      // Delete the friend request
      await FriendsService.cancelFriendRequest(requestId);
      toast.success('Friend request cancelled');
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      toast.error('Failed to cancel friend request');
    }
  };

  const UserNameLink = ({ user, className = "" }: { user: UserProfile; className?: string }) => (
    <Link
      href={`/players/${user.id}`}
      className={`group inline-flex items-center gap-2 text-gray-900 hover:text-primary-600 transition-colors ${className}`}
    >
      <UserCircleIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
      <span className="font-medium">{user.displayName}</span>
    </Link>
  );

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
    >
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('friends')}
              className={`flex items-center flex-shrink-0 px-4 sm:px-6 py-4 text-sm font-medium ${
                activeTab === 'friends'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserGroupIcon className="w-5 h-5 mr-1.5 sm:mr-2" />
              <span className="whitespace-nowrap">{t.friends.title}</span>
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex items-center flex-shrink-0 px-4 sm:px-6 py-4 text-sm font-medium ${
                activeTab === 'requests'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BellIcon className="w-5 h-5 mr-1.5 sm:mr-2" />
              <span className="whitespace-nowrap">{t.friends.requests}</span>
              {(friendRequests.length + outgoingRequests.length) > 0 && (
                <span className="ml-1.5 sm:ml-2 px-1.5 sm:px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-600 rounded-full">
                  {friendRequests.length + outgoingRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center flex-shrink-0 px-4 sm:px-6 py-4 text-sm font-medium ${
                activeTab === 'search'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MagnifyingGlassIcon className="w-5 h-5 mr-1.5 sm:mr-2" />
              <span className="whitespace-nowrap">{t.friends.find}</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">{t.common.loading}</div>
          ) : activeTab === 'friends' ? (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900">{t.friends.yourFriends}</h2>
              {friends.length === 0 ? (
                <p className="text-gray-500">{t.friends.haventAddedFriends}</p>
              ) : (
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="min-w-0 flex-1">
                        <UserNameLink user={friend} />
                      </div>
                      <button
                        onClick={() => handleRemoveFriend(friend.id)}
                        className="ml-3 sm:ml-4 p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title={t.friends.removeFriend}
                      >
                        <UserMinusIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'requests' ? (
            <div className="space-y-6">
              {/* Incoming Requests Section */}
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900">{t.friends.incomingRequests}</h2>
                {friendRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <BellIcon className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-3 text-sm text-gray-500 max-w-sm mx-auto">{t.friends.noIncomingRequests}</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {friendRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="min-w-0 flex-1">
                          {request.sender ? (
                            <UserNameLink user={request.sender} />
                          ) : (
                            <p className="text-sm font-medium text-gray-900 truncate">{t.friends.unknownSender}</p>
                          )}
                        </div>
                        <div className="ml-3 sm:ml-4 flex gap-1 sm:gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleFriendRequest(request.id, 'accepted')}
                            className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                            title={t.friends.acceptRequest}
                          >
                            <CheckIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleFriendRequest(request.id, 'rejected')}
                            className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title={t.friends.declineRequest}
                          >
                            <XMarkIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Outgoing Requests Section */}
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900">{t.friends.outgoingRequests}</h2>
                {outgoingRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <UserPlusIcon className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-3 text-sm text-gray-500 max-w-sm mx-auto">{t.friends.noOutgoingRequests}</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {outgoingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">{t.friends.requestSentTo}</span>
                            {request.receiver ? (
                              <UserNameLink user={request.receiver} />
                            ) : (
                              <span className="text-sm font-medium text-gray-900">{t.friends.unknownRecipient}</span>
                            )}
                          </div>
                        </div>
                        <div className="ml-3 sm:ml-4 flex-shrink-0">
                          <button
                            onClick={() => handleCancelFriendRequest(request.id)}
                            className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title={t.friends.cancelRequest}
                          >
                            <XMarkIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900">{t.friends.addFriend}</h2>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.friends.searchByEmail}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-sm sm:text-base"
                />
                {searching && (
                  <div className="absolute right-3 top-2.5 text-gray-400 text-sm">
                    {t.common.search}...
                  </div>
                )}
              </div>
              {searchResults.length > 0 ? (
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="min-w-0 flex-1">
                        <UserNameLink user={user} />
                      </div>
                      <div className="ml-3 sm:ml-4 flex-shrink-0">
                        {user.isFriend ? (
                          <div className="flex items-center gap-1 sm:gap-2 text-primary-600">
                            <CheckIcon className="w-4 sm:w-5 h-4 sm:h-5" />
                            <span className="text-xs sm:text-sm font-medium">{t.friends.title}</span>
                          </div>
                        ) : user.requestSent ? (
                          <div className="flex items-center gap-1 sm:gap-2 text-gray-500 text-xs sm:text-sm">
                            <ClockIcon className="w-4 sm:w-5 h-4 sm:h-5" />
                            <span className="hidden sm:inline">{t.friends.requestSent}</span>
                            <span className="sm:hidden">{t.friends.sent}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSendFriendRequest(user.id)}
                            className="p-1.5 sm:p-2 text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
                            title={t.friends.sendRequest}
                          >
                            <UserPlusIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery && !searching ? (
                <p className="text-gray-500">{t.friends.noResults}</p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
} 