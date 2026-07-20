import { useState } from "react";
import { FiMessageCircle, FiX, FiSend } from "react-icons/fi";
import { FaRobot } from "react-icons/fa";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:9000/api";

export default function ChatWidget() {

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const sendMessage = async () => {

    if (!message.trim()) return;

    const userMessage = {
      role: "user",
      content: message
    };

    setMessages(prev => [...prev, userMessage]);

    try {

      const response = await fetch(
        `${API_URL}/ai`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const data = await response.json();


      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "No hubo respuesta"
        }
      ]);


    } catch (error) {

      console.error(error);

      setMessages(prev => [
        ...prev,
        {
          role:"assistant",
          content:"Error al conectar con el asistente IA"
        }
      ]);
    }


    setMessage("");

  };


  return (

    <>

      {/* Botón flotante */}

      <button
      onClick={() => setOpen(!open)}
      aria-label="Abrir chat"
      className="fixed bottom-5 right-5 z-40 bg-blue-900 hover:bg-blue-950 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-colors"
      >
        {open ? <FiX size={22} /> : <FiMessageCircle size={22} />}
      </button>



      {
        open && (

          <div className="fixed bottom-24 right-5 z-40 w-[90vw] max-w-96 h-[500px] max-h-[65vh] bg-white rounded-xl shadow-xl border flex flex-col overflow-hidden">

            <div className=" bg-blue-900 text-white p-4 flex items-center gap-2 shink-0">
              <FaRobot size={17} />
              <span className="font-semibold text-sm">Asistente SWES</span>
            </div>



            <div
              className="
                flex-1
                overflow-y-auto
                p-3
                space-y-2
              "
            >

              {
                messages.map((msg,index)=>(

                  <div
                    key={index}
                    className={
                      msg.role==="user"
                      ?
                      "text-right"
                      :
                      "text-left"
                    }
                  >

                    <span
  className={`inline-block px-3 py-2 rounded-2xl text-sm max-w-[85%] whitespace-pre-line ${
    msg.role === "user"
      ? "bg-blue-900 text-white rounded-br-sm"
      : "bg-gray-100 text-gray-800 rounded-bl-sm"
  }`}
>
  {msg.content}
</span>

                  </div>

                ))
              }

            </div>



            <div
              className="
                p-3
                border-t
                flex
                gap-2
              "
            >

              <input

                value={message}

                onChange={
                  e=>setMessage(e.target.value)
                }

                onKeyDown={
                  e=>{
                    if(e.key==="Enter")
                      sendMessage();
                  }
                }

                placeholder="Escribe tu pregunta..."

                className="
                  flex-1
                  border
                  rounded-lg
                  px-3
                "

              />


              <button

                onClick={sendMessage}

                className="
                  bg-blue-600
                  text-white
                  px-4
                  rounded-lg
                "

              >
                Enviar

              </button>


            </div>


          </div>

        )
      }


    </>

  );
}
