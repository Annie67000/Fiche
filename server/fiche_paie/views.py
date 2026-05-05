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

from .ldap_auth import LDAPUnavailable, authenticate_ldap, sync_user_from_ldap

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
        email = request.data.get('username')
        password = request.data.get('password')

        if not email or not password:
            return Response({'error': 'Username and password required'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            ldap_attrs = authenticate_ldap(email, password)
        except LDAPUnavailable:
            return Response({'error': 'Authentication service unavailable'},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)

        if not ldap_attrs:
            return Response({'error': 'Invalid credentials'},
                            status=status.HTTP_401_UNAUTHORIZED)

        user, employe = sync_user_from_ldap(ldap_attrs)
        if not user.is_active:
            return Response({'error': 'Account disabled'},
                            status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        employe_data = {
            'matricule': employe.matricule,
            'nom': employe.nom,
            'prenom': employe.prenom,
            'email': employe.email,
            'departement': employe.departement,
            'poste': employe.poste,
        }

        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_staff': user.is_staff,
            },
            'matricule': employe.matricule,
            'employe': employe_data,
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


import os
import re
from datetime import datetime

MONTH_MAP = {
    'jan': '01', 'fev': '02', 'mar': '03', 'avr': '04',
    'mai': '05', 'jun': '06', 'jui': '07', 'aou': '08',
    'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
}

def parse_folder_date(folder_name):
    match = re.match(r'^(jan|fev|mar|avr|mai|jun|jui|aou|sep|oct|nov|dec)_(20\d{2})', folder_name.lower())
    if match:
        month = MONTH_MAP.get(match.group(1), '01')
        year = match.group(2)
        return f'{year}-{month}-01'
    return None

@api_view(['GET'])
@permission_classes([AllowAny])
def transaction_stats(request):
    """
    Récupère les statistiques mensuelles basées sur les dossiers dans pdf_separate_intelligent/output
    Retourne la date d'ajout et le nombre de fichiers par dossier
    URL : GET /api/v1/transaction-stats/
    """
    output_path = os.environ.get('PDF_OUTPUT_PATH', os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'pdf_separate_intelligent', 'output'))
    
    if not os.path.exists(output_path):
        return Response({'labels': [], 'data': []})
    
    folder_stats = []
    for folder_name in os.listdir(output_path):
        folder_path = os.path.join(output_path, folder_name)
        if os.path.isdir(folder_path):
            folder_date = parse_folder_date(folder_name)
            if not folder_date:
                continue
            
            file_count = 0
            for root, dirs, files in os.walk(folder_path):
                file_count += len(files)
            
            folder_stats.append({
                'date': folder_date,
                'count': file_count,
                'folder_name': folder_name
            })
    
    folder_stats.sort(key=lambda x: x['date'])
    
    labels = [stat['date'] for stat in folder_stats]
    data = [stat['count'] for stat in folder_stats]
    total = sum(stat['count'] for stat in folder_stats)
    
    return Response({
        'labels': labels,
        'data': data,
        'total': total,
        'total_employes': Employe.objects.filter(actif=True).count()
    })