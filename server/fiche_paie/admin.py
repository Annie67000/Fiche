# fiche_paie/admin.py
from django.contrib import admin
from .models import Employe, FichePaie  # Import des modèles

@admin.register(Employe)
class EmployeAdmin(admin.ModelAdmin):
    # Colonnes affichées dans la liste
    list_display = ['matricule', 'nom', 'prenom', 'email', 'poste', 'actif']
    
    # Filtres sur la droite
    list_filter = ['actif', 'departement']
    
    # Barre de recherche
    search_fields = ['matricule', 'nom', 'prenom', 'email']


@admin.register(FichePaie)
class FichePaieAdmin(admin.ModelAdmin):
    # Affichage dans la liste
    list_display = ['employe', 'mois', 'fichier_pdf', 'envoyee', 'date_import']
    
    # Filtres par mois et statut d'envoi
    list_filter = ['mois', 'envoyee']
    
    # Recherche par matricule, nom, mois
    search_fields = ['employe__matricule', 'employe__nom', 'mois']
    
    # Champ pour sélection rapide d'employé (évite les lenteurs)
    raw_id_fields = ['employe']

