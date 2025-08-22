from rest_framework import serializers
from .models import CustomUser, Owner


class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "email", "is_active", "is_staff", "role", "created_at"]


class OwnerSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)  # Nesting CustomUser details
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(), write_only=True
    )

    class Meta:
        model = Owner
        fields = ["id", "user", "user_id", "permissions"]
