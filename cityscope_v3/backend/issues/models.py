from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

CATEGORY_CHOICES = [
    ('road', 'Road'),
    ('water', 'Water'),
    ('electricity', 'Electricity'),
    ('waste', 'Waste'),
]

SEVERITY_CHOICES = [
    ('low', 'Low'),
    ('medium', 'Medium'),
    ('high', 'High'),
]

STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('reported', 'Reported'),
    ('in_progress', 'In Progress'),
    ('resolved', 'Resolved'),
]

SEVERITY_WEIGHTS = {'low': 1, 'medium': 3, 'high': 5}


class Issue(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    image = models.ImageField(upload_to='issues/', blank=True, null=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='low')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_comment = models.TextField(blank=True, default='')
    priority_score = models.FloatField(default=0.0)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='issues')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-priority_score', '-created_at']

    def __str__(self):
        return f'[{self.category}] {self.title}'

    def calculate_priority(self):
        upvotes = self.votes.count()
        severity_weight = SEVERITY_WEIGHTS.get(self.severity, 1)
        age_days = (timezone.now() - self.created_at).days
        age_factor = age_days * 0.1
        return round((upvotes * 2) + severity_weight - age_factor, 2)


class Vote(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='votes')
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='votes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'issue')

    def __str__(self):
        return f'{self.user.username} -> Issue #{self.issue.id}'


class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='comments')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'Comment by {self.user.username} on #{self.issue.id}'


class Notification(models.Model):
    TYPES = [
        ('status_change', 'Status Changed'),
        ('new_comment', 'New Comment'),
        ('new_vote', 'New Vote'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=TYPES)
    message = models.CharField(max_length=500)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Notif for {self.user.username}: {self.message[:40]}'
