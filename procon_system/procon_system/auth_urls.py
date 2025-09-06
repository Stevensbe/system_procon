from django.urls import path
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView
)

class AuthRootView(APIView):
    def get(self, request, *args, **kwargs):
        data = {
            "message": "Authentication Endpoints",
            "endpoints": {
                "token_obtain_pair": request.build_absolute_uri('token/'),
                "token_refresh": request.build_absolute_uri('refresh/'),
                "token_verify": request.build_absolute_uri('verify/'),
            }
        }
        return Response(data, status=status.HTTP_200_OK)

urlpatterns = [
    path('', AuthRootView.as_view(), name='auth_root'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('verify/', TokenVerifyView.as_view(), name='token_verify'),
]
