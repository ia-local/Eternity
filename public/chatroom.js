/**
 * chatroom.js - Interface de Pilotage Neo Village
 * Orchestration des sessions et synchronisation via Serveur Municipal (Port 5440)
 */

const chatController = {
    // État local pour éviter de spammer
    isProcessing: false,

    init() {
        // 1. Initialisation du noyau CVNU
        if (typeof system !== 'undefined') {
            system.init();
            this.renderInitialState();
        } else {
            console.error("⚠️ CORE_SYSTEM_CVNU.js non chargé.");
        }

        // 2. Écouteurs d'événements
        document.getElementById('send-btn').addEventListener('click', () => this.sendMessage());
        document.getElementById('user-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // 3. Message de bienvenue système
        this.appendMessage('SYSTEM', "Connexion au Hub Municipal (Port 5440)... Prêt.");
    },

    /**
     * Remplissage des données initiales dans les Asides
     */
    renderInitialState() {
        const u = KERNEL.STATE.USER_CVNU;
        document.getElementById('user-name').innerText = (u.firstName || 'Citoyen') + ' ' + (u.lastName || '');
        document.getElementById('lvl-display').innerText = u.level;
        document.getElementById('neutrality-score').value = u.neutrality_score || 0.5;
        document.getElementById('equity-val').innerText = u.value_points.toFixed(2);
    },

    /**
     * Envoi du message au serveur
     */
    async sendMessage() {
        if (this.isProcessing) return;
        
        const input = document.getElementById('user-input');
        const text = input.value.trim();
        
        if (!text) return;

        // A. Affichage immédiat du message utilisateur
        this.appendMessage('USER', text);
        input.value = '';
        this.isProcessing = true;
        this.showTyping(true);

        try {
            // B. Préparation du Payload pour server.js
            // On respecte la structure attendue par : app.post('/api/municipal/chat'...)
            const payload = {
                message: text,
                userState: KERNEL.STATE.USER_CVNU, // On envoie l'état complet pour le contexte
                lpuContext: "Urgence École Bavent - Niveau Alerte Rouge (-15 élèves)"
            };

            // C. Appel Fetch vers le serveur local
            const response = await fetch('http://localhost:5440/api/municipal/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

            const data = await response.json();

            // D. Traitement de la réponse IA
            this.showTyping(false);
            
            // Affichage de la réponse "Architecte"
            this.appendMessage('SYSTEM', data.result);

            // E. Effets de bord : Monétisation & Logs
            // On utilise le logId du serveur pour prouver l'enregistrement
            console.log(`✅ Log certifié par serveur : ID ${data.logId}`);
            
            this.processEconomicImpact(text);

        } catch (error) {
            this.showTyping(false);
            this.appendMessage('ERROR', `Échec liaison Halle : ${error.message}`);
            console.error(error);
        } finally {
            this.isProcessing = false;
        }
    },

    /**
     * Affiche un message dans le flux avec le style ASCII du Noyau
     */
    appendMessage(role, content) {
        const flow = document.getElementById('message-flow');
        const msgDiv = document.createElement('div');
        msgDiv.className = `message-wrap ${role.toLowerCase()}`;
        
        // Utilisation de system.wrapASCII pour garder le style "Document Officiel"
        // Si c'est une erreur, on affiche brut
        const formattedContent = (role === 'ERROR') 
            ? `⚠️ ${content}` 
            : system.wrapASCII(role, content);

        msgDiv.innerHTML = `<pre>${formattedContent}</pre>`;
        flow.appendChild(msgDiv);
        flow.scrollTop = flow.scrollHeight;
    },

    /**
     * Indicateur visuel d'attente
     */
    showTyping(show) {
        const flow = document.getElementById('message-flow');
        let indicator = document.getElementById('typing-indicator');
        
        if (show) {
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'typing-indicator';
                indicator.className = 'typing-indicator';
                indicator.innerText = "L'Architecte analyse le LPU...";
                flow.appendChild(indicator);
            }
            flow.scrollTop = flow.scrollHeight;
        } else {
            if (indicator) indicator.remove();
        }
    },

    /**
     * Calcul de la valeur générée (Côté Client pour UI immédiate)
     */
    processEconomicImpact(text) {
        // Déclenche le calcul de valeur UTMi basé sur la sémantique
        // On suppose que MonetizationSync est disponible via CORE_SYSTEM_CVNU.js
        if (typeof MonetizationSync !== 'undefined') {
            const valuation = MonetizationSync.processHistoryToValue();
            
            // Animation du compteur d'Equity
            const equityEl = document.getElementById('equity-val');
            equityEl.innerText = valuation.total.toFixed(2);
            equityEl.style.color = '#22C55E'; // Flash vert
            setTimeout(() => equityEl.style.color = '', 500);
        }
    }
};

// Démarrage
window.onload = () => chatController.init();