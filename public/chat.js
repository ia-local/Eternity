// chat.js - Module de Messagerie Privée ETERNITY

// Variables globales pour le chat
let currentDestinataireId = null;
let chatRefreshInterval = null;

// Fonction principale pour ouvrir le chat (sera appelée depuis app.js)
window.openChat = function(destinataireId, destinataireNom) {
    currentDestinataireId = destinataireId;
    
    // 1. Masquer la grille des matchs et afficher le chat
    document.getElementById('eternity-match-section').style.display = 'none';
    const chatSection = document.getElementById('eternity-private-chat');
    chatSection.style.display = 'flex';

    // 2. Mettre à jour l'en-tête du chat
    document.getElementById('chat-partner-name').innerText = destinataireNom;

    // 3. Charger l'historique
    loadPrivateMessages();

    // 4. Mettre à jour l'aide de l'IA (Panneau droit)
    const iaStatusBox = document.getElementById('ia-status-box');
    if (iaStatusBox) {
        iaStatusBox.innerHTML = `
            <p style="font-size: 0.9rem; line-height: 1.5;">
                <strong>Canal Sécurisé.</strong><br><br>
                Vous discutez avec ${destinataireNom}. L'Architecte reste en veille pour vous suggérer des options du périmètre (Savourer/Séjourner) si vous planifiez une rencontre.
            </p>`;
    }
};

// Fonction pour fermer le chat et retourner aux matchs
window.closeChat = function() {
    currentDestinataireId = null;
    document.getElementById('eternity-private-chat').style.display = 'none';
    document.getElementById('eternity-match-section').style.display = 'block';
    
    const iaStatusBox = document.getElementById('ia-status-box');
    if (iaStatusBox) {
        iaStatusBox.innerHTML = `<p style="font-size: 0.9rem;">Retour à la grille de sélection.</p>`;
    }
};

// Fonction pour charger les messages depuis le serveur
async function loadPrivateMessages() {
    if (!currentDestinataireId) return;
    const myId = localStorage.getItem('souverain_id');
    const chatHistoryBox = document.getElementById('private-chat-history');

    try {
        const response = await fetch(`http://localhost:5440/api/messages/${myId}/${currentDestinataireId}`);
        const data = await response.json();
        
        chatHistoryBox.innerHTML = ''; // On vide avant de remplir

        if (data.conversation.length === 0) {
            chatHistoryBox.innerHTML = `<div style="text-align:center; color:#999; margin-top:20px;"><em>Débutez la conversation...</em></div>`;
            return;
        }

        data.conversation.forEach(msg => {
            const isMe = msg.expediteur_id === myId;
            const msgDiv = document.createElement('div');
            
            // Style dynamique (Gris pour moi, Doré/Blanc pour l'autre)
            msgDiv.style.padding = '12px 15px';
            msgDiv.style.marginBottom = '10px';
            msgDiv.style.maxWidth = '75%';
            msgDiv.style.borderRadius = '4px';
            msgDiv.style.fontSize = '0.9rem';
            msgDiv.style.lineHeight = '1.4';

            if (isMe) {
                msgDiv.style.backgroundColor = '#121212';
                msgDiv.style.color = '#D4AF37';
                msgDiv.style.marginLeft = 'auto';
            } else {
                msgDiv.style.backgroundColor = '#F5F5F5';
                msgDiv.style.color = '#121212';
                msgDiv.style.borderLeft = '4px solid #D4AF37';
            }

            msgDiv.innerText = msg.contenu;
            chatHistoryBox.appendChild(msgDiv);
        });

        // Scroll automatique vers le bas
        chatHistoryBox.scrollTop = chatHistoryBox.scrollHeight;

    } catch (error) {
        console.error("Erreur de chargement des messages:", error);
    }
}

// Initialisation des écouteurs d'événements au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('private-chat-form');
    const chatInput = document.getElementById('private-chat-input');

    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const contenu = chatInput.value.trim();
            if (!contenu || !currentDestinataireId) return;

            const myId = localStorage.getItem('souverain_id');

            try {
                const response = await fetch('http://localhost:5440/api/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        expediteur_id: myId,
                        destinataire_id: currentDestinataireId,
                        contenu: contenu
                    })
                });

                if (response.ok) {
                    chatInput.value = ''; // On vide le champ
                    loadPrivateMessages(); // On recharge pour voir le nouveau message
                }
            } catch (error) {
                console.error("Erreur d'envoi:", error);
            }
        });
    }
});