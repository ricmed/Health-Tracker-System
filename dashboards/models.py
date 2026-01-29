from django.db import models
from django.conf import settings


class Dashboard(models.Model):
    """Main dashboard/report container"""
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    health_problem_type = models.ForeignKey(
        'health_problems.HealthProblemType',
        on_delete=models.CASCADE,
        related_name='dashboards'
    )
    is_public = models.BooleanField(default=False, help_text='Publicly accessible without login')
    is_active = models.BooleanField(default=True)
    logo = models.TextField(blank=True, help_text='Base64 encoded logo or URL')
    layout_config = models.JSONField(
        default=dict,
        help_text='Grid layout configuration for panels'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_dashboards'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class DashboardTextBlock(models.Model):
    """Text content blocks for dashboards"""
    BLOCK_TYPES = [
        ('header', 'Header'),
        ('description', 'Description'),
        ('note', 'Note'),
        ('source', 'Data Source'),
        ('methodology', 'Methodology'),
    ]

    dashboard = models.ForeignKey(
        Dashboard,
        on_delete=models.CASCADE,
        related_name='text_blocks'
    )
    block_type = models.CharField(max_length=20, choices=BLOCK_TYPES)
    title = models.CharField(max_length=255, blank=True)
    content = models.TextField()
    order = models.PositiveIntegerField(default=0)
    is_visible = models.BooleanField(default=True)
    style_config = models.JSONField(
        default=dict,
        help_text='Styling configuration (font size, color, etc.)'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.block_type}: {self.title or self.content[:50]}"


class DashboardFilter(models.Model):
    """Dynamic filters for dashboards"""
    FILTER_TYPES = [
        ('select', 'Single Select'),
        ('multiselect', 'Multi Select'),
        ('date', 'Date'),
        ('date_range', 'Date Range'),
        ('text', 'Text Search'),
        ('number_range', 'Number Range'),
    ]

    dashboard = models.ForeignKey(
        Dashboard,
        on_delete=models.CASCADE,
        related_name='filters'
    )
    name = models.CharField(max_length=100)
    label = models.CharField(max_length=255)
    filter_type = models.CharField(max_length=20, choices=FILTER_TYPES)
    field_path = models.CharField(
        max_length=255,
        help_text='Path to the field in data (e.g., patient.state, severity)'
    )
    options = models.JSONField(
        default=list,
        blank=True,
        help_text='Static options or query for dynamic options'
    )
    default_value = models.JSONField(
        null=True,
        blank=True,
        help_text='Default filter value'
    )
    order = models.PositiveIntegerField(default=0)
    is_required = models.BooleanField(default=False)
    is_visible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.label} ({self.filter_type})"


class DashboardPanel(models.Model):
    """Individual chart/visualization panels"""
    CHART_TYPES = [
        ('bar_vertical', 'Vertical Bar Chart'),
        ('bar_horizontal', 'Horizontal Bar Chart'),
        ('bar_grouped', 'Grouped Bar Chart'),
        ('bar_stacked', 'Stacked Bar Chart'),
        ('line', 'Line Chart'),
        ('area', 'Area Chart'),
        ('pie', 'Pie Chart'),
        ('donut', 'Donut Chart'),
        ('scatter', 'Scatter Plot'),
        ('choropleth', 'Choropleth Map (Brazil)'),
        ('table', 'Data Table'),
        ('metric', 'Single Metric/KPI'),
        ('flowchart', 'Flow Diagram'),
        ('timeline', 'Timeline'),
        ('heatmap', 'Heatmap'),
    ]

    AGGREGATION_TYPES = [
        ('count', 'Count'),
        ('sum', 'Sum'),
        ('avg', 'Average'),
        ('min', 'Minimum'),
        ('max', 'Maximum'),
        ('distinct', 'Distinct Count'),
    ]

    dashboard = models.ForeignKey(
        Dashboard,
        on_delete=models.CASCADE,
        related_name='panels'
    )
    title = models.CharField(max_length=255)
    chart_type = models.CharField(max_length=30, choices=CHART_TYPES)
    
    data_source = models.JSONField(
        default=dict,
        help_text='Configuration for data query (model, fields, filters)'
    )
    
    x_axis_field = models.CharField(max_length=255, blank=True, help_text='Field for X axis')
    y_axis_field = models.CharField(max_length=255, blank=True, help_text='Field for Y axis')
    aggregation = models.CharField(max_length=20, choices=AGGREGATION_TYPES, default='count')
    group_by = models.CharField(max_length=255, blank=True, help_text='Field to group data by')
    
    chart_config = models.JSONField(
        default=dict,
        help_text='Chart-specific configuration (colors, legend, tooltips, etc.)'
    )
    
    show_legend = models.BooleanField(default=True)
    show_values = models.BooleanField(default=True)
    show_grid = models.BooleanField(default=True)
    
    x_axis_label = models.CharField(max_length=255, blank=True)
    y_axis_label = models.CharField(max_length=255, blank=True)
    
    color_scheme = models.JSONField(
        default=list,
        blank=True,
        help_text='Custom color palette for chart'
    )
    
    grid_position = models.JSONField(
        default=dict,
        help_text='Position in dashboard grid (x, y, width, height)'
    )
    
    order = models.PositiveIntegerField(default=0)
    is_visible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.title} ({self.chart_type})"


class DashboardPermission(models.Model):
    """User permissions for specific dashboards"""
    PERMISSION_TYPES = [
        ('view', 'View Only'),
        ('edit', 'Edit'),
        ('admin', 'Full Admin'),
    ]

    dashboard = models.ForeignKey(
        Dashboard,
        on_delete=models.CASCADE,
        related_name='permissions'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='dashboard_permissions'
    )
    permission_type = models.CharField(max_length=20, choices=PERMISSION_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['dashboard', 'user']

    def __str__(self):
        return f"{self.user} - {self.dashboard} ({self.permission_type})"
