# fiche_paie/urls.py
from django.urls import path
from . import views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from . import logout_views
from .views import LoginView

urlpatterns = [
    # --- TEST ---
    path('test/', views.test_fiche_paie, name='test_fiche_paie'),


    # --- EMPLOYÉ : CRUD ---
    path('employe/create/', views.create_employe, name='create_employe'), # Créer un employé
    path('employe/list/', views.list_employes, name='list_employes'), # Lister les employés actifs
    path('employe/<int:pk>/', views.retrieve_employe, name='retrieve_employe'), # Détail d’un employé
    path('employe/<int:pk>/update/', views.update_employe, name='update_employe'), # Mettre à jour un employé
    path('employe/<int:pk>/delete/', views.delete_employe, name='delete_employe'), # Désactiver un employé (soft delete)

    # --- FICHE DE PAIE : CRUD ---
    path('fiche-paie/create/', views.create_fiche_paie, name='create_fiche_paie'), # Créer une fiche + upload PDF
    path('fiche-paie/list/', views.list_fiches_paie, name='list_fiches_paie'), # Lister toutes les fiches
    path('fiche-paie/<int:pk>/', views.retrieve_fiche_paie, name='retrieve_fiche_paie'), # Détail d’une fiche (inclut URL PDF)
    path('fiche-paie/<int:pk>/update/', views.update_fiche_paie, name='update_fiche_paie'), # Modifier une fiche (PDF optionnel)
    path('fiche-paie/<int:pk>/delete/', views.delete_fiche_paie, name='delete_fiche_paie'), # Supprimer une fiche + fichier PDF
]
    #Nouveau
urlpatterns += [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', logout_views.logout_view, name='logout'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
