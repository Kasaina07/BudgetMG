import { useId, useState } from "react";
import { Navigate } from "react-router-dom";
import { Wallet, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

const emptyForm = { email: "", password: "" };

const COPY = {
  signin: {
    title: "Content de vous revoir !",
    subtitle: "Pas encore de compte ?",
    switchLabel: "Inscrivez-vous",
    switchTo: "signup",
    submitLabel: "Se connecter",
  },
  signup: {
    title: "Créez votre compte",
    subtitle: "Déjà inscrit ?",
    switchLabel: "Connectez-vous",
    switchTo: "signin",
    submitLabel: "Créer mon compte",
  },
  forgot: {
    title: "Mot de passe oublié",
    subtitle: "",
    switchLabel: "",
    switchTo: "signin",
    submitLabel: "Envoyer le lien",
  },
};

/**
 * Motif géométrique du panneau de marque : une grille d'arcs (quart de cercle)
 * répétés en diagonale — clin d'œil à une courbe d'épargne qui grimpe.
 * Les couleurs viennent des variables du thème (navy + vert "success"),
 * pas de bleu importé d'ailleurs : ça reste cohérent avec le reste de l'app.
 */
function BrandPattern() {
  const patternId = useId();
  return (
    <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <pattern id={patternId} width="140" height="140" patternUnits="userSpaceOnUse">
          <rect width="140" height="140" fill="hsl(var(--sidebar-background))" />
          <circle cx="0" cy="0" r="140" fill="hsl(var(--success))" fillOpacity="0.22" />
          <circle cx="140" cy="140" r="90" fill="hsl(var(--sidebar-accent))" fillOpacity="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}

export default function Login() {
  const { isAuthenticated, loading, signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState("signin"); // "signin" | "signup" | "forgot"
  const [form, setForm] = useState(emptyForm);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAuthenticated) return <Navigate to="/" replace />;

  function switchMode(next) {
    setMode(next);
    setForm(emptyForm);
    setShowPassword(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || (mode !== "forgot" && !form.password)) return;
    setSubmitting(true);
    try {
      if (mode === "signin") {
        await signIn(form.email, form.password);
      } else if (mode === "signup") {
        await signUp(form.email, form.password);
        toast({
          title: "Compte créé",
          description: "Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous.",
        });
        switchMode("signin");
      } else {
        await resetPassword(form.email);
        toast({
          title: "E-mail envoyé",
          description: "Vérifiez votre boîte mail : un lien de réinitialisation vous a été envoyé.",
        });
        switchMode("signin");
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title:
          mode === "signin" ? "Connexion impossible" : mode === "signup" ? "Inscription impossible" : "Envoi impossible",
        description: err.message || "Une erreur est survenue.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const copy = COPY[mode];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Colonne gauche : formulaire */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center text-center gap-4 mb-8">
            <span className="h-14 w-14 rounded-full bg-secondary text-primary flex items-center justify-center">
              <Wallet className="h-6 w-6" />
            </span>

            {mode === "forgot" ? (
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground self-start"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Retour à la connexion
              </button>
            ) : null}

            <div>
              <h1 className="text-3xl font-display font-bold">{copy.title}</h1>
              {mode === "forgot" ? (
                <p className="text-sm text-muted-foreground mt-2">
                  Entrez votre adresse e-mail, nous vous enverrons un lien pour choisir un nouveau mot de passe.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">
                  {copy.subtitle}{" "}
                  <button
                    type="button"
                    onClick={() => switchMode(copy.switchTo)}
                    className="text-primary font-medium hover:underline"
                  >
                    {copy.switchLabel}
                  </button>
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Adresse e-mail"
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {mode !== "forgot" && (
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Mot de passe"
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            )}

            {mode === "signin" && (
              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2 text-muted-foreground select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                  />
                  Se souvenir de moi
                </label>
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="text-primary font-medium hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold py-3 hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {copy.submitLabel}
            </button>
          </form>

          <p className="text-[11px] text-center text-muted-foreground/60 mt-10">
            © {new Date().getFullYear()} Kasaina. Vos données sont isolées par compte et accessibles hors-ligne une fois connecté.
          </p>
        </div>
      </div>

      {/* Colonne droite : panneau de marque (masqué sur mobile) */}
      <div className="hidden md:flex md:flex-col md:w-[42%] lg:w-[45%] relative overflow-hidden">
        <BrandPattern />
        <div className="relative z-10 mt-auto w-full flex items-center gap-2 px-6 py-4 bg-black/20 backdrop-blur-sm">
          <span className="h-8 w-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
            <Wallet className="h-4 w-4" />
          </span>
          <span className="text-white font-display font-semibold">Kasaina</span>
        </div>
      </div>
    </div>
  );
}
