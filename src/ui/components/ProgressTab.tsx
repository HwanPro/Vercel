"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Ruler } from "lucide-react";

interface Attendance {
  checkInTime: string;
}

interface ProgressTabProps {
  measurements: {
    weight: { date: string; value: number }[];
    arms: { date: string; value: number }[];
    waist: { date: string; value: number }[];
    hips: { date: string; value: number }[];
  };
  attendances?: Attendance[];
  weeklyGoal?: number;
}

export default function ProgressTab({
  measurements,
  attendances,
  weeklyGoal,
}: ProgressTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(measurements).map(([key, values]) => (
          <Card key={key} className="bg-white border-yellow-400">
            <CardHeader>
              <CardTitle className="text-yellow-400 capitalize">
                {key}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {values.map((measurement, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <span>
                      {new Date(measurement.date).toLocaleDateString()}
                    </span>
                    <span className="text-yellow-400">
                      {measurement.value} {key === "weight" ? "kg" : "cm"}
                    </span>
                  </div>
                ))}
                <Button className="w-full mt-4" variant="outline">
                  <Ruler className="mr-2 h-4 w-4" />
                  Actualizar medida
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {attendances && weeklyGoal !== undefined && (
        <div className="text-center mt-6">
          <p>
            Asistencias esta semana: <strong>{attendances.length}</strong>
          </p>
          <p>
            Meta semanal: <strong>{weeklyGoal}</strong>
          </p>
        </div>
      )}
    </div>
  );
}
