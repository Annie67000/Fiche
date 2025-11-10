# fiche_paie/logout_views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

# Ity no mety mampisy anle erreur 
# fa jerena foana le log aloha
# mande io raha tsy mampiasa anle rest framework tsika
# from django.contrib.auth import logout

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        # Optionnel : blacklister le token (si tu utilises JWT)
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()

        # logout(request)
        return Response({"detail": "Déconnexion réussie."}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)