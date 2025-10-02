const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const completeExercises = [
  // PECHO
  {
    name: "Press de banca con barra",
    slug: "press-banca-barra",
    description: "Ejercicio básico para fuerza, trabaja todo el pecho",
    instructions: "1. Acuéstate en el banco con los pies firmes en el suelo\n2. Agarra la barra con las manos separadas al ancho de los hombros\n3. Baja la barra controladamente hasta el pecho\n4. Empuja la barra hacia arriba hasta extender completamente los brazos",
    commonMistakes: "- Arquear excesivamente la espalda\n- Bajar la barra demasiado rápido\n- No mantener los pies en el suelo\n- Agarre muy ancho o muy estrecho",
    tips: "- Mantén los omóplatos retraídos\n- Controla la respiración: inhala al bajar, exhala al subir\n- Usa un spotter para cargas pesadas",
    primaryMuscle: "Pecho",
    secondaryMuscles: ["Hombros", "Tríceps"],
    equipment: "Barra olímpica",
    level: "beginner",
    mechanics: "compound",
    category: "push",
    tempo: "3-1-1",
    breathing: "Inhalar al bajar, exhalar al subir",
    defaultRepMin: 6,
    defaultRepMax: 12,
    defaultRestSec: 120,
    tags: ["pecho", "fuerza", "básico", "compound"],
    isPublished: true,
    isVerified: true
  },
  {
    name: "Press con mancuernas en banco inclinado",
    slug: "press-mancuernas-inclinado",
    description: "Enfoca pecho superior y estabilizadores",
    instructions: "1. Ajusta el banco a 30-45 grados\n2. Sostén las mancuernas a los lados del pecho\n3. Empuja hacia arriba y ligeramente hacia adentro\n4. Baja controladamente hasta sentir estiramiento",
    commonMistakes: "- Inclinar demasiado el banco (más de 45°)\n- Chocar las mancuernas arriba\n- No controlar la bajada",
    tips: "- Mantén los codos ligeramente hacia adentro\n- Aprieta el pecho en la parte superior\n- Usa un rango completo de movimiento",
    primaryMuscle: "Pecho",
    secondaryMuscles: ["Hombros", "Tríceps"],
    equipment: "Mancuernas",
    level: "beginner",
    mechanics: "compound",
    category: "push",
    defaultRepMin: 8,
    defaultRepMax: 12,
    defaultRestSec: 90,
    tags: ["pecho", "mancuernas", "inclinado"],
    isPublished: true,
    isVerified: true
  },
  {
    name: "Aperturas en máquina",
    slug: "aperturas-maquina",
    description: "Tensión constante, ejercicio de aislamiento para pecho",
    instructions: "1. Ajusta el asiento para que los brazos estén paralelos al suelo\n2. Agarra las manijas con los codos ligeramente flexionados\n3. Junta los brazos en un arco amplio\n4. Regresa controladamente a la posición inicial",
    primaryMuscle: "Pecho",
    secondaryMuscles: [],
    equipment: "Máquina",
    level: "beginner",
    mechanics: "isolation",
    category: "push",
    defaultRepMin: 10,
    defaultRepMax: 15,
    defaultRestSec: 60,
    tags: ["pecho", "aislamiento", "máquina"],
    isPublished: true,
    isVerified: true
  },
  {
    name: "Flexiones en suelo",
    slug: "flexiones-suelo",
    description: "Ejercicio multiarticular usando peso corporal",
    instructions: "1. Posición de plancha con manos al ancho de hombros\n2. Baja el cuerpo hasta que el pecho casi toque el suelo\n3. Empuja hacia arriba manteniendo el cuerpo recto\n4. Mantén el core activado durante todo el movimiento",
    primaryMuscle: "Pecho",
    secondaryMuscles: ["Hombros", "Tríceps", "Core"],
    equipment: "Peso corporal",
    level: "beginner",
    mechanics: "compound",
    category: "push",
    defaultRepMin: 8,
    defaultRepMax: 20,
    defaultRestSec: 60,
    tags: ["pecho", "peso corporal", "casa"],
    isPublished: true,
    isVerified: true
  },

  // ESPALDA
  {
    name: "Peso muerto con barra",
    slug: "peso-muerto-barra",
    description: "Ejercicio fundamental para la cadena posterior",
    instructions: "1. Párate con los pies al ancho de las caderas, barra sobre los pies\n2. Flexiona las caderas y rodillas para agarrar la barra\n3. Mantén la espalda recta y el pecho arriba\n4. Levanta la barra extendiendo caderas y rodillas simultáneamente",
    commonMistakes: "- Redondear la espalda\n- Alejar la barra del cuerpo\n- Hiperextender la espalda en la parte superior",
    tips: "- Mantén la barra pegada al cuerpo\n- Activa los lats\n- Empuja el suelo con los pies",
    primaryMuscle: "Espalda baja",
    secondaryMuscles: ["Glúteos", "Isquiotibiales", "Trapecios"],
    equipment: "Barra olímpica",
    level: "intermediate",
    mechanics: "compound",
    category: "pull",
    defaultRepMin: 5,
    defaultRepMax: 8,
    defaultRestSec: 180,
    tags: ["espalda", "glúteos", "fuerza", "compound"],
    isPublished: true,
    isVerified: true
  },
  {
    name: "Dominadas",
    slug: "dominadas",
    description: "Ejercicio de tracción vertical para desarrollar la espalda",
    instructions: "1. Cuélgate de la barra con agarre prono\n2. Activa el core y retrae los omóplatos\n3. Tira hacia arriba hasta que la barbilla pase la barra\n4. Baja controladamente",
    primaryMuscle: "Dorsales",
    secondaryMuscles: ["Bíceps", "Romboides", "Trapecio medio"],
    equipment: "Barra de dominadas",
    level: "intermediate",
    mechanics: "compound",
    category: "pull",
    defaultRepMin: 3,
    defaultRepMax: 10,
    defaultRestSec: 120,
    tags: ["espalda", "dorsales", "peso corporal"],
    isPublished: true,
    isVerified: true
  },
  {
    name: "Jalones frontales",
    slug: "jalones-frontales",
    description: "Sustituto de dominadas, ejercicio de tracción vertical",
    instructions: "1. Siéntate en la máquina con las rodillas fijas\n2. Agarra la barra con las manos más anchas que los hombros\n3. Tira hacia abajo hasta el pecho\n4. Controla la subida",
    primaryMuscle: "Dorsales",
    secondaryMuscles: ["Bíceps", "Romboides"],
    equipment: "Máquina",
    level: "beginner",
    mechanics: "compound",
    category: "pull",
    defaultRepMin: 8,
    defaultRepMax: 12,
    defaultRestSec: 90,
    tags: ["espalda", "dorsales", "máquina"],
    isPublished: true,
    isVerified: true
  },
  {
    name: "Remo con barra",
    slug: "remo-barra",
    description: "Ejercicio de tracción horizontal para espalda media",
    instructions: "1. Inclínate hacia adelante con la barra en las manos\n2. Mantén la espalda recta y el core activado\n3. Tira la barra hacia el abdomen bajo\n4. Baja controladamente",
    primaryMuscle: "Dorsales",
    secondaryMuscles: ["Romboides", "Trapecio medio", "Bíceps"],
    equipment: "Barra olímpica",
    level: "beginner",
    mechanics: "compound",
    category: "pull",
    defaultRepMin: 8,
    defaultRepMax: 12,
    defaultRestSec: 90,
    tags: ["espalda", "remo", "tracción horizontal"],
    isPublished: true,
    isVerified: true
  },

  // HOMBROS
  {
    name: "Press militar con barra",
    slug: "press-militar-barra",
    description: "Ejercicio de empuje vertical para desarrollar hombros",
    instructions: "1. Párate con los pies al ancho de las caderas\n2. Sostén la barra a la altura de los hombros\n3. Empuja la barra directamente hacia arriba\n4. Baja controladamente",
    primaryMuscle: "Hombros",
    secondaryMuscles: ["Tríceps", "Core"],
    equipment: "Barra olímpica",
    level: "intermediate",
    mechanics: "compound",
    category: "push",
    defaultRepMin: 6,
    defaultRepMax: 10,
    defaultRestSec: 120,
    tags: ["hombros", "fuerza", "core"],
    isPublished: true,
    isVerified: true
  },
  {
    name: "Press con mancuernas sentado",
    slug: "press-mancuernas-sentado",
    description: "Desarrollo completo de hombros con estabilización",
    instructions: "1. Siéntate en banco con respaldo\n2. Sostén mancuernas a la altura de los hombros\n3. Empuja hacia arriba hasta extender brazos\n4. Baja controladamente",
    primaryMuscle: "Hombros",
    secondaryMuscles: ["Tríceps"],
    equipment: "Mancuernas",
    level: "beginner",
    mechanics: "compound",
    category: "push",
    defaultRepMin: 8,
    defaultRepMax: 12,
    defaultRestSec: 90,
    tags: ["hombros", "mancuernas", "sentado"],
    isPublished: true,
    isVerified: true
  },
  {
    name: "Elevaciones laterales",
    slug: "elevaciones-laterales",
    description: "Aislamiento para deltoides lateral",
    instructions: "1. Párate con mancuernas a los lados\n2. Eleva los brazos hacia los lados hasta la altura de hombros\n3. Mantén ligera flexión en codos\n4. Baja controladamente",
    primaryMuscle: "Hombros",
    secondaryMuscles: [],
    equipment: "Mancuernas",
    level: "beginner",
    mechanics: "isolation",
    category: "push",
    defaultRepMin: 12,
    defaultRepMax: 15,
    defaultRestSec: 60,
    tags: ["hombros", "lateral", "aislamiento"],
    isPublished: true,
    isVerified: true
  },

  // BÍCEPS
  {
    name: "Curl con barra Z",
    slug: "curl-barra-z",
    description: "Ejercicio básico para desarrollo de bíceps",
    instructions: "1. Párate con barra Z en las manos\n2. Mantén codos fijos a los lados\n3. Flexiona llevando la barra hacia arriba\n4. Baja controladamente",
    primaryMuscle: "Bíceps",
    secondaryMuscles: ["Antebrazos"],
    equipment: "Barra Z",
    level: "beginner",
    mechanics: "isolation",
    category: "upper",
    defaultRepMin: 10,
    defaultRepMax: 15,
    defaultRestSec: 60,
    tags: ["bíceps", "brazos", "aislamiento"],
    isPublished: true,
    isVerified: true
  },
  {
    name: "Curl martillo con mancuernas",
    slug: "curl-martillo-mancuernas",
    description: "Variante de curl que trabaja bíceps y braquial",
    instructions: "1. Sostén mancuernas con agarre neutro\n2. Mantén codos fijos\n3. Flexiona alternando brazos\n4. Controla la bajada",
    primaryMuscle: "Bíceps",
    secondaryMuscles: ["Braquial", "Antebrazos"],
    equipment: "Mancuernas",
    level: "beginner",
    mechanics: "isolation",
    category: "upper",
    defaultRepMin: 10,
    defaultRepMax: 15,
    defaultRestSec: 60,
    tags: ["bíceps", "martillo", "mancuernas"],
    isPublished: true,
    isVerified: true
  },

  // TRÍCEPS
  {
    name: "Press francés",
    slug: "press-frances",
    description: "Ejercicio de aislamiento para tríceps",
    instructions: "1. Acuéstate en banco con barra EZ\n2. Extiende brazos sobre el pecho\n3. Flexiona solo antebrazos hacia la frente\n4. Extiende controladamente",
    primaryMuscle: "Tríceps",
    secondaryMuscles: [],
    equipment: "Barra Z",
    level: "intermediate",
    mechanics: "isolation",
    category: "upper",
    defaultRepMin: 8,
    defaultRepMax: 12,
    defaultRestSec: 90,
    tags: ["tríceps", "aislamiento", "francés"],
    isPublished: true,
    isVerified: true
  },
  {
    name: "Fondos en paralelas",
    slug: "fondos-paralelas",
    description: "Ejercicio compuesto para tríceps y pecho",
    instructions: "1. Sujétate en barras paralelas\n2. Baja el cuerpo flexionando brazos\n3. Empuja hacia arriba hasta extensión completa\n4. Mantén torso ligeramente inclinado",
    primaryMuscle: "Tríceps",
    secondaryMuscles: ["Pecho", "Hombros"],
    equipment: "Barras paralelas",
    level: "intermediate",
    mechanics: "compound",
    category: "push",
    defaultRepMin: 6,
    defaultRepMax: 12,
    defaultRestSec: 90,
    tags: ["tríceps", "peso corporal", "compound"],
    isPublished: true,
    isVerified: true
  },
  {
    name: "Extensiones de tríceps en polea",
    slug: "extensiones-triceps-polea",
    description: "Aislamiento de tríceps con tensión constante",
    instructions: "1. Párate frente a polea alta\n2. Mantén codos fijos a los lados\n3. Extiende antebrazos hacia abajo\n4. Controla la subida",
    primaryMuscle: "Tríceps",
    secondaryMuscles: [],
    equipment: "Polea alta",
    level: "beginner",
    mechanics: "isolation",
    category: "upper",
    defaultRepMin: 12,
    defaultRepMax: 20,
    defaultRestSec: 60,
    tags: ["tríceps", "polea", "aislamiento"],
    isPublished: true,
    isVerified: true
  },

  // PIERNAS
  {
    name: "Sentadilla con barra",
    slug: "sentadilla-barra",
    description: "El rey de los ejercicios de piernas",
    instructions: "1. Coloca la barra en la parte superior de la espalda\n2. Pies separados al ancho de los hombros\n3. Baja flexionando caderas y rodillas\n4. Sube empujando con los talones",
    primaryMuscle: "Cuádriceps",
    secondaryMuscles: ["Glúteos", "Isquiotibiales", "Core"],
    equipment: "Barra olímpica",
    level: "beginner",
    mechanics: "compound",
    category: "legs",
    defaultRepMin: 8,
    defaultRepMax: 15,
    defaultRestSec: 150,
    tags: ["piernas", "cuádriceps", "glúteos"],
    isPublished: true,
    isVerified: true
  },
  {
    name: "Prensa inclinada",
    slug: "prensa-inclinada",
    description: "Alternativa más segura a la sentadilla",
    instructions: "1. Siéntate en la máquina con espalda apoyada\n2. Coloca pies en la plataforma\n3. Baja controladamente\n4. Empuja hacia arriba sin bloquear rodillas",
    primaryMuscle: "Cuádriceps",
    secondaryMuscles: ["Glúteos"],
    equipment: "Máquina",
    level: "beginner",
    mechanics: "compound",
    category: "legs",
    defaultRepMin: 10,
    defaultRepMax: 15,
    defaultRestSec: 120,
    tags: ["piernas", "cuádriceps", "máquina"],
    isPublished: true,
    isVerified: true
  },
  {
    name: "Peso muerto rumano",
    slug: "peso-muerto-rumano",
    description: "Enfoque en isquiotibiales y glúteos",
    instructions: "1. Sostén barra con agarre prono\n2. Mantén piernas ligeramente flexionadas\n3. Baja la barra deslizándola por las piernas\n4. Sube empujando caderas hacia adelante",
    primaryMuscle: "Isquiotibiales",
    secondaryMuscles: ["Glúteos", "Espalda baja"],
    equipment: "Barra olímpica",
    level: "intermediate",
    mechanics: "compound",
    category: "legs",
    defaultRepMin: 8,
    defaultRepMax: 12,
    defaultRestSec: 120,
    tags: ["isquiotibiales", "glúteos", "rumano"],
    isPublished: true,
    isVerified: true
  },
  {
    name: "Zancadas",
    slug: "zancadas",
    description: "Ejercicio unilateral para piernas completas",
    instructions: "1. Da un paso largo hacia adelante\n2. Baja hasta que ambas rodillas estén a 90°\n3. Empuja con el talón delantero para volver\n4. Alterna piernas",
    primaryMuscle: "Cuádriceps",
    secondaryMuscles: ["Glúteos", "Isquiotibiales"],
    equipment: "Peso corporal",
    level: "beginner",
    mechanics: "compound",
    category: "legs",
    defaultRepMin: 10,
    defaultRepMax: 15,
    defaultRestSec: 90,
    tags: ["piernas", "unilateral", "funcional"],
    isPublished: true,
    isVerified: true
  },
  {
    name: "Hip thrust con barra",
    slug: "hip-thrust-barra",
    description: "Ejercicio específico para glúteos",
    instructions: "1. Siéntate con espalda apoyada en banco\n2. Coloca barra sobre caderas\n3. Empuja caderas hacia arriba\n4. Aprieta glúteos en la parte superior",
    primaryMuscle: "Glúteos",
    secondaryMuscles: ["Isquiotibiales"],
    equipment: "Barra olímpica",
    level: "beginner",
    mechanics: "isolation",
    category: "legs",
    defaultRepMin: 10,
    defaultRepMax: 15,
    defaultRestSec: 90,
    tags: ["glúteos", "cadera", "aislamiento"],
    isPublished: true,
    isVerified: true
  },
  {
    name: "Elevaciones de talones",
    slug: "elevaciones-talones",
    description: "Ejercicio para desarrollo de pantorrillas",
    instructions: "1. Párate con antepié en plataforma elevada\n2. Deja que los talones bajen\n3. Elévate sobre las puntas de los pies\n4. Mantén la contracción arriba",
    primaryMuscle: "Gemelos",
    secondaryMuscles: [],
    equipment: "Peso corporal",
    level: "beginner",
    mechanics: "isolation",
    category: "legs",
    defaultRepMin: 15,
    defaultRepMax: 25,
    defaultRestSec: 60,
    tags: ["gemelos", "pantorrillas", "aislamiento"],
    isPublished: true,
    isVerified: true
  },

  // CORE/ABDOMINALES
  {
    name: "Plancha abdominal",
    slug: "plancha-abdominal",
    description: "Ejercicio isométrico para core completo",
    instructions: "1. Posición de flexión con antebrazos en suelo\n2. Mantén cuerpo en línea recta\n3. Activa core y glúteos\n4. Respira normalmente",
    primaryMuscle: "Core",
    secondaryMuscles: ["Hombros", "Glúteos"],
    equipment: "Peso corporal",
    level: "beginner",
    mechanics: "isolation",
    category: "core",
    defaultRepMin: 30,
    defaultRepMax: 60,
    defaultRestSec: 60,
    tags: ["core", "isométrico", "peso corporal"],
    isPublished: true,
    isVerified: true
  },
  {
    name: "Elevaciones de piernas colgado",
    slug: "elevaciones-piernas-colgado",
    description: "Ejercicio avanzado para abdomen inferior",
    instructions: "1. Cuélgate de barra con brazos extendidos\n2. Eleva piernas hasta formar 90° con torso\n3. Baja controladamente\n4. Evita balancearte",
    primaryMuscle: "Core",
    secondaryMuscles: ["Antebrazos"],
    equipment: "Barra de dominadas",
    level: "advanced",
    mechanics: "isolation",
    category: "core",
    defaultRepMin: 8,
    defaultRepMax: 15,
    defaultRestSec: 90,
    tags: ["core", "abdomen inferior", "colgado"],
    isPublished: true,
    isVerified: true
  },
  {
    name: "Rueda abdominal",
    slug: "rueda-abdominal",
    description: "Ejercicio intenso para core total",
    instructions: "1. Arrodíllate con rueda en manos\n2. Rueda hacia adelante manteniendo core tenso\n3. Regresa a posición inicial\n4. Mantén espalda recta",
    primaryMuscle: "Core",
    secondaryMuscles: ["Hombros", "Espalda"],
    equipment: "Rueda abdominal",
    level: "advanced",
    mechanics: "compound",
    category: "core",
    defaultRepMin: 5,
    defaultRepMax: 12,
    defaultRestSec: 90,
    tags: ["core", "rueda", "avanzado"],
    isPublished: true,
    isVerified: true
  }
];

async function seedCompleteExercises() {
  console.log('🌱 Sembrando ejercicios completos...');

  for (const exerciseData of completeExercises) {
    try {
      const existingExercise = await prisma.exercise.findUnique({
        where: { slug: exerciseData.slug }
      });

      if (!existingExercise) {
        await prisma.exercise.create({
          data: exerciseData
        });
        console.log(`✅ Ejercicio creado: ${exerciseData.name}`);
      } else {
        console.log(`⏭️  Ejercicio ya existe: ${exerciseData.name}`);
      }
    } catch (error) {
      console.error(`❌ Error creando ejercicio ${exerciseData.name}:`, error);
    }
  }

  console.log(`🎉 Seed completado: ${completeExercises.length} ejercicios procesados`);
}

async function main() {
  console.log('🌱 Iniciando seed completo...');
  
  try {
    await seedCompleteExercises();
    console.log('✅ Seed completo exitoso');
  } catch (error) {
    console.error('❌ Error durante el seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
