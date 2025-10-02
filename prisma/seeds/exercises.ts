import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const baseExercises = [
  {
    name: "Press de banca con barra",
    slug: "press-banca-barra",
    description: "Ejercicio básico para el desarrollo del pecho, hombros y tríceps",
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
    name: "Sentadilla con barra",
    slug: "sentadilla-barra",
    description: "El rey de los ejercicios de piernas, trabaja cuádriceps, glúteos y core",
    instructions: "1. Coloca la barra en la parte superior de la espalda\n2. Pies separados al ancho de los hombros\n3. Baja flexionando caderas y rodillas hasta que los muslos estén paralelos al suelo\n4. Sube empujando con los talones",
    commonMistakes: "- Rodillas que se van hacia adentro\n- No bajar lo suficiente\n- Inclinarse demasiado hacia adelante\n- Levantar los talones",
    tips: "- Mantén el pecho arriba y la mirada al frente\n- Empuja las rodillas hacia afuera\n- Mantén el peso en los talones\n- Activa el core durante todo el movimiento",
    primaryMuscle: "Cuádriceps",
    secondaryMuscles: ["Glúteos", "Isquiotibiales", "Core"],
    equipment: "Barra olímpica",
    level: "beginner",
    mechanics: "compound",
    category: "legs",
    tempo: "3-1-2",
    breathing: "Inhalar al bajar, exhalar al subir",
    defaultRepMin: 8,
    defaultRepMax: 15,
    defaultRestSec: 150,
    tags: ["piernas", "cuádriceps", "glúteos", "compound"],
    isPublished: true,
    isVerified: true
  },
  {
    name: "Peso muerto con barra",
    slug: "peso-muerto-barra",
    description: "Ejercicio fundamental para la cadena posterior: espalda baja, glúteos e isquiotibiales",
    instructions: "1. Párate con los pies al ancho de las caderas, barra sobre los pies\n2. Flexiona las caderas y rodillas para agarrar la barra\n3. Mantén la espalda recta y el pecho arriba\n4. Levanta la barra extendiendo caderas y rodillas simultáneamente",
    commonMistakes: "- Redondear la espalda\n- Alejar la barra del cuerpo\n- Hiperextender la espalda en la parte superior\n- Usar solo la espalda para levantar",
    tips: "- Mantén la barra pegada al cuerpo\n- Activa los lats para mantener la barra cerca\n- Empuja el suelo con los pies\n- Termina el movimiento con las caderas, no con la espalda",
    primaryMuscle: "Espalda baja",
    secondaryMuscles: ["Glúteos", "Isquiotibiales", "Trapecios", "Antebrazos"],
    equipment: "Barra olímpica",
    level: "intermediate",
    mechanics: "compound",
    category: "pull",
    tempo: "2-1-2",
    breathing: "Inhalar antes de levantar, exhalar en la parte superior",
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
    description: "Ejercicio de tracción vertical para desarrollar la espalda y bíceps",
    instructions: "1. Cuélgate de la barra con agarre prono, manos al ancho de los hombros\n2. Activa el core y retrae los omóplatos\n3. Tira hacia arriba hasta que la barbilla pase la barra\n4. Baja controladamente hasta la posición inicial",
    commonMistakes: "- Usar impulso o balancearse\n- No completar el rango de movimiento\n- Encoger los hombros\n- Cruzar las piernas excesivamente",
    tips: "- Piensa en tirar los codos hacia abajo y atrás\n- Mantén el core activado\n- Si no puedes hacer dominadas, usa bandas elásticas o máquina asistida\n- Controla la fase excéntrica",
    primaryMuscle: "Dorsales",
    secondaryMuscles: ["Bíceps", "Romboides", "Trapecio medio"],
    equipment: "Barra de dominadas",
    level: "intermediate",
    mechanics: "compound",
    category: "pull",
    tempo: "2-1-3",
    breathing: "Exhalar al subir, inhalar al bajar",
    defaultRepMin: 3,
    defaultRepMax: 10,
    defaultRestSec: 120,
    tags: ["espalda", "dorsales", "peso corporal", "tracción"],
    isPublished: true,
    isVerified: true
  },
  {
    name: "Press militar con barra",
    slug: "press-militar-barra",
    description: "Ejercicio de empuje vertical para desarrollar hombros y core",
    instructions: "1. Párate con los pies al ancho de las caderas\n2. Sostén la barra a la altura de los hombros\n3. Empuja la barra directamente hacia arriba\n4. Baja controladamente a la posición inicial",
    commonMistakes: "- Arquear excesivamente la espalda\n- Empujar la barra hacia adelante\n- No activar el core\n- Usar las piernas para impulsar",
    tips: "- Mantén el core muy activado\n- Empuja la cabeza ligeramente hacia adelante cuando la barra pase\n- Mantén los codos debajo de la barra\n- Aprieta los glúteos para estabilizar",
    primaryMuscle: "Hombros",
    secondaryMuscles: ["Tríceps", "Core", "Trapecio superior"],
    equipment: "Barra olímpica",
    level: "intermediate",
    mechanics: "compound",
    category: "push",
    tempo: "2-1-2",
    breathing: "Inhalar al bajar, exhalar al empujar",
    defaultRepMin: 6,
    defaultRepMax: 10,
    defaultRestSec: 120,
    tags: ["hombros", "fuerza", "core", "empuje vertical"],
    isPublished: true,
    isVerified: true
  },
  {
    name: "Remo con barra",
    slug: "remo-barra",
    description: "Ejercicio de tracción horizontal para desarrollar la espalda media y posterior",
    instructions: "1. Inclínate hacia adelante con la barra en las manos\n2. Mantén la espalda recta y el core activado\n3. Tira la barra hacia el abdomen bajo\n4. Baja controladamente a la posición inicial",
    commonMistakes: "- Usar demasiado impulso\n- Redondear la espalda\n- Tirar hacia el pecho en lugar del abdomen\n- No retraer los omóplatos",
    tips: "- Mantén los codos cerca del cuerpo\n- Piensa en juntar los omóplatos\n- Mantén una ligera flexión en las rodillas\n- Controla tanto la subida como la bajada",
    primaryMuscle: "Dorsales",
    secondaryMuscles: ["Romboides", "Trapecio medio", "Bíceps", "Deltoides posterior"],
    equipment: "Barra olímpica",
    level: "beginner",
    mechanics: "compound",
    category: "pull",
    tempo: "2-1-2",
    breathing: "Exhalar al tirar, inhalar al bajar",
    defaultRepMin: 8,
    defaultRepMax: 12,
    defaultRestSec: 90,
    tags: ["espalda", "remo", "tracción horizontal"],
    isPublished: true,
    isVerified: true
  },
  {
    name: "Hip Thrust con barra",
    slug: "hip-thrust-barra",
    description: "Ejercicio específico para el desarrollo de los glúteos",
    instructions: "1. Siéntate con la espalda apoyada en un banco\n2. Coloca la barra sobre las caderas\n3. Empuja las caderas hacia arriba contrayendo los glúteos\n4. Baja controladamente sin tocar el suelo",
    commonMistakes: "- Arquear excesivamente la espalda\n- No contraer completamente los glúteos\n- Usar demasiado rango de movimiento\n- Empujar con los cuádriceps en lugar de los glúteos",
    tips: "- Mantén la barbilla hacia abajo\n- Aprieta fuerte los glúteos en la parte superior\n- Mantén las rodillas alineadas con los pies\n- Usa una almohadilla para la barra si es necesario",
    primaryMuscle: "Glúteos",
    secondaryMuscles: ["Isquiotibiales", "Core"],
    equipment: "Barra olímpica",
    level: "beginner",
    mechanics: "isolation",
    category: "legs",
    tempo: "2-2-2",
    breathing: "Exhalar al subir, inhalar al bajar",
    defaultRepMin: 10,
    defaultRepMax: 15,
    defaultRestSec: 90,
    tags: ["glúteos", "cadera", "aislamiento"],
    isPublished: true,
    isVerified: true
  },
  {
    name: "Curl de bíceps con barra Z",
    slug: "curl-biceps-barra-z",
    description: "Ejercicio de aislamiento para el desarrollo de los bíceps",
    instructions: "1. Párate con los pies al ancho de las caderas\n2. Sostén la barra Z con agarre supino\n3. Flexiona los codos llevando la barra hacia arriba\n4. Baja controladamente a la posición inicial",
    commonMistakes: "- Balancear el cuerpo\n- Usar los hombros para ayudar\n- No completar el rango de movimiento\n- Bajar muy rápido",
    tips: "- Mantén los codos fijos a los lados\n- Contrae fuerte en la parte superior\n- Controla la fase excéntrica\n- Mantén las muñecas neutras",
    primaryMuscle: "Bíceps",
    secondaryMuscles: ["Antebrazos"],
    equipment: "Barra Z",
    level: "beginner",
    mechanics: "isolation",
    category: "upper",
    tempo: "2-1-3",
    breathing: "Exhalar al subir, inhalar al bajar",
    defaultRepMin: 10,
    defaultRepMax: 15,
    defaultRestSec: 60,
    tags: ["bíceps", "brazos", "aislamiento"],
    isPublished: true,
    isVerified: true
  },
  {
    name: "Extensiones de tríceps en polea",
    slug: "extensiones-triceps-polea",
    description: "Ejercicio de aislamiento para el desarrollo de los tríceps",
    instructions: "1. Párate frente a la polea alta con cuerda o barra\n2. Mantén los codos fijos a los lados\n3. Extiende los antebrazos hacia abajo\n4. Vuelve controladamente a la posición inicial",
    commonMistakes: "- Mover los codos\n- Usar demasiado peso\n- No extender completamente\n- Inclinarse hacia adelante",
    tips: "- Mantén el core activado\n- Piensa en empujar hacia abajo, no hacia adelante\n- Contrae fuerte en la extensión completa\n- Mantén los hombros estables",
    primaryMuscle: "Tríceps",
    secondaryMuscles: [],
    equipment: "Polea alta",
    level: "beginner",
    mechanics: "isolation",
    category: "upper",
    tempo: "2-1-2",
    breathing: "Exhalar al extender, inhalar al flexionar",
    defaultRepMin: 12,
    defaultRepMax: 20,
    defaultRestSec: 60,
    tags: ["tríceps", "brazos", "polea", "aislamiento"],
    isPublished: true,
    isVerified: true
  },
  {
    name: "Plancha abdominal",
    slug: "plancha-abdominal",
    description: "Ejercicio isométrico para fortalecer el core completo",
    instructions: "1. Colócate en posición de flexión con antebrazos en el suelo\n2. Mantén el cuerpo en línea recta desde cabeza hasta talones\n3. Activa el core y mantén la posición\n4. Respira normalmente durante el ejercicio",
    commonMistakes: "- Levantar demasiado las caderas\n- Dejar caer las caderas\n- Tensar el cuello\n- Aguantar la respiración",
    tips: "- Imagina que tienes una tabla en la espalda\n- Aprieta los glúteos y el core\n- Mantén la cabeza en posición neutra\n- Empieza con tiempos cortos y ve aumentando",
    primaryMuscle: "Core",
    secondaryMuscles: ["Hombros", "Glúteos"],
    equipment: "Peso corporal",
    level: "beginner",
    mechanics: "isolation",
    category: "core",
    tempo: "Isométrico",
    breathing: "Respiración normal y controlada",
    defaultRepMin: 30,
    defaultRepMax: 60,
    defaultRestSec: 60,
    tags: ["core", "abdominales", "isométrico", "peso corporal"],
    isPublished: true,
    isVerified: true
  }
];

export async function seedExercises() {
  console.log('🌱 Sembrando ejercicios base...');

  for (const exerciseData of baseExercises) {
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

  console.log('🎉 Seed de ejercicios completado');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedExercises()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
