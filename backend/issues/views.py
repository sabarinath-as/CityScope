from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from rest_framework import status, generics, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, IsAuthenticatedOrReadOnly
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend

from .models import Issue, Vote, Comment, Notification
from .serializers import (
    IssueListSerializer, IssueDetailSerializer, IssueCreateSerializer,
    CommentSerializer, NotificationSerializer
)
from .filters import IssueFilter


def _refresh_priority(issue):
    """Recalculate and persist priority score for an issue."""
    issue.priority_score = issue.calculate_priority()
    Issue.objects.filter(pk=issue.pk).update(priority_score=issue.priority_score)


def _notify_issue_owner(issue, actor, notification_type, message):
    """Create a notification for the issue owner (if they are not the actor)."""
    if issue.user != actor:
        Notification.objects.create(
            user=issue.user,
            issue=issue,
            notification_type=notification_type,
            message=message,
        )


# ─── Issues ───────────────────────────────────────────────────────────────────

class IssueListCreateView(generics.ListCreateAPIView):
    queryset = Issue.objects.select_related('user').prefetch_related('votes', 'comments')
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = IssueFilter
    search_fields = ['title', 'description']
    ordering_fields = ['priority_score', 'created_at', 'severity']
    ordering = ['-priority_score']
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return IssueCreateSerializer
        return IssueListSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        serializer.save()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        issue = serializer.save()
        out = IssueDetailSerializer(issue, context={'request': request})
        return Response(out.data, status=status.HTTP_201_CREATED)


class IssueDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Issue.objects.select_related('user').prefetch_related('votes', 'comments__user')
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        return IssueDetailSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        # Only admin can change status; owner can edit other fields
        if 'status' in request.data and not request.user.is_staff:
            return Response({'detail': 'Only admins can update issue status.'}, status=status.HTTP_403_FORBIDDEN)

        old_status = instance.status
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()

        # Notify issue owner on status change
        new_status = updated.status
        if old_status != new_status:
            _notify_issue_owner(
                updated, request.user,
                'status_change',
                f'Your issue "{updated.title}" status changed from "{old_status}" to "{new_status}".'
            )

        _refresh_priority(updated)
        return Response(IssueDetailSerializer(updated, context={'request': request}).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.user != request.user and not request.user.is_staff:
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class IssueStatusUpdateView(APIView):
    """Admin-only endpoint to update status."""
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            issue = Issue.objects.get(pk=pk)
        except Issue.DoesNotExist:
            return Response({'detail': 'Issue not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status not in ['reported', 'in_progress', 'resolved']:
            return Response({'detail': 'Invalid status value.'}, status=status.HTTP_400_BAD_REQUEST)

        old_status = issue.status
        issue.status = new_status
        issue.save()

        if old_status != new_status:
            _notify_issue_owner(
                issue, request.user,
                'status_change',
                f'Your issue "{issue.title}" status was updated to "{new_status}".'
            )
            _refresh_priority(issue)

        return Response(IssueDetailSerializer(issue, context={'request': request}).data)


# ─── Votes ────────────────────────────────────────────────────────────────────

class VoteToggleView(APIView):
    """Toggle upvote: vote if not voted, unvote if already voted."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            issue = Issue.objects.get(pk=pk)
        except Issue.DoesNotExist:
            return Response({'detail': 'Issue not found.'}, status=status.HTTP_404_NOT_FOUND)

        vote, created = Vote.objects.get_or_create(user=request.user, issue=issue)
        if not created:
            vote.delete()
            action = 'removed'
        else:
            action = 'added'
            _notify_issue_owner(
                issue, request.user,
                'new_vote',
                f'{request.user.username} upvoted your issue "{issue.title}".'
            )

        _refresh_priority(issue)
        issue.refresh_from_db()

        return Response({
            'action': action,
            'vote_count': issue.votes.count(),
            'has_voted': action == 'added',
            'priority_score': issue.priority_score,
        })


# ─── Comments ─────────────────────────────────────────────────────────────────

class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Comment.objects.filter(issue_id=self.kwargs['pk']).select_related('user')

    def perform_create(self, serializer):
        try:
            issue = Issue.objects.get(pk=self.kwargs['pk'])
        except Issue.DoesNotExist:
            return Response({'detail': 'Issue not found.'}, status=status.HTTP_404_NOT_FOUND)

        comment = serializer.save(user=self.request.user, issue=issue)

        _notify_issue_owner(
            issue, self.request.user,
            'new_comment',
            f'{self.request.user.username} commented on your issue "{issue.title}".'
        )
        return comment


class CommentDeleteView(generics.DestroyAPIView):
    queryset = Comment.objects.all()
    permission_classes = [IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        comment = self.get_object()
        if comment.user != request.user and not request.user.is_staff:
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        self.perform_destroy(comment)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Notifications ────────────────────────────────────────────────────────────

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Mark all notifications as read for the current user."""
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'detail': 'All notifications marked as read.'})

    def patch(self, request, pk):
        """Mark a single notification as read."""
        try:
            notif = Notification.objects.get(pk=pk, user=request.user)
        except Notification.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        notif.is_read = True
        notif.save()
        return Response(NotificationSerializer(notif).data)


class UnreadNotificationCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count})


# ─── Dashboard ────────────────────────────────────────────────────────────────

class DashboardView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)

        total_issues = Issue.objects.count()

        issues_by_category = dict(
            Issue.objects.values('category').annotate(count=Count('id')).values_list('category', 'count')
        )

        issues_by_status = dict(
            Issue.objects.values('status').annotate(count=Count('id')).values_list('status', 'count')
        )

        issues_by_severity = dict(
            Issue.objects.values('severity').annotate(count=Count('id')).values_list('severity', 'count')
        )

        # Resolution trend: resolved issues over last 30 days (daily counts)
        resolution_trend = []
        for i in range(29, -1, -1):
            day = now - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day.replace(hour=23, minute=59, second=59)
            count = Issue.objects.filter(
                status='resolved',
                updated_at__range=(day_start, day_end)
            ).count()
            resolution_trend.append({
                'date': day_start.strftime('%Y-%m-%d'),
                'count': count,
            })

        # Top affected areas: round lat/lng to 2 decimals to cluster nearby issues
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT ROUND(latitude, 2) as lat, ROUND(longitude, 2) as lng, COUNT(*) as count
                FROM issues_issue
                GROUP BY lat, lng
                ORDER BY count DESC
                LIMIT 10
            """)
            rows = cursor.fetchall()
            top_areas = [{'lat': r[0], 'lng': r[1], 'count': r[2]} for r in rows]

        recent_resolved = Issue.objects.filter(
            status='resolved',
            updated_at__gte=thirty_days_ago
        ).count()

        return Response({
            'total_issues': total_issues,
            'issues_by_category': issues_by_category,
            'issues_by_status': issues_by_status,
            'issues_by_severity': issues_by_severity,
            'resolution_trend': resolution_trend,
            'top_areas': top_areas,
            'recent_resolved': recent_resolved,
        })


class MyIssuesView(generics.ListAPIView):
    serializer_class = IssueListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Issue.objects.filter(user=self.request.user).select_related('user').prefetch_related('votes', 'comments')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
