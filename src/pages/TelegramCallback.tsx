import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const AUTH_URL = "https://functions.poehali.dev/98c0cd97-6d02-45ee-8ae9-cf25f9e30e6b";

export default function TelegramCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setErrorMsg("Токен не найден");
      return;
    }

    fetch(`${AUTH_URL}?action=callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.access_token) {
          localStorage.setItem("telegram_auth_refresh_token", data.refresh_token);
          localStorage.setItem("telegram_access_token", data.access_token);
          localStorage.setItem("telegram_user", JSON.stringify(data.user));
          setStatus("success");
          setTimeout(() => navigate("/cabinet"), 1500);
        } else {
          setStatus("error");
          setErrorMsg(data.error || "Ошибка авторизации");
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMsg("Ошибка сети");
      });
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        {status === "loading" && (
          <>
            <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-white">Выполняется вход через Telegram...</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="text-4xl">✅</div>
            <p className="text-white text-lg">Вход выполнен! Перенаправляем...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-4xl">❌</div>
            <p className="text-white text-lg">{errorMsg}</p>
            <button
              onClick={() => navigate("/login")}
              className="text-teal-400 underline text-sm"
            >
              Вернуться на страницу входа
            </button>
          </>
        )}
      </div>
    </div>
  );
}
