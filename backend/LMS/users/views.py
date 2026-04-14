from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import authenticate
from users.models import User
from users.serializers import RegisterSerializer, LoginSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class LoginView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(username=username, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "id": user.id,
                "role": user.role,
                "username": user.username,
            })
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

class SocialLoginView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def post(self, request):
        provider = request.data.get("provider")
        email = request.data.get("email")
        role = request.data.get("role", "student")

        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Domain filtering for Students specifically requested by user rules
        if role == "student" and not email.lower().endswith("@ybit.ac.in"):
            return Response({"error": "Students must register with their college email only (@ybit.ac.in)"}, status=status.HTTP_400_BAD_REQUEST)

        # MOCK IMPLEMENTATION: Real OAuth Token verification should happen here using google-auth / facebook SDKs.  
        # Once tokens are verified, grab standard response parameters containing user email / details.
        
        user, created = User.objects.get_or_create(email=email, defaults={
            "username": email.split("@")[0] + ("_" + provider if provider else ""),
            "role": role,
            "is_active": True
        })

        refresh = RefreshToken.for_user(user)
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "id": user.id,
            "role": user.role,
            "username": user.username,
            "is_new": created
        }, status=status.HTTP_200_OK)
