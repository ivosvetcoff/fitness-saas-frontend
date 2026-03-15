/**
 * Verificaciones básicas del mobile app (React Native / Expo)
 * No usa Playwright — solo lectura estática de App.js
 * Ejecutar: node tests/test_basic.js
 */

const fs = require('fs');
const path = require('path');

const APP_PATH = path.join(__dirname, '..', 'App.js');

let PASS = 0;
let FAIL = 0;
let WARN = 0;

function ok(msg) {
  console.log(`  ✅ ${msg}`);
  PASS++;
}

function fail(msg) {
  console.log(`  ❌ FAIL: ${msg}`);
  FAIL++;
}

function warn(msg) {
  console.log(`  ⚠️  WARN: ${msg}`);
  WARN++;
}

console.log('\n── Mobile App (React Native) ──────────────────────\n');

// Leer App.js
let content;
try {
  content = fs.readFileSync(APP_PATH, 'utf-8');
  console.log(`App.js leído: ${content.length} chars\n`);
} catch (e) {
  fail(`No se puede leer App.js: ${e.message}`);
  process.exit(1);
}

// ── CHECK 1: BACKEND_URL no debe apuntar a IP local ──────
console.log('CHECK 1: BACKEND_URL apunta a producción (no IP local)');
const backendMatch = content.match(/const\s+BACKEND_URL\s*=\s*['"`]([^'"`]+)['"`]/);
if (!backendMatch) {
  fail("No se encontró 'const BACKEND_URL' en App.js");
} else {
  const url = backendMatch[1];
  if (/^https?:\/\/192\.168\.|^https?:\/\/10\.|^https?:\/\/172\.(1[6-9]|2\d|3[01])\./.test(url)) {
    fail(
      `BACKEND_URL apunta a IP local: "${url}"\n` +
      `   → Cambiar a la URL de producción de Render antes de entregar al cliente.`
    );
  } else if (url.includes('localhost') || url.includes('127.0.0.1')) {
    fail(
      `BACKEND_URL apunta a localhost: "${url}"\n` +
      `   → Cambiar a la URL de producción de Render antes de entregar al cliente.`
    );
  } else {
    ok(`BACKEND_URL correcta: "${url}"`);
  }
}

// ── CHECK 2: EXERCISE_IMAGES tiene los ejercicios clave ──
console.log('\nCHECK 2: EXERCISE_IMAGES contiene ejercicios principales de Agustín');
const exercisesRequired = [
  'Sentadilla en multifuerza',
  'Elevación pelvis barra',
  'Femoral sentada 1 pierna',
  'Peso muerto barra',
];

const hasExerciseImages = content.includes('EXERCISE_IMAGES');
if (!hasExerciseImages) {
  fail("No se encontró 'EXERCISE_IMAGES' en App.js");
} else {
  for (const exercise of exercisesRequired) {
    if (content.includes(`'${exercise}'`) || content.includes(`"${exercise}"`)) {
      ok(`EXERCISE_IMAGES incluye: "${exercise}"`);
    } else {
      // Buscar variantes sin tilde o con capitalización diferente
      const normalized = exercise.toLowerCase().replace(/[áéíóú]/g, c =>
        ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' }[c])
      );
      const contentLower = content.toLowerCase();
      const keyFound = [...content.matchAll(/['"]([^'"]{5,60})['"]\s*:/g)]
        .some(m => m[1].toLowerCase().includes(normalized.split(' ')[0]));

      if (keyFound) {
        warn(`"${exercise}" no encontrado exacto — verificar variante de nombre en EXERCISE_IMAGES`);
      } else {
        warn(`"${exercise}" NO está en EXERCISE_IMAGES — el ejercicio no tendrá imagen en la app`);
      }
    }
  }
}

// ── CHECK 3: CUSTOM_REP_SCHEMES existe y no está vacío ───
console.log('\nCHECK 3: CUSTOM_REP_SCHEMES existe y tiene entradas');
const repSchemesMatch = content.match(/const\s+CUSTOM_REP_SCHEMES\s*=\s*\{([^}]*)\}/s);
if (!repSchemesMatch) {
  fail("No se encontró 'CUSTOM_REP_SCHEMES' en App.js");
} else {
  const block = repSchemesMatch[1].trim();
  const entries = block.split('\n').filter(l => l.includes(':') && l.trim().length > 5);
  if (entries.length === 0) {
    fail("CUSTOM_REP_SCHEMES está vacío — no hay esquemas de repeticiones personalizados");
  } else {
    ok(`CUSTOM_REP_SCHEMES tiene ${entries.length} esquemas personalizados`);
  }
}

// ── RESUMEN ───────────────────────────────────────────────
console.log('\n────────────────────────────────────────────────────');
console.log(`Mobile: ${PASS} ✅  ${WARN} ⚠️   ${FAIL} ❌`);
console.log('');

if (FAIL > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
