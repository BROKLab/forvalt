export enum QueStatus {
  Qued = 1,
  Approved = 2,
  Declined = 3,
}

export function getStatus(status: QueStatus) {
  switch (status) {
    case QueStatus.Approved:
      return "Godkjent";
    case QueStatus.Declined:
      return "Avslått";
    case QueStatus.Qued:
      return "Venter godkjenning fra Brønnøysundregistrene";
    default:
      return "Ikke gyldig status";
  }
}
