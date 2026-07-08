import { useState } from "react";

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
        "http://localhost:9000/api/ai",
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
        className="
          fixed bottom-5 right-5
          bg-blue-600 text-white
          rounded-full
          w-14 h-14
          text-2xl
          shadow-lg
        "
      >
        💬
      </button>



      {
        open && (

          <div
            className="
              fixed bottom-24 right-5
              w-96 h-[500px]
              bg-white
              rounded-xl
              shadow-xl
              border
              flex flex-col
            "
          >

            <div
              className="
                bg-blue-600
                text-white
                p-4
                rounded-t-xl
              "
            >
              🤖 SWES Assistant
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
                      className="
                        inline-block
                        p-2
                        rounded-lg
                        bg-gray-100
                      "
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