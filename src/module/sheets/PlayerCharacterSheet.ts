/**
 * Extends the basic ActorSheet with specific features for 7Sea V3.
 */
export class PlayerCharacterSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["fvtt-svnsea-v3", "sheet", "actor"],
      template: "systems/fvtt-svnsea-v3/templates/sheets/actor-sheet.hbs",
      width: 1000,
      height: 800,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attributes" }]
    });
  }

  /** @override */
  getData() {
    const data: any = super.getData();

    // Calculer les seuils de garde pour chaque attribut
    const attributes = data.actor.system.attributes;
    const thresholdModifier = (game.settings.get("fvtt-svnsea-v3", "modificateurSeuil") as number) || 0;
    const variante = game.settings.get("fvtt-svnsea-v3", "variante") as string;
    data.variante = variante;

    if (attributes) {
      for (let attr in attributes) {
        const value = attributes[attr].value;
        // Formule : Seuil = (10 - valeur) - modificateur
        attributes[attr].seuil = (10 - value) - thresholdModifier;
      }
    }

    // Calculer les seuils de garde pour chaque compétence si variante standard
    const skills = data.actor.system.skills;
    if (variante === 'standard' && skills) {
      for (let sKey in skills) {
        const sValue = skills[sKey].value || 0;
        skills[sKey].seuil = (10 - sValue) - thresholdModifier;
      }
    }

    // Calculer les attributs de combat basés sur les attributs liés
    const combatAttributes = data.actor.system.combatAttributes;
    if (combatAttributes && attributes) {
      for (let cAttr in combatAttributes) {
        const linkedKey = combatAttributes[cAttr].linkedAttribute;
        if (linkedKey && attributes[linkedKey]) {
          combatAttributes[cAttr].value = attributes[linkedKey].value;
          combatAttributes[cAttr].seuil = attributes[linkedKey].seuil;
        }
      }
    }

    // Calcul des blessures
    const robustesse = combatAttributes?.robustesse?.value || attributes?.resolution?.value || 1;
    const baseBlessure = robustesse;
    const blessuresValue = data.actor.system.blessures?.value || 0;
    const dramatiquesValue = data.actor.system.blessures?.dramatiques || 0;

    const maxDramatiques = data.actor.type === 'lieutenant' ? 2 : 4;

    const blessures = [];
    for (let i = 1; i <= maxDramatiques; i++) {
      const group = {
        index: i,
        normals: [] as any[],
        dramatique: {
          filled: dramatiquesValue >= i
        }
      };
      for (let j = 1; j <= baseBlessure; j++) {
        const woundIndex = (i - 1) * baseBlessure + j;
        group.normals.push({
          index: woundIndex,
          filled: blessuresValue >= woundIndex
        });
      }
      blessures.push(group);
    }
    data.blessures = blessures;
    
    // Vérifier si l'onglet Sorcellerie doit être affiché
    // Uniquement pour personnages, scélérats ou lieutenants ayant un cercle en Sorcellerie
    const actorType = data.actor.type;
    const isRelevantType = ['playerCharacter', 'scelerat', 'lieutenant'].includes(actorType);
    const hasSorcellerie = (data.actor.system.skills?.sorcellerie?.value || 0) > 0;
    
    data.showSorcellerieTab = isRelevantType && hasSorcellerie;

    // Config pour la sorcellerie
    data.config = {
      attributes: {
        "esprit": "Esprit",
        "finesse": "Finesse",
        "gaillardise": "Gaillardise",
        "resolution": "Résolution",
        "panache": "Panache"
      },
      sorcellerieTypes: {
        "porte": "Porte",
        "sorte": "Sorte",
        "hexen": "Hexen",
        "glamour": "Glamour",
        "sanderis": "Sanderis",
        "alquemie": "Alquemie"
      }
    };

    // Préparer le contrecoup si nécessaire
    if (data.actor.system.sorcellerie?.type === "sorte") {
      const contrecoupValue = data.actor.system.sorcellerie.contrecoup || 0;
      const contrecoup = [];
      for (let i = 1; i <= 10; i++) {
        contrecoup.push({
          index: i,
          filled: contrecoupValue >= i
        });
      }
      data.contrecoup = contrecoup;
    }

    return data;
  }

  /** @override */
  activateListeners(html: JQuery) {
    super.activateListeners(html);

    // Add Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Gestion des cercles d'attributs
    html.find('.attribute-circle').click(this._onAttributeCircleClick.bind(this));

    // Gestion des cercles de compétences
    html.find('.skill-circle').click(this._onSkillCircleClick.bind(this));

    // Gestion de la spécialité des compétences
    html.find('.skill-specialized-toggle').click(this._onSkillSpecializedClick.bind(this));

    // Gestion du lancer de dés pour les compétences
    html.find('.skill-roll-dice').click(this._onRollSkill.bind(this));

    // Modification des avantages
    html.find('.item-edit').click(this._onItemEdit.bind(this));

    // Suppression des avantages et equipements
    html.find('.item-delete').click(this._onItemDelete.bind(this));

    // Gestion de l'héroïsme
    html.find('.heroisme-control').click(this._onHeroismeControl.bind(this));

    // Mise à jour directe du nom de l'équipement
    html.find('.equipement-name input').change(this._onEquipementNameChange.bind(this));

    // Gestion des blessures
    html.find('.blessure-normal').click(this._onBlessureNormalClick.bind(this));
    html.find('.blessure-dramatique').click(this._onBlessureDramatiqueClick.bind(this));

    // Gestion du contrecoup
    html.find('.contrecoup-circle').click(this._onContrecoupClick.bind(this));
  }

  /**
   * Handle clicking on a contrecoup circle
   * @param {Event} event   The originating click event
   * @private
   */
  private async _onContrecoupClick(event: JQuery.ClickEvent) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index);
    const system = (this.actor as any).system;
    const currentValue = Number(system.sorcellerie?.contrecoup) || 0;

    const newValue = currentValue === index ? index - 1 : index;
    await this.actor.update({ "system.sorcellerie.contrecoup": newValue });
  }

  /**
   * Handle clicking on a normal wound circle
   * @param {Event} event   The originating click event
   * @private
   */
  private async _onBlessureNormalClick(event: JQuery.ClickEvent) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index);
    const system = (this.actor as any).system;
    const currentValue = Number(system.blessures?.value) || 0;
    const currentDramatiques = Number(system.blessures?.dramatiques) || 0;
    
    // Si on clique sur la dernière blessure remplie, on la décoche
    // Sinon on remplit jusqu'à cet index
    const newValue = currentValue === index ? index - 1 : index;

    const updates: any = { "system.blessures.value": newValue };

    // Quand je coche un cercle, je doit aussi cocher les étoiles qui sont avant.
    // L'étoile avant le cercle d'index 'index' est celle du groupe précédent.
    const attributes = system.attributes;
    const gaillardise = attributes?.gaillardise?.value || 1;
    const resolution = attributes?.resolution?.value || 1;
    const baseBlessure = Math.max(gaillardise, resolution);
    
    const groupOfClick = Math.ceil(index / baseBlessure);
    const requiredDramatiques = groupOfClick - 1;

    if (newValue > currentValue && currentDramatiques < requiredDramatiques) {
      updates["system.blessures.dramatiques"] = requiredDramatiques;
    }

    await this.actor.update(updates);
  }

  /**
   * Handle clicking on a dramatic wound star
   * @param {Event} event   The originating click event
   * @private
   */
  private async _onBlessureDramatiqueClick(event: JQuery.ClickEvent) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index);
    const system = (this.actor as any).system;
    const currentDramatiques = Number(system.blessures?.dramatiques) || 0;
    const currentValue = Number(system.blessures?.value) || 0;
    
    const newValue = currentDramatiques === index ? index - 1 : index;

    const updates: any = { "system.blessures.dramatiques": newValue };

    // Quand je coche une étoile, je dois aussi cocher tous les cercles précédents.
    // Les cercles précédents l'étoile 'index' sont tous ceux des groupes 1 à 'index'.
    const attributes = system.attributes;
    const gaillardise = attributes?.gaillardise?.value || 1;
    const resolution = attributes?.resolution?.value || 1;
    const baseBlessure = Math.max(gaillardise, resolution);

    const requiredValue = index * baseBlessure;

    if (newValue > currentDramatiques && currentValue < requiredValue) {
      updates["system.blessures.value"] = requiredValue;
    }

    await this.actor.update(updates);
  }

  /**
   * Handle changing the name of an equipment directly from the sheet
   * @param {Event} event   The originating change event
   * @private
   */
  private async _onEquipementNameChange(event: JQuery.ChangeEvent) {
    event.preventDefault();
    const element = $(event.currentTarget).closest(".equipement-item");
    const itemId = element.data("item-id");
    const newName = event.currentTarget.value;
    const item = this.actor.items.get(itemId);
    if (item) {
      await item.update({ name: newName });
    }
  }

  /**
   * Handle heroism controls (+/-)
   * @param {Event} event   The originating click event
   * @private
   */
  private async _onHeroismeControl(event: JQuery.ClickEvent) {
    event.preventDefault();
    const action = event.currentTarget.dataset.action;
    const currentValue = Number((this.actor as any).system.heroisme?.value) || 0;
    const newValue = action === "increase" ? currentValue + 1 : Math.max(0, currentValue - 1);

    await this.actor.update({ "system.heroisme.value": newValue });
  }

  /**
   * Handle editing an Owned Item for the actor
   * @param {Event} event   The originating click event
   * @private
   */
  private _onItemEdit(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = $(event.currentTarget).closest(".avantage-item, .equipement-item, .travers-item, .pouvoir-item");
    const itemId = element.data("item-id");
    const item = this.actor.items.get(itemId);
    item?.sheet?.render(true);
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  private async _onItemCreate(event: JQuery.ClickEvent) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type;
    const typeName = type.charAt(0).toUpperCase() + type.slice(1);

    let itemData;
    if (type === "equipements") {
      itemData = {
        name: `Nouvel Equipement`,
        type: type
      };
    } else if (type === "avantage") {
      itemData = {
        name: `Nouvel Avantage`,
        type: type,
        system: {
          type: "passif",
          description: ""
        }
      };
    } else if (type === "travers") {
      itemData = {
        name: `Nouveau Travers`,
        type: type,
        system: {
          description: ""
        }
      };
    } else if (type === "pouvoir") {
      itemData = {
        name: `Nouveau Pouvoir`,
        type: type,
        system: {
          description: ""
        }
      };
    } else {
      // For other types, include value
      itemData = {
        name: `New ${typeName}`,
        type: type,
        system: { value: 0 }
      };
    }
    await this.actor.createEmbeddedDocuments("Item", [itemData]);
  }

  /**
   * Handle deleting an Owned Item from the Actor
   * @param {Event} event   The originating click event
   * @private
   */
  private async _onItemDelete(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = $(event.currentTarget).closest(".avantage-item, .equipement-item, .travers-item, .pouvoir-item");
    const itemId = element.data("item-id");
    await this.actor.deleteEmbeddedDocuments("Item", [itemId]);
  }

  /**
   * Handle clicking on an attribute circle
   * @param {Event} event   The originating click event
   * @private
   */
  private async _onAttributeCircleClick(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget;
    const index = Number(element.dataset.index);
    const parent = $(element).closest(".profile-item");
    const attribute = parent.data("attribute");

    if (attribute) {
      const field = `system.attributes.${attribute}.value`;
      await this.actor.update({ [field]: index });
    }
  }

  /**
   * Handle clicking on a skill circle
   * @param {Event} event   The originating click event
   * @private
   */
  private async _onSkillCircleClick(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget;
    const index = Number(element.dataset.index);
    const parent = $(element).closest(".skill-item");
    const skill = parent.data("skill");

    if (skill) {
      const field = `system.skills.${skill}.value`;
      // Allow toggling off if clicking on the same value
      const currentValue = foundry.utils.getProperty(this.actor, field);
      const newValue = (currentValue === index && index === 1) ? 0 : index;
      await this.actor.update({ [field]: newValue });
    }
  }

  /**
   * Handle clicking on a skill specialty toggle
   * @param {Event} event   The originating click event
   * @private
   */
  private async _onSkillSpecializedClick(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget;
    const parent = $(element).closest(".skill-item");
    const skill = parent.data("skill");

    if (skill) {
      const field = `system.skills.${skill}.specialized`;
      const currentValue = foundry.utils.getProperty(this.actor, field);
      await this.actor.update({ [field]: !currentValue });
    }
  }

  /**
   * Handle clicking on a skill roll icon
   * @param {Event} event   The originating click event
   * @private
   */
  private async _onRollSkill(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget;
    const parent = $(element).closest(".skill-item");
    const skillKey = parent.data("skill");
    const skill = foundry.utils.getProperty(this.actor, `system.skills.${skillKey}`);
    const attributes = (this.actor as any).system.attributes;
    const combatAttributes = (this.actor as any).system.combatAttributes;

    const attributeLabels: Record<string, string> = {
      esprit: "Esprit",
      finesse: "Finesse",
      gaillardise: "Gaillardise",
      resolution: "Résolution",
      panache: "Panache",
      attaque: "Attaque",
      defense: "Défense",
      mouvement: "Mouvement",
      degats: "Dégâts",
      robustesse: "Robustesse"
    };

    const skillLabels: Record<string, string> = {
      armeDeTir: "Arme de tir",
      armesBlanches: "Armes blanches",
      athletisme: "Athlétisme",
      empathie: "Empathie",
      furtivite: "Furtivité",
      ingenierie: "Ingénierie",
      intrigue: "Intrigue",
      larcin: "Larcin",
      legendes: "Légendes",
      lettre: "Lettre",
      navigation: "Navigation",
      persuasion: "Persuasion",
      protocole: "Protocole",
      recherche: "Recherche",
      religion: "Religion",
      representation: "Représentation",
      science: "Science",
      sorcellerie: "Sorcellerie",
      strategie: "Stratégie",
      subornation: "Subornation",
      survie: "Survie"
    };

    const skillLabel = skillLabels[skillKey] || skillKey;

    // Préparer le contenu de la modale
    let attributeOptions = "";
    for (let key of Object.keys(attributes)) {
      const label = attributeLabels[key] || key;
      attributeOptions += `<option value="${key}">${label}</option>`;
    }

    if (combatAttributes) {
      attributeOptions += `<optgroup label="Combat">`;
      for (let key of Object.keys(combatAttributes)) {
        const label = attributeLabels[key] || key;
        attributeOptions += `<option value="${key}">${label}</option>`;
      }
      attributeOptions += `</optgroup>`;
    }

    const template = `
      <form>
        <div class="form-group">
          <label>Attribut</label>
          <select name="attribute">
            ${attributeOptions}
          </select>
        </div>
        <div class="form-group">
          <label>Bonus (dés supplémentaires)</label>
          <input type="number" name="bonus" value="0" />
        </div>
        <div class="form-group">
          <label>Pari</label>
          <input type="number" name="pari" value="0" />
        </div>
        <div class="form-group">
          <label>Difficulté (optionnel)</label>
          <input type="number" name="difficulty" value="2" />
        </div>
      </form>
    `;

    new Dialog({
      title: `Test de ${skillLabel}`,
      content: template,
      buttons: {
        roll: {
          icon: '<i class="fas fa-dice"></i>',
          label: "Lancer",
          callback: async (html: any) => {
            const attrKey = html.find('[name="attribute"]').val();
            const bonus = parseInt(html.find('[name="bonus"]').val()) || 0;
            const pari = parseInt(html.find('[name="pari"]').val()) || 0;
            const difficultyStr = html.find('[name="difficulty"]').val();
            const difficulty = difficultyStr !== "" ? parseInt(difficultyStr) : null;

            let attribute = attributes[attrKey];
            let attrLabel = attributeLabels[attrKey] || attrKey;
            const thresholdModifier = (game.settings.get("fvtt-svnsea-v3", "modificateurSeuil") as number) || 0;
            if (!attribute && combatAttributes) {
              const combatAttr = combatAttributes[attrKey];
              if (combatAttr) {
                const linkedKey = combatAttr.linkedAttribute;
                attribute = attributes[linkedKey];
                // Pour l'affichage dans le jet, on peut garder le label de l'attribut de combat
              }
            }
            const skillValue = skill.value;
            const attrValue = attribute.value;
            const variante = game.settings.get("fvtt-svnsea-v3", "variante") as string;
            const seuil = variante === 'standard' ? (10 - skillValue) - thresholdModifier : attribute.seuil;
            const dramatiques = (this.actor as any).system.blessures?.dramatiques || 0;
            const isSpecialized = skill.specialized || false;

            // Nombre de dés : Attribut + Compétence + Bonus - Pari - Blessures Dramatiques
            let numDice = attrValue + skillValue + bonus - pari - dramatiques;

            if (numDice <= 0) {
              ui.notifications.warn("Le nombre de dés doit être supérieur à 0.");
              return;
            }

            // Lancer les dés
            const roll = new Roll(`${numDice}d10`);
            await roll.evaluate();

            // Compter les succès (dés >= seuil)
            let successCount = 0;
            let diceResults = [...(roll.terms[0] as any).results];

            // Gérer les 10 explosifs si spécialité
            if (isSpecialized) {
              let tens = diceResults.filter(r => r.result === 10).length;
              while (tens > 0) {
                const extraRoll = new Roll(`${tens}d10`);
                await extraRoll.evaluate();
                const extraResults = (extraRoll.terms[0] as any).results;
                diceResults = diceResults.concat(extraResults);
                tens = extraResults.filter((r: any) => r.result === 10).length;
              }
            }

            for (let result of diceResults) {
              if (result.result >= seuil) {
                successCount++;
              }
            }

            // Message de résultat
            let statusMessage = "";
            if (difficulty !== null) {
              if (successCount >= difficulty) {
                statusMessage = `<p style="color: green; font-weight: bold;">Réussite (Difficulté ${difficulty})</p>`;
              } else {
                statusMessage = `<p style="color: red; font-weight: bold;">Échec (Difficulté ${difficulty})</p>`;
              }
            }

            let pariMessage = "";
            if (pari > 0) {
              pariMessage = `<li>Pari : ${pari}</li>`;
            }

            const chatContent = `
              <div class="fvtt-svnsea-v3-roll">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <img src="${this.actor.img}" width="32" height="32" style="border: none;"/>
                  <h4 style="margin: 0; font-size: 0.9em;">${attrLabel} - ${skillLabel}</h4>
                </div>
                <ul>
                  <li>Succès : ${successCount}</li>
                  ${pariMessage}
                </ul>
                ${statusMessage}
                <div class="roll-details" style="font-size: 0.8em; color: gray;">
                  Dés : ${diceResults.map((r: any) => r.result).join(", ")} (Seuil : ${seuil})
                </div>
              </div>
            `;

            await ChatMessage.create({
              speaker: ChatMessage.getSpeaker({ actor: this.actor as any }),
              content: chatContent,
              type: CONST.CHAT_MESSAGE_TYPES.ROLL,
              rolls: [roll]
            });
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Annuler"
        }
      },
      default: "roll"
    }).render(true);
  }
}
