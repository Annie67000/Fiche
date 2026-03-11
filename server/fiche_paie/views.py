# Create your views here.
from rest_framework.decorators import api_view
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from .models import Employe, FichePaie  # Assure-toi que le modèle existe
from .serializers import EmployeSerializer, FichePaieSerializer # Tu dois créer ce serializer
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate

# Création d'un API avec méthode GET et 'AllowAny' pour la permission (Permettre tout)
@api_view(['GET'])
@permission_classes([AllowAny])
def test_fiche_paie(request):
    return Response(
        {'message': 'test fiche de paie'}
    ) 

# --- NOUVELLE VUE : Créer un employé ---
@api_view(['POST'])
@permission_classes([AllowAny])  # Change plus tard avec IsAuthenticated si besoin
def create_employe(request):
    serializer = EmployeSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
@api_view(['GET'])
@permission_classes([AllowAny])
def list_employes(request):
    employes = Employe.objects.filter(actif=True)
    serializer = EmployeSerializer(employes, many=True)
    return Response(serializer.data)


            #04/11/25
          # CRUD EMPLOYE
@api_view(['GET'])
@permission_classes([AllowAny])
def list_employes(request):
    """
    Liste tous les employés actifs.
    URL : GET /employe/list/
    """
    employes = Employe.objects.filter(actif=True)
    serializer = EmployeSerializer(employes, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def create_employe(request):
    """
    Crée un nouvel employé.
    Exemple JSON :
    {
        "matricule": "EMP001",
        "nom": "DUPONT",
        "prenom": "Jean",
        "email": "jean.dupont@exemple.com"
    }
    """
    serializer = EmployeSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def retrieve_employe(request, pk):
    """
    Détail d’un employé par ID.
    URL : GET /employe/1/
    """
    try:
        employe = Employe.objects.get(pk=pk, actif=True)
    except Employe.DoesNotExist:
        return Response(
            {'error': 'Employé non trouvé ou désactivé'},
            status=status.HTTP_404_NOT_FOUND
        )
    serializer = EmployeSerializer(employe)
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([AllowAny])
def update_employe(request, pk):
    """
    Met à jour un employé (complet avec PUT, partiel avec PATCH).
    """
    try:
        employe = Employe.objects.get(pk=pk)
    except Employe.DoesNotExist:
        return Response(
            {'error': 'Employé non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = EmployeSerializer(employe, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_employe(request, pk):
    """
    Désactive un employé (soft delete).
    On garde l'historique des fiches de paie.
    """
    try:
        employe = Employe.objects.get(pk=pk)
    except Employe.DoesNotExist:
        return Response(
            {'error': 'Employé non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    employe.actif = False
    employe.save()
    return Response(status=status.HTTP_204_NO_CONTENT)



# ======================= CRUD FICHE DE PAIE ========================
# Vues optimisées avec select_related('employe') pour joindre les tables en une requête SQL.
# Gestion des fichiers PDF via champ FileField dans le modèle.
@api_view(['GET'])
@permission_classes([AllowAny])
def list_fiches_paie(request):
    """
    Liste toutes les fiches de paie avec les infos de l'employé.
    Utilise select_related() pour optimiser les requêtes SQL.
    """
    fiches = FichePaie.objects.select_related('employe').all()
    serializer = FichePaieSerializer(fiches, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def create_fiche_paie(request):
    """
    Crée une fiche de paie (ex: après import CSV/PDF).
    Champs requis :
    - employe (ID)
    - mois (ex: "Janvier 2025")
    - fichier_pdf (chemin ou URL)
    """
    serializer = FichePaieSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def retrieve_fiche_paie(request, pk):
    """
    Détail d’une fiche de paie.
    """
    try:
        fiche = FichePaie.objects.get(pk=pk)
    except FichePaie.DoesNotExist:
        return Response(
            {'error': 'Fiche de paie non trouvée'},
            status=status.HTTP_404_NOT_FOUND
        )
    serializer = FichePaieSerializer(fiche)
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([AllowAny])
def update_fiche_paie(request, pk):
    """
    Met à jour une fiche (ex: marquer comme envoyée, corriger mois).
    """
    try:
        fiche = FichePaie.objects.get(pk=pk)
    except FichePaie.DoesNotExist:
        return Response(
            {'error': 'Fiche de paie non trouvée'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = FichePaieSerializer(fiche, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_fiche_paie(request, pk):
    """
    Supprime définitivement une fiche de paie.
    Attention : supprime aussi les envois associés si tu les remets plus tard.
    """
    try:
        fiche = FichePaie.objects.get(pk=pk)
    except FichePaie.DoesNotExist:
        return Response(
            {'error': 'Fiche de paie non trouvée'},
            status=status.HTTP_404_NOT_FOUND
        )

    fiche.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@authentication_classes([JWTAuthentication])
def get_employe_by_matricule(request):
    """
    Récupère les informations de l'employé connecté via son matricule.
    URL : GET /employe/by-matricule/
    """
    try:
        # Récupérer l'utilisateur connecté
        user = request.user
        
        # Trouver l'employé associé à cet utilisateur
        employe = Employe.objects.get(user=user, actif=True)
        
        # Retourner uniquement le matricule
        return Response(
            {'matricule': employe.matricule},
            status=status.HTTP_200_OK
        )
        
    except Employe.DoesNotExist:
        return Response(
            {'error': 'Employé non trouvé ou désactivé'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Erreur serveur: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        identifiant = request.data.get('username')  # Can be matricule or email
        password = request.data.get('password')

        if not identifiant or not password:
            return Response({'error': 'Username and password required'},
                            status=status.HTTP_400_BAD_REQUEST)

        user = None
        # Try to find user by matricule
        try:
            employe = Employe.objects.get(matricule=identifiant, actif=True)
            user = employe.user
        except Employe.DoesNotExist:
            pass

        # If not found by matricule, try by email
        if not user:
            try:
                user = authenticate(email=identifiant, password=password)
            except:
                pass

        # If still not found, try username authentification
        if not user:
            user = authenticate(username=identifiant, password=password)

        if user is None or not user.is_active:
            return Response({'error': 'Invalid credentials'},
                            status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        })

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """
    Get current authenticated user info
    URL : GET /api/v1/me/
    """
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
    })