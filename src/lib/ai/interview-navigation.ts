export function getInterviewSessionHref(interviewId: string) {
  return `/interview?session=${encodeURIComponent(interviewId)}`;
}

export function getInterviewReportHref(interviewId: string) {
  return `/interview/report?session=${encodeURIComponent(interviewId)}`;
}
