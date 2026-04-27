from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Issue, Vote, Comment, Notification


class SimpleUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'is_staff']


class CommentSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'user', 'issue', 'text', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'issue', 'created_at', 'updated_at']


class IssueListSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)
    vote_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    has_voted = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Issue
        fields = [
            'id', 'title', 'description', 'image_url', 'latitude', 'longitude',
            'category', 'severity', 'status', 'admin_comment', 'user',
            'created_at', 'updated_at', 'priority_score',
            'vote_count', 'comment_count', 'has_voted',
        ]

    def get_vote_count(self, obj):
        return obj.votes.count()

    def get_comment_count(self, obj):
        return obj.comments.count()

    def get_has_voted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.votes.filter(user=request.user).exists()
        return False

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None


class IssueDetailSerializer(IssueListSerializer):
    comments = CommentSerializer(many=True, read_only=True)

    class Meta(IssueListSerializer.Meta):
        fields = IssueListSerializer.Meta.fields + ['comments']


class IssueCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Issue
        fields = ['id', 'title', 'description', 'image', 'latitude', 'longitude',
                  'category', 'severity']
        read_only_fields = ['id']

    def create(self, validated_data):
        user = self.context['request'].user
        issue = Issue.objects.create(user=user, **validated_data)
        issue.priority_score = issue.calculate_priority()
        Issue.objects.filter(pk=issue.pk).update(priority_score=issue.priority_score)
        return issue


class NotificationSerializer(serializers.ModelSerializer):
    issue_title = serializers.CharField(source='issue.title', read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'issue', 'issue_title', 'notification_type', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'issue', 'issue_title', 'notification_type', 'message', 'created_at']


# ── Admin serializers ─────────────────────────────────────────────────────────

class AdminIssueSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)
    vote_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Issue
        fields = [
            'id', 'title', 'description', 'image_url', 'latitude', 'longitude',
            'category', 'severity', 'status', 'admin_comment', 'user',
            'created_at', 'updated_at', 'priority_score',
            'vote_count', 'comment_count',
        ]

    def get_vote_count(self, obj):
        return obj.votes.count()

    def get_comment_count(self, obj):
        return obj.comments.count()

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None


class AdminIssueUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Issue
        fields = ['status', 'admin_comment']
