export type AppRole = 'holder' | 'issuer' | 'verifier' | 'admin';

export type IssuedCredential = {
  id: string;
  given_name: string;
  family_name: string;
  date_of_birth: string;
  nationality: string;
  gender: string;
  case_number: string;
  arrival_site: string;
  status: 'active' | 'revoked';
  issuer_id: string;
  issuer_did: string;
  subject_did: string;
  subject_user_id: string | null;
  face_image_url: string | null;
  face_embedding: string | null;
  face_verification_status: 'pending' | 'verified' | 'failed';
  claim_code: string | null;
  claim_code_expires_at: string | null;
  claimed_at: string | null;
  vc_id: string;
  created_at: string;
  updated_at: string;
};

export type UserRole = {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
};

export type Profile = {
  id: string;
  display_name: string | null;
  face_embedding: string | null;
  face_image_url: string | null;
  created_at: string;
};

export type VerificationLog = {
  id: string;
  verifier_id: string;
  method: 'qr' | 'code' | 'nfc';
  result: 'valid' | 'revoked' | 'unknown';
  holder_alias: string;
  issuer: string;
  credential_type: string;
  notes: string | null;
  subject_did: string;
  created_at: string;
};

export type AdminUserListResult = {
  user_id: string;
  email: string;
  display_name: string | null;
  roles: AppRole[];
  created_at: string;
};
