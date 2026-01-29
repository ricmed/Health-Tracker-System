from rest_framework import serializers
from .models import (
    Dashboard, DashboardTextBlock, DashboardFilter,
    DashboardPanel, DashboardPermission
)


class DashboardTextBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardTextBlock
        fields = [
            'id', 'block_type', 'title', 'content', 'order',
            'is_visible', 'style_config', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class DashboardFilterSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardFilter
        fields = [
            'id', 'name', 'label', 'filter_type', 'field_path',
            'options', 'default_value', 'order', 'is_required',
            'is_visible', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class DashboardPanelSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardPanel
        fields = [
            'id', 'title', 'chart_type', 'data_source',
            'x_axis_field', 'y_axis_field', 'aggregation', 'group_by',
            'chart_config', 'show_legend', 'show_values', 'show_grid',
            'x_axis_label', 'y_axis_label', 'color_scheme',
            'grid_position', 'order', 'is_visible',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class DashboardPermissionSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = DashboardPermission
        fields = ['id', 'user', 'user_email', 'user_name', 'permission_type', 'created_at']
        read_only_fields = ['created_at']


class DashboardListSerializer(serializers.ModelSerializer):
    health_problem_type_name = serializers.CharField(
        source='health_problem_type.name', read_only=True
    )
    health_problem_type_color = serializers.CharField(
        source='health_problem_type.color', read_only=True
    )
    created_by_name = serializers.CharField(
        source='created_by.get_full_name', read_only=True
    )
    panel_count = serializers.SerializerMethodField()

    class Meta:
        model = Dashboard
        fields = [
            'id', 'name', 'description', 'health_problem_type',
            'health_problem_type_name', 'health_problem_type_color',
            'is_public', 'is_active', 'logo',
            'created_by', 'created_by_name', 'panel_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']

    def get_panel_count(self, obj):
        return obj.panels.count()


class DashboardDetailSerializer(serializers.ModelSerializer):
    health_problem_type_name = serializers.CharField(
        source='health_problem_type.name', read_only=True
    )
    health_problem_type_color = serializers.CharField(
        source='health_problem_type.color', read_only=True
    )
    created_by_name = serializers.CharField(
        source='created_by.get_full_name', read_only=True
    )
    panels = DashboardPanelSerializer(many=True, read_only=True)
    filters = DashboardFilterSerializer(many=True, read_only=True)
    text_blocks = DashboardTextBlockSerializer(many=True, read_only=True)
    permissions = DashboardPermissionSerializer(many=True, read_only=True)

    class Meta:
        model = Dashboard
        fields = [
            'id', 'name', 'description', 'health_problem_type',
            'health_problem_type_name', 'health_problem_type_color',
            'is_public', 'is_active', 'logo', 'layout_config',
            'created_by', 'created_by_name',
            'panels', 'filters', 'text_blocks', 'permissions',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']


class DashboardCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dashboard
        fields = [
            'id', 'name', 'description', 'health_problem_type',
            'is_public', 'is_active', 'logo', 'layout_config'
        ]

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
