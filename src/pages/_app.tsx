import NotificationPopup from "@/components/NotificationPopup";
import { NotificationProvider } from "@/providers/NotificationContext";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/context/AuthContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div>
      <AuthProvider>
        <NotificationProvider>
          <Component {...pageProps} />
          <NotificationPopup />
        </NotificationProvider>
      </AuthProvider>
    </div>
  );
}
