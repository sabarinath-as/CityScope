import django_filters
from .models import Issue


class IssueFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name='category', lookup_expr='exact')
    severity  = django_filters.CharFilter(field_name='severity',  lookup_expr='exact')
    status    = django_filters.CharFilter(field_name='status',    lookup_expr='exact')
    date_from = django_filters.DateFilter(field_name='created_at', lookup_expr='date__gte')
    date_to   = django_filters.DateFilter(field_name='created_at', lookup_expr='date__lte')

    class Meta:
        model  = Issue
        fields = ['category', 'severity', 'status', 'date_from', 'date_to']
