/**
 * Extends the basic ActorSheet with specific features for 7Sea V3.
 */
export class PlayerCharacterSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
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
    for (let attr in attributes) {
      const value = attributes[attr].value;
      // Formule : Seuil = 10 - valeur (si valeur entre 1 et 5)
      // Attribut 1 => Garde 9
      // Attribut 2 => Garde 8
      // Attribut 3 => Garde 7
      // Attribut 4 => Garde 6
      // Attribut 5 => Garde 5
      attributes[attr].seuil = 10 - value;
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
  }

  /**
   * Handle editing an Owned Item for the actor
   * @param {Event} event   The originating click event
   * @private
   */
  private _onItemEdit(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = $(event.currentTarget).closest(".avantage-item, .equipement-item");
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
      // For equipements, only include name (no value)
      itemData = {
        name: `New ${typeName}`,
        type: type,
        system: {}
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
    const element = $(event.currentTarget).closest(".avantage-item, .equipement-item");
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
      const currentValue = getProperty(this.actor, field);
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
      const currentValue = getProperty(this.actor, field);
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
    const skill = getProperty(this.actor, `system.skills.${skillKey}`);
    const attributes = (this.actor as any).system.attributes;

    const attributeLabels: Record<string, string> = {
      esprit: "Esprit",
      finesse: "Finesse",
      gaillardise: "Gaillardise",
      resolution: "Résolution",
      panache: "Panache"
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

            const attribute = attributes[attrKey];
            const attrLabel = attributeLabels[attrKey] || attrKey;
            const skillValue = skill.value;
            const attrValue = attribute.value;
            const seuil = attribute.seuil;

            // Nombre de dés : Attribut + Compétence + Bonus - Pari
            const numDice = attrValue + skillValue + bonus - pari;

            if (numDice <= 0) {
              ui.notifications.warn("Le nombre de dés doit être supérieur à 0.");
              return;
            }

            // Lancer les dés
            const roll = new Roll(`${numDice}d10`);
            await roll.evaluate();

            // Compter les succès (dés >= seuil)
            let successCount = 0;
            const diceResults = (roll.terms[0] as any).results;
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
                <h3>${attrLabel} - ${skillLabel}</h3>
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
