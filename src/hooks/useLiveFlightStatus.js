import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

function hoursUntilDeparture(dateStr, timeStr) {
  if (!dateStr) return null;
  const time = timeStr || "00:00";
  const dep = new Date(`${dateStr}T${time}:00`);
  return (dep - new Date()) / (1000 * 60 * 60);
}

// Live tracking hook — only polls within 24h of departure, stops after landing
export function useLiveFlightStatus(flightNum, dateStr, timeStr) {
  const [status, setStatus] = useState(null); // null | 'on_time' | 'delayed' | 'landed' | 'unknown'
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!flightNum || !dateStr) return;

    async function fetchStatus() {
      const hours = hoursUntilDeparture(dateStr, timeStr);
      if (hours === null || hours > 24 || hours < -6) return; // not in window

      setLoading(true);
      try {
        const res = await base44.functions.invoke("lookupFlight", {
          flight_number: flightNum,
          date: dateStr,
        });
        const data = res.data;
        if (data?.found) {
          setStatus(data.live_status || "unknown");
        } else {
          setStatus("unknown");
        }
      } catch {
        setStatus("unknown");
      }
      setLoading(false);
    }

    const hours = hoursUntilDeparture(dateStr, timeStr);
    if (hours !== null && hours <= 24 && hours > -6) {
      fetchStatus();
      // Poll every 3 min while in window, stop after landed
      intervalRef.current = setInterval(() => {
        setStatus((prev) => {
          if (prev === "landed") {
            clearInterval(intervalRef.current);
            return prev;
          }
          return prev;
        });
        fetchStatus();
      }, 3 * 60 * 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [flightNum, dateStr, timeStr]);

  return { status, loading };
}