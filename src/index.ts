import "./styles/main.scss";
import {PlayerCharacterSheet} from "./module/sheets/PlayerCharacterSheet";

Hooks.once("init", async () => {
    console.log("Custom System | Initialisation");

    // Register custom sheets
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("fvtt-svnsea-v3", PlayerCharacterSheet, {
        types: ["playerCharacter"],
        makeDefault: true
    });

    // Register Handlebars partials
    loadTemplates([
        "systems/fvtt-svnsea-v3/templates/sheets/partials/equipement.hbs",
        "systems/fvtt-svnsea-v3/templates/sheets/partials/technique.hbs",
        "systems/fvtt-svnsea-v3/templates/sheets/partials/header.hbs",
        "systems/fvtt-svnsea-v3/templates/sheets/partials/profile.hbs"
    ]);
});
