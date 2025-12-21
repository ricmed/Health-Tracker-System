from rest_framework import serializers
from .models import User, Role, Permission


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'name', 'code', 'description', 'permission_type']


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    roles = RoleSerializer(many=True, read_only=True)
    role_ids = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        many=True,
        write_only=True,
        source='roles',
        required=False
    )
    health_problem_permission_ids = serializers.PrimaryKeyRelatedField(
        queryset='health_problems.HealthProblemType',
        many=True,
        write_only=True,
        source='health_problem_permissions',
        required=False
    )
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone',
            'is_active', 'is_staff', 'roles', 'role_ids',
            'health_problem_permissions', 'health_problem_permission_ids',
            'full_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_full_name(self, obj):
        return obj.get_full_name()


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'phone', 'password', 'password_confirm']

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match'})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)
    new_password_confirm = serializers.CharField()

    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'Passwords do not match'})
        return data
