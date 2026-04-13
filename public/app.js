// app.js - Logique Front-End ETERNITY (v4.0 - Moteur de Rencontre Humain)

document.addEventListener('DOMContentLoaded', () => {
    // 1. Éléments du DOM (Formulaire d'inscription)
    const profileForm = document.getElementById('eternity-profile-form');
    const formContainer = document.getElementById('form-container');
    const mainArea = document.querySelector('.l-flux-central'); // La zone centrale globale

    // --- FONCTION 1 : METTRE À JOUR L'EN-TÊTE ---
    const updateHeader = (sid) => {
        const statutCapital = document.querySelector('.statut-capital');
        if (statutCapital) {
            statutCapital.innerText = `Niveau CVNU : 01 | Souverain : ${sid}`;
        }
    };

    // --- FONCTION 2 : AFFICHER LES MATCHES (Remplace le Chat) ---
    const loadAndDisplayMatches = async (souverainId) => {
        // A. On masque le formulaire d'inscription
        if (formContainer) formContainer.style.display = 'none';

        // B. On supprime l'ancienne interface de Chat IA si elle existe encore dans le HTML
        const oldChat = document.getElementById('chat-interface');
        if (oldChat) oldChat.style.display = 'none';

        // C. On crée le conteneur de la Grille de Profils s'il n'existe pas
        let matchSection = document.getElementById('eternity-match-section');
        if (!matchSection) {
            matchSection = document.createElement('div');
            matchSection.id = 'eternity-match-section';
            matchSection.innerHTML = `
                <div style="background: #fff; padding: 30px; border-top: 4px solid #D4AF37; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <h2 style="font-family: 'Playfair Display', serif; color: #121212; margin-top: 0;">Citoyens Compatibles</h2>
                    <p style="color: #666; font-size: 0.9rem;">L'algorithme a analysé votre matrice d'affinité et vos projets immobiliers. Voici les profils qui résonnent avec votre vision.</p>
                </div>
                <div id="matches-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
                    <p id="loading-matches">Recherche d'affinités en cours...</p>
                </div>
            `;
            mainArea.appendChild(matchSection);
        }

        // D. Appel au serveur pour récupérer les vrais profils (Route /api/matches/:id)
        try {
            const response = await fetch(`http://localhost:5440/api/matches/${souverainId}`);
            if (!response.ok) throw new Error("Erreur serveur");
            
            const data = await response.json();
            const grid = document.getElementById('matches-grid');
            grid.innerHTML = ''; // On vide le texte de chargement

            if (!data.matches || data.matches.length === 0) {
                grid.innerHTML = `<p style="color: #666; padding: 20px; background: #fff;">Aucun profil compatible trouvé pour le moment dans le périmètre.</p>`;
                return;
            }

            // E. On génère les "Cartes Profil" pour chaque match trouvé
            data.matches.forEach(match => {
                const card = document.createElement('div');
                card.style.background = '#fff';
                card.style.border = '1px solid #E0E0E0';
                card.style.padding = '20px';
                card.style.position = 'relative';
                card.style.transition = '0.3s';
                
                // Effet de survol (Hover) géré en JS pour éviter de toucher au CSS
                card.onmouseover = () => { card.style.borderColor = '#D4AF37'; card.style.transform = 'translateY(-5px)'; };
                card.onmouseout = () => { card.style.borderColor = '#E0E0E0'; card.style.transform = 'none'; };

                // Image par défaut si le profil n'en a pas
                const photo = match.photo_url || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?q=80&w=200&auto=format&fit=crop';
                const piliers = match.matrice_affinite.piliers.join(', ');

                card.innerHTML = `
                    <div style="position: absolute; top: 10px; right: 10px; background: #D4AF37; color: #121212; padding: 5px 10px; font-weight: bold; font-size: 0.8rem;">
                        Score : ${match.score} pts
                    </div>
                    <img src="${photo}" alt="Profil de ${match.prenom}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 4px; margin-bottom: 15px;">
                    <h3 style="margin: 0 0 5px 0; font-family: 'Playfair Display', serif;">${match.pseudo || match.prenom}</h3>
                    <p style="font-size: 0.8rem; color: #D4AF37; font-weight: 600; text-transform: uppercase; margin: 0 0 10px 0;">Objectif : ${match.matrice_affinite.intention_immo}</p>
                    <p style="font-size: 0.85rem; color: #666; line-height: 1.4; margin-bottom: 15px; height: 60px; overflow: hidden;">"${match.matrice_affinite.bio}"</p>
                    <div style="font-size: 0.75rem; color: #999; margin-bottom: 15px;"><strong>Piliers:</strong> ${piliers}</div>
<button onclick="openChat('${match.id_souverain}', '${match.pseudo || match.prenom}')" style="width: 100%; padding: 12px; background: #121212; color: #D4AF37; border: none; font-weight: bold; cursor: pointer; text-transform: uppercase;">Contacter</button>
                `;
                grid.appendChild(card);
            });

            // F. Mise à jour de l'Assistant de Droite
            const iaStatusBox = document.getElementById('ia-status-box');
            if (iaStatusBox) {
                iaStatusBox.innerHTML = `
                    <p style="font-size: 0.9rem; line-height: 1.5;">
                        <strong>Analyse Terminée.</strong><br><br>
                        L'algorithme a trouvé <strong>${data.matches.length}</strong> profils compatibles.<br><br>
                        Le score est calculé sur vos piliers de vie et votre désir d'acquisition (Art. 544).
                    </p>`;
            }

        } catch (error) {
            console.error("Erreur récupération matches:", error);
            document.getElementById('matches-grid').innerHTML = `<p style="color: red;">Erreur de connexion au serveur (Port 5440).</p>`;
        }
    };

    // --- FONCTION 3 : VÉRIFICATION DE SESSION AU DÉMARRAGE ---
    const checkSession = () => {
        const sid = localStorage.getItem('souverain_id');
        if (sid) {
            console.log(`Session active : ${sid}`);
            updateHeader(sid);
            loadAndDisplayMatches(sid); // On affiche direct les profils !
        }
    };
    
    // On lance la vérification tout de suite
    checkSession();

    // --- FONCTION 4 : GESTION DE L'INSCRIPTION (Si pas de session) ---
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Récupération des données
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            data.skills = Array.from(formData.getAll('skills'));

            // Feedback bouton
            const submitBtn = e.target.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerText = "CERTIFICATION EN COURS...";
                submitBtn.disabled = true;
            }

            try {
                // Envoi au serveur pour création du profil JSON
                const response = await fetch('http://localhost:5440/api/auth/register', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    const result = await response.json();
                    
                    // Sauvegarde dans le navigateur
                    localStorage.setItem('souverain_id', result.souverain_id);
                    localStorage.setItem('user_data', JSON.stringify(data)); 
                    
                    updateHeader(result.souverain_id);
                    
                    // On lance l'affichage de la grille de rencontre !
                    loadAndDisplayMatches(result.souverain_id);
                } else {
                    alert("Erreur lors de la certification (Code " + response.status + ")");
                }
            } catch (error) {
                console.error("Erreur technique:", error);
                alert(`Échec de la liaison avec le serveur.`);
            } finally {
                if (submitBtn) {
                    submitBtn.innerText = "Certifier mon Profil Souverain";
                    submitBtn.disabled = false;
                }
            }
        });
    }
});