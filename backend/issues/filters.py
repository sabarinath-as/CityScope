import django_filters
from .models import Issue


class IssueFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name='category', lookup_expr='exact')
    severity = django_filters.CharFilter(field_name='severity', lookup_expr='exact')
    status = django_filters.CharFilter(field_name='status', lookup_expr='exact')
    user = django_filters.NumberFilter(field_name='user__id')
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = Issue
        fields = ['category', 'severity', 'status', 'user', 'created_after', 'created_before']
