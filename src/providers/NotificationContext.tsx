import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";

type NotificationProps = {
  message: string;
  duration?: number;
  autoHide?: boolean;
  onDismiss?: () => void;
  actions?: {
    label: string;
    callback: () => void;
  }[];
};

type NotificationContextType = {
  isVisible: boolean;
  notificationProps: NotificationProps | null;
  showNotification: (props: NotificationProps) => void;
  hideNotification: () => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotificationContext must be used within a NotificationProvider"
    );
  }
  return context;
};

type Props = {
  children?: React.ReactNode;
};

export const NotificationProvider: React.FC<Props> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [notificationProps, setNotificationProps] =
    useState<NotificationProps | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const hideNotification = useCallback(() => {
    clearHideTimer();
    setIsVisible(false);
    setNotificationProps(null);
  }, [clearHideTimer]);

  const showNotification = useCallback(
    ({
      message,
      duration = 1000,
      autoHide = true,
      onDismiss,
      actions,
    }: NotificationProps) => {
      clearHideTimer();
      setNotificationProps({ message, duration, autoHide, actions });
      setIsVisible(true);

      if (autoHide) {
        hideTimerRef.current = setTimeout(() => {
          setIsVisible(false);
          setNotificationProps(null);
          if (onDismiss) {
            onDismiss();
          }
        }, duration);
      }
    },
    [clearHideTimer]
  );

  useEffect(() => {
    return () => {
      clearHideTimer();
    };
  }, [clearHideTimer]);

  return (
    <NotificationContext.Provider
      value={{
        isVisible,
        notificationProps,
        showNotification,
        hideNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
