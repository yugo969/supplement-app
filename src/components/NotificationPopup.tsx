import React from 'react'
import { useNotification } from '@/lib/useNotification';

const NotificationPopup = () => {
  const { isVisible, notificationProps } = useNotification();
  if(!isVisible || !notificationProps) return null;

  return (
    <div className="fixed top-0 bottom-0 left-0 right-0 overflow-hidden overscroll-none flex justify-center items-center w-screen h-screen bg-black/60">
      <div className="flex flex-col justify-center items-center gap-4 w-fit h-fit rounded-lg py-10 px-16 bg-white/70 text-black ">
        {notificationProps.message}

        {notificationProps.actions && (
            <div className="flex mt-4">
              {notificationProps.actions.map((action, index) => (
                <button
                  key={index}
                  className="mx-2 py-1 px-3 rounded border border-gray-400 bg-gray-300 text-black"
                  onClick={action.callback}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

export default NotificationPopup



