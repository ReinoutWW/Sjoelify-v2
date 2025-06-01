'use client';

import React, { useState } from 'react';
import { ShareIcon } from '@heroicons/react/24/outline';
import { CheckIcon, DocumentDuplicateIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { toast } from 'react-hot-toast';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  className?: string;
  iconClassName?: string;
  showLabel?: boolean;
}

export function ShareButton({ 
  title, 
  text, 
  url, 
  className = '',
  iconClassName = '',
  showLabel = false 
}: ShareButtonProps) {
  const { t } = useTranslation();
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const handleShare = async () => {
    // Try native share first
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled or error occurred
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    }
    
    // Fallback to custom share modal
    setShowShareModal(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(t.common.linkCopied || 'Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error(t.common.failedToCopy || 'Failed to copy link');
    }
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title}\n${text}\n${shareUrl}`)}`;
    window.open(whatsappUrl, '_blank');
    setShowShareModal(false);
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${text}\n\n${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setShowShareModal(false);
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${title}\n${text}`)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank');
    setShowShareModal(false);
  };

  return (
    <>
      <button
        onClick={handleShare}
        className={`inline-flex items-center justify-center p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors ${className}`}
        title={t.common.share || 'Share'}
      >
        <ShareIcon className={`h-5 w-5 ${iconClassName}`} />
        {showLabel && (
          <span className="ml-2 text-sm font-medium">{t.common.share || 'Share'}</span>
        )}
      </button>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-4 right-4 bottom-4 sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 bg-white rounded-2xl shadow-xl z-50 sm:w-96 max-w-[calc(100vw-2rem)]"
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t.common.shareVia || 'Share via'}
                </h3>
                
                <div className="space-y-3">
                  {/* Copy Link */}
                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    {copied ? (
                      <CheckIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <DocumentDuplicateIcon className="h-5 w-5 text-gray-600 flex-shrink-0" />
                    )}
                    <span className="text-gray-900">
                      {copied ? (t.common.linkCopied || 'Link copied!') : (t.common.copyLink || 'Copy link')}
                    </span>
                  </button>

                  {/* WhatsApp */}
                  <button
                    onClick={handleWhatsAppShare}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <svg className="h-5 w-5 text-green-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <span className="text-gray-900">WhatsApp</span>
                  </button>

                  {/* Email */}
                  <button
                    onClick={handleEmailShare}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <EnvelopeIcon className="h-5 w-5 text-gray-600 flex-shrink-0" />
                    <span className="text-gray-900">{t.common.email || 'Email'}</span>
                  </button>

                  {/* Twitter/X */}
                  <button
                    onClick={handleTwitterShare}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <svg className="h-5 w-5 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    <span className="text-gray-900">X (Twitter)</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowShareModal(false)}
                  className="mt-4 w-full py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {t.common.cancel || 'Cancel'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
} 