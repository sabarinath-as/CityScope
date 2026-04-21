from django.urls import path
from .views import (
    IssueListCreateView, IssueDetailView, IssueStatusUpdateView,
    VoteToggleView,
    CommentListCreateView, CommentDeleteView,
    NotificationListView, NotificationMarkReadView, UnreadNotificationCountView,
    DashboardView, MyIssuesView,
)

urlpatterns = [
    # Issues
    path('issues/', IssueListCreateView.as_view(), name='issue-list-create'),
    path('issues/<int:pk>/', IssueDetailView.as_view(), name='issue-detail'),
    path('issues/<int:pk>/status/', IssueStatusUpdateView.as_view(), name='issue-status'),
    path('issues/mine/', MyIssuesView.as_view(), name='my-issues'),

    # Votes
    path('issues/<int:pk>/vote/', VoteToggleView.as_view(), name='issue-vote'),

    # Comments
    path('issues/<int:pk>/comments/', CommentListCreateView.as_view(), name='issue-comments'),
    path('comments/<int:pk>/', CommentDeleteView.as_view(), name='comment-delete'),

    # Notifications
    path('notifications/', NotificationListView.as_view(), name='notifications'),
    path('notifications/read/', NotificationMarkReadView.as_view(), name='notifications-read-all'),
    path('notifications/<int:pk>/read/', NotificationMarkReadView.as_view(), name='notification-read'),
    path('notifications/unread-count/', UnreadNotificationCountView.as_view(), name='notifications-unread-count'),

    # Dashboard
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
]
