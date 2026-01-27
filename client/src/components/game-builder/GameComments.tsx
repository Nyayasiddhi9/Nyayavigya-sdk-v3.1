import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageCircle, 
  Heart, 
  Reply, 
  Flag, 
  ThumbsUp,
  ThumbsDown,
  Star
} from 'lucide-react';

interface GameCommentsProps {
  gameId: number;
}

interface Comment {
  id: number;
  user: {
    name: string;
    avatar: string;
    level: number;
  };
  content: string;
  timestamp: string;
  likes: number;
  dislikes: number;
  rating?: number;
  replies: Comment[];
  hasLiked: boolean;
  hasDisliked: boolean;
}

export function GameComments({ gameId }: GameCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const { toast } = useToast();

  const [comments, setComments] = useState<Comment[]>([
    {
      id: 1,
      user: {
        name: 'Sarah M.',
        avatar: 'SM',
        level: 12
      },
      content: 'This game really helped me during my anxiety episodes. The breathing exercises between levels are perfect!',
      timestamp: '2 hours ago',
      likes: 24,
      dislikes: 1,
      rating: 5,
      replies: [
        {
          id: 2,
          user: {
            name: 'Dr. James K.',
            avatar: 'JK',
            level: 8
          },
          content: 'That\'s wonderful to hear! The therapeutic design elements are evidence-based.',
          timestamp: '1 hour ago',
          likes: 12,
          dislikes: 0,
          replies: [],
          hasLiked: false,
          hasDisliked: false
        }
      ],
      hasLiked: false,
      hasDisliked: false
    },
    {
      id: 3,
      user: {
        name: 'Miguel R.',
        avatar: 'MR',
        level: 6
      },
      content: 'Great game for kids! My 8-year-old loves the colorful graphics and educational content.',
      timestamp: '4 hours ago',
      likes: 18,
      dislikes: 0,
      rating: 4,
      replies: [],
      hasLiked: true,
      hasDisliked: false
    },
    {
      id: 4,
      user: {
        name: 'Eleanor P.',
        avatar: 'EP',
        level: 15
      },
      content: 'As a senior, I appreciate the large buttons and clear instructions. Memory challenges are just right!',
      timestamp: '6 hours ago',
      likes: 31,
      dislikes: 2,
      rating: 5,
      replies: [],
      hasLiked: false,
      hasDisliked: false
    }
  ]);

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now(),
      user: {
        name: 'You',
        avatar: 'YU',
        level: 5
      },
      content: newComment,
      timestamp: 'Just now',
      likes: 0,
      dislikes: 0,
      rating: newRating > 0 ? newRating : undefined,
      replies: [],
      hasLiked: false,
      hasDisliked: false
    };

    setComments(prev => [comment, ...prev]);
    setNewComment('');
    setNewRating(0);

    toast({
      title: "Comment Posted",
      description: "Your comment has been added to the discussion.",
    });
  };

  const handleReply = (parentId: number) => {
    if (!replyText.trim()) return;

    const reply: Comment = {
      id: Date.now(),
      user: {
        name: 'You',
        avatar: 'YU',
        level: 5
      },
      content: replyText,
      timestamp: 'Just now',
      likes: 0,
      dislikes: 0,
      replies: [],
      hasLiked: false,
      hasDisliked: false
    };

    setComments(prev => prev.map(comment => 
      comment.id === parentId 
        ? { ...comment, replies: [...comment.replies, reply] }
        : comment
    ));

    setReplyText('');
    setReplyingTo(null);

    toast({
      title: "Reply Posted",
      description: "Your reply has been added.",
    });
  };

  const handleLike = (commentId: number, isReply: boolean = false, parentId?: number) => {
    if (isReply && parentId) {
      setComments(prev => prev.map(comment => 
        comment.id === parentId 
          ? {
              ...comment,
              replies: comment.replies.map(reply =>
                reply.id === commentId
                  ? {
                      ...reply,
                      likes: reply.hasLiked ? reply.likes - 1 : reply.likes + 1,
                      dislikes: reply.hasDisliked ? reply.dislikes - 1 : reply.dislikes,
                      hasLiked: !reply.hasLiked,
                      hasDisliked: false
                    }
                  : reply
              )
            }
          : comment
      ));
    } else {
      setComments(prev => prev.map(comment =>
        comment.id === commentId
          ? {
              ...comment,
              likes: comment.hasLiked ? comment.likes - 1 : comment.likes + 1,
              dislikes: comment.hasDisliked ? comment.dislikes - 1 : comment.dislikes,
              hasLiked: !comment.hasLiked,
              hasDisliked: false
            }
          : comment
      ));
    }
  };

  const StarRating = ({ rating, onRatingChange, readonly = false }: {
    rating: number;
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
  }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating 
              ? 'fill-yellow-400 text-yellow-400' 
              : 'text-gray-300'
          } ${!readonly ? 'cursor-pointer hover:text-yellow-400' : ''}`}
          onClick={() => !readonly && onRatingChange?.(star)}
        />
      ))}
    </div>
  );

  const CommentItem = ({ 
    comment, 
    isReply = false, 
    parentId 
  }: { 
    comment: Comment; 
    isReply?: boolean; 
    parentId?: number; 
  }) => (
    <div className={`${isReply ? 'ml-12 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="text-sm font-medium">
            {comment.user.avatar}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{comment.user.name}</span>
            <Badge variant="outline" className="text-xs">
              Level {comment.user.level}
            </Badge>
            <span className="text-xs text-gray-500">{comment.timestamp}</span>
            {comment.rating && (
              <div className="flex items-center gap-1">
                <StarRating rating={comment.rating} readonly />
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-700 leading-relaxed">
            {comment.content}
          </p>
          
          <div className="flex items-center gap-4">
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 px-2 text-xs"
              onClick={() => handleLike(comment.id, isReply, parentId)}
            >
              <Heart className={`h-3 w-3 mr-1 ${comment.hasLiked ? 'fill-red-500 text-red-500' : ''}`} />
              {comment.likes}
            </Button>
            
            {!isReply && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 px-2 text-xs"
                onClick={() => setReplyingTo(comment.id)}
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}
            
            <Button size="sm" variant="ghost" className="h-8 px-2 text-xs">
              <Flag className="h-3 w-3 mr-1" />
              Report
            </Button>
          </div>

          {replyingTo === comment.id && (
            <div className="mt-3 space-y-2">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                className="text-sm"
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => handleReply(comment.id)}>
                  Post Reply
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyText('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map(reply => (
                <CommentItem 
                  key={reply.id} 
                  comment={reply} 
                  isReply={true} 
                  parentId={comment.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Comment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            Share Your Experience
          </CardTitle>
          <CardDescription>
            Help others by sharing your thoughts and rating this game
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Your Rating</label>
            <StarRating 
              rating={newRating} 
              onRatingChange={setNewRating}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Your Comment</label>
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your experience with this game..."
              rows={3}
            />
          </div>
          
          <Button onClick={handleSubmitComment} disabled={!newComment.trim()}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Post Comment
          </Button>
        </CardContent>
      </Card>

      {/* Comments List */}
      <Card>
        <CardHeader>
          <CardTitle>Community Feedback ({comments.length} comments)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}