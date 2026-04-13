// app.js - Logique Front-End ETERNITY

document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('eternity-profile-form');

    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Récupération des données du formulaire
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            // Gestion spécifique pour les checkbox (array)
            data.skills = Array.from(formData.getAll('skills'));

            console.log("Préparation de l'envoi des données :", data);

            try {
                // Envoi au serveur (Port 5440)
                const response = await fetch('http://localhost:5440/api/eternity/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: `Initialisation du profil pour ${data.firstName}. Intention: ${data.intention}.`,
                        userState: data,
                        lpuContext: "Création de profil Eternity - Phase d'ancrage"
                    })
                });

                if(response.ok) {
                    alert("Profil Souverain Certifié. L'Architecte IA analyse vos données.");
                    // L'interface peut ensuite se mettre à jour dynamiquement ici
                } else {
                    console.error("Le serveur a retourné une erreur :", response.status);
                }
            } catch (error) {
                console.error("Erreur de liaison avec le serveur local:", error);
                alert("Impossible de joindre le Hub Municipal (Port 5440). Assurez-vous que le serveur Node.js est lancé.");
            }
        });
    }
});