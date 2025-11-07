# Create your views here.
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import Employe, FichePaie  # Assure-toi que le modèle existe
from .serializers import EmployeSerializer, FichePaieSerializer # Tu dois créer ce serializer

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


# ===================================================================
# ======================= CRUD FICHE DE PAIE ========================
# ===================================================================

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

