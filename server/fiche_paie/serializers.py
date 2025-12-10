# serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Employe, FichePaie

class EmployeSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    username = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Employe
        fields = '__all__'  # Tous les champs

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        username = validated_data.pop('username', validated_data.get('matricule'))

        # Create User
        user = User.objects.create_user(
            username=username,
            email=validated_data.get('email'),
            first_name=validated_data.get('prenom'),
            last_name=validated_data.get('nom'),
        )
        if password:
            user.set_password(password)
        else:
            user.set_password('defaultpassword2025')  # Set a default password
        user.save()

        employe = Employe.objects.create(user=user, **validated_data)
        return employe

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
