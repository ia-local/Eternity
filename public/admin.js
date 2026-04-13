// admin.js - Logique du Tableau de Bord ETERNITY

const adminLogic = {
    
    // Initialisation
    async init() {
        console.log("🟢 La Loge Admin est initialisée. Requête au serveur...");
        await this.chargerCatalogueDepuisServeur();
    },

    // Récupération des vraies données depuis server.js
    async chargerCatalogueDepuisServeur() {
        try {
            const response = await fetch('http://localhost:5440/api/admin/catalogue');
            
            if (!response.ok) {
                throw new Error("Erreur HTTP: " + response.status);
            }

            const data = await response.json();
            
            // Mise à jour des tableaux
            this.renderImmoTable(data.catalogue.sejourner_acquerir);
            this.renderRestoTable(data.catalogue.savourer);
            
            // Mise à jour des petits compteurs KPI
            document.getElementById('kpi-restos').innerText = data.catalogue.savourer.length;
            // (Les autres compteurs pourront être liés à une base de profils plus tard)
            document.getElementById('kpi-profils').innerText = "12"; 
            document.getElementById('kpi-matches').innerText = "4";

        } catch (error) {
            console.error("Échec de la liaison avec le serveur:", error);
            document.getElementById('immo-table-body').innerHTML = `<tr><td colspan="5" style="color:red;">Erreur de connexion au serveur local (Port 5440).</td></tr>`;
            document.getElementById('resto-table-body').innerHTML = `<tr><td colspan="5" style="color:red;">Erreur de connexion au serveur local (Port 5440).</td></tr>`;
        }
    },

    // Génération du tableau Immobilier
    renderImmoTable(biens) {
        const tbody = document.getElementById('immo-table-body');
        tbody.innerHTML = '';

        biens.forEach(bien => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="code-mono">${bien.id}</td>
                <td><strong>${bien.nom}</strong></td>
                <td>${bien.loyer_test_weekend}</td>
                <td>${bien.bail_evolutif.prix_acquisition_final} (${bien.bail_evolutif.taux_capitalisation_art544})</td>
                <td>
                    <button style="cursor:pointer; background:none; border:none; color:#D4AF37;">Éditer</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    // Génération du tableau Restauration
    renderRestoTable(restos) {
        const tbody = document.getElementById('resto-table-body');
        tbody.innerHTML = '';

        restos.forEach(resto => {
            const motsClesFormat = resto.mots_cles.join(', '); // Transforme le tableau en texte
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="code-mono">${resto.id}</td>
                <td><strong>${resto.nom}</strong></td>
                <td>${resto.type}</td>
                <td style="font-size:0.8rem; color:#666;">${motsClesFormat}</td>
                <td>
                    <button style="cursor:pointer; background:none; border:none; color:#D4AF37;">Éditer</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
};

// Lancement à l'ouverture de la page
document.addEventListener('DOMContentLoaded', () => adminLogic.init());