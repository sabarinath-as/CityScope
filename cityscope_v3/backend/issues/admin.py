from django.contrib import admin
from .models import Issue, Vote, Comment, Notification


@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
    list_display  = ['id', 'title', 'category', 'severity', 'status', 'user', 'priority_score', 'created_at']
    list_filter   = ['category', 'severity', 'status']
    search_fields = ['title', 'description', 'user__username']
    readonly_fields = ['priority_score', 'created_at', 'updated_at']
    actions = ['mark_in_progress', 'mark_resolved']

    def mark_in_progress(self, request, queryset):
        queryset.update(status='in_progress')
    mark_in_progress.short_description = 'Mark selected as In Progress'

    def mark_resolved(self, request, queryset):
        queryset.update(status='resolved')
    mark_resolved.short_description = 'Mark selected as Resolved'


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'issue', 'created_at']


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'issue', 'created_at']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'notification_type', 'is_read', 'created_at']
