import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  FileText,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { TikPayBrandIcon } from "@/components/members/TikPayBrandIcon";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Términos de Uso — Tik Pay" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f5] px-4 py-6 font-sans text-[#161823]">
      <div className="mx-auto w-full max-w-[560px]">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Link
            to="/login"
            className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#66666b] shadow-sm"
            aria-label="Volver"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>

          <div className="flex items-center gap-2">
            <TikPayBrandIcon className="h-9 w-9 rounded-[11px] shadow-sm" />
            <div className="text-[18px] font-black tracking-tight">
              Tik <span className="text-[#ff3b5c]">Pay</span>
            </div>
          </div>

          <div className="h-10 w-10" />
        </div>

        <section className="mb-4 rounded-[26px] border border-black/[0.05] bg-white p-5 shadow-[0_10px_32px_rgba(0,0,0,0.05)]">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#fff0f3] text-[#ff3b5c]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#ff3b5c]">
                Documento legal
              </p>
              <h1 className="mt-1 text-[24px] font-black tracking-tight">
                Términos de Uso
              </h1>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[#8a8a8e]">
                Última actualización: septiembre de 2026.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-4 rounded-[22px] border border-[#ffd8df] bg-[#fff7f9] p-4">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#ff3b5c]" />
            <div>
              <h2 className="text-[14px] font-black text-[#161823]">
                Regla importante del ciclo de 30 días
              </h2>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#5f5f64]">
                Para mantener la elegibilidad de las recompensas, el usuario debe
                acceder a la plataforma y completar los vídeos y tareas diarias
                requeridas durante el ciclo de 30 días.
              </p>
              <p className="mt-2 text-[12px] font-bold leading-relaxed text-[#3f3f44]">
                Si el usuario no cumple las actividades exigidas y finaliza el
                período de 30 días sin completar las condiciones del programa,
                las recompensas pendientes asociadas a las tareas podrán caducar
                y no serán abonadas, pagadas ni transferidas.
              </p>
            </div>
          </div>
        </section>

        <TermsSection
          icon={<CalendarDays className="h-4.5 w-4.5" />}
          title="1. Ciclo de participación"
        >
          <p>
            El programa de tareas funciona mediante un ciclo de 30 días. Cada día
            puede contener vídeos, actividades, tiempos de espera y condiciones
            específicas que deben completarse para avanzar.
          </p>
          <p>
            La falta de acceso o de finalización de las tareas diarias puede
            impedir que el usuario complete el ciclo dentro del plazo establecido.
          </p>
        </TermsSection>

        <TermsSection
          icon={<WalletCards className="h-4.5 w-4.5" />}
          title="2. Saldo y recompensas"
        >
          <p>
            Los importes mostrados dentro de la plataforma pueden representar
            recompensas pendientes o condicionadas al cumplimiento de las tareas
            y requisitos del programa.
          </p>
          <p>
            Un importe mostrado en pantalla no se considera definitivamente
            adquirido ni exigible hasta que se cumplan las condiciones aplicables
            para su liberación o pago.
          </p>
        </TermsSection>

        <TermsSection
          icon={<Clock3 className="h-4.5 w-4.5" />}
          title="3. Caducidad por incumplimiento"
        >
          <p>
            Al finalizar el ciclo de 30 días, las recompensas pendientes vinculadas
            a tareas no completadas o a requisitos no cumplidos podrán perder su
            validez.
          </p>
          <p>
            Los importes que ya hayan sido efectivamente aprobados y transferidos
            antes de la caducidad no se ven afectados por esta regla.
          </p>
        </TermsSection>

        <TermsSection
          icon={<CheckCircle2 className="h-4.5 w-4.5" />}
          title="4. Responsabilidad del usuario"
        >
          <p>
            El usuario es responsable de acceder a su cuenta, revisar su progreso,
            completar las tareas disponibles y respetar los plazos indicados en la
            plataforma.
          </p>
          <p>
            El usuario también debe mantener sus datos de acceso seguros y no
            compartir su contraseña con terceros.
          </p>
        </TermsSection>

        <TermsSection
          icon={<ShieldCheck className="h-4.5 w-4.5" />}
          title="5. Uso adecuado de la plataforma"
        >
          <p>
            No está permitido manipular el sistema, automatizar visualizaciones,
            crear cuentas duplicadas para obtener beneficios indebidos o utilizar
            métodos destinados a alterar artificialmente el progreso.
          </p>
          <p>
            El incumplimiento de estas reglas puede resultar en suspensión de la
            cuenta y pérdida de recompensas pendientes.
          </p>
        </TermsSection>

        <section className="rounded-[22px] border border-black/[0.05] bg-white p-4 text-[11px] leading-relaxed text-[#747378] shadow-[0_7px_24px_rgba(0,0,0,0.04)]">
          <p>
            Al crear una cuenta, acceder a Tik Pay o continuar utilizando la
            plataforma, el usuario declara haber leído y aceptado estos Términos
            de Uso.
          </p>
        </section>
      </div>
    </main>
  );
}

function TermsSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-3 rounded-[22px] border border-black/[0.05] bg-white p-4 shadow-[0_7px_24px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-2.5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#fff0f3] text-[#ff3b5c]">
          {icon}
        </div>
        <h2 className="text-[14px] font-black text-[#161823]">{title}</h2>
      </div>
      <div className="mt-3 space-y-2 text-[12px] leading-relaxed text-[#66666b]">
        {children}
      </div>
    </section>
  );
}
