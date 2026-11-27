export const referralStages = {
  OPEN: "Awaiting a match",
  MATCHED: "Awaiting provider response",
  ACCEPTED: "Accepted by provider",
  SERVICED: "Service completed",
  CLOSED: "Closed",
} as const;

export const recipientChanges = {
  ACCEPT: { from: "MATCHED", to: "ACCEPTED" },
  DECLINE: { from: "MATCHED", to: "OPEN" },
  COMPLETE: { from: "ACCEPTED", to: "SERVICED" },
} as const;
