// Script simple para agregar ejercicios usando fetch
const exercises = [
  {
    name: "Press de banca con barra",
    slug: "press-banca-barra",
    description: "Ejercicio básico para el desarrollo del pecho, hombros y tríceps",
    primaryMuscle: "Pecho",
    equipment: "Barra olímpica",
    level: "beginner",
    mechanics: "compound",
    category: "push",
    isPublished: true
  },
  {
    name: "Sentadilla con barra",
    slug: "sentadilla-barra",
    description: "El rey de los ejercicios de piernas, trabaja cuádriceps, glúteos y core",
    primaryMuscle: "Cuádriceps",
    equipment: "Barra olímpica",
    level: "beginner",
    mechanics: "compound",
    category: "legs",
    isPublished: true
  },
  {
    name: "Peso muerto con barra",
    slug: "peso-muerto-barra",
    description: "Ejercicio fundamental para la cadena posterior",
    primaryMuscle: "Espalda baja",
    equipment: "Barra olímpica",
    level: "intermediate",
    mechanics: "compound",
    category: "pull",
    isPublished: true
  },
  {
    name: "Dominadas",
    slug: "dominadas",
    description: "Ejercicio de tracción vertical para desarrollar la espalda",
    primaryMuscle: "Dorsales",
    equipment: "Barra de dominadas",
    level: "intermediate",
    mechanics: "compound",
    category: "pull",
    isPublished: true
  },
  {
    name: "Press militar con barra",
    slug: "press-militar-barra",
    description: "Ejercicio de empuje vertical para desarrollar hombros",
    primaryMuscle: "Hombros",
    equipment: "Barra olímpica",
    level: "intermediate",
    mechanics: "compound",
    category: "push",
    isPublished: true
  },
  {
    name: "Hip thrust con barra",
    slug: "hip-thrust-barra",
    description: "Ejercicio específico para glúteos",
    primaryMuscle: "Glúteos",
    equipment: "Barra olímpica",
    level: "beginner",
    mechanics: "isolation",
    category: "legs",
    isPublished: true
  },
  {
    name: "Remo con barra",
    slug: "remo-barra",
    description: "Ejercicio de tracción horizontal para espalda media",
    primaryMuscle: "Dorsales",
    equipment: "Barra olímpica",
    level: "beginner",
    mechanics: "compound",
    category: "pull",
    isPublished: true
  },
  {
    name: "Press con mancuernas sentado",
    slug: "press-mancuernas-sentado",
    description: "Desarrollo completo de hombros con estabilización",
    primaryMuscle: "Hombros",
    equipment: "Mancuernas",
    level: "beginner",
    mechanics: "compound",
    category: "push",
    isPublished: true
  },
  {
    name: "Curl con barra Z",
    slug: "curl-barra-z",
    description: "Ejercicio básico para desarrollo de bíceps",
    primaryMuscle: "Bíceps",
    equipment: "Barra Z",
    level: "beginner",
    mechanics: "isolation",
    category: "upper",
    isPublished: true
  },
  {
    name: "Extensiones de tríceps en polea",
    slug: "extensiones-triceps-polea",
    description: "Aislamiento de tríceps con tensión constante",
    primaryMuscle: "Tríceps",
    equipment: "Polea alta",
    level: "beginner",
    mechanics: "isolation",
    category: "upper",
    isPublished: true
  },
  {
    name: "Prensa inclinada",
    slug: "prensa-inclinada",
    description: "Alternativa más segura a la sentadilla",
    primaryMuscle: "Cuádriceps",
    equipment: "Máquina",
    level: "beginner",
    mechanics: "compound",
    category: "legs",
    isPublished: true
  },
  {
    name: "Jalones frontales",
    slug: "jalones-frontales",
    description: "Sustituto de dominadas, ejercicio de tracción vertical",
    primaryMuscle: "Dorsales",
    equipment: "Máquina",
    level: "beginner",
    mechanics: "compound",
    category: "pull",
    isPublished: true
  },
  {
    name: "Elevaciones laterales",
    slug: "elevaciones-laterales",
    description: "Aislamiento para deltoides lateral",
    primaryMuscle: "Hombros",
    equipment: "Mancuernas",
    level: "beginner",
    mechanics: "isolation",
    category: "push",
    isPublished: true
  },
  {
    name: "Flexiones en suelo",
    slug: "flexiones-suelo",
    description: "Ejercicio multiarticular usando peso corporal",
    primaryMuscle: "Pecho",
    equipment: "Peso corporal",
    level: "beginner",
    mechanics: "compound",
    category: "push",
    isPublished: true
  },
  {
    name: "Plancha abdominal",
    slug: "plancha-abdominal",
    description: "Ejercicio isométrico para core completo",
    primaryMuscle: "Core",
    equipment: "Peso corporal",
    level: "beginner",
    mechanics: "isolation",
    category: "core",
    isPublished: true
  }
];

console.log(`📋 Ejercicios preparados: ${exercises.length}`);
console.log('🔗 Para agregar estos ejercicios, copia y pega cada uno en la API de ejercicios');
console.log('📍 Endpoint: POST /api/exercises');
console.log('📝 Ejemplo de uso:');
console.log(JSON.stringify(exercises[0], null, 2));
