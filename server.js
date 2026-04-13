/**
 * server.js - Noyau ETERNITY V4 (Intégration Totale)
 * Gestionnaire de Patrimoine & Plateforme de Rencontre
 */
const express = require('express');
const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(express.static('public'));
app.use(express.json());

// --- CONFIGURATION DES CHEMINS DE DONNÉES ---
const DB_PATH = {
    PROFILS: path.join(__dirname, 'data', 'profils.json'),
    OPTIONS: path.join(__dirname, 'data', 'options.json'),
    MESSAGES: path.join(__dirname, 'data', 'messages.json'),
    LOGS: path.join(__dirname, 'data', 'audit_trail.json')
};

// --- HELPERS : CHARGEMENT ET SAUVEGARDE JSON ---
const loadJSON = (filePath) => {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf8');
    return content ? JSON.parse(content) : null;
};

const saveJSON = (filePath, data) => {
    if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// ==========================================
// ROUTES : ADMINISTRATION (LA LOGE)
// ==========================================

// Récupérer le catalogue pour l'administration
app.get('/api/admin/catalogue', (req, res) => {
    try {
        const data = loadJSON(DB_PATH.OPTIONS);
        if (!data) return res.status(404).json({ error: "Catalogue introuvable." });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la lecture du catalogue." });
    }
});

// ==========================================
// ROUTES : GESTION DES PROFILS SOUVERAINS
// ==========================================

// Inscription et certification de l'identité
app.post('/api/auth/register', (req, res) => {
    try {
        const data = req.body;
        const secret = 'ETERNITY_KEY_2026';
        const hashIdentite = crypto.createHmac('sha256', secret)
                                   .update(data.lastName ? data.lastName.toLowerCase() : 'inconnu')
                                   .digest('hex');

        const nouveauProfil = {
            id_souverain: "USR_" + crypto.randomBytes(4).toString('hex'),
            pseudo: data.firstName + "_" + crypto.randomBytes(2).toString('hex'),
            photo_url: "",
            etat_civil: {
                prenom: data.firstName,
                hash_identite: hashIdentite,
                ville: data.city
            },
            matrice_affinite: {
                piliers: data.skills || [],
                bio: data.bio || "",
                intention_immo: data.intention
            },
            kpi_souverain: {
                niveau_cvnu: 1,
                wallet_utmi: 100,
                capital_art544: 0
            },
            date_creation: new Date().toISOString()
        };

        let base = loadJSON(DB_PATH.PROFILS) || { utilisateurs: [] };
        base.utilisateurs.push(nouveauProfil);
        saveJSON(DB_PATH.PROFILS, base);

        res.status(201).json({ status: "SUCCESS", souverain_id: nouveauProfil.id_souverain });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la création du profil." });
    }
});

// Mise à jour du profil (Pseudo, Photo, Bio)
app.post('/api/profile/update', (req, res) => {
    try {
        const { id_souverain, pseudo, photo_url, bio } = req.body;
        let base = loadJSON(DB_PATH.PROFILS);
        const index = base.utilisateurs.findIndex(u => u.id_souverain === id_souverain);

        if (index === -1) return res.status(404).json({ error: "Utilisateur inconnu." });

        base.utilisateurs[index].pseudo = pseudo || base.utilisateurs[index].pseudo;
        base.utilisateurs[index].photo_url = photo_url || base.utilisateurs[index].photo_url;
        base.utilisateurs[index].matrice_affinite.bio = bio || base.utilisateurs[index].matrice_affinite.bio;

        saveJSON(DB_PATH.PROFILS, base);
        res.json({ status: "SUCCESS", message: "Profil mis à jour." });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la mise à jour." });
    }
});

// ==========================================
// ROUTES : MOTEUR DE MATCHES ET IA
// ==========================================

// Recherche de matches par affinité
app.get('/api/matches/:id', (req, res) => {
    try {
        const userId = req.params.id;
        const base = loadJSON(DB_PATH.PROFILS);
        const currentUser = base.utilisateurs.find(u => u.id_souverain === userId);

        if (!currentUser) return res.status(404).json({ error: "Utilisateur introuvable." });

        const matches = base.utilisateurs
            .filter(u => u.id_souverain !== userId)
            .map(u => {
                let score = 0;
                u.matrice_affinite.piliers.forEach(p => {
                    if (currentUser.matrice_affinite.piliers.includes(p)) score += 20;
                });
                if (u.matrice_affinite.intention_immo === currentUser.matrice_affinite.intention_immo) score += 30;
                return { ...u, score };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 6);

        res.json({ matches });
    } catch (error) {
        res.status(500).json({ error: "Erreur de l'algorithme d'affinité." });
    }
});

// Messagerie IA et suggestions
app.post('/api/eternity/chat', async (req, res) => {
    try {
        const { message, userState } = req.body;
        const optionsData = loadJSON(DB_PATH.OPTIONS);
        const catalogueContexte = JSON.stringify(optionsData.catalogue);

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Tu es l'Architecte IA de la plateforme ETERNITY.\nOptions disponibles :\n${catalogueContexte}\n\nMission : Bienvenue élégante, analyse des valeurs, suggestion d'un restaurant et d'un logement (Art. 544).`
                },
                { role: "user", content: `Profil: ${JSON.stringify(userState)}\nMessage: ${message}` }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.3 
        });

        res.json({ result: completion.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: "L'Architecte IA est indisponible." });
    }
});

// ==========================================
// ROUTES : MESSAGERIE SÉCURISÉE (NOUVEAU)
// ==========================================

// Lire l'historique d'une conversation
app.get('/api/messages/:id1/:id2', (req, res) => {
    try {
        const { id1, id2 } = req.params;
        const data = loadJSON(DB_PATH.MESSAGES) || { messages: [] };

        const conversation = data.messages.filter(m => 
            (m.expediteur_id === id1 && m.destinataire_id === id2) || 
            (m.expediteur_id === id2 && m.destinataire_id === id1)
        ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        res.json({ conversation });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération des messages." });
    }
});

// Envoyer un message privé
app.post('/api/messages', (req, res) => {
    try {
        const { expediteur_id, destinataire_id, contenu } = req.body;
        let data = loadJSON(DB_PATH.MESSAGES) || { messages: [] };

        const newMessage = {
            id: "MSG_" + crypto.randomBytes(4).toString('hex'),
            expediteur_id,
            destinataire_id,
            contenu,
            timestamp: new Date().toISOString()
        };

        data.messages.push(newMessage);
        saveJSON(DB_PATH.MESSAGES, data);

        res.status(201).json({ status: "SUCCESS", message: newMessage });
    } catch (error) {
        res.status(500).json({ error: "Échec de l'envoi du message." });
    }
});

// ==========================================
// DÉMARRAGE DU SERVEUR
// ==========================================
const PORT = 5440;
app.listen(PORT, () => console.log(`🏛️ ETERNITY Hub actif sur le port ${PORT}`));