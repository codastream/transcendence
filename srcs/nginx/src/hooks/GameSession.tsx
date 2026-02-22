// export const useSession = () => {
//   const [sessionId, setSessionId] = useState<string | null>(null);
//   const [error, setError] = useState<string | null>(null);
//
//   const joinSession = async (newSessionId: string) => {
//     if (sessionId) return;
//
//     try {
//       setSessionId(newSessionId);
//       await openWebSocket(newSessionId);
//     } catch (err) {
//       console.error("Failed to join session:", err);
//       setSessionId(null);
//       setError("Failed to join session");
//       throw err;
//     }
//   };
//
//   return { sessionId, error, joinSession };
// };
