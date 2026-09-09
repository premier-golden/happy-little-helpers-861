import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  CalendarDays,
  Camera,
  LogOut,
  Mail,
  ShieldCheck,
  Trophy,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { useRef, useState } from "react";
import { MembersLayout } from "@/components/members/MembersLayout";
import { useTikPayAuth } from "@/hooks/use-tikpay-auth";
import { useTikPayMemberState } from "@/hooks/use-tikpay-member-state";
import { formatTikPayBalance } from "@/lib/members-balance";
import { uploadTikPayAvatar } from "@/lib/tikpay-profile-api";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Mi perfil — Tik Pay" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { user, signOut } = useTikPayAuth();
  const { state, loading, refresh } = useTikPayMemberState();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/login", replace: true });
  }

  async function handleAvatar(file: File | undefined) {
    if (!file || uploading) return;
    setUploading(true);
    setUploadError("");
    try {
      await uploadTikPayAvatar(file);
      await refresh();
    } catch (caught) {
      setUploadError(
        caught instanceof Error ? caught.message : "No se pudo subir la foto.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const name =
    state?.member.fullName ||
    user?.user_metadata?.full_name ||
    "Mi cuenta";

  const avatarUrl = state?.member.avatarUrl ?? null;

  return (
    <MembersLayout>
      <section className="mb-4 rounded-[22px] border border-black/[0.05] bg-white p-5 shadow-[0_8px_26px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[#fff0f3] text-[#ff3b5c] disabled:opacity-60"
            aria-label="Cambiar foto de perfil"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="grid h-full w-full place-items-center">
                <UserRound className="h-7 w-7" />
              </span>
            )}

            <span className="absolute inset-x-0 bottom-0 grid h-6 place-items-center bg-black/55 text-white">
              <Camera className="h-3.5 w-3.5" />
            </span>
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => void handleAvatar(event.target.files?.[0])}
          />

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#ff3b5c]">
              Mi cuenta
            </p>
            <h2 className="mt-0.5 truncate text-[20px] font-black text-[#161823]">
              {name}
            </h2>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#8a8a8e]">
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate">{state?.member.email || user?.email || ""}</span>
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="mt-2 text-[10px] font-black text-[#ff3b5c] disabled:opacity-60"
            >
              {uploading ? "SUBIENDO FOTO..." : avatarUrl ? "CAMBIAR FOTO" : "AÑADIR FOTO"}
            </button>
          </div>
        </div>

        {uploadError ? (
          <p className="mt-3 rounded-xl bg-[#fff0f3] px-3 py-2 text-[10px] font-semibold text-[#c93652]">
            {uploadError}
          </p>
        ) : null}

        <p className="mt-3 text-[9px] leading-relaxed text-[#a0a0a4]">
          JPG, PNG o WEBP · máximo 3 MB.
        </p>
      </section>

      <section className="mb-4 grid grid-cols-2 gap-3">
        <Metric
          icon={<WalletCards className="h-4 w-4" />}
          label="Saldo"
          value={loading ? "..." : formatTikPayBalance(state?.member.balance ?? 0)}
        />
        <Metric
          icon={<CalendarDays className="h-4 w-4" />}
          label="Día actual"
          value={loading ? "..." : String(state?.member.activeDay ?? 1) + "/30"}
        />
        <Metric
          icon={<Trophy className="h-4 w-4" />}
          label="Días completos"
          value={loading ? "..." : String(state?.member.completedDays ?? 0)}
        />
        <Metric
          icon={<UserRound className="h-4 w-4" />}
          label="Estado"
          value="Activo"
        />
      </section>

      {state?.member.isAdmin ? (
        <Link
          to="/admin-community"
          className="mb-4 flex items-center gap-3 rounded-[20px] border border-[#ffd6de] bg-[#fff7f9] p-4 shadow-[0_6px_22px_rgba(255,59,92,0.06)]"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#ff3b5c] text-white">
            <UsersRound className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black text-[#161823]">Administrar comunidad</p>
            <p className="mt-0.5 text-[9px] text-[#8a8a8e]">
              Crear, editar, ocultar y eliminar publicaciones.
            </p>
          </div>
          <ShieldCheck className="h-4 w-4 text-[#ff3b5c]" />
        </Link>
      ) : null}

      <Link
        to="/terms"
        className="mb-4 flex items-center gap-3 rounded-[20px] border border-black/[0.05] bg-white p-4 shadow-[0_6px_22px_rgba(0,0,0,0.04)]"
      >
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fff0f3] text-[#ff3b5c]">
          <ShieldCheck className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black text-[#161823]">Términos de Uso</p>
          <p className="mt-0.5 text-[9px] leading-relaxed text-[#8a8a8e]">
            Consulta las reglas del ciclo de 30 días y las recompensas.
          </p>
        </div>
      </Link>

      <section className="rounded-[22px] border border-black/[0.05] bg-white p-4 shadow-[0_8px_26px_rgba(0,0,0,0.05)]">
        <h3 className="text-[15px] font-black text-[#161823]">Tu progreso está protegido</h3>
        <p className="mt-1.5 text-[12px] leading-relaxed text-[#747378]">
          Tus vídeos completados, recompensas y próximos desbloqueos están vinculados a esta cuenta.
          Puedes entrar desde otro dispositivo con el mismo correo y contraseña.
        </p>

        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#f3f3f4] px-4 text-[13px] font-black text-[#4f4f53] transition active:scale-[0.99]"
        >
          <LogOut className="h-4 w-4" />
          CERRAR SESIÓN
        </button>
      </section>
    </MembersLayout>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-black/[0.05] bg-white p-3.5 shadow-[0_6px_20px_rgba(0,0,0,0.04)]">
      <div className="mb-2 grid h-8 w-8 place-items-center rounded-xl bg-[#fff0f3] text-[#ff3b5c]">
        {icon}
      </div>
      <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#8a8a8e]">{label}</p>
      <p className="mt-1 truncate text-[16px] font-black text-[#161823]">{value}</p>
    </div>
  );
}
