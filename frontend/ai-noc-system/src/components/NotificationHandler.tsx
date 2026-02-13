import { useEffect } from 'react';
import toast from 'react-hot-toast';

interface NotificationHandlerProps {
    userId: number;
    authToken: string;
}

const API_WS_URL = 'ws://127.0.0.1:8000';

/**
 * A headless component that manages the WebSocket connection for real-time notifications.
 */
export function NotificationHandler({ userId, authToken }: NotificationHandlerProps) {
    useEffect(() => {
        // Ensure there's a valid user ID and token before trying to connect
        if (!userId || !authToken) {
            return;
        }

        // Establish the WebSocket connection
        const ws = new WebSocket(`${API_WS_URL}/ws/${userId}`);

        ws.onopen = () => {
            console.log("WebSocket connection established for user:", userId);
        };

        ws.onmessage = (event) => {
            // When a message is received from the server, show a toast notification
            console.log("Notification received:", event.data);
            toast.success(event.data, {
                duration: 6000, // Make the notification last for 6 seconds
                icon: '🔔',
                style: {
                    border: '1px solid #2563EB',
                    padding: '16px',
                    color: '#1E40AF',
                },
            });
        };

        ws.onclose = () => {
            console.log("WebSocket connection closed for user:", userId);
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        // This is a cleanup function that runs when the component unmounts
        // or when the dependencies (userId, authToken) change.
        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [userId, authToken]); // Re-run the effect if the user or token changes

    return null; // This component renders no UI
}