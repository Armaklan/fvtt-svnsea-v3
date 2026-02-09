import "./styles/main.scss";
import {PlayerCharacterSheet} from "./module/sheets/PlayerCharacterSheet";
import {SecondCouteauSheet} from "./module/sheets/SecondCouteauSheet";
import {LieutenantSheet} from "./module/sheets/LieutenantSheet";
import {AvantageSheet} from "./module/sheets/AvantageSheet";
import {PouvoirSheet} from "./module/sheets/PouvoirSheet";
import {TraversSheet} from "./module/sheets/TraversSheet";

Hooks.once("init", async () => {
    console.log("Custom System | Initialisation");

    // Register custom sheets
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("fvtt-svnsea-v3", PlayerCharacterSheet, {
        types: ["playerCharacter", "scelerat"],
        makeDefault: true
    });
    Actors.registerSheet("fvtt-svnsea-v3", SecondCouteauSheet, {
        types: ["secondCouteau"],
        makeDefault: true
    });
    Actors.registerSheet("fvtt-svnsea-v3", LieutenantSheet, {
        types: ["lieutenant"],
        makeDefault: true
    });

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("fvtt-svnsea-v3", AvantageSheet, {
        types: ["avantage"],
        makeDefault: true
    });
    Items.registerSheet("fvtt-svnsea-v3", PouvoirSheet, {
        types: ["pouvoir"],
        makeDefault: true
    });
    Items.registerSheet("fvtt-svnsea-v3", TraversSheet, {
        types: ["travers"],
        makeDefault: true
    });

    // Register Handlebars partials
    loadTemplates([
        "systems/fvtt-svnsea-v3/templates/sheets/partials/equipement.hbs",
        "systems/fvtt-svnsea-v3/templates/sheets/partials/avantage.hbs",
        "systems/fvtt-svnsea-v3/templates/sheets/partials/travers.hbs",
        "systems/fvtt-svnsea-v3/templates/sheets/partials/header.hbs",
        "systems/fvtt-svnsea-v3/templates/sheets/partials/profile.hbs",
        "systems/fvtt-svnsea-v3/templates/sheets/partials/skills.hbs",
        "systems/fvtt-svnsea-v3/templates/sheets/partials/sorcellerie.hbs",
        "systems/fvtt-svnsea-v3/templates/sheets/second-couteau-sheet.hbs"
    ]);

    // Handlebars helpers
    Handlebars.registerHelper('times', function(n, block) {
        let accum = '';
        for(let i = 1; i <= n; ++i)
            accum += block.fn(i);
        return accum;
    });

    Handlebars.registerHelper('lte', function(v1, v2) {
        return v1 <= v2;
    });
});
