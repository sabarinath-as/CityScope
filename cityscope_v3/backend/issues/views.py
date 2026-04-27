from django.db.models import Count
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

from rest_framework import status, generics, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend

from .models import Issue, Vote, Comment, Notification
from .serializers import (
    IssueListSerializer, IssueDetailSerializer, IssueCreateSerializer,
    CommentSerializer, NotificationSerializer,
    AdminIssueSerializer, AdminIssueUpdateSerializer,
)
from .filters import IssueFilter
from .permissions import IsAdminUser


# ─── Helpers ─────────────────────────────────────────────────────────────────

def refresh_priority(issue):
    score = issue.calculate_priority()
    Issue.objects.filter(pk=issue.pk).update(priority_score=score)
    issue.priority_score = score


def notify(user, issue, ntype, message):
    if user != issue.user:
        Notification.objects.create(
            user=issue.user, issue=issue,
            notification_type=ntype, message=message,
        )


# ─── Issues (User) ────────────────────────────────────────────────────────────

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
        return IssueCreateSerializer if self.request.method == 'POST' else IssueListSerializer

    def get_serializer_context(self):
        return {**super().get_serializer_context(), 'request': self.request}

    def create(self, request, *args, **kwargs):
        s = self.get_serializer(data=request.data)
        s.is_valid(raise_exception=True)
        issue = s.save()
        return Response(
            IssueDetailSerializer(issue, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class IssueDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Issue.objects.select_related('user').prefetch_related('votes', 'comments__user')
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    serializer_class = IssueDetailSerializer

    def get_serializer_context(self):
        return {**super().get_serializer_context(), 'request': self.request}

    def destroy(self, request, *args, **kwargs):
        issue = self.get_object()
        if issue.user != request.user and not request.user.is_staff:
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        issue.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyIssuesView(generics.ListAPIView):
    serializer_class = IssueListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Issue.objects.filter(user=self.request.user).select_related('user').prefetch_related('votes', 'comments')

    def get_serializer_context(self):
        return {**super().get_serializer_context(), 'request': self.request}


# ─── Votes ────────────────────────────────────────────────────────────────────

class VoteToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            issue = Issue.objects.get(pk=pk)
        except Issue.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        vote, created = Vote.objects.get_or_create(user=request.user, issue=issue)
        if not created:
            vote.delete()
            action = 'removed'
        else:
            action = 'added'
            notify(request.user, issue, 'new_vote',
                   f'{request.user.username} upvoted your issue "{issue.title}".')

        refresh_priority(issue)
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

    def create(self, request, *args, **kwargs):
        try:
            issue = Issue.objects.get(pk=self.kwargs['pk'])
        except Issue.DoesNotExist:
            return Response({'detail': 'Issue not found.'}, status=status.HTTP_404_NOT_FOUND)

        s = self.get_serializer(data=request.data)
        s.is_valid(raise_exception=True)
        comment = s.save(user=request.user, issue=issue)
        notify(request.user, issue, 'new_comment',
               f'{request.user.username} commented on your issue "{issue.title}".')
        return Response(CommentSerializer(comment).data, status=status.HTTP_201_CREATED)


class CommentDeleteView(generics.DestroyAPIView):
    queryset = Comment.objects.all()
    permission_classes = [IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        comment = self.get_object()
        if comment.user != request.user and not request.user.is_staff:
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        comment.delete()
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
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'detail': 'All marked as read.'})


class UnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count})


# ─── Public Dashboard ─────────────────────────────────────────────────────────

