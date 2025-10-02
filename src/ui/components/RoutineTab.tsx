"use client";

import { useState, useEffect } from "react";
import { 
  Dumbbell, 
  Play, 
  Eye, 
  Calendar,
  Plus,
  Timer,
  Save
} from "lucide-react";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { Input } from "@/ui/input";
import Swal from "sweetalert2";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface RoutinesTabProps {
  gender: "male" | "female";
  fitnessGoal: string;
  setFitnessGoal: (value: string) => void;
  bodyFocus: string;
  setBodyFocus: (value: string) => void;
}

interface Exercise {
  id: string;
  name: string;
  primaryMuscle: string;
  equipment: string;
  level: string;
  description?: string;
  instructions?: string;
  media: Array<{
    id: string;
    type: string;
    url: string;
    isCover: boolean;
  }>;
}

interface WorkoutSet {
  id?: string;
  reps: number;
  weight: number;
  restSeconds?: number;
  completed: boolean;
}

interface WorkoutExercise {
  id: string;
  exercise: Exercise;
  sets: WorkoutSet[];
  notes?: string;
}

interface ActiveWorkout {
  id: string;
  status: string;
  notes?: string;
}

interface RecentWorkout {
  id: string;
  date: string;
  routineName: string;
  duration: number;
  totalVolume: number;
  totalSets: number;
}

