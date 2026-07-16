import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Wallet, Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const emptyForm = { email: "", password: "" };

export default function Login() {
  const { isAuthenticated, loading, signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState("signin"); // "signin" | "signup" | "forgot"
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAuthenticated) return <Navigate to="/" replace />;

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
        setMode("signin");
        setForm(emptyForm);
      } else {
        await resetPassword(form.email);
        toast({
          title: "E-mail envoyé",
          description: "Vérifiez votre boîte mail : un lien de réinitialisation vous a été envoyé.",
        });
        setMode("signin");
        setForm(emptyForm);
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-8">
          <span className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center">
            <Wallet className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-heading font-semibold">Budget MG</h1>
          <p className="text-sm text-muted-foreground">Suivi budgétaire personnel</p>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
          {mode === "forgot" ? (
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setForm(emptyForm);
              }}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Retour à la connexion
            </button>
          ) : (
            <div className="flex rounded-xl bg-muted p-1 mb-6">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
                  mode === "signin" ? "bg-card shadow-sm" : "text-muted-foreground"
                }`}
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
                  mode === "signup" ? "bg-card shadow-sm" : "text-muted-foreground"
                }`}
              >
                Inscription
              </button>
            </div>
          )}

          {mode === "forgot" && (
            <div className="mb-4">
              <p className="font-medium text-sm">Mot de passe oublié</p>
              <p className="text-xs text-muted-foreground mt-1">
                Entrez votre adresse e-mail, nous vous enverrons un lien pour choisir un nouveau mot de passe.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                Adresse e-mail
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="ex: Rakoto@gmail.com"
              />
            </div>

            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium">
                  Mot de passe
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Mot de passe (6 caractères minimum)"
                />
              </div>
            )}

            {mode === "signin" && (
              <button
                type="button"
                onClick={() => {
                  setMode("forgot");
                  setForm((f) => ({ ...f, password: "" }));
                }}
                className="text-xs text-muted-foreground hover:text-foreground -mt-2"
              >
                Mot de passe oublié ?
              </button>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Se connecter" : mode === "signup" ? "Créer mon compte" : "Envoyer le lien"}
            </Button>
          </form>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-6">
          Vos données sont isolées par compte et accessibles hors-ligne une fois connecté.
        </p>
        <p className="text-[11px] text-center text-muted-foreground/60 mt-3">
          © {new Date().getFullYear()} Kasaina. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}
