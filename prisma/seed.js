const { PrismaClient } = require('@prisma/client');

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
  }
];

async function seedExercises() {
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

async function main() {
  console.log('🌱 Iniciando seeds...');
  
  try {
    await seedExercises();
    console.log('✅ Todos los seeds completados exitosamente');
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