export default function RoutinesTab({ 
  fitnessGoal
}: RoutinesTabProps) {
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<RecentWorkout[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  // Técnica (pendiente de modal en siguiente paso)
  const [searchQuery, setSearchQuery] = useState("");

  // Cargar datos iniciales
  useEffect(() => {
    loadRecentWorkouts();
    loadAvailableExercises();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recargar ejercicios cuando cambia la búsqueda
  useEffect(() => {
    loadAvailableExercises();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const loadRecentWorkouts = async () => {
    try {
      const response = await fetch('/api/workouts/recent?limit=50');
      if (response.ok) {
        const data = await response.json();
        setRecentWorkouts(data.recentWorkouts || []);
      }
    } catch (error) {
      console.error('Error loading recent workouts:', error);
    }
  };

  const loadAvailableExercises = async () => {
    try {
      const url = `/api/exercises?published=true&limit=100${searchQuery ? `&query=${encodeURIComponent(searchQuery)}` : ''}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAvailableExercises(data.items || []);
      }
    } catch (error) {
      console.error('❌ Error loading exercises:', error);
    }
  };

  const startWorkout = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString(),
          notes: `Entrenamiento ${fitnessGoal}`
        })
      });

      if (response.ok) {
        const workout = await response.json();
        setActiveWorkout({ id: workout.id, status: workout.status });
        
        // SweetAlert de éxito
        await Swal.fire({
          title: '¡Entrenamiento Iniciado! 💪',
          text: 'Tu sesión de entrenamiento ha comenzado. ¡A darle con todo!',
          icon: 'success',
          confirmButtonText: 'Continuar',
          confirmButtonColor: '#EAB308',
          background: '#1F2937',
          color: '#F9FAFB',
          timer: 3000,
          timerProgressBar: true
        });
        
      } else {
        const error = await response.json();
        
        // SweetAlert de error
        await Swal.fire({
          title: 'Error al iniciar',
          text: error.error || "No se pudo iniciar el entrenamiento",
          icon: 'error',
          confirmButtonText: 'Intentar de nuevo',
          confirmButtonColor: '#EF4444',
          background: '#1F2937',
          color: '#F9FAFB'
        });
      }
    } catch (err) {
      console.error('Error:', err);
      
      // SweetAlert de error de conexión
      await Swal.fire({
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor. Verifica tu conexión.',
        icon: 'error',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#EF4444',
        background: '#1F2937',
        color: '#F9FAFB'
      });
    }
    setLoading(false);
  };

  const addExerciseToWorkout = async (exerciseId: string) => {
    if (!activeWorkout) return;
    try {
      const exercise = availableExercises.find(ex => ex.id === exerciseId);
      if (!exercise) return;
      const res = await fetch(`/api/workouts/${activeWorkout.id}/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId })
      });
      if (!res.ok) throw new Error('No se pudo agregar el ejercicio');
      const created = await res.json();
      const newWorkoutExercise: WorkoutExercise = {
        id: created.id,
        exercise,
        sets: [],
        notes: ''
      };
      setWorkoutExercises(prev => [...prev, newWorkoutExercise]);
      toast.success(`${exercise.name} agregado`, { position: "bottom-right", autoClose: 1200, theme: "dark" });
    } catch (error) {
      console.error('Error adding exercise:', error);
      await Swal.fire({
        title: 'Error',
        text: 'No se pudo agregar el ejercicio',
        icon: 'error',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#EF4444',
        background: '#1F2937',
        color: '#F9FAFB'
      });
    }
  };

  const finishWorkout = async () => {
    if (!activeWorkout) return;
    
    const result = await Swal.fire({
      title: '¿Finalizar entrenamiento?',
      text: 'Se guardará tu progreso y se cerrará la sesión',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, finalizar',
      cancelButtonText: 'Continuar entrenando',
      confirmButtonColor: '#EAB308',
      cancelButtonColor: '#6B7280',
      background: '#1F2937',
      color: '#F9FAFB'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/workouts/${activeWorkout.id}/complete`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          setActiveWorkout(null);
          setWorkoutExercises([]);
          await loadRecentWorkouts();
          
          await Swal.fire({
            title: '¡Entrenamiento completado! 🎉',
            text: 'Excelente trabajo. Tu progreso ha sido guardado.',
            icon: 'success',
            confirmButtonText: 'Genial',
            confirmButtonColor: '#EAB308',
            background: '#1F2937',
            color: '#F9FAFB'
          });
        }
      } catch (error) {
        console.error('Error finishing workout:', error);
      }
    }
  };

  // Vista principal
  return (
    <div className="space-y-6 p-4">
      <ToastContainer />
      {/* Entrenamiento Activo o Botón para iniciar */}
      {activeWorkout ? (
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Timer className="h-6 w-6" />
                  Entrenamiento en Progreso
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    placeholder="Nombre del entrenamiento"
                    defaultValue={activeWorkout?.notes?.split(" — ")[0] || "Entrenamiento libre"}
                    onBlur={async (e) => {
                      const name = e.target.value?.trim();
                      if (!name || !activeWorkout) return;
                      await fetch(`/api/workouts/${activeWorkout.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
                      toast.info('Nombre guardado', { position: 'bottom-right', autoClose: 1000, theme: 'dark' });
                    }}
                    className="h-8 bg-white/90 text-black w-64"
                  />
                  <span className="opacity-90">• {workoutExercises.length} ejercicios</span>
                </div>
              </div>
              <Button 
                onClick={finishWorkout}
                variant="outline"
                className="bg-white text-green-600 hover:bg-gray-100 border-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Finalizar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div>
                <h3 className="text-2xl font-bold">¿Listo para entrenar?</h3>
                <p className="opacity-80 text-lg">Inicia una nueva sesión de entrenamiento</p>
              </div>
              <Button 
                onClick={startWorkout}
                disabled={loading}
                size="lg"
                className="bg-black text-yellow-400 hover:bg-gray-800 px-8 py-3 text-lg font-semibold"
              >
                <Play className="h-6 w-6 mr-2" />
                {loading ? 'Iniciando...' : 'Iniciar Entrenamiento'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ejercicios del entrenamiento activo */}
      {activeWorkout && workoutExercises.length > 0 && (
        <Card className="bg-white shadow-md">
          <CardHeader className="bg-green-50 border-b">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Dumbbell className="h-5 w-5 text-green-600" />
              Ejercicios del Entrenamiento ({workoutExercises.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {workoutExercises.map((workoutExercise, index) => (
                <WorkoutExerciseCard 
                  key={workoutExercise.id} 
                  workoutExercise={workoutExercise}
                  exerciseNumber={index + 1}
                  onUpdateSets={(sets: WorkoutSet[]) => {
                    // Actualizar sets en el estado local
                    setWorkoutExercises(prev => 
                      prev.map(we => 
                        we.id === workoutExercise.id 
                          ? { ...we, sets } 
                          : we
                      )
                    );
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entrenamientos recientes */}
      {recentWorkouts.length > 0 && (
        <Card className="bg-white shadow-md">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Calendar className="h-5 w-5 text-yellow-500" />
              Entrenamientos Recientes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 max-h-72 overflow-y-auto">
            {Object.entries(
              recentWorkouts.reduce((acc: Record<string, RecentWorkout[]>, w: RecentWorkout) => {
                const d = new Date(w.date);
                const key = d.toLocaleDateString();
                if (!acc[key]) acc[key] = [];
                acc[key].push(w);
                return acc;
              }, {})
            ).map(([date, items]) => (
              <div key={date} className="mb-3">
                <div className="text-xs text-gray-500 mb-1">{date}</div>
                <div className="grid md:grid-cols-2 gap-2">
                  {items.map((workout) => (
                    <div key={workout.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-800">{workout.routineName}</p>
                        <p className="text-xs text-gray-600">{workout.duration} min</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-yellow-600">{workout.totalVolume}kg</p>
                        <p className="text-xs text-gray-600">{workout.totalSets} series</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Ejercicios disponibles */}
      <Card className="bg-white shadow-md">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Dumbbell className="h-5 w-5 text-yellow-500" />
            Biblioteca de Ejercicios
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Búsqueda */}
          <div className="flex items-center gap-2 mb-4">
            <Input
              placeholder="Buscar ejercicio, músculo o equipo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
            <Button onClick={loadAvailableExercises} variant="outline">Buscar</Button>
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
              <span className="ml-2 text-gray-600">Cargando ejercicios...</span>
            </div>
          ) : availableExercises.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(
                availableExercises.reduce((acc: Record<string, Exercise[]>, ex) => {
                  const key = ex.primaryMuscle || 'Otros';
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(ex);
                  return acc;
                }, {})
              ).map(([muscle, list]) => (
                <div key={muscle} className="space-y-2">
                  <h4 className="font-semibold text-gray-800">{muscle}</h4>
                  <div className="overflow-x-auto pb-2">
                    <div className="grid grid-rows-2 grid-flow-col auto-cols-[20rem] gap-4 min-w-max">
                      {list.map((exercise) => (
                        <div key={exercise.id} className="flex-shrink-0 w-80 border border-gray-200 rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow bg-white">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-gray-800 text-sm leading-tight pr-2">{exercise.name}</h4>
                            <div className="flex gap-1 flex-shrink-0">
                              {activeWorkout && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => addExerciseToWorkout(exercise.id)}
                                  title="Agregar al entrenamiento"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" className="text-gray-500 hover:text-yellow-600 hover:bg-yellow-50" title="Ver detalles">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                              {exercise.primaryMuscle}
                            </Badge>
                            <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">
                              {exercise.level}
                            </Badge>
                            <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">
                              {exercise.equipment}
                            </Badge>
                          </div>
                          {exercise.description && (
                            <p className="text-xs text-gray-600 line-clamp-2">{exercise.description}</p>
                          )}
                          {activeWorkout && (
                            <Button 
                              size="sm" 
                              className="w-full bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => addExerciseToWorkout(exercise.id)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Agregar al entrenamiento
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay ejercicios disponibles</p>
              <p className="text-sm">Los ejercicios se cargarán pronto</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">0</div>
              <div className="text-xs text-gray-600">Esta semana</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">0kg</div>
              <div className="text-xs text-gray-600">Volumen total</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-xs text-gray-600">PRs este mes</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{availableExercises.length}</div>
              <div className="text-xs text-gray-600">Ejercicios</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Componente para mostrar y editar ejercicios del entrenamiento
interface WorkoutExerciseCardProps {
  workoutExercise: WorkoutExercise;
  exerciseNumber: number;
  onUpdateSets: (sets: WorkoutSet[]) => void;
}

function WorkoutExerciseCard({ workoutExercise, exerciseNumber, onUpdateSets }: WorkoutExerciseCardProps) {
  const [sets, setSets] = useState<WorkoutSet[]>(workoutExercise.sets || []);

  const addSet = () => {
    const newSet: WorkoutSet = {
      reps: 10,
      weight: 0,
      completed: false
    };
    const updatedSets = [...sets, newSet];
    setSets(updatedSets);
    onUpdateSets(updatedSets);
  };

  const updateSet = (index: number, field: keyof WorkoutSet, value: number | boolean) => {
    const updatedSets = sets.map((set, i) => 
      i === index ? { ...set, [field]: value } : set
    );
    setSets(updatedSets);
    onUpdateSets(updatedSets);
  };

  const removeSet = (index: number) => {
    const updatedSets = sets.filter((_, i) => i !== index);
    setSets(updatedSets);
    onUpdateSets(updatedSets);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-semibold text-gray-800">
            {exerciseNumber}. {workoutExercise.exercise.name}
          </h4>
          <div className="flex gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {workoutExercise.exercise.primaryMuscle}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {workoutExercise.exercise.equipment}
            </Badge>
          </div>
        </div>
        <Button
          size="sm"
          onClick={addSet}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus className="h-4 w-4 mr-1" />
          Agregar Serie
        </Button>
      </div>

      {/* Sets */}
      <div className="space-y-2">
        <div className="grid grid-cols-4 gap-2 text-sm font-medium text-gray-600 px-2">
          <span>Serie</span>
          <span>Peso (kg)</span>
          <span>Reps</span>
          <span>Acción</span>
        </div>
        
        {sets.map((set, index) => (
          <div key={index} className="grid grid-cols-4 gap-2 items-center p-2 bg-gray-50 rounded">
            <span className="text-sm font-medium">{index + 1}</span>
            
            <Input
              type="number"
              value={set.weight}
              onChange={(e) => updateSet(index, 'weight', parseFloat(e.target.value) || 0)}
              className="h-8 text-sm"
              min="0"
              step="0.5"
            />
            
            <Input
              type="number"
              value={set.reps}
              onChange={(e) => updateSet(index, 'reps', parseInt(e.target.value) || 0)}
              className="h-8 text-sm"
              min="1"
            />
            
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={set.completed ? "default" : "outline"}
                onClick={() => updateSet(index, 'completed', !set.completed)}
                className={`h-8 px-2 text-xs ${
                  set.completed 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'hover:bg-green-50 hover:text-green-600'
                }`}
              >
                ✓
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeSet(index)}
                className="h-8 px-2 text-red-600 hover:bg-red-50"
              >
                ×
              </Button>
            </div>
          </div>
        ))}
        
        {sets.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">No hay series agregadas</p>
            <Button
              size="sm"
              onClick={addSet}
              variant="outline"
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar primera serie
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
