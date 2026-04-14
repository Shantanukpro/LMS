from rest_framework import serializers
from django.contrib.auth import authenticate
from users.models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role']


class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'role']
        extra_kwargs = {'password': {'write_only': True}}

    def validate(self, data):
        role = data.get('role', 'student')
        email = data.get('email', '')
        if role == 'student' and not email.endswith('@ybit.ac.in'):
            raise serializers.ValidationError({"email": "Students must register with their college email only (@ybit.ac.in)"})
        return data

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(**data)
        if user and user.is_active:
            return user
        raise serializers.ValidationError("Invalid Credentials")
