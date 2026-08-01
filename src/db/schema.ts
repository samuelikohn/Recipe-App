export const SQL_SCHEMA = `
CREATE TABLE IF NOT EXISTS recipes (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL UNIQUE,
    num_servings INTEGER NOT NULL,
    directions   TEXT NOT NULL DEFAULT '',
    prep_time    INTEGER NOT NULL DEFAULT 0,
    cook_time    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS images (
    filepath  TEXT PRIMARY KEY NOT NULL,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS components (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id  INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    directions TEXT NOT NULL,
    prep_time  INTEGER NOT NULL,
    cook_time  INTEGER NOT NULL,
    UNIQUE (recipe_id, name)
);

CREATE TABLE IF NOT EXISTS tags (
    name TEXT PRIMARY KEY NOT NULL
);

CREATE TABLE IF NOT EXISTS recipe_tags (
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    tag       TEXT NOT NULL REFERENCES tags(name) ON DELETE CASCADE,
    PRIMARY KEY (recipe_id, tag)
);

CREATE TABLE IF NOT EXISTS ingredients (
    name TEXT PRIMARY KEY NOT NULL
);

-- A component may list the same ingredient more than once as long as the
-- prep differs (e.g. "1 onion, diced" for the sauce plus "1 onion, sliced"
-- for the garnish), so prep is part of the key. Two rows with the same
-- ingredient AND the same prep are still rejected — that's a duplicate the
-- user meant to enter as a single larger amount.
CREATE TABLE IF NOT EXISTS component_ingredients (
    component_id INTEGER NOT NULL REFERENCES components(id) ON DELETE CASCADE,
    ingredient   TEXT NOT NULL REFERENCES ingredients(name) ON DELETE CASCADE,
    amount       REAL NOT NULL,
    unit         TEXT NOT NULL,
    prep         TEXT NOT NULL,
    PRIMARY KEY (component_id, ingredient, prep)
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
    recipe_id  INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient TEXT NOT NULL REFERENCES ingredients(name) ON DELETE CASCADE,
    amount     REAL NOT NULL,
    unit       TEXT NOT NULL,
    prep       TEXT NOT NULL,
    PRIMARY KEY (recipe_id, ingredient, prep)
);

CREATE TABLE IF NOT EXISTS equipment (
    name TEXT PRIMARY KEY NOT NULL
);

CREATE TABLE IF NOT EXISTS component_equipment (
    component_id INTEGER NOT NULL REFERENCES components(id) ON DELETE CASCADE,
    equipment    TEXT NOT NULL REFERENCES equipment(name) ON DELETE CASCADE,
    PRIMARY KEY (component_id, equipment)
);
`
