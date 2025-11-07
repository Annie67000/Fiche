# fiche_paie/forms.py
from django import forms
from .models import Employe, FichePaie
import os

# Formulaire pour créer/modifier un employé
class EmployeForm(forms.ModelForm):
    class Meta:
        model = Employe
        fields = ['matricule', 'nom', 'prenom', 'email', 'departement', 'poste', 'actif']
        
        # Personnalisation des labels (facultatif)
        labels = {
            'matricule': 'Matricule',
            'actif': 'Actif',
        }


# Formulaire pour importer une fiche de paie (avec PDF)
class FichePaieForm(forms.ModelForm):
    # Champ fichier pour upload
    fichier_pdf = forms.FileField(label="Fichier PDF", required=True)

    class Meta:
        model = FichePaie
        fields = ['employe', 'mois', 'fichier_pdf']

    # Validation du fichier PDF
    def clean_fichier_pdf(self):
        pdf = self.cleaned_data.get('fichier_pdf')
        if pdf:
            # Vérifie l'extension
            if not pdf.name.lower().endswith('.pdf'):
                raise forms.ValidationError("Seuls les fichiers PDF sont acceptés.")
            
            # Limite la taille à 5 Mo
            if pdf.size > 5 * 1024 * 1024:
                raise forms.ValidationError("Le fichier ne doit pas dépasser 5 Mo.")
        return pdf