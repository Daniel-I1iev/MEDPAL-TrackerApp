import React, { useState, useEffect, useRef } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase";

interface Patient {
  id: string;
  name: string;
}

interface DoctorChatWidgetProps {
  patients: Patient[];
  currentUser: any;
}

const DoctorChatWidget: React.FC<DoctorChatWidgetProps> = ({ patients, currentUser }) => {
  const [open, setOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ id?: string; patientId: string; text: string; from: string; timestamp: number; pending?: boolean }[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const MAX_MESSAGE_LENGTH = 500;
  const [unreadCounts, setUnreadCounts] = useState<{ [patientId: string]: number }>({});
  const [lastReadTimestamps, setLastReadTimestamps] = useState<{ [patientId: string]: number }>({});

  // Helper за формат на време
  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Listen for messages in real time
  useEffect(() => {
    if (!selectedPatient) return;
    const chatId = `${currentUser.id}_${selectedPatient.id}`;
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          patientId: data.patientId,
          text: data.text,
          from: data.from,
          timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : Date.now(),
        };
      }));
    });
    return () => unsub();
  }, [selectedPatient, currentUser]);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  // Listen for unread messages for each patient
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribes: (() => void)[] = [];
    patients.forEach((patient) => {
      const chatId = `${currentUser.id}_${patient.id}`;
      const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"));
      const unsub = onSnapshot(q, (snap) => {
        let unread = 0;
        const lastRead = lastReadTimestamps[patient.id] || 0;
        snap.docs.forEach(doc => {
          const data = doc.data();
          if (data.from === "patient" && data.timestamp?.toMillis && data.timestamp.toMillis() > lastRead) {
            unread++;
          }
        });
        setUnreadCounts(prev => ({ ...prev, [patient.id]: unread }));
      });
      unsubscribes.push(unsub);
    });
    return () => { unsubscribes.forEach(u => u()); };
  }, [patients, currentUser, lastReadTimestamps]);

  // Когато се отвори чат с пациент, маркирай всички като прочетени
  useEffect(() => {
    if (open && selectedPatient) {
      const now = Date.now();
      setLastReadTimestamps(prev => ({ ...prev, [selectedPatient.id]: now }));
      setUnreadCounts(prev => ({ ...prev, [selectedPatient.id]: 0 }));
    }
  }, [open, selectedPatient]);

  const sendMessage = async () => {
    setError(null);
    if (!selectedPatient) {
      setError("Моля, изберете пациент.");
      return;
    }
    if (!currentUser || !currentUser.id) {
      setError("Липсва информация за лекаря.");
      return;
    }
    if (!message.trim()) {
      setError("Съобщението не може да е празно.");
      return;
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      setError(`Съобщението е твърде дълго (макс. ${MAX_MESSAGE_LENGTH} знака).`);
      return;
    }
    setSending(true);
    setMessage("");
    try {
      // Save message in a subcollection for the chat between doctor and patient
      const chatId = `${currentUser.id}_${selectedPatient.id}`;
      await addDoc(collection(db, "chats", chatId, "messages"), {
        doctorId: currentUser.id,
        doctorName: currentUser.name,
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        text: message,
        from: "doctor",
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      setError("Възникна грешка при изпращане. Опитайте отново.");
    } finally {
      setSending(false);
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
              <CardTitle>Чат с пациенти</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2">
                <select
                  className="w-full border rounded p-2 mb-2 bg-background text-foreground border-border"
                  value={selectedPatient?.id || ""}
                  onChange={e => {
                    const p = patients.find(p => p.id === e.target.value) || null;
                    setSelectedPatient(p);
                  }}
                >
                  <option value="">Избери пациент</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="h-[32rem] overflow-y-auto bg-muted rounded p-2 mb-2 text-base text-foreground flex flex-col gap-2">
                {selectedPatient && messages.filter(m => m.patientId === selectedPatient.id).length === 0 && (
                  <div className="text-muted-foreground">Няма съобщения.</div>
                )}
                {selectedPatient &&
                  messages
                    .filter(m => m.patientId === selectedPatient.id)
                    .filter((m, idx, arr) => {
                      if (!m.pending) return true;
                      return !arr.some(real =>
                        !real.pending &&
                        real.text === m.text &&
                        real.from === m.from &&
                        Math.abs(real.timestamp - m.timestamp) < 5000
                      );
                    })
                    .map((m, idx) => (
                      <div
                        key={m.id || idx}
                        className={
                          "flex " +
                          (m.from === "doctor"
                            ? "justify-end"
                            : "justify-start")
                        }
                      >
                        <div className={
                          "flex flex-col items-" + (m.from === "doctor" ? "end" : "start")
                        }>
                          <span
                            className={
                              "inline-block px-4 py-2 rounded-2xl max-w-[90%] whitespace-nowrap break-words relative shadow " +
                              (m.from === "doctor"
                                ? "bg-blue-500 text-white"
                                : "bg-primary/10 text-foreground dark:bg-gray-700 dark:text-gray-100")
                            }
                          >
                            {m.text}
                            {m.from === "doctor" && (
                              <span className="ml-2 align-middle text-xs text-white/80">
                                {m.pending ? (
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="inline-block"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.5"/></svg>
                                ) : (
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="inline-block"><path d="M4 8l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                )}
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground mt-1 select-none">
                            {m.timestamp ? formatTimestamp(m.timestamp) : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                {!selectedPatient && <div className="text-muted-foreground">Изберете пациент за чат.</div>}
                <div ref={messagesEndRef} />
              </div>
              {error && (
                <div className="text-red-500 text-xs mb-2">{error}</div>
              )}
              <div className="flex gap-2">
                <input
                  className="flex-1 border rounded p-2 bg-background text-foreground border-border h-12 text-base"
                  type="text"
                  placeholder="Вашето съобщение..."
                  value={message}
                  onChange={e => {
                    setMessage(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={!selectedPatient || sending}
                  maxLength={MAX_MESSAGE_LENGTH + 1}
                  onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
                />
                <Button onClick={sendMessage} disabled={!selectedPatient || !message.trim() || sending} size="sm" className="h-12 text-base">Изпрати</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default DoctorChatWidget;
