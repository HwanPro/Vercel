import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";
import { z, ZodError } from "zod";
import { getToken } from "next-auth/jwt";
import { parsePhoneNumberFromString } from "libphonenumber-js";

/* ---------- Auth guard ---------- */
async function ensureAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  return !!token && token.role === "admin";
}

/* ---------- Zod schema ---------- */
const clientUpdateSchema = z.object({
  firstName: z.string().min(1, "El nombre es obligatorio"),
  lastName: z.string().min(1, "El apellido es obligatorio"),
  plan: z.enum(["Sin plan", "Mensual", "Básico", "Pro", "Elite"]),
  startDate: z
    .string()
    .nullable()
    .or(z.literal(""))
    .transform((val) => (val ? new Date(val) : null)),
  endDate: z
    .string()
    .nullable()
    .or(z.literal(""))
    .transform((val) => (val ? new Date(val) : null)),
  phone: z.string().optional().or(z.literal("")),
  emergencyPhone: z.string().optional().default(""),
});

/* ---------- PUT: actualizar cliente ---------- */
export async function PUT(
  req: NextRequest,
  // si ejecutas en Edge, params puede ser Promise; usa esta firma:
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await ensureAdmin(req))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params; // 👈 importante en Edge runtime
    if (!id) {
      return NextResponse.json(
        { error: "El ID del cliente es inválido o no está presente" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = clientUpdateSchema.parse(body);

    const clientProfile = await prisma.clientProfile.findUnique({
      where: { profile_id: id },
      select: { user_id: true },
    });
    if (!clientProfile) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    // Normaliza/valida teléfono si viene
    let phoneE164: string | null = null;
    if (validatedData.phone && validatedData.phone.trim() !== "") {
      const pn = parsePhoneNumberFromString(validatedData.phone, "PE");
      if (!pn?.isValid()) {
        return NextResponse.json(
          { error: "El teléfono principal no es válido" },
          { status: 400 }
        );
      }
      phoneE164 = pn.number;

      // Unicidad (excluye al mismo user)
      const phoneTaken = await prisma.user.findFirst({
        where: {
          phoneNumber: phoneE164,
          id: { not: clientProfile.user_id },
        },
        select: { id: true },
      });
      if (phoneTaken) {
        return NextResponse.json(
          { error: "El teléfono ya está registrado" },
          { status: 400 }
        );
      }
    }

    // Transacción
    const [updatedProfile, updatedUser] = await prisma.$transaction([
      prisma.clientProfile.update({
        where: { profile_id: id },
        data: {
          profile_first_name: validatedData.firstName,
          profile_last_name: validatedData.lastName,
          profile_plan: validatedData.plan,
          profile_start_date: validatedData.startDate,
          profile_end_date: validatedData.endDate,
          profile_phone: phoneE164 ?? null,
          profile_emergency_phone:
            validatedData.emergencyPhone?.trim() || null,
        },
      }),
      prisma.user.update({
        where: { id: clientProfile.user_id },
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          ...(phoneE164 ? { phoneNumber: phoneE164 } : {}),
        },
      }),
    ]);

    return NextResponse.json(
      { message: "Cliente actualizado con éxito", updatedProfile, updatedUser },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al actualizar cliente:", error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/* ---------- DELETE: eliminar cliente ---------- */
export async function DELETE(
  req: NextRequest,
  // en Edge, params es Promise; hay que await
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await ensureAdmin(req))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params; // 👈 importante en Edge runtime
    if (!id) {
      return NextResponse.json(
        { error: "El ID del cliente es inválido" },
        { status: 400 }
      );
    }

    const profile = await prisma.clientProfile.findUnique({
      where: { profile_id: id },
      select: { user_id: true },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    /* ============ Opción 1 (recomendada si ya tienes onDelete: Cascade) ============
       Borrar sólo el usuario; el resto (ClientProfile, Fingerprint, PaymentRecord, etc.)
       se elimina automáticamente por cascada.
    */
    await prisma.user.delete({ where: { id: profile.user_id } });

    /* ============ Opción 2 (defensiva: borra dependencias manualmente) ============
    await prisma.$transaction(async (tx) => {
      // ¡OJO! El delegado correcto es 'fingerprint' (singular)
      await tx.fingerprint
        .deleteMany({ where: { user_id: profile.user_id } })
        .catch(() => {});
      await tx.paymentRecord
        .deleteMany({ where: { user_id: profile.user_id } })
        .catch(() => {});
      await tx.userMembershipPlan
        .deleteMany({ where: { user_id: profile.user_id } })
        .catch(() => {});
      await tx.attendance
        .deleteMany({ where: { user_id: profile.user_id } })
        .catch(() => {});

      await tx.clientProfile.delete({ where: { profile_id: id } });
      await tx.user.delete({ where: { id: profile.user_id } });
    });
    */

    return NextResponse.json(
      { message: "Cliente eliminado con éxito" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al eliminar cliente:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
