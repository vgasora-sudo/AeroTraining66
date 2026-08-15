// src/components/AeroTrainingBot.jsx
import React, { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import { Chat, Channel, Window, MessageList, MessageInput, MessageHeader } from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';
import './AeroTrainingBot.css';

const apiKey = import.meta.env.VITE_STREAM_API_KEY;

const AeroTrainingBot = () => {
    const [chatClient, setChatClient] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);

    useEffect(() => {
        if (!apiKey) {
            console.error('❌ VITE_STREAM_API_KEY no definida en .env');
            return;
        }

        const initChat = async () => {
            const client = StreamChat.getInstance(apiKey);
            const userId = 'alumno_generico';
            const userName = 'Alumno AeroTraining';

            try {
                await client.connectUser(
                    { id: userId, name: userName },
                    client.devToken(userId)
                );
                setChatClient(client);
            } catch (error) {
                console.error('Error al conectar con Stream Chat:', error);
            }
        };

        initChat();

        return () => {
            if (chatClient) chatClient.disconnectUser();
        };
    }, []);

    if (!chatClient) return null;

    const channel = chatClient.channel('messaging', 'soporte_easa', {
        name: 'Soporte EASA Part 66',
    });

    return (
        <div className={`aerotraining-chat-container ${isChatOpen ? 'open' : ''}`}>
            <button
                className="chat-float-button"
                onClick={() => setIsChatOpen(!isChatOpen)}
                aria-label="Abrir chat de ayuda"
            >
                {isChatOpen ? '✖️' : '💬'}
            </button>

            {isChatOpen && (
                <div className="chat-window">
                    <Chat client={chatClient}>
                        <Channel channel={channel}>
                            <Window>
                                <MessageHeader title="Soporte AeroTraining" />
                                <MessageList />
                                <MessageInput placeholder="Escribe tu consulta sobre EASA..." />
                            </Window>
                        </Channel>
                    </Chat>
                </div>
            )}
        </div>
    );
};

export default AeroTrainingBot;
