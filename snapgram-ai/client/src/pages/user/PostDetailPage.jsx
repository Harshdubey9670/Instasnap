import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Sparkles, Loader2 } from 'lucide-react';
import API from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { PostCard } from '../../components/feed/PostCard';
import { PostDetailCard } from '../../components/post/PostDetailCard';
import { LocationCard } from '../../components/post/LocationCard';
import { RelatedPostsPanel } from '../../components/post/RelatedPostsPanel';

export default function PostDetailPage() {
  const { id: targetPostId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Origin Navigation Context (Profile, Feed, or Explore) — preserved as-is,
  // this drives which stream ("more posts") is fetched below the target post.
  const navState = location.state || {};
  const originSource = navState.source || 'explore';
  const originUserId = navState.userId;

  const [targetPost, setTargetPost] = useState(null);
  const [targetLoading, setTargetLoading] = useState(true);

  const [feedPosts, setFeedPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [feedLoading, setFeedLoading] = useState(false);

  const prefetchedCacheRef = useRef({});
  const observerRef = useRef(null);

  useEffect(() => {
    fetchTargetPost();
    setFeedPosts([]);
    setPage(1);
    setHasMore(true);
    prefetchedCacheRef.current = {};
    fetchMorePosts(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPostId, originSource, originUserId]);

  const fetchTargetPost = async () => {
    try {
      setTargetLoading(true);
      const res = await API.get(`/api/posts/${targetPostId}`);
      if (res.data.success) setTargetPost(res.data.data);
    } catch (err) {
      toast({ variant: 'error', title: 'Error', description: 'Failed to load post details.' });
    } finally {
      setTargetLoading(false);
    }
  };

  const fetchMorePosts = async (pageNum, reset = false) => {
    try {
      setFeedLoading(true);
      let endpoint = '/api/posts/explore';
      const params = { page: pageNum, limit: 6 };

      if (originSource === 'profile' && originUserId) {
        endpoint = `/api/posts/user/${originUserId}`;
      } else if (originSource === 'feed') {
        endpoint = '/api/posts/feed';
      }

      let fetched = [];
      if (prefetchedCacheRef.current[pageNum]) {
        fetched = prefetchedCacheRef.current[pageNum];
      } else {
        const res = await API.get(endpoint, { params });
        if (res.data.success) fetched = res.data.data?.posts || res.data.data || [];
      }

      const filtered = fetched.filter((p) => p._id !== targetPostId);
      setFeedPosts((prev) => (reset ? filtered : [...prev, ...filtered]));
      if (fetched.length < 6) setHasMore(false);

      if (hasMore) prefetchNextBatch(endpoint, pageNum + 1);
    } catch (e) {
      console.error('Failed to load related posts feed', e);
    } finally {
      setFeedLoading(false);
    }
  };

  const prefetchNextBatch = async (endpoint, nextPage) => {
    if (prefetchedCacheRef.current[nextPage]) return;
    try {
      const res = await API.get(endpoint, { params: { page: nextPage, limit: 6 } });
      if (res.data.success) prefetchedCacheRef.current[nextPage] = res.data.data?.posts || res.data.data || [];
    } catch (e) {}
  };

  const lastPostElementRef = useCallback(
    (node) => {
      if (feedLoading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => {
            const nextPage = prevPage + 1;
            fetchMorePosts(nextPage);
            return nextPage;
          });
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [feedLoading, hasMore]
  );

  const handleTargetDeleted = () => navigate(-1);
  const handleStreamPostDeleted = (postId) => setFeedPosts((prev) => prev.filter((p) => p._id !== postId));

  return (
    <div className="w-full max-w-[1400px] mx-auto pb-safe-24 lg:pb-10">
      {/* Back header */}
      <div className="sticky top-0 z-30 bg-bg-base/95 backdrop-blur-xl border-b border-border-soft/50 lg:border-none lg:bg-transparent px-4 py-3.5 lg:px-4 lg:pt-4 lg:pb-0 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-bg-surface-hover text-text-primary transition-colors" aria-label="Back">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-text-primary">Post</h1>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6 lg:items-start lg:px-4 lg:pt-4">
        {/* Main content: target post + more posts stream */}
        <div className="min-w-0 space-y-4 sm:space-y-6 px-2 sm:px-4 lg:px-0 pt-4 lg:pt-0">
          {targetLoading ? (
            <div className="py-20 flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
            </div>
          ) : targetPost ? (
            <PostDetailCard post={targetPost} onPostDeleted={handleTargetDeleted} />
          ) : (
            <div className="text-center py-12 text-text-secondary">Post not found</div>
          )}

          {feedPosts.length > 0 && (
            <>
              <div className="border-t border-border-soft pt-6 space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary-500" />
                  <h2 className="text-lg font-bold text-text-primary">More from {originSource === 'profile' ? 'this Creator' : 'Feed'}</h2>
                </div>
                <p className="text-xs text-text-secondary">Keep scrolling to view more posts without going back.</p>
              </div>

              <div className="space-y-6">
                {feedPosts.map((postItem, idx) => {
                  const isLast = idx === feedPosts.length - 1;
                  return (
                    <div key={postItem._id} ref={isLast ? lastPostElementRef : null}>
                      <PostCard post={postItem} onPostDeleted={handleStreamPostDeleted} />
                    </div>
                  );
                })}
                {feedLoading && (
                  <div className="py-8 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right sidebar — desktop only */}
        <div className="hidden lg:flex flex-col gap-4">
          <LocationCard location={targetPost?.location} />
          <RelatedPostsPanel posts={feedPosts} sourceLabel={originSource} />
        </div>
      </div>
    </div>
  );
}
