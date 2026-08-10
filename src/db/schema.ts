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

-- position is the component's 0-based slot in the recipe's component list,
-- i.e. the order the user arranged them in. It has to be stored explicitly:
-- the UNIQUE (recipe_id, name) constraint below creates an index that SQLite
-- picks as a covering index for "WHERE recipe_id = ?", so an unordered read
-- comes back sorted by name rather than in insertion order.
CREATE TABLE IF NOT EXISTS components (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id  INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    directions TEXT NOT NULL,
    prep_time  INTEGER NOT NULL,
    cook_time  INTEGER NOT NULL,
    position   INTEGER NOT NULL DEFAULT 0,
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

/**
 * Garbage-collection triggers for the shared master tables.
 *
 * ingredients/equipment/tags are shared master data — many recipes reuse
 * "flour", "whisk", "vegan" — so they can't hang off a recipe with
 * ON DELETE CASCADE. Instead each junction table gets an AFTER DELETE trigger
 * that drops the master row once nothing references it anymore. The trigger
 * fires whether the junction row went away from an explicit app delete or from
 * an FK cascade, so deleting a recipe collects everything it was the last user
 * of, two cascade levels down (recipes -> components -> component_ingredients).
 *
 * Ingredients are reachable from two junction tables (recipe-level and
 * component-level lines), so both triggers check both tables before deleting
 * — an ingredient listed on the recipe itself must survive the deletion of a
 * component that also used it.
 *
 * Run this AFTER the migrations in client.ts, never as part of SQL_SCHEMA. A
 * table rebuild (see migrateComponentIngredientsKey) is fatal with these
 * installed: DROP TABLE silently takes that table's own triggers with it, and
 * the following ALTER TABLE ... RENAME re-parses the whole schema, which fails
 * outright on any surviving trigger that still references the dropped name
 * ("no such table: main.component_ingredients"). SQL_GC_DROP_TRIGGERS clears
 * them before the migrations for exactly that reason.
 */
export const SQL_GC_DROP_TRIGGERS = `
DROP TRIGGER IF EXISTS trg_gc_ingredients_component;
DROP TRIGGER IF EXISTS trg_gc_ingredients_recipe;
DROP TRIGGER IF EXISTS trg_gc_equipment;
DROP TRIGGER IF EXISTS trg_gc_tags;
`

export const SQL_GC_TRIGGERS = `
CREATE TRIGGER IF NOT EXISTS trg_gc_ingredients_component
AFTER DELETE ON component_ingredients
BEGIN
    DELETE FROM ingredients
    WHERE name = OLD.ingredient
      AND NOT EXISTS (SELECT 1 FROM component_ingredients WHERE ingredient = OLD.ingredient)
      AND NOT EXISTS (SELECT 1 FROM recipe_ingredients WHERE ingredient = OLD.ingredient);
END;

CREATE TRIGGER IF NOT EXISTS trg_gc_ingredients_recipe
AFTER DELETE ON recipe_ingredients
BEGIN
    DELETE FROM ingredients
    WHERE name = OLD.ingredient
      AND NOT EXISTS (SELECT 1 FROM component_ingredients WHERE ingredient = OLD.ingredient)
      AND NOT EXISTS (SELECT 1 FROM recipe_ingredients WHERE ingredient = OLD.ingredient);
END;

CREATE TRIGGER IF NOT EXISTS trg_gc_equipment
AFTER DELETE ON component_equipment
BEGIN
    DELETE FROM equipment
    WHERE name = OLD.equipment
      AND NOT EXISTS (SELECT 1 FROM component_equipment WHERE equipment = OLD.equipment);
END;

CREATE TRIGGER IF NOT EXISTS trg_gc_tags
AFTER DELETE ON recipe_tags
BEGIN
    DELETE FROM tags
    WHERE name = OLD.tag
      AND NOT EXISTS (SELECT 1 FROM recipe_tags WHERE tag = OLD.tag);
END;
`

/**
 * One-off sweep for master rows orphaned before the triggers above existed.
 * The triggers keep the tables clean going forward; this catches the backlog
 * in databases written by earlier builds. Guarded by a SELECT in client.ts so
 * a clean database doesn't take a write on every launch.
 */
export const SQL_GC_SWEEP = `
DELETE FROM ingredients
WHERE name NOT IN (SELECT ingredient FROM component_ingredients)
  AND name NOT IN (SELECT ingredient FROM recipe_ingredients);

DELETE FROM equipment
WHERE name NOT IN (SELECT equipment FROM component_equipment);

DELETE FROM tags
WHERE name NOT IN (SELECT tag FROM recipe_tags);
`
