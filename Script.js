/* Fichier: script.js */

document.getElementById('calculForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // Récupération des valeurs
    const dateSouscriptionStr = document.getElementById('dateSouscription').value;
    const dateDernierCRMStr = document.getElementById('dateDernierCRM').value;
    const crmActuel = parseFloat(document.getElementById('crmActuel').value);
    
    // Conversion en objets Date. On ajoute T00:00:00 pour forcer le fuseau horaire local
    // et éviter les erreurs de décalage temporel lors de la conversion.
    const dateSouscription = new Date(dateSouscriptionStr + 'T00:00:00');
    const dateDernierCRM = new Date(dateDernierCRMStr + 'T00:00:00');
    const dateDuDevis = new Date(); // Date du jour
    
    // Vérification des dates
    if (dateDernierCRM <= dateSouscription) {
        alert("La Date du Dernier CRM doit être postérieure à la Date de Souscription.");
        return;
    }

    // --- Fonction de Calcul de la Différence en Mois ---
    function diffEnMois(date1, date2) {
        let anneeDiff = date2.getFullYear() - date1.getFullYear();
        let moisDiff = date2.getMonth() - date1.getMonth();
        
        let totalMois = anneeDiff * 12 + moisDiff;

        // Ajustement si le jour du mois de fin est avant le jour du mois de début (mois incomplet)
        if (date2.getDate() < date1.getDate()) {
            totalMois -= 1;
        }
        return totalMois > 0 ? totalMois : 0;
    }
    
    // 1. Calcul de l'ancienneté du contrat
    const ancienneteEnMois = diffEnMois(dateSouscription, dateDernierCRM);

    // 2. Calcul de l'interruption (entre la fin du contrat et aujourd'hui)
    const interruptionEnMois = diffEnMois(dateDernierCRM, dateDuDevis);

    // --- Application des Règles ---
    
    let crmApplique = crmActuel;
    let moisDeReprise = ancienneteEnMois;
    let alerteTexte = "";
    let alerteClass = "";

    if (interruptionEnMois >= 24) {
        crmApplique = 1.00; // Perte du bonus/malus après 2 ans (règle de descente rapide)
        moisDeReprise = 0; // L'historique est remis à zéro
        
        alerteTexte = `⚠️ **INTERRUPTION MAJEURE :** ${interruptionEnMois} mois sans assurance. Votre historique est perdu, et votre CRM sera remis à **1.00** par la nouvelle compagnie.`;
        alerteClass = "warning";
    } else {
        // Le CRM et l'ancienneté sont conservés
        alerteTexte = `✅ **Historique Conservé :** Votre interruption est de ${interruptionEnMois} mois. Vous conservez votre CRM (${crmActuel.toFixed(2)}) et votre ancienneté.`;
        alerteClass = "ok";
    }
    
    // --- Affichage des Résultats ---
    
    document.getElementById('moisReprise').textContent = `${moisDeReprise} mois`;
    document.getElementById('crmApplique').textContent = crmApplique.toFixed(2);
    document.getElementById('alerteInterruption').innerHTML = alerteTexte;
    document.getElementById('alerteInterruption').className = 'alerte ' + alerteClass; 
    document.getElementById('resultats').style.display = 'block';
});
