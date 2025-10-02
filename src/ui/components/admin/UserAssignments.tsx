"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Calendar, 
  Search, 
  UserPlus,
  Trash2,
  CheckCircle
} from "lucide-react";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/ui/table";

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Routine {
  id: string;
  name: string;
  goal: string;
  level: string;
  dayIndex?: number;
  items: Array<{
    exercise: {
      name: string;
      primaryMuscle: string;
    };
  }>;
}

interface UserAssignment {
  userId: string;
  routineTemplateId: string;
  weekDay: number;
  active: boolean;
  notes?: string;
  user: User;
  routineTemplate: Routine;
}

export default function UserAssignments() {
  const [assignments, setAssignments] = useState<UserAssignment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  // Form state
  const [assignmentForm, setAssignmentForm] = useState({
    userId: "",
    routineTemplateId: "",
    weekDay: 1, // Lunes por defecto
    notes: ""
  });

  useEffect(() => {
    loadAssignments();
    loadUsers();
    loadRoutines();
  }, [searchTerm]);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      // Esta ruta necesitaría ser implementada
      const response = await fetch('/api/admin/assignments');
      if (response.ok) {
        const data = await response.json();
        setAssignments(data || []);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
    setLoading(false);
  };

  const loadUsers = async () => {
    try {
      // Esta ruta necesitaría ser implementada
      const response = await fetch('/api/admin/users?role=client');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.items || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadRoutines = async () => {
    try {
      const response = await fetch('/api/routines?published=true');
      if (response.ok) {
        const data = await response.json();
        setRoutines(data.items || []);
      }
    } catch (error) {
      console.error('Error loading routines:', error);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/assign/routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: assignmentForm.userId,
          routineTemplateId: assignmentForm.routineTemplateId,
          weekDay: assignmentForm.weekDay,
          active: true,
          notes: assignmentForm.notes
        })
      });

      if (response.ok) {
        await loadAssignments();
        setAssignmentForm({
          userId: "",
          routineTemplateId: "",
          weekDay: 1,
          notes: ""
        });
        setIsAssignDialogOpen(false);
        alert('Rutina asignada exitosamente');
      } else {
        const error = await response.json();
        alert(error.error || 'Error al asignar rutina');
      }
    } catch (error) {
      alert('Error al asignar rutina');
    }
    setLoading(false);
  };

  const handleUnassign = async (userId: string, routineId: string, weekDay: number) => {
    if (!confirm('¿Estás seguro de desasignar esta rutina?')) return;

    try {
      const response = await fetch('/api/assign/routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          routineTemplateId: routineId,
          weekDay,
          active: false
        })
      });

      if (response.ok) {
        await loadAssignments();
        alert('Rutina desasignada');
      } else {
        const error = await response.json();
        alert(error.error || 'Error al desasignar rutina');
      }
    } catch (error) {
      alert('Error al desasignar rutina');
    }
  };

  const getDayName = (dayIndex: number) => {
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    return days[dayIndex];
  };

  const getWeekSchedule = (userId: string) => {
    const userAssignments = assignments.filter(a => a.userId === userId && a.active);
    const schedule: { [key: number]: UserAssignment } = {};
    
    userAssignments.forEach(assignment => {
      schedule[assignment.weekDay] = assignment;
    });

    return schedule;
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Asignación de Rutinas</h1>
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-yellow-400 text-black hover:bg-yellow-500">
              <UserPlus className="h-4 w-4 mr-2" />
              Asignar Rutina
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Asignar Rutina a Usuario</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <Label>Usuario</Label>
                <Select 
                  value={assignmentForm.userId} 
                  onValueChange={(value) => setAssignmentForm(prev => ({ ...prev, userId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} (@{user.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Rutina</Label>
                <Select 
                  value={assignmentForm.routineTemplateId} 
                  onValueChange={(value) => setAssignmentForm(prev => ({ ...prev, routineTemplateId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rutina" />
                  </SelectTrigger>
                  <SelectContent>
                    {routines.map(routine => (
                      <SelectItem key={routine.id} value={routine.id}>
                        {routine.name} ({routine.goal})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Día de la Semana</Label>
                <Select 
                  value={assignmentForm.weekDay.toString()} 
                  onValueChange={(value) => setAssignmentForm(prev => ({ ...prev, weekDay: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Domingo</SelectItem>
                    <SelectItem value="1">Lunes</SelectItem>
                    <SelectItem value="2">Martes</SelectItem>
                    <SelectItem value="3">Miércoles</SelectItem>
                    <SelectItem value="4">Jueves</SelectItem>
                    <SelectItem value="5">Viernes</SelectItem>
                    <SelectItem value="6">Sábado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Notas (Opcional)</Label>
                <Input
                  value={assignmentForm.notes}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notas adicionales..."
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAssignDialogOpen(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || !assignmentForm.userId || !assignmentForm.routineTemplateId}
                  className="bg-yellow-400 text-black hover:bg-yellow-500"
                >
                  {loading ? 'Asignando...' : 'Asignar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-700 text-white border-gray-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* User Schedules */}
      <div className="space-y-4">
        {filteredUsers.map(user => {
          const schedule = getWeekSchedule(user.id);
          const hasAssignments = Object.keys(schedule).length > 0;

          return (
            <Card key={user.id} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-white">
                      {user.firstName} {user.lastName}
                    </CardTitle>
                    <p className="text-gray-400">@{user.username}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-400">
                      {Object.keys(schedule).length} días asignados
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {hasAssignments ? (
                  <div className="grid grid-cols-7 gap-2">
                    {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
                      const assignment = schedule[dayIndex];
                      return (
                        <div key={dayIndex} className="text-center">
                          <div className="text-xs text-gray-400 mb-2">
                            {getDayName(dayIndex)}
                          </div>
                          {assignment ? (
                            <div className="bg-yellow-400 text-black p-2 rounded-lg text-xs">
                              <div className="font-semibold truncate">
                                {assignment.routineTemplate.name}
                              </div>
                              <div className="text-xs opacity-80">
                                {assignment.routineTemplate.goal}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="mt-1 h-6 w-6 p-0 hover:bg-red-500 hover:text-white"
                                onClick={() => handleUnassign(
                                  user.id, 
                                  assignment.routineTemplateId, 
                                  assignment.weekDay
                                )}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="bg-gray-700 p-2 rounded-lg text-xs text-gray-500">
                              Libre
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tiene rutinas asignadas</p>
                    <p className="text-sm">Usa el botón "Asignar Rutina" para comenzar</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Usuarios</p>
                <p className="text-2xl font-bold text-white">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Usuarios con Rutinas</p>
                <p className="text-2xl font-bold text-white">
                  {new Set(assignments.filter(a => a.active).map(a => a.userId)).size}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Asignaciones Activas</p>
                <p className="text-2xl font-bold text-white">
                  {assignments.filter(a => a.active).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
