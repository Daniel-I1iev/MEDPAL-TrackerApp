import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase";

interface PatientChatWidgetProps {
  doctor: { id: string; name: string };
  currentUser: any;
}

const PatientChatWidget: React.FC<PatientChatWidgetProps> = ({ doctor, currentUser }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{text: string, from: string, timestamp: number}[]>([]);
  const [pendingMessages, setPendingMessages] = useState<{text: string, from: string, tempId: string}[]>([]);
  const [error, setError] = useState<string>("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Helper за формат на време
  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Update Firestore query to always show messages between this patient and doctor, regardless of medications
  useEffect(() => {
    if (!doctor || !doctor.id || !currentUser || !currentUser.id) return;
    const chatId = `${doctor.id}_${currentUser.id}`;
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const firestoreMessages = snap.docs.map(doc => doc.data() as any);
      setMessages(firestoreMessages);
      // Remove pending messages that are now confirmed in Firestore
      setPendingMessages(prevPending =>
        prevPending.filter(pm =>
          !firestoreMessages.some(
            m => m.text === pm.text && m.from === pm.from && m.from === "patient"
          )
        )
      );
    });
    return () => unsub();
  }, [doctor, currentUser]);

  // Scroll to bottom on new messages or pending messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingMessages]);

  const sendMessage = async () => {
    setError("");
    if (!doctor || !doctor.id || !currentUser || !currentUser.id) {
      setError("Липсва информация за лекар или потребител.");
      return;
    }
    if (!message.trim()) {
      setError("Моля, въведете съобщение.");
      return;
    }
    if (message.length > 500) {
      setError("Съобщението е твърде дълго (макс. 500 символа).");
      return;
    }
    const tempId = Math.random().toString(36).substring(2, 15);
    const pendingMsg = {
      text: message,
      from: "patient",
      tempId,
    };
    setPendingMessages((prev) => [...prev, pendingMsg]);
    setMessage("");
    try {
      // Save message in a subcollection for the chat between doctor and patient
      const chatId = `${doctor.id}_${currentUser.id}`;
      await addDoc(collection(db, "chats", chatId, "messages"), {
        doctorId: doctor.id,
        doctorName: doctor.name,
        patientId: currentUser.id,
        patientName: currentUser.name,
        text: pendingMsg.text,
        from: "patient",
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      setError("Възникна грешка при изпращане. Опитайте отново.");
      setPendingMessages((prev) => prev.filter((m) => m.tempId !== tempId));
    }
  };

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:bg-primary/90"
        style={{ width: 56, height: 56 }}
        onClick={() => setOpen(o => !o)}
      >
        <Heart className="h-7 w-7" />
      </Button>
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[28rem] max-w-full">
          <Card className="shadow-xl bg-background text-foreground border border-border">
            <CardHeader>
              <CardTitle>Чат с лекаря</CardTitle>
              {doctor && doctor.name && doctor.id && doctor.id !== '' && (
                <div className="text-sm text-muted-foreground mt-1">Вашият лекар: <span className="font-semibold text-foreground">{doctor.name}</span></div>
              )}
            </CardHeader>
            <CardContent>
              <div className="h-[32rem] overflow-y-auto bg-muted rounded p-2 mb-2 text-base text-foreground flex flex-col gap-2">
                {messages.length === 0 && pendingMessages.length === 0 && (
                  <div className="text-muted-foreground">Няма съобщения.</div>
                )}
                {/* Истински съобщения */}
                {messages.map((m, idx) => {
                  // Унифицирана обработка на Firestore timestamp
                  let ts: number | undefined = undefined;
                  if (typeof m.timestamp === "number") {
                    ts = m.timestamp;
                  } else if (
                    m.timestamp &&
                    typeof m.timestamp === "object" &&
                    (m.timestamp as { seconds?: number }).seconds !== undefined &&
                    typeof (m.timestamp as { seconds: number }).seconds === "number"
                  ) {
                    ts = (m.timestamp as { seconds: number }).seconds * 1000;
                  }
                  return (
                    <div
                      key={idx}
                      className={
                        "flex " +
                        (m.from === "patient" ? "justify-end" : "justify-start")
                      }
                    >
                      <div className={
                        "flex flex-col items-" + (m.from === "patient" ? "end" : "start")
                      }>
                        <span
                          className={
                            "inline-block px-4 py-2 rounded-2xl max-w-[90%] whitespace-nowrap break-words relative shadow " +
                            (m.from === "patient"
                              ? "bg-blue-500 text-white"
                              : "bg-primary/10 text-foreground dark:bg-gray-700 dark:text-gray-100")
                          }
                        >
                          {m.text}
                          {m.from === "patient" && (
                            <span className="ml-2 align-middle text-xs text-white/80">
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="inline-block"><path d="M4 8l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </span>
                          )}
                        </span>
                        {ts && !isNaN(Number(ts)) && (
                          <span className="text-xs text-muted-foreground mt-1 select-none">
                            {formatTimestamp(Number(ts))}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {/* Оптимистични (pending) съобщения */}
                {pendingMessages.map((m) => (
                  <div key={m.tempId} className="flex justify-end">
                    <div className="flex flex-col items-end">
                      <span className="inline-block px-4 py-2 rounded-2xl max-w-[75%] bg-blue-500 text-white opacity-70 shadow">
                        {m.text}
                        <span className="ml-2 align-middle text-xs animate-pulse text-white/80">…</span>
                      </span>
                      <span className="text-xs text-muted-foreground mt-1 select-none">Изпращане…</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 border rounded p-2 bg-background text-foreground border-border h-12 text-base"
                  type="text"
                  placeholder="Вашето съобщение..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                  maxLength={500}
                />
                <Button onClick={sendMessage} disabled={!message.trim()} size="sm" className="h-12 text-base">Изпрати</Button>
              </div>
              {error && (
                <div className="mt-2 text-red-500 text-sm">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default PatientChatWidget;
