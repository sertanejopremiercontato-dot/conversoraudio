import { useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  User 
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../firebase";
import { AdminUserV2 } from "../types";

const BOOTSTRAP_ADMIN_EMAIL = "sertanejopremiercontato@gmail.com";

export function useAdminAuthV2() {
  const [adminUser, setAdminUser] = useState<AdminUserV2 | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (!isMounted) return;

      if (!firebaseUser) {
        setAdminUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setAuthError(null);

      try {
        const isBootstrap = firebaseUser.email === BOOTSTRAP_ADMIN_EMAIL;
        let isActiveAdmin = isBootstrap;

        if (!isBootstrap) {
          const adminRef = doc(db, "admins", firebaseUser.uid);
          const adminSnap = await getDoc(adminRef);
          if (adminSnap.exists() && adminSnap.data()?.active === true) {
            isActiveAdmin = true;
          }
        }

        if (isActiveAdmin) {
          if (isMounted) {
            setAdminUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: isBootstrap ? "superadmin" : "admin"
            });
          }
        } else {
          // Não é admin autorizado
          await signOut(auth);
          if (isMounted) {
            setAdminUser(null);
            setAuthError("Acesso restrito. Este usuário não possui privilégios de administrador.");
          }
        }
      } catch (err: any) {
        console.error("[V2 Admin Auth] Falha na verificação de administrador:", err);
        if (isMounted) {
          setAuthError(err.message || "Erro ao verificar credenciais administrativas.");
          setAdminUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const login = async (emailInput: string, passwordInput: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, emailInput.trim(), passwordInput);
    } catch (err: any) {
      console.error("[V2 Admin Auth] Erro de login:", err);
      let message = "Credenciais inválidas. Verifique seu e-mail e senha.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        message = "E-mail ou senha incorretos.";
      } else if (err.code === "auth/too-many-requests") {
        message = "Muitas tentativas malsucedidas. Tente novamente mais tarde.";
      }
      setAuthError(message);
      setLoading(false);
      throw new Error(message);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setAdminUser(null);
    } catch (err: any) {
      console.error("[V2 Admin Auth] Erro ao deslogar:", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    adminUser,
    isAuthenticated: !!adminUser,
    loading,
    authError,
    login,
    logout
  };
}
