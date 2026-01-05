// CONSTANTS
const PH_UPPER_LIMIT = 6.40;
const PH_SAFE_ZONE = 6.05;
const PH_CAUTION_LIMIT = 5.95;
const PH_REJECT_LIMIT = 5.90;

const AGE_HORIZON_HOURS = 6;
const MAX_PH_SLOPE = 0.25;

// HARD GATE (FAIL SAFE)
function evaluateHardGate(ph, sensory) {
  if (sensory === "ABNORMAL") {
    return { status: "HOLD", score: 999 };
  }

  if (ph > PH_UPPER_LIMIT) {
    return { status: "HOLD", score: 999 };
  }

  if (ph <= PH_REJECT_LIMIT) {
    return { status: "URGENT", score: 1.0 };
  }

  return { status: "PASS" };
}

// NORMALIZED COMPONENTS
function ageSeverity(startTime) {
  const ageHours = (Date.now() - startTime) / 3600000;
  return Math.min(1.0, ageHours / AGE_HORIZON_HOURS);
}

function phSeverity(ph) {
  return Math.min(
    1.0,
    (PH_UPPER_LIMIT - ph) / (PH_UPPER_LIMIT - PH_CAUTION_LIMIT)
  );
}

function velocityRisk(phLogs) {
  if (phLogs.length < 2) return null;

  const last = phLogs[phLogs.length - 1];
  const prev = phLogs[phLogs.length - 2];

  const dt = (last.time - prev.time) / 3600000;
  if (dt <= 0) return null;

  const slope = (last.ph - prev.ph) / dt;
  return Math.min(1.0, Math.abs(slope) / MAX_PH_SLOPE);
}

// CURRENT RISK (ZONAL)
function currentRisk(ph, ageSev) {
  const phSev = phSeverity(ph);

  if (ph > PH_SAFE_ZONE) {
    const phSafe = Math.min(
      1.0,
      (PH_UPPER_LIMIT - ph) / (PH_UPPER_LIMIT - PH_SAFE_ZONE)
    );
    return (0.6 * ageSev) + (0.4 * phSafe);
  }

  if (ph > PH_CAUTION_LIMIT) {
    return (0.7 * phSev) + (0.3 * ageSev);
  }

  return (0.8 * phSev) + (0.2 * ageSev);
}

// PREDICTIVE RISK
function predictiveRisk(phSev, ageSev, velRisk) {
  return (0.5 * velRisk) + (0.3 * phSev) + (0.2 * ageSev);
}

// FINAL SCORE + RANK KEY
function calculateScore(batch) {
  const ageSev = ageSeverity(batch.startTime);

  // No pH → FIFO-only
  if (batch.phLogs.length === 0) {
    return {
      score: Number(ageSev.toFixed(3)),
      rankKey: {
        startTime: batch.startTime,
        slope: 0
      }
    };
  }

  const last = batch.phLogs[batch.phLogs.length - 1];
  const gate = evaluateHardGate(last.ph, last.sensory);

  // HARD GATE OVERRIDE
  if (gate.status !== "PASS") {
    return {
      score: gate.score,
      rankKey: {
        startTime: batch.startTime,
        slope: 1 // force top if urgent
      }
    };
  }

  const currRisk = currentRisk(last.ph, ageSev);
  const velRisk = velocityRisk(batch.phLogs);

  let finalScore;

  // Reactive mode
  if (velRisk === null) {
    finalScore = currRisk;
  } else {
    const phSev = phSeverity(last.ph);
    const predRisk = predictiveRisk(phSev, ageSev, velRisk);
    finalScore = (0.5 * currRisk) + (0.5 * predRisk);
  }

  return {
    score: Number(finalScore.toFixed(3)),
    rankKey: {
      startTime: batch.startTime,  // FEFO/FIFO
      slope: velRisk ?? 0         // deterioration speed
    }
  };
}
