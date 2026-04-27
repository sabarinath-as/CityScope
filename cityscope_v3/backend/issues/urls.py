from django.urls import path
from .views import (
    IssueListCreateView, IssueDetailView, MyIssuesView,
    VoteToggleView,
    CommentListCreateView, CommentDeleteView,
    NotificationListView, NotificationMarkReadView, UnreadCountView,
    DashboardView,
    AdminDashboardView, AdminComplaintListView, AdminComplaintDetailView, AdminUserListView,
)

urlpatterns = [
    # IMPORTANT: specific paths must come before dynamic <int:pk> paths
    path('issues/mine/',              MyIssuesView.as_view()),
    path('issues/',                   IssueListCreateView.as_view()),
    path('issues/<int:pk>/',          IssueDetailView.as_view()),
    path('issues/<int:pk>/vote/',     VoteToggleView.as_view()),
    path('issues/<int:pk>/comments/', CommentListCreateView.as_view()),
    path('comments/<int:pk>/',        CommentDeleteView.as_view()),

    path('notifications/',              NotificationListView.as_view()),
    path('notifications/read/',         NotificationMarkReadView.as_view()),
    path('notifications/unread-count/', UnreadCountView.as_view()),

    path('dashboard/', DashboardView.as_view()),

    path('admin/dashboard/',           AdminDashboardView.as_view()),
    path('admin/complaints/',          AdminComplaintListView.as_view()),
    path('admin/complaints/<int:pk>/', AdminComplaintDetailView.as_view()),
    path('admin/users/',               AdminUserListView.as_view()),
]