class DashboardView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        now = timezone.now()
        by_cat = dict(Issue.objects.values('category').annotate(c=Count('id')).values_list('category', 'c'))
        by_status = dict(Issue.objects.values('status').annotate(c=Count('id')).values_list('status', 'c'))
        by_sev = dict(Issue.objects.values('severity').annotate(c=Count('id')).values_list('severity', 'c'))

        trend = []
        for i in range(29, -1, -1):
            day = now - timedelta(days=i)
            d_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            d_end   = day.replace(hour=23, minute=59, second=59)
            trend.append({
                'date': d_start.strftime('%Y-%m-%d'),
                'count': Issue.objects.filter(status='resolved', updated_at__range=(d_start, d_end)).count(),
            })

        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT ROUND(latitude,2) lat, ROUND(longitude,2) lng, COUNT(*) cnt
                FROM issues_issue GROUP BY lat, lng ORDER BY cnt DESC LIMIT 10
            """)
            top_areas = [{'lat': r[0], 'lng': r[1], 'count': r[2]} for r in cursor.fetchall()]

        return Response({
            'total_issues': Issue.objects.count(),
            'issues_by_category': by_cat,
            'issues_by_status': by_status,
            'issues_by_severity': by_sev,
            'resolution_trend': trend,
            'top_areas': top_areas,
            'recent_resolved': Issue.objects.filter(
                status='resolved', updated_at__gte=now - timedelta(days=30)
            ).count(),
        })


# ─── Admin Views ──────────────────────────────────────────────────────────────

class AdminDashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        now = timezone.now()

        total   = Issue.objects.count()
        pending = Issue.objects.filter(status='pending').count()
        in_prog = Issue.objects.filter(status='in_progress').count()
        resolved = Issue.objects.filter(status='resolved').count()

        by_cat = dict(Issue.objects.values('category').annotate(c=Count('id')).values_list('category', 'c'))
        by_sev = dict(Issue.objects.values('severity').annotate(c=Count('id')).values_list('severity', 'c'))

        trend = []
        for i in range(6, -1, -1):
            day = now - timedelta(days=i)
            d_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            d_end   = day.replace(hour=23, minute=59, second=59)
            trend.append({
                'date': d_start.strftime('%b %d'),
                'count': Issue.objects.filter(created_at__range=(d_start, d_end)).count(),
            })

        recent = Issue.objects.select_related('user').order_by('-created_at')[:5]

        return Response({
            'total_issues': total,
            'pending_issues': pending,
            'in_progress_issues': in_prog,
            'resolved_issues': resolved,
            'open_issues': pending + in_prog,
            'total_users': User.objects.filter(is_staff=False).count(),
            'issues_by_category': by_cat,
            'issues_by_severity': by_sev,
            'weekly_trend': trend,
            'recent_issues': [
                {
                    'id': i.id, 'title': i.title, 'status': i.status,
                    'category': i.category, 'severity': i.severity,
                    'user': i.user.username,
                    'created_at': i.created_at.strftime('%Y-%m-%d'),
                }
                for i in recent
            ],
        })


class AdminComplaintListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminIssueSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = IssueFilter
    search_fields = ['title', 'description', 'user__username']
    ordering_fields = ['created_at', 'updated_at', 'priority_score', 'severity', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        return Issue.objects.select_related('user').prefetch_related('votes', 'comments')

    def get_serializer_context(self):
        return {**super().get_serializer_context(), 'request': self.request}


class AdminComplaintDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get_object(self, pk):
        try:
            return Issue.objects.select_related('user').prefetch_related('votes', 'comments__user').get(pk=pk)
        except Issue.DoesNotExist:
            return None

    def get(self, request, pk):
        issue = self.get_object(pk)
        if not issue:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(AdminIssueSerializer(issue, context={'request': request}).data)

    def patch(self, request, pk):
        issue = self.get_object(pk)
        if not issue:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        old_status = issue.status
        s = AdminIssueUpdateSerializer(issue, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        updated = s.save()

        if old_status != updated.status:
            Notification.objects.create(
                user=issue.user, issue=issue,
                notification_type='status_change',
                message=f'Your complaint "{issue.title}" was updated to "{updated.status}" by admin.',
            )
            refresh_priority(updated)

        return Response(AdminIssueSerializer(updated, context={'request': request}).data)

    def delete(self, request, pk):
        issue = self.get_object(pk)
        if not issue:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        issue.delete()
        return Response({'detail': 'Deleted.'}, status=status.HTTP_200_OK)


class AdminUserListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        users = User.objects.filter(is_staff=False).annotate(
            complaint_count=Count('issues')
        ).order_by('-date_joined')
        return Response({
            'count': users.count(),
            'results': [
                {
                    'id': u.id, 'username': u.username, 'email': u.email,
                    'first_name': u.first_name, 'last_name': u.last_name,
                    'date_joined': u.date_joined.strftime('%Y-%m-%d'),
                    'complaint_count': u.complaint_count,
                    'is_active': u.is_active,
                }
                for u in users
            ],
        })
