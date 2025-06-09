import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { collection, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/config/firebase";

// Reference data for lab tests
const LAB_TESTS_INFO: Record<string, any> = {
  'ПКК': [
    { name: 'Хемоглобин (HGB)', ref: 'Жени: 120 - 160; Мъже: 135 - 175', unit: 'g/L', key: 'Хемоглобин (HGB)' },
    { name: 'Левкоцити (WBC)', ref: '4.0 - 10.0', unit: 'x10⁹/L', key: 'Левкоцити (WBC)' },
    { name: 'Еритроцити (RBC)', ref: 'Жени: 4.0 - 5.0; Мъже: 4.5 - 5.5', unit: 'x10¹²/L', key: 'Еритроцити (RBC)' },
    { name: 'Хематокрит (HCT)', ref: 'Жени: 0.36 - 0.46; Мъже: 0.40 - 0.50', unit: 'L/L (или %)', key: 'Хематокрит (HCT)' },
    { name: 'Тромбоцити (PLT)', ref: '150 - 400', unit: 'x10⁹/L', key: 'Тромбоцити (PLT)' },
    { name: 'Неутрофили (NEU) %', ref: '40 - 75', unit: '%', key: 'Неутрофили (NEU) %' },
    { name: 'Лимфоцити (LYM) %', ref: '20 – 45', unit: '%', key: 'Лимфоцити (LYM) %' },
  ],
  'ОХИ': [
    // Test-лента
    { name: 'Белтък', ref: '< 0.15', unit: 'g/L', key: 'Белтък' },
    { name: 'Глюкоза', ref: '< 0.8', unit: 'mmol/L', key: 'Глюкоза' },
    { name: 'Уробилиноген', ref: '< 17', unit: 'µmol/L', key: 'Уробилиноген' },
    { name: 'Билирубин', ref: 'отрицателен', unit: '', key: 'Билирубин' },
    { name: 'Кетони', ref: 'отрицателен', unit: '', key: 'Кетони' },
    { name: 'Нитрити', ref: 'отрицателен', unit: '', key: 'Нитрити' },
    { name: 'Левкоцити', ref: 'отрицателен', unit: '', key: 'Левкоцити' },
    { name: 'Еритроцити', ref: 'отрицателен', unit: '', key: 'Еритроцити' },
    // Седимент (примерни)
    { name: 'Епителни клетки', ref: '0 - 5', unit: 'бр/поле', key: 'Епителни клетки' },
    { name: 'Левкоцити', ref: '0 - 5', unit: 'бр/поле', key: 'Левкоцити' },
    { name: 'Еритроцити', ref: '0 - 2', unit: 'бр/поле', key: 'Еритроцити' },
    { name: 'Цилиндри', ref: '0', unit: 'бр/поле', key: 'Цилиндри' },
    { name: 'Бактерии', ref: 'няма', unit: '', key: 'Бактерии' },
  ],
  'Глюкоза': [
    { name: 'Глюкоза', ref: '3.9 - 6.1', unit: 'mmol/L', key: 'Глюкоза' },
  ],
  'Креатинин/Урея': [
    { name: 'Креатинин', ref: 'Жени: 44 - 80; Мъже: 62 - 106', unit: 'µmol/L', key: 'Креатинин' },
    { name: 'Урея', ref: '2.8 - 8.3', unit: 'mmol/L', key: 'Урея' },
  ],
  'АЛАТ/АСАТ': [
    { name: 'АЛАТ', ref: 'Жени: < 34; Мъже: < 45', unit: 'U/L', key: 'АЛАТ' },
    { name: 'АСАТ', ref: 'Жени: < 31; Мъже: < 35', unit: 'U/L', key: 'АСАТ' },
  ],
};

const PatientLabResults = () => {
  const { currentUser } = useAuth();
  const [labResults, setLabResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.id) return;
    setLoading(true);
    // Listen for lab results for this patient
    const q = query(collection(db, "labResults"), where("patientId", "==", currentUser.id));
    const unsub = onSnapshot(q, (snap) => {
      setLabResults(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [currentUser]);

  const handleDeleteLab = async (labId: string) => {
    if (!window.confirm("Сигурни ли сте, че искате да изтриете това изследване?")) return;
    await deleteDoc(doc(db, "labResults", labId));
    // Firestore onSnapshot ще обнови списъка автоматично
  };

  // Универсална функция за намиране на резултат по различни варианти на ключа
  function getResultValue(results: any, row: any) {
    if (!results) return '';
    // Възможни варианти на ключа
    const variants = [
      row.key,
      row.name,
      row.label,
      row.key?.replace(/\s*\(.*\)/, ''),
      row.name?.replace(/\s*\(.*\)/, ''),
      row.key?.replace(/\s*\(.*\)/, '').trim(),
      row.name?.replace(/\s*\(.*\)/, '').trim(),
    ].filter(Boolean);
    for (const v of variants) {
      if (v in results && results[v] !== undefined && results[v] !== null && results[v] !== '') {
        return results[v];
      }
    }
    // Ако има само един ключ и той е с "Глюкоза (кр.з.)" или подобно, върни го
    if (row.key?.includes('Глюкоза')) {
      const glucoseKey = Object.keys(results).find(k => k.toLowerCase().includes('глюкоза'));
      if (glucoseKey) return results[glucoseKey];
    }
    return '';
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Моите изследвания</h1>
      {loading ? (
        <div>Зареждане...</div>
      ) : labResults.length === 0 ? (
        <Alert variant="default" className="text-center text-lg">
          В момента нямате чакащи изследвания.
        </Alert>
      ) : (
        <div className="space-y-4">
          {labResults.map((lab) => (
            <Card key={lab.id} className="bg-card border border-border">
              <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <div className="font-semibold text-lg text-foreground">{lab.tests?.map((t:any) => t.testType).join(", ")}</div>
                  <div className="text-muted-foreground text-sm mt-1">Пуснато от: {lab.doctorName || "-"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">
                    {lab.createdAt?.toDate ? lab.createdAt.toDate().toLocaleString("bg-BG") : "-"}
                  </div>
                  <button
                    className="ml-2 px-2 py-1 text-xs rounded bg-destructive text-destructive-foreground hover:bg-destructive/80"
                    onClick={() => handleDeleteLab(lab.id)}
                  >
                    Изтрий
                  </button>
                </div>
              </div>
              <div className="px-4 pb-4">
                {lab.tests?.map((test: any, idx: number) => (
                  <div key={idx} className="mb-6">
                    <div className="font-semibold text-primary mb-2">{test.testType}</div>
                    {/* ПКК с ДКК */}
                    {test.testType.includes("ПКК") && (
                      <table className="min-w-full text-sm border mb-2">
                        <thead>
                          <tr className="bg-muted">
                            <th className="p-2 font-semibold">Показател</th>
                            <th className="p-2 font-semibold">Резултат</th>
                            <th className="p-2 font-semibold">Референтни граници</th>
                            <th className="p-2 font-semibold">Мерна единица</th>
                          </tr>
                        </thead>
                        <tbody>
                          {LAB_TESTS_INFO['ПКК'].map((row: any) => (
                            <tr key={row.key}>
                              <td className="p-2 text-center whitespace-nowrap">{row.name}</td>
                              <td className="p-2 text-center">{test.results?.[row.key] || ''}</td>
                              <td className="p-2 text-center">{row.ref}</td>
                              <td className="p-2 text-center">{row.unit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {/* ОХИ със Седимент */}
                    {test.testType.includes("ОХИ") && (
                      <>
                        {test.results?.testLenta && (
                          <div className="mb-2">
                            <div className="font-medium mb-1">Test-лента</div>
                            <table className="min-w-full text-sm border">
                              <thead>
                                <tr className="bg-muted">
                                  <th className="p-2 font-semibold">Показател</th>
                                  <th className="p-2 font-semibold">Резултат</th>
                                  <th className="p-2 font-semibold">Референтни граници</th>
                                  <th className="p-2 font-semibold">Мерна единица</th>
                                </tr>
                              </thead>
                              <tbody>
                                {LAB_TESTS_INFO['ОХИ'].filter(row => row.key in test.results.testLenta).map((row: any) => (
                                  <tr key={row.key}>
                                    <td className="p-2 text-center whitespace-nowrap">{row.name}</td>
                                    <td className="p-2 text-center">{test.results.testLenta[row.key] || ''}</td>
                                    <td className="p-2 text-center">{row.ref}</td>
                                    <td className="p-2 text-center">{row.unit}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {test.results?.sediment && (
                          <div>
                            <div className="font-medium mb-1">Седимент</div>
                            <table className="min-w-full text-sm border">
                              <thead>
                                <tr className="bg-muted">
                                  <th className="p-2 font-semibold">Показател</th>
                                  <th className="p-2 font-semibold">Резултат</th>
                                  <th className="p-2 font-semibold">Референтни граници</th>
                                  <th className="p-2 font-semibold">Мерна единица</th>
                                </tr>
                              </thead>
                              <tbody>
                                {LAB_TESTS_INFO['ОХИ'].filter(row => row.key in test.results.sediment).map((row: any) => (
                                  <tr key={row.key}>
                                    <td className="p-2 text-center whitespace-nowrap">{row.name}</td>
                                    <td className="p-2 text-center">{test.results.sediment[row.key] || ''}</td>
                                    <td className="p-2 text-center">{row.ref}</td>
                                    <td className="p-2 text-center">{row.unit}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    )}
                    {/* Кръвна захар (Глюкоза) на гладно */}
                    {test.testType.includes("Глюкоза") && (
                      <table className="min-w-full text-sm border mb-2">
                        <thead>
                          <tr className="bg-muted">
                            <th className="p-2 font-semibold">Показател</th>
                            <th className="p-2 font-semibold">Резултат</th>
                            <th className="p-2 font-semibold">Референтни граници</th>
                            <th className="p-2 font-semibold">Мерна единица</th>
                          </tr>
                        </thead>
                        <tbody>
                          {LAB_TESTS_INFO['Глюкоза'].map((row: any) => (
                            <tr key={row.key}>
                              <td className="p-2 text-center whitespace-nowrap">{row.name}</td>
                              <td className="p-2 text-center">{test.results?.[row.key] || test.results?.[row.name] || test.results?.['Глюкоза (кр.з.)'] || ''}</td>
                              <td className="p-2 text-center">{row.ref}</td>
                              <td className="p-2 text-center">{row.unit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {/* Креатинин/Урея */}
                    {test.testType.includes("Креатинин") && (
                      <table className="min-w-full text-sm border mb-2">
                        <thead>
                          <tr className="bg-muted">
                            <th className="p-2 font-semibold">Показател</th>
                            <th className="p-2 font-semibold">Резултат</th>
                            <th className="p-2 font-semibold">Референтни граници</th>
                            <th className="p-2 font-semibold">Мерна единица</th>
                          </tr>
                        </thead>
                        <tbody>
                          {LAB_TESTS_INFO['Креатинин/Урея'].map((row: any) => {
                            let value = test.results?.[row.key]
                              || test.results?.[row.label]
                              || test.results?.[row.name]
                              || '';
                            // Ако row.key е 'Урея', пробвай и 'Урея (BUN)'
                            if (!value && row.key === 'Урея') {
                              value = test.results['Урея (BUN)'] || '';
                            }
                            return (
                              <tr key={row.key}>
                                <td className="p-2 text-center whitespace-nowrap">{row.name}</td>
                                <td className="p-2 text-center">{value}</td>
                                <td className="p-2 text-center">{row.ref}</td>
                                <td className="p-2 text-center">{row.unit}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                    {/* АЛАТ/АСАТ */}
                    {test.testType.includes("АЛАТ") && (
                      <table className="min-w-full text-sm border mb-2">
                        <thead>
                          <tr className="bg-muted">
                            <th className="p-2 font-semibold">Показател</th>
                            <th className="p-2 font-semibold">Резултат</th>
                            <th className="p-2 font-semibold">Референтни граници</th>
                            <th className="p-2 font-semibold">Мерна единица</th>
                          </tr>
                        </thead>
                        <tbody>
                          {LAB_TESTS_INFO['АЛАТ/АСАТ'].map((row: any) => {
                            // Търси и по вариантите с ALT/GPT и AST/GOT, както са въвеждани от лекаря
                            let value = test.results?.[row.key] || test.results?.[row.label] || test.results?.[row.name] || '';
                            // Допълнително: ако row.key е 'АЛАТ', пробвай и 'АЛАТ (ALT/GPT)'; ако е 'АСАТ', пробвай и 'ACAT (AST/GOT)'
                            if (!value && row.key === 'АЛАТ') {
                              value = test.results['АЛАТ (ALT/GPT)'] || '';
                            }
                            if (!value && row.key === 'АСАТ') {
                              value = test.results['ACAT (AST/GOT)'] || '';
                            }
                            return (
                              <tr key={row.key}>
                                <td className="p-2 text-center whitespace-nowrap">{row.name}</td>
                                <td className="p-2 text-center">{value}</td>
                                <td className="p-2 text-center">{row.ref}</td>
                                <td className="p-2 text-center">{row.unit}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientLabResults;
