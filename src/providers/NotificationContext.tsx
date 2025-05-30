import { createContext, useContext, useState, useCallback } from "react";

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
  setIsVisible?: boolean;
  notificationProps: NotificationProps | null;
  showNotification: (props: NotificationProps) => void;
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

  const showNotification = useCallback(
    ({
      message,
      duration = 1000,
      autoHide = true,
      onDismiss,
      actions,
    }: NotificationProps) => {
      setNotificationProps({ message, duration, autoHide, actions });
      setIsVisible(true);

      if (autoHide) {
        setTimeout(() => {
          setIsVisible(false);
          setNotificationProps(null);
          if (onDismiss) {
            onDismiss();
          }
        }, duration);
      }
    },
    []
  );

  return (
    <NotificationContext.Provider
      value={{ isVisible, notificationProps, showNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
