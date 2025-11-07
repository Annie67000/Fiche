# serializers.py
from rest_framework import serializers
from .models import Employe, FichePaie

class EmployeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employe
        fields = '__all__'  # Tous les champs
        # ou : fields = ['first_name', 'last_name', 'email', ...]

#Autre 
class FichePaieSerializer(serializers.ModelSerializer):
    employe = serializers.PrimaryKeyRelatedField(queryset=Employe.objects.all())
    employe_info = serializers.SerializerMethodField()  # Bonus : nom + matricule

    class Meta:
        model = FichePaie
        fields = '__all__'
    
# MÉTHODE OBLIGATOIRE POUR SerializerMethodField
    def get_employe_info(self, obj):
        return f"{obj.employe.prenom} {obj.employe.nom} ({obj.employe.matricule})"