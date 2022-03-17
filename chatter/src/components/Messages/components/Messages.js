import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import io from "socket.io-client";
import useSound from "use-sound";
import config from "../../../config";
import LatestMessagesContext from "../../../contexts/LatestMessages/LatestMessages";
import TypingMessage from "./TypingMessage";
import Header from "./Header";
import Footer from "./Footer";
import Message from "./Message";
import "../styles/_messages.scss";

const socket = io(config.BOT_SERVER_ENDPOINT, {
  transports: ["websocket", "polling", "flashsocket"],
});
const user = "me";

function Messages() {
  const [playSend] = useSound(config.SEND_AUDIO_URL);
  const [playReceive] = useSound(config.RECEIVE_AUDIO_URL);
  const { messages, setLatestMessage } = useContext(LatestMessagesContext);

  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState([
    { id: 0, user: "bot", message: messages.bot },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messageRef = useRef(null);

  const sendMessage = useCallback(
    (text) => {
      const userMessage = { id: messageList.length, user, message: text };
      socket.emit("user-message", text);

      playSend();
      setMessage("");
      setMessageList((list) => [...list, userMessage]);
      setLatestMessage("bot", text);
    },
    [messageList.length, setLatestMessage, playSend]
  );

  const handleBotMessage = useCallback(
    (text) => {
      const botMessage = { id: messageList.length, user: "bot", message: text };

      playReceive();
      setIsTyping(false);
      setLatestMessage("bot", text);
      setMessageList((list) => [...list, botMessage]);
    },
    [messageList.length, setLatestMessage, playReceive]
  );

  useEffect(() => {
    socket.on("bot-message", (text) => {
      handleBotMessage(text);
    });
  }, []);
  useEffect(() => {
    socket.on("bot-typing", () => {
      setIsTyping(true);
    });
  }, []);

  useEffect(() => {
    messageRef.current.scrollIntoView();
  }, [messageList.length, isTyping]);

  return (
    <div className="messages">
      <Header />
      <div className="messages__list" id="message-list">
        {messageList &&
          messageList.map((m, i) => (
            <div ref={i === messageList.length - 1 ? messageRef : undefined}>
              <Message
                message={m}
                nextMessage={i === messageList.length - 1}
                botTyping={isTyping}
              />
            </div>
          ))}
        {isTyping && <TypingMessage />}
      </div>
      <Footer
        message={message}
        sendMessage={() => sendMessage(message)}
        onChangeMessage={(event) => setMessage(event.target.value)}
      />
    </div>
  );
}

export default Messages;
