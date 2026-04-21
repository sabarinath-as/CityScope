from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Issue, Vote, Comment, Notification


class SimpleUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']


class CommentSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'user', 'issue', 'text', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'issue', 'created_at', 'updated_at']

class VoteSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)

    class Meta:
        model = Vote
        fields = ['id', 'user', 'issue', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class IssueListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    user = SimpleUserSerializer(read_only=True)
    vote_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    has_voted = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Issue
        fields = [
            'id', 'title', 'description', 'image_url', 'latitude', 'longitude',
            'category', 'severity', 'status', 'user', 'created_at', 'updated_at',
            'priority_score', 'vote_count', 'comment_count', 'has_voted',
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


class IssueDetailSerializer(serializers.ModelSerializer):
    """Full serializer for detail views — includes comments."""
    user = SimpleUserSerializer(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    vote_count = serializers.SerializerMethodField()
    has_voted = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Issue
        fields = [
            'id', 'title', 'description', 'image', 'image_url', 'latitude', 'longitude',
            'category', 'severity', 'status', 'user', 'created_at', 'updated_at',
            'priority_score', 'vote_count', 'has_voted', 'comments',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'priority_score']

    def get_vote_count(self, obj):
        return obj.votes.count()

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


class IssueCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Issue
        fields = [
            'id', 'title', 'description', 'image', 'latitude', 'longitude',
            'category', 'severity',
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        user = self.context['request'].user
        issue = Issue.objects.create(user=user, **validated_data)
        # Calculate priority for new issue (upvotes=0)
        issue.priority_score = issue.calculate_priority()
        issue.save()
        return issue


class NotificationSerializer(serializers.ModelSerializer):
    issue_title = serializers.CharField(source='issue.title', read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'issue', 'issue_title', 'notification_type', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'issue', 'issue_title', 'notification_type', 'message', 'created_at']


class DashboardSerializer(serializers.Serializer):
    """Serializer for dashboard statistics."""
    total_issues = serializers.IntegerField()
    issues_by_category = serializers.DictField()
    issues_by_status = serializers.DictField()
    issues_by_severity = serializers.DictField()
    resolution_trend = serializers.ListField()
    top_areas = serializers.ListField()
    recent_resolved = serializers.IntegerField()
