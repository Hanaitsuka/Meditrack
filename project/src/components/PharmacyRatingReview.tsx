import { useState, useEffect } from 'react';
import { Star, X, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Review = {
  id: string;
  user_id: string;
  rating: number;
  review_text: string;
  created_at: string;
};

type PharmacyRatingReviewProps = {
  pharmacyId: string;
  pharmacyName: string;
  onAuthClick: (mode: 'login' | 'signup') => void;
};

// Small star display used inside pharmacy cards
export function StarDisplay({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= Math.round(rating)
              ? 'text-amber-400 fill-amber-400'
              : 'text-gray-300'
          }`}
        />
      ))}
      <span className="text-sm text-gray-500 ml-1">
        {count > 0 ? `${rating.toFixed(1)} (${count})` : 'No ratings yet'}
      </span>
    </div>
  );
}

export function PharmacyRatingReview({
  pharmacyId,
  pharmacyName,
  onAuthClick,
}: PharmacyRatingReviewProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [hasExistingReview, setHasExistingReview] = useState(false);

  // Fetch reviews for this pharmacy
  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from('pharmacy_reviews')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReviews(data);
      if (data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAverageRating(avg);
      }
      // Check if the current user already left a review
      if (user) {
        const existing = data.find((r) => r.user_id === user.id);
        if (existing) {
          setHasExistingReview(true);
          setUserRating(existing.rating);
          setReviewText(existing.review_text);
        }
      }
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [pharmacyId, user]);

  const handleSubmit = async () => {
    if (!user) {
      onAuthClick('login');
      return;
    }
    if (userRating === 0) {
      setErrorMsg('Please select a star rating.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const { error } = await supabase.from('pharmacy_reviews').upsert(
      {
        pharmacy_id: pharmacyId,
        user_id: user.id,
        rating: userRating,
        review_text: reviewText,
      },
      { onConflict: 'pharmacy_id,user_id' }
    );

    setIsSubmitting(false);

    if (error) {
      setErrorMsg('Something went wrong. Please try again.');
    } else {
      setSuccessMsg(hasExistingReview ? 'Review updated!' : 'Review submitted! Thank you.');
      setHasExistingReview(true);
      fetchReviews();
    }
  };

  return (
    <>
      {/* Star summary shown on the card */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <StarDisplay rating={averageRating} count={reviews.length} />
        <button
          onClick={() => setIsOpen(true)}
          className="text-sm text-amber-700 hover:text-amber-900 font-medium underline"
        >
          {user ? (hasExistingReview ? 'Edit Your Review' : 'Rate & Review') : 'View Reviews'}
        </button>
      </div>

      {/* Modal popup */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-amber-900">Reviews</h3>
                <p className="text-sm text-gray-500">{pharmacyName}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Average */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-3 mb-5 p-3 bg-amber-50 rounded-lg">
                <span className="text-4xl font-bold text-amber-900">
                  {averageRating.toFixed(1)}
                </span>
                <div>
                  <StarDisplay rating={averageRating} count={reviews.length} />
                  <p className="text-xs text-gray-500 mt-1">Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            )}

            {/* Submit/Edit Review */}
            {user ? (
              <div className="mb-5 p-4 border border-amber-200 rounded-xl bg-white">
                <p className="text-sm font-semibold text-amber-900 mb-2">
                  {hasExistingReview ? 'Your Review' : 'Write a Review'}
                </p>
                {/* Star picker */}
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-8 h-8 cursor-pointer transition-colors ${
                        star <= (hoverRating || userRating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-300'
                      }`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setUserRating(star)}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-500 self-center">
                    {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][hoverRating || userRating] || 'Select rating'}
                  </span>
                </div>
                {/* Text area */}
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience (optional)..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                {errorMsg && <p className="text-red-500 text-xs mt-1">{errorMsg}</p>}
                {successMsg && <p className="text-green-600 text-xs mt-1">{successMsg}</p>}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="mt-2 flex items-center gap-2 px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Submitting...' : hasExistingReview ? 'Update Review' : 'Submit Review'}
                </button>
              </div>
            ) : (
              <div className="mb-5 p-4 bg-amber-50 rounded-xl text-center">
                <p className="text-sm text-amber-800 mb-2">
                  Please log in to leave a review
                </p>
                <button
                  onClick={() => { setIsOpen(false); onAuthClick('login'); }}
                  className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 text-sm font-medium"
                >
                  Log In
                </button>
              </div>
            )}

            {/* Reviews list */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {reviews.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-4">
                  No reviews yet. Be the first to review!
                </p>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(review.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </span>
                      {user && review.user_id === user.id && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">You</span>
                      )}
                    </div>
                    {review.review_text && (
                      <p className="text-sm text-gray-600">{review.review_text}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}