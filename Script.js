document.addEventListener('DOMContentLoaded', () => {
    const currentDateInput = document.getElementById('currentDate');
    const riList = document.getElementById('riList');
    const addRiBtn = document.getElementById('addRiBtn');
    const monthsToResumeSpan = document.getElementById('monthsToResume');
    const finalBonusSpan = document.getElementById('finalBonus');
    const sinistresSummaryList = document.getElementById('sinistresSummary');

    let riEntries = []; // Tableau pour stocker tous les relevés

    // Initialiser la date du jour avec la date actuelle
    currentDateInput.value = new Date().toISOString().split('T')[0];

    // --- Fonctions utilitaires de date et de Bonus/Malus ---

    /**
     * Calcule la différence en mois entre deux dates.
     */
    function monthDiff(d1, d2) {
        let months = (d2.getFullYear() - d1.getFullYear()) * 12;
        months -= d1.getMonth();
        months += d2.getMonth();
        // Ajuster pour les jours, si d2 est avant le jour de d1 dans le mois
        if (d2.getDate() < d1.getDate()) {
            months--;
        }
        return months;
    }

    /**
     * Parse une chaîne de date YYYY-MM-DD en objet Date (UTC pour fiabilité).
     */
    function parseDate(dateString) {
        if (!dateString) return null;
        const [year, month, day] = dateString.split('-').map(Number);
        // Utilise UTC pour éviter les problèmes de fuseau horaire
        return new Date(Date.UTC(year, month - 1, day)); 
    }

    // Calcul de l'impact des sinistres sur le coefficient de Bonus-Malus (simplifié +25% par sinistre responsable)
    function calculerBonusApresSinistres(bonusInitial, sinistresResponsables) {
        let nouveauBonus = bonusInitial;
        
        for (let i = 0; i < sinistresResponsables; i++) {
            nouveauBonus = nouveauBonus * 1.25;
        }

        // Le Bonus ne peut pas dépasser 3.50.
        return Math.min(nouveauBonus, 3.50);
    }

    // --- Gestion de l'interface utilisateur des RI ---

    function renderRiEntries() {
        riList.innerHTML = '';
        riEntries.forEach((entry, index) => {
            const riDiv = document.createElement('div');
            riDiv.classList.add('ri-entry');
            riDiv.innerHTML = `
                <h3>Relevé d'Information #${index + 1}</h3>
                
                <div class="input-group">
                    <label>Date de Début :</label>
                    <input type="date" id="riStart-${index}" value="${entry.startDate}" onchange="updateRiEntry(${index}, 'startDate', this.value)">
                </div>
                <div class="input-group">
                    <label>Date de Fin (si clos) :</label>
                    <input type="date" id="riEnd-${index}" value="${entry.endDate || ''}" onchange="updateRiEntry(${index}, 'endDate', this.value)">
                </div>
                <div class="input-group">
                    <label>Date Dernière Échéance :</label>
                    <input type="date" id="riEcheance-${index}" value="${entry.echeanceDate}" onchange="updateRiEntry(${index}, 'echeanceDate', this.value)">
                </div>
                
                <hr style="border: 0; border-top: 1px dashed #ffcc80; margin: 15px 0;">

                <div class="input-group">
                    <label>Bonus à l'échéance (RI) :</label>
                    <input type="number" id="riBonus-${index}" value="${entry.bonusEcheance}" step="0.01" onchange="updateRiEntry(${index}, 'bonusEcheance', parseFloat(this.value))">
                </div>
                <div class="input-group">
                    <label>Sinistres Responsables (Matériels) :</label>
                    <input type="number" id="riMatResp-${index}" value="${entry.sinistres.matResp}" min="0" onchange="updateRiEntry(${index}, 'sinistres.matResp', parseInt(this.value) || 0)">
                </div>
                
                <details style="margin-bottom: 10px;">
                    <summary style="cursor: pointer; color: #e65100;">Détails Sinistres (Optionnel)</summary>
                    <div style="padding: 10px; background: #fff8e1; border-radius: 5px;">
                        <div class="input-group">
                            <label>Matériels Non Resp. :</label>
                            <input type="number" value="${entry.sinistres.matNonResp}" min="0" onchange="updateRiEntry(${index}, 'sinistres.matNonResp', parseInt(this.value) || 0)">
                        </div>
                        <div class="input-group">
                            <label>Bris de Glace :</label>
                            <input type="number" value="${entry.sinistres.brisGlace}" min="0" onchange="updateRiEntry(${index}, 'sinistres.brisGlace', parseInt(this.value) || 0)">
                        </div>
                        <div class="input-group">
                            <label>Corporels :</label>
                            <input type="number" value="${entry.sinistres.corporels}" min="0" onchange="updateRiEntry(${index}, 'sinistres.corporels', parseInt(this.value) || 0)">
                        </div>
                        <div class="input-group">
                            <label>Vol :</label>
                            <input type="number" value="${entry.sinistres.vol}" min="0" onchange="updateRiEntry(${index}, 'sinistres.vol', parseInt(this.value) || 0)">
                        </div>
                    </div>
                </details>
                
                <div id="alert-${index}"></div>
                
                <button class="orange-button" onclick="removeRiEntry(${index})">Supprimer ce RI</button>
            `;
            riList.appendChild(riDiv);
            
            // Afficher l'alerte spécifique pour ce RI
            displayBonusAlert(index, riDiv);
        });
        calculateResults();
    }

    // Met à jour la structure de l'objet ou de la sous-propriété (pour les sinistres)
    window.updateRiEntry = (index, field, value) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            riEntries[index][parent][child] = value;
        } else {
            riEntries[index][field] = value;
        }
        renderRiEntries(); // On ré-affiche tout pour mettre à jour les alertes
    };

    window.removeRiEntry = (index) => {
        riEntries.splice(index, 1);
        renderRiEntries();
    };

    addRiBtn.addEventListener('click', () => {
        riEntries.push({
            startDate: '',
            endDate: '',
            echeanceDate: '',
            bonusEcheance: 1.00,
            sinistres: {
                matResp: 0,
                matNonResp: 0,
                brisGlace: 0,
                corporels: 0,
                vol: 0
            }
        });
        renderRiEntries();
    });

    // --- Logique d'Alerte et de Calcul de Bonus ---
    
    function displayBonusAlert(index, riDivElement) {
        const entry = riEntries[index];
        const alertElement = riDivElement.querySelector(`#alert-${index}`);
        alertElement.innerHTML = '';
        
        const dateFin = parseDate(entry.endDate || entry.echeanceDate);
        
        // 1. Alerte si la sinistralité a pu impacter le bonus
        if (entry.sinistres.matResp > 0 && entry.bonusEcheance > 0) {
            const bonusApresSinistres = calculerBonusApresSinistres(entry.bonusEcheance, entry.sinistres.matResp).toFixed(2);
            
            // Si le bonus théorique (après sinistres) est différent du bonus reporté sur le RI
            if (parseFloat(bonusApresSinistres) > entry.bonusEcheance) {
                const alertText = document.createElement('div');
                alertText.classList.add('alert-bonus');
                alertText.innerHTML = `⚠️ **ALERTE BONUS :** ${entry.sinistres.matResp} sinistre(s) responsable(s) trouvé(s) ! Le Bonus reporté sur le RI est **${entry.bonusEcheance.toFixed(2)}**. Le Bonus recalculé *théorique* serait **${bonusApresSinistres}** (augmentation du malus). **Vérifier l'application des majorations !**`;
                alertElement.appendChild(alertText);
            } else {
                 const alertText = document.createElement('div');
                 alertText.classList.add('alert-ok');
                 alertText.innerHTML = `✅ **Vérification Bonus :** Le Bonus reporté (${entry.bonusEcheance.toFixed(2)}) semble déjà inclure les sinistres ou correspond à un minimum.`;
                 alertElement.appendChild(alertText);
            }
        }
        
        // 2. Alerte si le contrat est terminé depuis longtemps sans nouveau RI
        const currentDate = parseDate(currentDateInput.value);
        if (dateFin && dateFin < currentDate) {
            const gapMonths = monthDiff(dateFin, currentDate);
            if (gapMonths >= 24) {
                 const alertText = document.createElement('div');
                alertText.classList.add('alert-bonus');
                alertText.innerHTML = `🚨 **ALERTE RÈGLE 24 MOIS :** Le contrat est clos depuis plus de **${gapMonths} mois** ! Le Bonus de **${entry.bonusEcheance.toFixed(2)}** pourrait être perdu au profit de 1.00.`;
                alertElement.appendChild(alertText);
            }
        }
    }

    // --- Logique de Calcul Final ---

    function calculateResults() {
        const currentDate = parseDate(currentDateInput.value);
        if (!currentDate) return;

        // Tri des relevés par date de début (Sécurité)
        const sortedRi = [...riEntries].filter(ri => parseDate(ri.startDate)).sort((a, b) => parseDate(a.startDate) - parseDate(b.startDate));
        
        let totalMonthsOffInsurance = 0;
        let lastContractEndDate = null;
        let finalBonus = 1.00; // Commence à 1.00 par défaut

        let totalSinistres = { matResp: 0, matNonResp: 0, brisGlace: 0, corporels: 0, vol: 0 };
        
        // 1. Calcul des Mois de Reprise et des Sinistres
        sortedRi.forEach((ri, index) => {
            const riStartDate = parseDate(ri.startDate);
            const riEcheanceDate = parseDate(ri.echeanceDate);
            const riEndDate = parseDate(ri.endDate);
            
            // La date de fin de la période d'assurance est la date la plus tardive entre la fin et l'échéance
            const actualContractEndDate = riEndDate && riEcheanceDate 
                ? (riEndDate > riEcheanceDate ? riEndDate : riEcheanceDate)
                : (riEndDate || riEcheanceDate);

            // A. Calcul de l'écart (GAP) entre deux contrats
            if (lastContractEndDate && riStartDate) {
                const gapStartDate = new Date(lastContractEndDate);
                gapStartDate.setUTCDate(gapStartDate.getUTCDate() + 1);

                if (gapStartDate < riStartDate) {
                    const monthsOff = monthDiff(gapStartDate, riStartDate);
                    if (monthsOff > 0) {
                        totalMonthsOffInsurance += monthsOff;
                    }
                }
            }
            
            // B. Mise à jour de la date de fin pour le prochain calcul
            if (actualContractEndDate && riStartDate <= actualContractEndDate) { 
                lastContractEndDate = actualContractEndDate;
            }

            // C. Accumulation des Sinistres
            totalSinistres.matResp += ri.sinistres.matResp;
            totalSinistres.matNonResp += ri.sinistres.matNonResp;
            totalSinistres.brisGlace += ri.sinistres.brisGlace;
            totalSinistres.corporels += ri.sinistres.corporels;
            totalSinistres.vol += ri.sinistres.vol;

            // D. Détermination du Bonus (Le Bonus final est celui du dernier RI, sous réserve de la règle des 24 mois)
            if (ri.bonusEcheance) {
                finalBonus = ri.bonusEcheance;
            }
        });

        // 2. Calcul de l'écart final (entre le dernier contrat et la date du jour)
        if (lastContractEndDate && lastContractEndDate < currentDate) {
            const gapStartDate = new Date(lastContractEndDate);
            gapStartDate.setUTCDate(gapStartDate.getUTCDate() + 1);
            
            const monthsOff = monthDiff(gapStartDate, currentDate);
            if (monthsOff > 0) {
                totalMonthsOffInsurance += monthsOff;
            }
        }
        
        // 3. Application de la Règle des 24 mois sur le Bonus
        if (totalMonthsOffInsurance >= 24) {
            finalBonus = 1.00; // Réinitialisation du bonus
        }


        // --- Affichage des Résultats ---

        monthsToResumeSpan.textContent = `${totalMonthsOffInsurance} mois`;
        if (totalMonthsOffInsurance >= 24) {
            monthsToResumeSpan.textContent += " (Règle des 24 mois APPLICABLE - Perte de Bonus possible)";
            monthsToResumeSpan.style.color = "#d32f2f";
        } else {
            monthsToResumeSpan.style.color = "#bf360c";
        }
        
        // Affichage du Bonus final
        finalBonusSpan.textContent = finalBonus.toFixed(2);
        
        // Récapitulatif des Sinistres
        sinistresSummaryList.innerHTML = `
            <li>**Responsables (Matériels) :** ${totalSinistres.matResp}</li>
            <li>**Non Responsables (Matériels) :** ${totalSinistres.matNonResp}</li>
            <li>**Bris de Glace :** ${totalSinistres.brisGlace}</li>
            <li>**Corporels :** ${totalSinistres.corporels}</li>
            <li>**Vol :** ${totalSinistres.vol}</li>
        `;
    }

    // Écouteurs d'événements pour déclencher le recalcul
    currentDateInput.addEventListener('change', renderRiEntries); // L'événement change déclenche le render et donc le calcul

    // --- Initialisation ---
    // Ajout de 6 relevés par défaut au chargement pour faciliter la saisie rapide.
    if (riEntries.length === 0) {
        for (let i = 0; i < 6; i++) {
            riEntries.push({
                startDate: '',
                endDate: '',
                echeanceDate: '',
                bonusEcheance: 1.00,
                sinistres: {
                    matResp: 0,
                    matNonResp: 0,
                    brisGlace: 0,
                    corporels: 0,
                    vol: 0
                }
            });
        }
    }
    renderRiEntries();
});
