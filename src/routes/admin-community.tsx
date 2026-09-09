import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, EyeOff, Pencil, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MembersLayout } from "@/components/members/MembersLayout";
import { useTikPayMemberState } from "@/hooks/use-tikpay-member-state";
import {
  createTikPayCommunityPost,
  deleteTikPayCommunityPost,
  fetchTikPayCommunityPostsAdmin,
  type TikPayCommunityPost,
  updateTikPayCommunityPost,
} from "@/lib/tikpay-community-api";

export const Route = createFileRoute("/admin-community")({
  head: () => ({
    meta: [
      { title: "Administrar comunidad — Tik Pay" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminCommunityPage,
});

type FormState = {
  id: string | null;
  authorName: string;
  authorHandle: string;
  authorAvatarUrl: string;
  body: string;
  likesCount: string;
  commentsCount: string;
  sortOrder: string;
  isActive: boolean;
  isSeedDemo: boolean;
};

const EMPTY_FORM: FormState = {
  id: null,
  authorName: "",
  authorHandle: "",
  authorAvatarUrl: "",
  body: "",
  likesCount: "0",
  commentsCount: "0",
  sortOrder: "0",
  isActive: true,
  isSeedDemo: true,
};

function toForm(post: TikPayCommunityPost): FormState {
  return {
    id: post.id,
    authorName: post.author_name,
    authorHandle: post.author_handle ?? "",
    authorAvatarUrl: post.author_avatar_url ?? "",
    body: post.body,
    likesCount: String(post.likes_count),
    commentsCount: String(post.comments_count),
    sortOrder: String(post.sort_order),
    isActive: post.is_active,
    isSeedDemo: post.is_seed_demo,
  };
}

function AdminCommunityPage() {
  const { state, loading: memberLoading } = useTikPayMemberState();
  const [posts, setPosts] = useState<TikPayCommunityPost[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isAdmin = Boolean(state?.member.isAdmin);

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError("");
    try {
      setPosts(await fetchTikPayCommunityPostsAdmin());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo cargar la comunidad.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!memberLoading && isAdmin) void load();
    if (!memberLoading && !isAdmin) setLoading(false);
  }, [memberLoading, isAdmin, load]);

  const editing = useMemo(() => Boolean(form.id), [form.id]);

  async function save() {
    if (!form.authorName.trim() || !form.body.trim()) {
      setError("Completa el nombre y el texto de la publicación.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const input = {
        authorName: form.authorName,
        authorHandle: form.authorHandle,
        authorAvatarUrl: form.authorAvatarUrl,
        body: form.body,
        likesCount: Number(form.likesCount || 0),
        commentsCount: Number(form.commentsCount || 0),
        sortOrder: Number(form.sortOrder || 0),
        isActive: form.isActive,
        isSeedDemo: form.isSeedDemo,
      };

      if (form.id) {
        await updateTikPayCommunityPost(form.id, input);
        setSuccess("Publicación actualizada.");
      } else {
        await createTikPayCommunityPost(input);
        setSuccess("Publicación creada.");
      }

      setForm(EMPTY_FORM);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("¿Eliminar esta publicación?")) return;
    setError("");
    try {
      await deleteTikPayCommunityPost(id);
      if (form.id === id) setForm(EMPTY_FORM);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo eliminar.");
    }
  }

  async function toggle(post: TikPayCommunityPost) {
    setError("");
    try {
      await updateTikPayCommunityPost(post.id, {
        authorName: post.author_name,
        authorHandle: post.author_handle ?? "",
        authorAvatarUrl: post.author_avatar_url ?? "",
        body: post.body,
        likesCount: post.likes_count,
        commentsCount: post.comments_count,
        sortOrder: post.sort_order,
        isActive: !post.is_active,
        isSeedDemo: post.is_seed_demo,
      });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo cambiar el estado.");
    }
  }

  if (memberLoading) {
    return (
      <MembersLayout>
        <div className="rounded-[22px] bg-white p-8 text-center text-[12px] text-[#8a8a8e]">
          Cargando permisos...
        </div>
      </MembersLayout>
    );
  }

  if (!isAdmin) {
    return (
      <MembersLayout>
        <section className="rounded-[22px] border border-black/[0.05] bg-white p-6 text-center shadow-[0_8px_26px_rgba(0,0,0,0.05)]">
          <ShieldCheck className="mx-auto h-8 w-8 text-[#ff3b5c]" />
          <h1 className="mt-3 text-[18px] font-black">Área restringida</h1>
          <p className="mt-1 text-[12px] text-[#747378]">
            Solo el administrador puede editar la comunidad.
          </p>
          <Link
            to="/community"
            className="mt-4 inline-flex rounded-xl bg-[#ff3b5c] px-4 py-2.5 text-[11px] font-black text-white"
          >
            VOLVER A COMUNIDAD
          </Link>
        </section>
      </MembersLayout>
    );
  }

  return (
    <MembersLayout>
      <section className="mb-4 rounded-[22px] border border-black/[0.05] bg-white p-5 shadow-[0_8px_26px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#ff3b5c]">
              Administración
            </p>
            <h1 className="mt-1 text-[21px] font-black">Comunidad</h1>
            <p className="mt-1 text-[11px] text-[#8a8a8e]">
              Crea, edita, oculta o elimina publicaciones.
            </p>
          </div>
          {editing ? (
            <button
              type="button"
              onClick={() => setForm(EMPTY_FORM)}
              className="grid h-10 w-10 place-items-center rounded-xl bg-[#f3f3f4] text-[#6f6f73]"
              aria-label="Cancelar edición"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </section>

      <section className="mb-4 rounded-[22px] border border-black/[0.05] bg-white p-4 shadow-[0_8px_26px_rgba(0,0,0,0.05)]">
        <div className="mb-3 flex items-center gap-2">
          {editing ? <Pencil className="h-4 w-4 text-[#ff3b5c]" /> : <Plus className="h-4 w-4 text-[#ff3b5c]" />}
          <h2 className="text-[14px] font-black">
            {editing ? "Editar publicación" : "Nueva publicación"}
          </h2>
        </div>

        <div className="space-y-3">
          <Field label="Nombre">
            <input
              value={form.authorName}
              onChange={(e) => setForm((prev) => ({ ...prev, authorName: e.target.value }))}
              placeholder="Ej.: Laura M."
              className="w-full bg-transparent text-[13px] outline-none"
            />
          </Field>

          <Field label="Usuario">
            <input
              value={form.authorHandle}
              onChange={(e) => setForm((prev) => ({ ...prev, authorHandle: e.target.value }))}
              placeholder="@usuario"
              className="w-full bg-transparent text-[13px] outline-none"
            />
          </Field>

          <Field label="URL de foto (opcional)">
            <input
              value={form.authorAvatarUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, authorAvatarUrl: e.target.value }))}
              placeholder="https://..."
              className="w-full bg-transparent text-[13px] outline-none"
            />
          </Field>

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.08em] text-[#8a8a8e]">
              Texto
            </span>
            <textarea
              value={form.body}
              onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
              rows={4}
              placeholder="Escribe la publicación..."
              className="w-full resize-none rounded-2xl border border-black/[0.08] bg-[#fafafa] px-3.5 py-3 text-[13px] outline-none focus:border-[#ff3b5c]/40"
            />
          </label>

          <div className="grid grid-cols-3 gap-2">
            <NumberField
              label="Likes"
              value={form.likesCount}
              onChange={(value) => setForm((prev) => ({ ...prev, likesCount: value }))}
            />
            <NumberField
              label="Comentarios"
              value={form.commentsCount}
              onChange={(value) => setForm((prev) => ({ ...prev, commentsCount: value }))}
            />
            <NumberField
              label="Orden"
              value={form.sortOrder}
              onChange={(value) => setForm((prev) => ({ ...prev, sortOrder: value }))}
            />
          </div>

          <Toggle
            checked={form.isActive}
            onChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
            title="Visible en la comunidad"
            subtitle="Desactiva para ocultar sin eliminar."
          />

          <Toggle
            checked={form.isSeedDemo}
            onChange={(checked) => setForm((prev) => ({ ...prev, isSeedDemo: checked }))}
            title="Marcar como ejemplo"
            subtitle="Déjalo activo si el contenido es ficticio o de demostración."
          />

          {error ? (
            <p className="rounded-xl bg-[#fff0f3] px-3 py-2.5 text-[11px] font-semibold text-[#c93652]">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="rounded-xl bg-[#eefaf2] px-3 py-2.5 text-[11px] font-semibold text-[#159447]">
              {success}
            </p>
          ) : null}

          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#ff3b5c] px-4 text-[12px] font-black text-white disabled:opacity-60"
          >
            {saving ? "GUARDANDO..." : editing ? "GUARDAR CAMBIOS" : "CREAR PUBLICACIÓN"}
          </button>
        </div>
      </section>

      <section className="space-y-2.5">
        <h2 className="px-1 text-[12px] font-black text-[#4f4f53]">
          Publicaciones ({posts.length})
        </h2>

        {loading ? (
          <div className="rounded-[20px] bg-white p-5 text-center text-[11px] text-[#8a8a8e]">
            Cargando...
          </div>
        ) : (
          posts.map((post) => (
            <article
              key={post.id}
              className="rounded-[20px] border border-black/[0.05] bg-white p-4 shadow-[0_6px_20px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[12px] font-black">{post.author_name}</h3>
                    {post.is_seed_demo ? (
                      <span className="rounded-full bg-[#f3f3f4] px-2 py-0.5 text-[8px] font-black uppercase text-[#8a8a8e]">
                        Ejemplo
                      </span>
                    ) : null}
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-[8px] font-black uppercase " +
                        (post.is_active
                          ? "bg-[#eefaf2] text-[#159447]"
                          : "bg-[#f3f3f4] text-[#8a8a8e]")
                      }
                    >
                      {post.is_active ? "Visible" : "Oculto"}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#747378]">
                    {post.body}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex gap-2 border-t border-black/[0.05] pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setForm(toForm(post));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-[#f4f4f5] px-3 text-[10px] font-black text-[#55555a]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => void toggle(post)}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-[#f4f4f5] px-3 text-[10px] font-black text-[#55555a]"
                >
                  {post.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {post.is_active ? "Ocultar" : "Mostrar"}
                </button>
                <button
                  type="button"
                  onClick={() => void remove(post.id)}
                  className="ml-auto grid h-9 w-9 place-items-center rounded-xl bg-[#fff0f3] text-[#d92d4b]"
                  aria-label="Eliminar publicación"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </MembersLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.08em] text-[#8a8a8e]">
        {label}
      </span>
      <div className="rounded-2xl border border-black/[0.08] bg-[#fafafa] px-3.5 py-3">
        {children}
      </div>
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.06em] text-[#8a8a8e]">
        {label}
      </span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-black/[0.08] bg-[#fafafa] px-3 py-2.5 text-[12px] outline-none"
      />
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  title,
  subtitle,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  subtitle: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-black/[0.06] bg-[#fafafa] p-3.5">
      <div>
        <p className="text-[11px] font-black text-[#3f3f44]">{title}</p>
        <p className="mt-0.5 text-[9px] text-[#99999e]">{subtitle}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[#ff3b5c]"
      />
    </label>
  );
}
