import { createFileRoute } from "@tanstack/react-router";
import { Clock3, Copy, Headphones, Mail, Phone, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { MembersLayout } from "@/components/members/MembersLayout";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Soporte — Tik Pay" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SupportPage,
});

const SUPPORT_PHONE = "+34 000 000 000";
const SUPPORT_EMAIL = "soporte.tikpay.es@outlook.com";

function SupportPage() {
  const [copied, setCopied] = useState<"phone" | "email" | null>(null);

  async function copy(value: string, type: "phone" | "email") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      // El usuario todavía puede copiar el dato manualmente.
    }
  }

  return (
    <MembersLayout>
      <section className="mb-4 rounded-[22px] border border-black/[0.05] bg-white p-5 shadow-[0_8px_26px_rgba(0,0,0,0.05)]">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#fff0f3] text-[#ff3b5c]">
            <Headphones className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#ff3b5c]">
              Centro de ayuda
            </p>
            <h1 className="mt-1 text-[22px] font-black tracking-tight text-[#161823]">
              Soporte Tik Pay
            </h1>
            <p className="mt-1.5 text-[12px] leading-relaxed text-[#747378]">
              Si tienes alguna duda sobre tu acceso, progreso o recompensas, puedes hablar con nuestro equipo.
            </p>
          </div>
        </div>
      </section>

      <ContactCard
        icon={<Phone className="h-5 w-5" />}
        label="Teléfono / WhatsApp"
        value={SUPPORT_PHONE}
        helper="Atención en español"
        copied={copied === "phone"}
        onCopy={() => void copy(SUPPORT_PHONE, "phone")}
      />

      <ContactCard
        icon={<Mail className="h-5 w-5" />}
        label="Correo de soporte"
        value={SUPPORT_EMAIL}
        helper="Respondemos por correo electrónico"
        copied={copied === "email"}
        onCopy={() => void copy(SUPPORT_EMAIL, "email")}
      />

      <section className="mt-4 rounded-[20px] border border-black/[0.05] bg-white p-4 shadow-[0_6px_22px_rgba(0,0,0,0.04)]">
        <div className="flex gap-3">
          <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[#ff3b5c]" />
          <div>
            <h2 className="text-[13px] font-black text-[#161823]">Horario de atención</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-[#747378]">
              Lunes a viernes, de 09:00 a 18:00 (hora de España).
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-3 border-t border-black/[0.05] pt-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#159447]" />
          <p className="text-[11px] leading-relaxed text-[#747378]">
            Nunca compartas tu contraseña ni códigos de acceso con terceros.
          </p>
        </div>
      </section>
    </MembersLayout>
  );
}

function ContactCard({
  icon,
  label,
  value,
  helper,
  copied,
  onCopy,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <section className="mb-3 flex items-center gap-3 rounded-[20px] border border-black/[0.05] bg-white p-4 shadow-[0_6px_22px_rgba(0,0,0,0.04)]">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#fff0f3] text-[#ff3b5c]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8a8a8e]">{label}</p>
        <p className="mt-0.5 truncate text-[14px] font-black text-[#161823]">{value}</p>
        <p className="mt-0.5 text-[10px] text-[#9a9a9e]">{helper}</p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f4f4f5] text-[#66666b] transition active:scale-95"
        aria-label={"Copiar " + label}
      >
        {copied ? <span className="text-[10px] font-black text-[#159447]">OK</span> : <Copy className="h-4 w-4" />}
      </button>
    </section>
  );
}
