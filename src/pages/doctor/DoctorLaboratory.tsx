import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

const DoctorLaboratory = () => {
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedTests, setSelectedTests] = useState<string[]>([""]);
  const testOptions = [
    "Пълна Кръвна Картина (ПКК) с Диференциално броене (ДКК)",
    "Общо химично изследване на урина (ОХИ) със Седимент",
    "Кръвна Захар (Глюкоза) на гладно",
    "Креатинин (и/или Урея) - за оценка на бъбречната функция",
    "АЛАТ (Аланинаминотрансфераза) (и/или АСАТ - Аспартатаминотрансфераза) - за оценка на чернодробната функция"
  ];

  // Дефинирай структура за ПКК с ДКК
  const PKK_FIELDS = [
    { label: "Хемоглобин (HGB)", unit: "g/L", ref: "Жени: 120 - 160; Мъже: 135 - 175" },
    { label: "Левкоцити (WBC)", unit: "x10⁹/L", ref: "4.0 - 10.0" },
    { label: "Еритроцити (RBC)", unit: "x10¹²/L", ref: "Жени: 4.0 - 5.0; Мъже: 4.5 - 5.5" },
    { label: "Хематокрит (HCT)", unit: "L/L (или %)", ref: "Жени: 0.36 - 0.46; Мъже: 0.40 - 0.50" },
    { label: "Тромбоцити (PLT)", unit: "x10⁹/L", ref: "150 - 400" },
    { label: "Неутрофили (NEU) %", unit: "%", ref: "40 - 75" },
    { label: "Лимфоцити (LYM) %", unit: "%", ref: "20 - 45" },
  ];
  const [pkkValues, setPkkValues] = useState<{[key:string]: string}>({});

  // ОХИ със Седимент (Test-лента)
  const OHI_TEST_LENTA_FIELDS = [
    { label: "Цвят", unit: "-", ref: "Сламеножълт" },
    { label: "Прозрачност", unit: "-", ref: "Бистра" },
    { label: "Относително тегло", unit: "-", ref: "1.005 - 1.030" },
    { label: "pH", unit: "-", ref: "4.5 - 8.0" },
    { label: "Белтък", unit: "-", ref: "Отрицателен" },
    { label: "Глюкоза", unit: "-", ref: "Отрицателен" },
    { label: "Кетони", unit: "-", ref: "Отрицателен" },
    { label: "Левкоцити", unit: "-", ref: "Отрицателен" },
    { label: "Нитрити", unit: "-", ref: "Отрицателен" },
    { label: "Кръв", unit: "-", ref: "Отрицателен" },
  ];
  const [ohiTestLentaValues, setOhiTestLentaValues] = useState<{[key:string]: string}>({});

  // ОХИ със Седимент (Седимент)
  const OHI_SEDIMENT_FIELDS = [
    { label: "Левкоцити", unit: "на зрително поле", ref: "< 4-5" },
    { label: "Еритроцити", unit: "на зрително поле", ref: "< 2-3" },
    { label: "Бактерии", unit: "-", ref: "Липсват/Единични" },
  ];
  const [ohiSedimentValues, setOhiSedimentValues] = useState<{[key:string]: string}>({});

  // Кръвна захар (Глюкоза) на гладно
  const GLUCOSE_FIELDS = [
    { label: "Глюкоза (кр.з.)", unit: "mmol/L", ref: "3.9 - 6.1" },
  ];
  const [glucoseValues, setGlucoseValues] = useState<{[key:string]: string}>({});

  // Креатинин (и/или Урея)
  const KREATININ_FIELDS = [
    { label: "Креатинин", unit: "µmol/L", ref: "Мъже: 62 - 106; Жени: 44 - 80" },
    { label: "Урея (BUN)", unit: "mmol/L", ref: "2.5 - 8.3" },
  ];
  const [kreatininValues, setKreatininValues] = useState<{[key:string]: string}>({});

  // АЛАТ/АСАТ
  const ALAT_ASAT_FIELDS = [
    { label: "АЛАТ (ALT/GPT)", unit: "U/L", ref: "< 40" },
    { label: "ACAT (AST/GOT)", unit: "U/L", ref: "< 40" },
  ];
  const [alatAsatValues, setAlatAsatValues] = useState<{[key:string]: string}>({});

  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "patients"), where("doctorId", "==", currentUser.id));
    const unsub = onSnapshot(q, (snap) => {
      setPatients(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [currentUser]);

  const handleTestChange = (idx: number, value: string) => {
    setSelectedTests(tests => tests.map((t, i) => i === idx ? value : t));
  };

  const addTestRow = () => {
    setSelectedTests(tests => [...tests, ""]);
  };

  const removeTestRow = (idx: number) => {
    setSelectedTests(tests => tests.length > 1 ? tests.filter((_, i) => i !== idx) : tests);
  };

  const handlePkkChange = (field: string, value: string) => {
    setPkkValues(v => ({ ...v, [field]: value }));
  };
  const handleOhiTestLentaChange = (field: string, value: string) => {
    setOhiTestLentaValues(v => ({ ...v, [field]: value }));
  };
  const handleOhiSedimentChange = (field: string, value: string) => {
    setOhiSedimentValues(v => ({ ...v, [field]: value }));
  };
  const handleGlucoseChange = (field: string, value: string) => {
    setGlucoseValues(v => ({ ...v, [field]: value }));
  };
  const handleKreatininChange = (field: string, value: string) => {
    setKreatininValues(v => ({ ...v, [field]: value }));
  };
  const handleAlatAsatChange = (field: string, value: string) => {
    setAlatAsatValues(v => ({ ...v, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (!selectedPatient || selectedTests.some(t => !t)) {
      setIsSubmitting(false);
      return;
    }
    // Prepare lab results data
    const labData = selectedTests.map((test, idx) => {
      let results = {};
      if (test === testOptions[0]) results = pkkValues;
      if (test === testOptions[1]) results = { testLenta: ohiTestLentaValues, sediment: ohiSedimentValues };
      if (test === testOptions[2]) results = glucoseValues;
      if (test === testOptions[3]) results = kreatininValues;
      if (test === testOptions[4]) results = alatAsatValues;
      return {
        testType: test,
        results,
      };
    });
    await addDoc(collection(db, "labResults"), {
      patientId: selectedPatient,
      doctorId: currentUser.id,
      doctorName: currentUser.name,
      tests: labData,
      createdAt: serverTimestamp(),
      status: "pending"
    });
    setSelectedPatient("");
    setSelectedTests([""]);
    setPkkValues({});
    setOhiTestLentaValues({});
    setOhiSedimentValues({});
    setGlucoseValues({});
    setKreatininValues({});
    setAlatAsatValues({});
    toast({ title: "Изследванията са пуснати успешно!" });
    setTimeout(() => navigate("/doctor/dashboard"), 1200);
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-5xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Пускане на лабораторни изследвания</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block mb-1 font-medium">Изберете пациент</label>
              <select
                className="w-full border rounded p-2 bg-background text-foreground border-border"
                value={selectedPatient}
                onChange={e => setSelectedPatient(e.target.value)}
              >
                <option value="">-- Изберете --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            {selectedPatient && (
              <div className="space-y-2">
                {selectedTests.map((test, idx) => (
                  <div key={idx} className="flex flex-col gap-2 border-b pb-4 mb-4">
                    <div className="flex gap-2 items-center">
                      <select
                        className="flex-1 border rounded p-2 bg-background text-foreground border-border"
                        value={test}
                        onChange={e => handleTestChange(idx, e.target.value)}
                      >
                        <option value="">-- Изберете изследване --</option>
                        {testOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <Button type="button" variant="outline" size="icon" onClick={() => removeTestRow(idx)} disabled={selectedTests.length === 1}>
                        –
                      </Button>
                    </div>
                    {/* Ако е избрано ПКК с ДКК, покажи полетата */}
                    {test === testOptions[0] && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm border mt-2">
                          <thead>
                            <tr className="bg-muted">
                              <th className="p-2 font-semibold text-center">Показател</th>
                              <th className="p-2 font-semibold text-center">Резултат</th>
                              <th className="p-2 font-semibold text-center">Референтни граници</th>
                              <th className="p-2 font-semibold text-center">Мерна единица</th>
                            </tr>
                          </thead>
                          <tbody>
                            {PKK_FIELDS.map(field => (
                              <tr key={field.label}>
                                <td className="p-2 whitespace-nowrap text-center">{field.label}</td>
                                <td className="p-2 text-center">
                                  <input
                                    type="text"
                                    className="border rounded p-1 w-24 bg-background text-foreground border-border text-center"
                                    value={pkkValues[field.label] || ""}
                                    onChange={e => handlePkkChange(field.label, e.target.value)}
                                  />
                                </td>
                                <td className="p-2 text-center whitespace-nowrap text-muted-foreground">{field.ref}</td>
                                <td className="p-2 text-center whitespace-nowrap text-muted-foreground">{field.unit}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {/* ОХИ със Седимент */}
                    {test === testOptions[1] && (
                      <>
                        <div className="overflow-x-auto">
                          <div className="font-semibold mt-2 mb-1">Показател (Test-лента)</div>
                          <table className="min-w-full text-sm border">
                            <thead>
                              <tr className="bg-muted">
                                <th className="p-2 font-semibold text-center">Показател (Test-лента)</th>
                                <th className="p-2 font-semibold text-center">Резултат на пациента</th>
                                <th className="p-2 font-semibold text-center">Референтни граници (ориентировъчни)</th>
                                <th className="p-2 font-semibold text-center">Мерна единица</th>
                              </tr>
                            </thead>
                            <tbody>
                              {OHI_TEST_LENTA_FIELDS.map(field => (
                                <tr key={field.label}>
                                  <td className="p-2 whitespace-nowrap text-center">{field.label}</td>
                                  <td className="p-2 text-center">
                                    <input
                                      type="text"
                                      className="border rounded p-1 w-24 bg-background text-foreground border-border text-center"
                                      value={ohiTestLentaValues[field.label] || ""}
                                      onChange={e => handleOhiTestLentaChange(field.label, e.target.value)}
                                    />
                                  </td>
                                  <td className="p-2 text-center whitespace-nowrap text-muted-foreground">{field.ref}</td>
                                  <td className="p-2 text-center whitespace-nowrap text-muted-foreground">{field.unit}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="overflow-x-auto mt-4">
                          <div className="font-semibold mb-1">Показател (Седимент)</div>
                          <table className="min-w-full text-sm border">
                            <thead>
                              <tr className="bg-muted">
                                <th className="p-2 font-semibold text-center">Показател (Седимент)</th>
                                <th className="p-2 font-semibold text-center">Резултат на пациента</th>
                                <th className="p-2 font-semibold text-center">Референтни граници (ориентировъчни)</th>
                                <th className="p-2 font-semibold text-center">Мерна единица</th>
                              </tr>
                            </thead>
                            <tbody>
                              {OHI_SEDIMENT_FIELDS.map(field => (
                                <tr key={field.label}>
                                  <td className="p-2 whitespace-nowrap text-center">{field.label}</td>
                                  <td className="p-2 text-center">
                                    <input
                                      type="text"
                                      className="border rounded p-1 w-24 bg-background text-foreground border-border text-center"
                                      value={ohiSedimentValues[field.label] || ""}
                                      onChange={e => handleOhiSedimentChange(field.label, e.target.value)}
                                    />
                                  </td>
                                  <td className="p-2 text-center whitespace-nowrap text-muted-foreground">{field.ref}</td>
                                  <td className="p-2 text-center whitespace-nowrap text-muted-foreground">{field.unit}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                    {/* Кръвна захар (Глюкоза) на гладно */}
                    {test === testOptions[2] && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm border mt-2">
                          <thead>
                            <tr className="bg-muted">
                              <th className="p-2 font-semibold text-center">Показател</th>
                              <th className="p-2 font-semibold text-center">Резултат на пациента</th>
                              <th className="p-2 font-semibold text-center">Референтни граници (ориентировъчни, на гладно)</th>
                              <th className="p-2 font-semibold text-center">Мерна единица</th>
                            </tr>
                          </thead>
                          <tbody>
                            {GLUCOSE_FIELDS.map(field => (
                              <tr key={field.label}>
                                <td className="p-2 whitespace-nowrap text-center">{field.label}</td>
                                <td className="p-2 text-center">
                                  <input
                                    type="text"
                                    className="border rounded p-1 w-24 bg-background text-foreground border-border text-center"
                                    value={glucoseValues[field.label] || ""}
                                    onChange={e => handleGlucoseChange(field.label, e.target.value)}
                                  />
                                </td>
                                <td className="p-2 text-center whitespace-nowrap text-muted-foreground">{field.ref}</td>
                                <td className="p-2 text-center whitespace-nowrap text-muted-foreground">{field.unit}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {/* Креатинин (и/или Урея) */}
                    {test === testOptions[3] && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm border mt-2">
                          <thead>
                            <tr className="bg-muted">
                              <th className="p-2 font-semibold text-center">Показател</th>
                              <th className="p-2 font-semibold text-center">Резултат на пациента</th>
                              <th className="p-2 font-semibold text-center">Референтни граници (ориентировъчни)</th>
                              <th className="p-2 font-semibold text-center">Мерна единица</th>
                            </tr>
                          </thead>
                          <tbody>
                            {KREATININ_FIELDS.map(field => (
                              <tr key={field.label}>
                                <td className="p-2 whitespace-nowrap text-center">{field.label}</td>
                                <td className="p-2 text-center">
                                  <input
                                    type="text"
                                    className="border rounded p-1 w-24 bg-background text-foreground border-border text-center"
                                    value={kreatininValues[field.label] || ""}
                                    onChange={e => handleKreatininChange(field.label, e.target.value)}
                                  />
                                </td>
                                <td className="p-2 text-center whitespace-nowrap text-muted-foreground">{field.ref}</td>
                                <td className="p-2 text-center whitespace-nowrap text-muted-foreground">{field.unit}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {/* АЛАТ/АСАТ */}
                    {test === testOptions[4] && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm border mt-2">
                          <thead>
                            <tr className="bg-muted">
                              <th className="p-2 font-semibold text-center">Показател</th>
                              <th className="p-2 font-semibold text-center">Резултат на пациента</th>
                              <th className="p-2 font-semibold text-center">Референтни граници (ориентировъчни)</th>
                              <th className="p-2 font-semibold text-center">Мерна единица</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ALAT_ASAT_FIELDS.map(field => (
                              <tr key={field.label}>
                                <td className="p-2 whitespace-nowrap text-center">{field.label}</td>
                                <td className="p-2 text-center">
                                  <input
                                    type="text"
                                    className="border rounded p-1 w-24 bg-background text-foreground border-border text-center"
                                    value={alatAsatValues[field.label] || ""}
                                    onChange={e => handleAlatAsatChange(field.label, e.target.value)}
                                  />
                                </td>
                                <td className="p-2 text-center whitespace-nowrap text-muted-foreground">{field.ref}</td>
                                <td className="p-2 text-center whitespace-nowrap text-muted-foreground">{field.unit}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
                <Button type="button" variant="secondary" onClick={addTestRow}>
                  + Добави изследване
                </Button>
              </div>
            )}
            <Button type="submit" disabled={isSubmitting || !selectedPatient || selectedTests.some(t => !t)}>
              Пусни изследвания
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorLaboratory;
