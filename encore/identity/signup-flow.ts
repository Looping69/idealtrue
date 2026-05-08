import type { UserProfile } from "../shared/domain";

export type VerificationEmailStatus = "sent" | "failed";

export interface SignupSessionResponse {
  token: string;
  user: UserProfile;
  verificationEmailStatus: VerificationEmailStatus;
}

export async function finalizeSignupSession(params: {
  user: UserProfile;
  issueSession: (user: UserProfile) => { token: string; user: UserProfile };
  sendVerificationEmail: () => Promise<unknown>;
  onEmailFailure?: (error: unknown) => void;
}): Promise<SignupSessionResponse> {
  let verificationEmailStatus: VerificationEmailStatus = "sent";

  try {
    await params.sendVerificationEmail();
  } catch (error) {
    verificationEmailStatus = "failed";
    params.onEmailFailure?.(error);
  }

  return {
    ...params.issueSession(params.user),
    verificationEmailStatus,
  };
}
