/**
 * server.js - Noyau ETERNITY V2
 * Gestionnaire de Patrimoine & Plateforme de Rencontre
 */
const express = require('express');
const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

const app = express();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(express.static('public'));
app.use(express.json());

// --- GESTION DES DONNÉES (Simulation Database) ---
const DB_PATH = {
    PROFILS: './data/profils.json',
    OPTIONS: './data/options.json', // Restaurants, Maisons, Activités
    LOGS: './data/audit_trail.json'
};

// --- INTERFACE ADMINISTRATEUR (Gestion du Périmètre) ---
// Route pour ajouter un restaurant ou un logement au catalogue
// À ajouter dans server.js
app.get('/api/admin/catalogue', (req, res) => {
    try {
        const optionsPath = path.join(__dirname, 'data', 'options.json');
        const optionsData = JSON.parse(fs.readFileSync(optionsPath, 'utf8'));
        res.json(optionsData);
    } catch (error) {
        res.status(500).json({ error: "Impossible de lire le catalogue." });
    }
});
// --- INTERFACE UTILISATEUR & CHATROOM ---

app.post('/api/eternity/chat', async (req, res) => {
    const { message, userState } = req.body;

    try {
        // 1. Lire la base de données des options du village
        const optionsPath = path.join(__dirname, 'data', 'options.json');
        const optionsData = JSON.parse(fs.readFileSync(optionsPath, 'utf8'));

        // 2. Transformer le catalogue en texte pour que l'IA le comprenne
        const catalogueContexte = JSON.stringify(optionsData.catalogue);

        // 3. Appel à Groq (Llama 3.1) avec le catalogue injecté
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Tu es l'Architecte IA de la plateforme ETERNITY.
                    Un nouvel utilisateur vient de certifier son profil.
                    
                    Voici les options disponibles dans le village actuellement :
                    ${catalogueContexte}

                    TA MISSION :
                    1. Souhaite-lui la bienvenue avec un ton élégant et bienveillant.
                    2. Analyse ses "skills" (valeurs) et sa "bio".
                    3. Suggère-lui UN restaurant (Savourer) et UN logement (Séjourner/Acquérir) de notre catalogue qui correspondent exactement à ses valeurs.
                    4. Rappelle-lui que l'option logement est soumise au Bail Évolutif (Art. 544) qui lui permet de capitaliser ses loyers.`
                },
                { 
                    role: "user", 
                    content: `Voici mon profil : ${JSON.stringify(userState)}` 
                }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.3 // Température basse pour qu'il reste précis sur le catalogue
        });

        const reponseIA = completion.choices[0].message.content;

        res.json({ result: reponseIA });

    } catch (error) {
        console.error("Erreur Llama/Groq :", error);
        res.status(500).json({ error: "L'Architecte IA est momentanément indisponible." });
    }
});
const PORT = 5440;
app.listen(PORT, () => console.log(`🏛️ ETERNITY Hub actif sur le port ${PORT}`));