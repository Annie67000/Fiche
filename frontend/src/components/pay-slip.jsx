import React from 'react'
import './pay-slip.css';

export const PaySlip = () => {
    return (

        <div class="payslip">

            <div class="header">
                <div class="logo">
                    <img src="images/logo.png.jpeg" alt="GULFSAT Madagascar" />
                </div>
                <h2>Bulletin de Paie</h2>
            </div>

            <div class="grid-2">
                <div>
                    <div class="field"><label>Antananarivo</label></div>
                    <div class="field">N° Stat : __________________</div>
                    <div class="field">N° RC : _____________________</div>
                </div>

                <div>
                    <div class="field">N° : ____________________</div>
                    <div class="field">Mois : __________________</div>
                    <div class="field">Période : _______ au _______</div>
                    <div class="field">Payé le : _______________</div>
                    <div class="field">Date de tirage : __________</div>
                </div>
            </div>

            <div class="section-title">Informations Employé</div>

            <div class="grid-2">
                <div>
                    <div class="field">Nom & Prénoms : ____________________________</div>
                    <div class="field">Matricule : __________________________________</div>
                    <div class="field">Poste : ______________________________________</div>
                </div>

                <div>
                    <div class="field">Adresse : _____________________________________</div>
                    <div class="field">Embauché le : ______________________________</div>
                    <div class="field">CNaPS N° : _________________________________</div>
                </div>
            </div>

            <div class="section-title">Détails de Paie</div>

            <table>
                <tr>
                    <th>Code</th>
                    <th>Libellés</th>
                    <th>Nombre</th>
                    <th>Base</th>
                    <th>Taux</th>
                    <th>Gain</th>
                    <th>Retenues</th>
                </tr>

                <tr>
                    <td>97</td><td>Salaire de base</td>
                    <td></td><td></td><td></td><td></td><td></td>
                </tr>

                <tr>
                    <td>98</td><td>Salaire du mois</td>
                    <td></td><td></td><td></td><td></td><td></td>
                </tr>

                <tr>
                    <td>1</td><td><b>TOTAL BRUT</b></td>
                    <td></td><td></td><td></td><td></td><td></td>
                </tr>

                <tr>
                    <td>2</td><td>CNaPS</td>
                    <td></td><td></td><td></td><td></td><td></td>
                </tr>

                <tr>
                    <td>4</td><td>OSTIE</td>
                    <td></td><td></td><td></td><td></td><td></td>
                </tr>

                <tr>
                    <td>6</td><td>IRSA</td>
                    <td></td><td></td><td></td><td></td><td></td>
                </tr>

                <tr>
                    <td>7</td><td><b>TOTAL COTISATIONS</b></td>
                    <td></td><td></td><td></td><td></td><td></td>
                </tr>

                <tr>
                    <td>6</td><td>Salaire MIARO</td>
                    <td></td><td></td><td></td><td></td><td></td>
                </tr>

                <tr>
                    <td>7</td><td>Retenue sur cantine</td>
                    <td></td><td></td><td></td><td></td><td></td>
                </tr>
            </table>

            <div class="net">
                Net à payer : ______ Ariary
            </div>

            <div class="footer-msg">
                Conservez ce bulletin pour faire valoir vos droits.
            </div>
        </div>
    )
}
