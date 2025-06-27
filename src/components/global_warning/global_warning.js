import { useMonitoring } from "../../utils/monitoring_context";
import { useEffect, useState } from "react";
import './global_warning.css';
import { socket } from "../../socket";

export default function GlobalWarning() {
  const { showWarning, maliciousDetected } = useMonitoring();
  const [peerFinalWarning, setPeerFinalWarning] = useState(false);

  useEffect(() => {
    socket.on("show-last-warning", ({ userId }) => {
      setPeerFinalWarning(true);
      setTimeout(() => setPeerFinalWarning(false), 4000);
    });

    return () => {
      socket.off("show-last-warning");
    };
  }, []);

  if (!showWarning && !maliciousDetected && !peerFinalWarning) return null;

  return (
    <div className={`global-warning ${maliciousDetected ? "malicious" : ""}`}>
      {maliciousDetected ? (
        "🚫 Malicious activity detected. Your session is flagged."
      ) : peerFinalWarning ? (
        "🚨 Your peer received FINAL warning. Malpractice suspected!"
      ) : (
        "⚠️ Tab switching detected. Please stay on the call tab!"
      )}
    </div>
  );
}