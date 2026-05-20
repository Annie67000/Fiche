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
    path('employe/create/', views.create_employe, name='create_employe'),
    path('employe/list/', views.list_employes, name='list_employes'),
    path('employe/<int:pk>/', views.retrieve_employe, name='retrieve_employe'),
    path('employe/<int:pk>/update/', views.update_employe, name='update_employe'),
    path('employe/<int:pk>/delete/', views.delete_employe, name='delete_employe'),
    path('employe/matricule/', views.get_employe_by_matricule, name='get_employe_by_matricule'),

    # --- FICHE DE PAIE : CRUD ---
    path('fiche-paie/create/', views.create_fiche_paie, name='create_fiche_paie'),
    path('fiche-paie/list/', views.list_fiches_paie, name='list_fiches_paie'),
    path('fiche-paie/<int:pk>/', views.retrieve_fiche_paie, name='retrieve_fiche_paie'),
    path('fiche-paie/<int:pk>/update/', views.update_fiche_paie, name='update_fiche_paie'),
    path('fiche-paie/<int:pk>/delete/', views.delete_fiche_paie, name='delete_fiche_paie'),

    # --- AUTH ---
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', logout_views.logout_view, name='logout'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', views.get_current_user, name='current_user'),

    # --- EXPORT ---
    # --- EXPORT (Efa nasiana prefix v1 mifanaraka amin'ny React) ---
    path('export-report/', views.ExportReportView.as_view(), name='export_report'),
    # --- STATISTIQUES ---
    path('transaction-stats/', views.transaction_stats, name='transaction_stats'),
]
